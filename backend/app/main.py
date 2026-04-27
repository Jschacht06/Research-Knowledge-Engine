import asyncio
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import BackgroundTasks, Body, FastAPI, Depends, HTTPException, Request, UploadFile, File, Form, Path as ApiPath
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text

from .config import settings
from .db import Base, engine, get_db, SessionLocal
from .models import User, Document, DocumentChunk, ChatConversation, ChatConversationMessage
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    get_user_by_email,
    get_current_user,
)
from .extractors import extract_text
from .rag import chunk_text, embed_texts, retrieve_top_chunks, chat_answer, conversational_answer
from .rate_limit import (
    chat_rate_limiter,
    login_failures_by_email,
    login_failures_by_ip,
    register_rate_limiter,
    upload_rate_limiter,
)
from .validation import (
    ChatConversationUpdateIn,
    ChatIn,
    RegisterIn,
    validate_document_file,
    validate_document_form,
    validate_login_credentials,
)

app = FastAPI(title="Research KB API", version="0.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else {}
    message = str(first_error.get("msg", "Invalid input")).removeprefix("Value error, ")
    return JSONResponse(status_code=400, content={"detail": message})


def ensure_vector_extension() -> None:
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(sql_text("SELECT pg_advisory_lock(482019641)"))
        try:
            conn.execute(sql_text("CREATE EXTENSION IF NOT EXISTS vector"))
        except IntegrityError as exc:
            if "pg_extension_name_index" not in str(exc):
                raise
        finally:
            conn.execute(sql_text("SELECT pg_advisory_unlock(482019641)"))


@app.on_event("startup")
def on_startup():
    ensure_vector_extension()
    with engine.begin() as conn:
        conn.execute(sql_text("SELECT pg_advisory_xact_lock(482019641)"))
        Base.metadata.create_all(bind=conn)
        conn.execute(sql_text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS title VARCHAR(255)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS topic VARCHAR(120)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]'::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ALTER COLUMN topics TYPE JSONB USING topics::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ALTER COLUMN topics SET DEFAULT '[]'::jsonb"))
        conn.execute(
            sql_text(
                "UPDATE documents SET topics = jsonb_build_array(topic) "
                "WHERE topic IS NOT NULL AND COALESCE(topics, '[]'::jsonb) = '[]'::jsonb"
            )
        )
        conn.execute(sql_text("UPDATE documents SET topics = '[]'::jsonb WHERE topics IS NULL"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(40)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_status VARCHAR(40)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_error TEXT"))
        conn.execute(sql_text("UPDATE documents SET processing_status = 'ready' WHERE processing_status IS NULL"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS abstract TEXT"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS authors JSONB DEFAULT '[]'::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ALTER COLUMN authors TYPE JSONB USING authors::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ALTER COLUMN keywords TYPE JSONB USING keywords::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ALTER COLUMN authors SET DEFAULT '[]'::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ALTER COLUMN keywords SET DEFAULT '[]'::jsonb"))
        conn.execute(sql_text("UPDATE documents SET authors = '[]'::jsonb WHERE authors IS NULL"))
        conn.execute(sql_text("UPDATE documents SET keywords = '[]'::jsonb WHERE keywords IS NULL"))
    Path(settings.storage_dir).mkdir(parents=True, exist_ok=True)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    owner_id: int
    title: str
    filename: str
    topic: str | None = None
    topics: list[str]
    status: str | None = None
    processing_status: str
    processing_error: str | None = None
    abstract: str | None = None
    authors: list[str]
    keywords: list[str]
    created_at: datetime
    class Config:
        from_attributes = True


class ChatOut(BaseModel):
    answer: str
    sources: list[dict]


class ChatConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class ChatConversationMessageOut(BaseModel):
    id: int
    role: str
    content: str
    sources: list[dict]
    created_at: datetime
    class Config:
        from_attributes = True


def serialize_document(document: Document) -> Document:
    if not document.title:
        document.title = document.filename
    if not document.topics:
        document.topics = [document.topic] if document.topic else []
    document.processing_status = document.processing_status or "ready"
    document.authors = document.authors or []
    document.keywords = document.keywords or []
    return document


def process_document_ingestion(document_id: int) -> None:
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return

        document.processing_status = "processing"
        document.processing_error = None
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
        db.commit()

        text_content = extract_text(document.filepath)
        chunks = chunk_text(text_content)
        if chunks:
            vectors = asyncio.run(embed_texts(chunks))
            for index, (chunk, vector) in enumerate(zip(chunks, vectors)):
                db.add(
                    DocumentChunk(
                        document_id=document.id,
                        chunk_index=index,
                        content=chunk,
                        embedding=vector,
                    )
                )

        document.processing_status = "ready"
        document.processing_error = None
        db.commit()
    except Exception as exc:
        db.rollback()
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.processing_status = "failed"
            document.processing_error = str(exc)[:500]
            db.commit()
    finally:
        db.close()


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    return request.client.host if request.client else "unknown"


@app.get("/health")
def health():
    return {"ok": True}


# -------- AUTH --------

@app.post("/auth/register", response_model=UserOut)
def register(payload: RegisterIn, request: Request, db: Session = Depends(get_db)):
    register_rate_limiter.check(
        get_client_ip(request),
        "Too many registration attempts. Please try again later.",
    )
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login")
def login(
    response: Response,
    request: Request,
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    client_ip = get_client_ip(request)
    login_failures_by_ip.ensure_allowed(
        client_ip,
        "Too many failed login attempts. Please try again in 10 minutes.",
    )
    email, password = validate_login_credentials(form.username, form.password)
    login_failures_by_email.ensure_allowed(
        email,
        "Too many failed login attempts. Please try again in 10 minutes.",
    )
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        login_failures_by_ip.record_failure(client_ip)
        login_failures_by_email.record_failure(email)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    login_failures_by_ip.record_success(client_ip)
    login_failures_by_email.record_success(email)
    token = create_access_token(user.id)
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=60 * 60 * 24,
        path="/",
    )
    return {"ok": True}


@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        samesite=settings.auth_cookie_samesite,
    )
    return {"ok": True}


@app.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# -------- DOCUMENTS --------

@app.post("/documents/upload", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    topic: str = Form(""),
    topics: str = Form("[]"),
    status: str = Form(""),
    abstract: str = Form(""),
    authors: str = Form("[]"),
    keywords: str = Form("[]"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload_rate_limiter.check(
        f"user:{current_user.id}",
        "Too many upload requests. Please try again later.",
    )
    upload_rate_limiter.check(
        f"ip:{get_client_ip(request)}",
        "Too many upload requests. Please try again later.",
    )
    document_input = validate_document_form(
        title=title,
        topic=topic,
        topics=topics,
        status=status,
        abstract=abstract,
        authors=authors,
        keywords=keywords,
    )
    filename, file_content = validate_document_file(file, required=True)

    doc_uuid = str(uuid.uuid4())
    safe_name = f"{doc_uuid}_{filename}"
    storage_path = Path(settings.storage_dir) / safe_name

    with storage_path.open("wb") as f:
        f.write(file_content)

    doc = Document(
        filename=filename,
        title=document_input.title,
        topic=document_input.topics[0],
        topics=document_input.topics,
        status=document_input.status,
        processing_status="processing",
        processing_error=None,
        abstract=document_input.abstract,
        authors=document_input.authors,
        keywords=document_input.keywords,
        filepath=str(storage_path),
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    background_tasks.add_task(process_document_ingestion, doc.id)
    return doc


@app.put("/documents/{document_id}", response_model=DocumentOut)
async def update_document(
    background_tasks: BackgroundTasks,
    document_id: int = ApiPath(..., ge=1),
    title: str = Form(...),
    topic: str = Form(""),
    topics: str = Form("[]"),
    status: str = Form(""),
    abstract: str = Form(""),
    authors: str = Form("[]"),
    keywords: str = Form("[]"),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document_input = validate_document_form(
        title=title,
        topic=topic,
        topics=topics,
        status=status,
        abstract=abstract,
        authors=authors,
        keywords=keywords,
    )

    document.title = document_input.title
    document.topic = document_input.topics[0]
    document.topics = document_input.topics
    document.status = document_input.status
    document.abstract = document_input.abstract
    document.authors = document_input.authors
    document.keywords = document_input.keywords

    if file and file.filename:
        validated_file = validate_document_file(file, required=False)
        if validated_file is None:
            raise HTTPException(status_code=400, detail="Please select a replacement file")
        filename, file_content = validated_file
        old_path = Path(document.filepath)
        doc_uuid = str(uuid.uuid4())
        safe_name = f"{doc_uuid}_{filename}"
        storage_path = Path(settings.storage_dir) / safe_name

        with storage_path.open("wb") as f:
            f.write(file_content)

        document.filename = filename
        document.filepath = str(storage_path)
        document.processing_status = "processing"
        document.processing_error = None

        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()

        if old_path.exists():
            old_path.unlink()

    db.commit()
    db.refresh(document)
    if file and file.filename:
        background_tasks.add_task(process_document_ingestion, document.id)
    return document


@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int = ApiPath(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    stored_path = Path(document.filepath)
    db.delete(document)
    db.commit()

    if stored_path.exists():
        stored_path.unlink()

    return {"ok": True}


@app.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    documents = (
        db.query(Document)
        .order_by(Document.id.desc())
        .all()
    )
    return [serialize_document(document) for document in documents]


@app.get("/documents/mine", response_model=list[DocumentOut])
def list_my_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.id.desc())
        .all()
    )
    return [serialize_document(document) for document in documents]


@app.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int = ApiPath(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return serialize_document(document)


@app.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int = ApiPath(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    path = Path(document.filepath)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stored file not found")

    suffix = path.suffix.lower()
    media_type = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }.get(suffix, "application/octet-stream")

    return FileResponse(path, media_type=media_type, filename=document.filename)


# -------- CHAT --------

def is_conversational_message(message: str) -> bool:
    normalized = message.strip().lower()
    conversational_messages = {
        "hi",
        "hii",
        "hello",
        "hey",
        "yo",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "ok",
        "okay",
    }
    conversational_prefixes = (
        "how are you",
        "who are you",
        "what can you do",
        "can you help",
        "help me",
    )

    return (
        normalized in conversational_messages
        or any(normalized.startswith(prefix) for prefix in conversational_prefixes)
    )


def get_owned_conversation(db: Session, conversation_id: int, user_id: int) -> ChatConversation:
    conversation = (
        db.query(ChatConversation)
        .filter(ChatConversation.id == conversation_id, ChatConversation.owner_id == user_id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.get("/chat/conversations", response_model=list[ChatConversationOut])
def list_chat_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ChatConversation)
        .filter(ChatConversation.owner_id == current_user.id)
        .order_by(ChatConversation.updated_at.desc(), ChatConversation.id.desc())
        .all()
    )


@app.post("/chat/conversations", response_model=ChatConversationOut)
def create_chat_conversation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = ChatConversation(owner_id=current_user.id, title="New conversation")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@app.put("/chat/conversations/{conversation_id}", response_model=ChatConversationOut)
def update_chat_conversation(
    conversation_id: int = ApiPath(..., ge=1),
    payload: ChatConversationUpdateIn = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = get_owned_conversation(db, conversation_id, current_user.id)
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Conversation title is required")

    conversation.title = title[:255]
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)
    return conversation


@app.delete("/chat/conversations/{conversation_id}")
def delete_chat_conversation(
    conversation_id: int = ApiPath(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = get_owned_conversation(db, conversation_id, current_user.id)
    db.delete(conversation)
    db.commit()
    return {"ok": True}


@app.get("/chat/conversations/{conversation_id}/messages", response_model=list[ChatConversationMessageOut])
def list_chat_messages(
    conversation_id: int = ApiPath(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_conversation(db, conversation_id, current_user.id)
    return (
        db.query(ChatConversationMessage)
        .filter(ChatConversationMessage.conversation_id == conversation_id)
        .order_by(ChatConversationMessage.id.asc())
        .all()
    )


@app.post("/chat/conversations/{conversation_id}/messages", response_model=ChatConversationMessageOut)
async def ask_chat_in_conversation(
    request: Request,
    conversation_id: int = ApiPath(..., ge=1),
    payload: ChatIn = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat_rate_limiter.check(
        f"user:{current_user.id}",
        "Too many chat requests. Please try again later.",
    )
    chat_rate_limiter.check(
        f"ip:{get_client_ip(request)}",
        "Too many chat requests. Please try again later.",
    )
    conversation = get_owned_conversation(db, conversation_id, current_user.id)
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    recent_history = (
        db.query(ChatConversationMessage)
        .filter(ChatConversationMessage.conversation_id == conversation.id)
        .order_by(ChatConversationMessage.id.desc())
        .limit(10)
        .all()
    )
    conversation_history = [
        {"role": message.role, "content": message.content}
        for message in reversed(recent_history)
    ]

    user_message = ChatConversationMessage(
        conversation_id=conversation.id,
        role="user",
        content=question,
        sources=[],
    )
    db.add(user_message)

    if conversation.title == "New conversation":
        conversation.title = question[:70]
    conversation.updated_at = datetime.utcnow()

    if is_conversational_message(question):
        answer = await conversational_answer(question, conversation_history)
        assistant_message = ChatConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
            sources=[],
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)
        return assistant_message

    retrieval_query = "\n".join(
        [message["content"] for message in conversation_history[-4:]] + [question]
    )
    qvec = (await embed_texts([retrieval_query]))[0]
    chunks = retrieve_top_chunks(db, qvec, top_k=payload.top_k)

    sources = []
    source_ids = set()
    context_blocks = []
    for ch in chunks:
        if ch.document_id not in source_ids:
            source_ids.add(ch.document_id)
            sources.append(
                {
                    "doc_id": ch.document_id,
                    "title": ch.document.title or ch.document.filename,
                    "filename": ch.document.filename,
                }
            )
        context_blocks.append(
            {
                "doc_id": ch.document_id,
                "chunk_id": ch.id,
                "content": ch.content,
                "filename": ch.document.filename,
                "title": ch.document.title or ch.document.filename,
            }
        )

    answer = await chat_answer(question, context_blocks, conversation_history)
    assistant_message = ChatConversationMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources=sources,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    return assistant_message


@app.post("/chat/ask", response_model=ChatOut)
async def ask_chat(
    payload: ChatIn,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chat_rate_limiter.check(
        f"user:{current_user.id}",
        "Too many chat requests. Please try again later.",
    )
    chat_rate_limiter.check(
        f"ip:{get_client_ip(request)}",
        "Too many chat requests. Please try again later.",
    )
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    if is_conversational_message(question):
        answer = await conversational_answer(question)
        return ChatOut(answer=answer, sources=[])

    qvec = (await embed_texts([question]))[0]
    chunks = retrieve_top_chunks(db, qvec, top_k=payload.top_k)

    sources = []
    source_ids = set()
    context_blocks = []
    for ch in chunks:
        if ch.document_id not in source_ids:
            source_ids.add(ch.document_id)
            sources.append(
                {
                    "doc_id": ch.document_id,
                    "title": ch.document.title or ch.document.filename,
                    "filename": ch.document.filename,
                }
            )
        context_blocks.append(
            {
                "doc_id": ch.document_id,
                "chunk_id": ch.id,
                "content": ch.content,
                "filename": ch.document.filename,
                "title": ch.document.title or ch.document.filename,
            }
        )

    answer = await chat_answer(question, context_blocks)
    return ChatOut(answer=answer, sources=sources)

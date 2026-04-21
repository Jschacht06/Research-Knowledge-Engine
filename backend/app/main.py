import uuid
from datetime import datetime
from pathlib import Path

import json

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text

from .config import settings
from .db import Base, engine, get_db
from .models import User, Document, DocumentChunk
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    get_user_by_email,
    get_current_user,
)
from .extractors import extract_text
from .rag import chunk_text, embed_texts, retrieve_top_chunks, chat_answer

app = FastAPI(title="Research KB API", version="0.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # enable pgvector extension
    with engine.begin() as conn:
        conn.execute(sql_text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS title VARCHAR(255)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS topic VARCHAR(120)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(40)"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS abstract TEXT"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS authors JSONB DEFAULT '[]'::jsonb"))
        conn.execute(sql_text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb"))
    Path(settings.storage_dir).mkdir(parents=True, exist_ok=True)


class RegisterIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DocumentOut(BaseModel):
    id: int
    title: str
    filename: str
    topic: str | None = None
    status: str | None = None
    abstract: str | None = None
    authors: list[str]
    keywords: list[str]
    created_at: datetime
    class Config:
        from_attributes = True


class ChatIn(BaseModel):
    question: str
    top_k: int = 6


class ChatOut(BaseModel):
    answer: str
    sources: list[dict]


def serialize_document(document: Document) -> Document:
    if not document.title:
        document.title = document.filename
    document.authors = document.authors or []
    document.keywords = document.keywords or []
    return document


@app.get("/health")
def health():
    return {"ok": True}


# -------- AUTH --------

@app.post("/auth/register", response_model=UserOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    existing = get_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form.username.strip().lower()
    user = get_user_by_email(db, email)
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenOut(access_token=token)


@app.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# -------- DOCUMENTS --------

@app.post("/documents/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    topic: str = Form(""),
    status: str = Form(""),
    abstract: str = Form(""),
    authors: str = Form("[]"),
    keywords: str = Form("[]"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or "file"
    cleaned_title = title.strip()
    if not cleaned_title:
        raise HTTPException(status_code=400, detail="Document title is required")

    cleaned_status = status.strip()
    allowed_statuses = {"Goedgekeurd", "Afgekeurd", "Aangevraagd", "Done"}
    if cleaned_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Please select a valid document status")

    ext = filename.lower().split(".")[-1]
    allowed = {"pdf", "docx", "pptx"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, PPTX are allowed")

    try:
        parsed_authors = [item.strip() for item in json.loads(authors) if str(item).strip()]
        parsed_keywords = [item.strip() for item in json.loads(keywords) if str(item).strip()]
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Authors and keywords must be valid JSON arrays") from exc

    doc_uuid = str(uuid.uuid4())
    safe_name = f"{doc_uuid}_{Path(filename).name}"
    storage_path = Path(settings.storage_dir) / safe_name

    with storage_path.open("wb") as f:
        f.write(file.file.read())

    doc = Document(
        filename=Path(filename).name,
        title=cleaned_title,
        topic=topic.strip() or None,
        status=cleaned_status,
        abstract=abstract.strip() or None,
        authors=parsed_authors,
        keywords=parsed_keywords,
        filepath=str(storage_path),
        owner_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # --- Extract + chunk + embed + store ---
    text_content = extract_text(doc.filepath)
    chunks = chunk_text(text_content)

    if chunks:
        vectors = await embed_texts(chunks)
        for i, (c, v) in enumerate(zip(chunks, vectors)):
            db.add(DocumentChunk(document_id=doc.id, chunk_index=i, content=c, embedding=v))
        db.commit()

    return doc


@app.put("/documents/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: int,
    title: str = Form(...),
    topic: str = Form(""),
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

    cleaned_title = title.strip()
    if not cleaned_title:
        raise HTTPException(status_code=400, detail="Document title is required")

    cleaned_status = status.strip()
    allowed_statuses = {"Goedgekeurd", "Afgekeurd", "Aangevraagd", "Done"}
    if cleaned_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Please select a valid document status")

    try:
        parsed_authors = [item.strip() for item in json.loads(authors) if str(item).strip()]
        parsed_keywords = [item.strip() for item in json.loads(keywords) if str(item).strip()]
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Authors and keywords must be valid JSON arrays") from exc

    document.title = cleaned_title
    document.topic = topic.strip() or None
    document.status = cleaned_status
    document.abstract = abstract.strip() or None
    document.authors = parsed_authors
    document.keywords = parsed_keywords

    if file and file.filename:
        filename = file.filename or "file"
        ext = filename.lower().split(".")[-1]
        allowed = {"pdf", "docx", "pptx"}
        if ext not in allowed:
            raise HTTPException(status_code=400, detail="Only PDF, DOCX, PPTX are allowed")

        old_path = Path(document.filepath)
        doc_uuid = str(uuid.uuid4())
        safe_name = f"{doc_uuid}_{Path(filename).name}"
        storage_path = Path(settings.storage_dir) / safe_name

        with storage_path.open("wb") as f:
            f.write(file.file.read())

        document.filename = Path(filename).name
        document.filepath = str(storage_path)

        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
        text_content = extract_text(document.filepath)
        chunks = chunk_text(text_content)
        if chunks:
            vectors = await embed_texts(chunks)
            for i, (c, v) in enumerate(zip(chunks, vectors)):
                db.add(DocumentChunk(document_id=document.id, chunk_index=i, content=c, embedding=v))

        if old_path.exists():
            old_path.unlink()

    db.commit()
    db.refresh(document)
    return document


@app.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    documents = (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.id.desc())
        .all()
    )
    return [serialize_document(document) for document in documents]


@app.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
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

    return serialize_document(document)


@app.get("/documents/{document_id}/file")
def get_document_file(
    document_id: int,
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

@app.post("/chat/ask", response_model=ChatOut)
async def ask_chat(payload: ChatIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question required")

    qvec = (await embed_texts([question]))[0]
    chunks = retrieve_top_chunks(db, current_user.id, qvec, top_k=payload.top_k)

    sources = []
    context_blocks = []
    for ch in chunks:
        sources.append({"doc_id": ch.document_id, "chunk_id": ch.id, "chunk_index": ch.chunk_index})
        context_blocks.append(
            {"doc_id": ch.document_id, "chunk_id": ch.id, "content": ch.content, "filename": ch.document.filename}
        )

    answer = await chat_answer(question, context_blocks)
    return ChatOut(answer=answer, sources=sources)

import uuid
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
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
    filename: str
    created_at: datetime
    class Config:
        from_attributes = True


class ChatIn(BaseModel):
    question: str
    top_k: int = 6


class ChatOut(BaseModel):
    answer: str
    sources: list[dict]


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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or "file"
    ext = filename.lower().split(".")[-1]
    allowed = {"pdf", "docx", "pptx"}
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, PPTX are allowed")

    doc_uuid = str(uuid.uuid4())
    safe_name = f"{doc_uuid}_{Path(filename).name}"
    storage_path = Path(settings.storage_dir) / safe_name

    with storage_path.open("wb") as f:
        f.write(file.file.read())

    doc = Document(
        filename=Path(filename).name,
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


@app.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.id.desc())
        .all()
    )


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

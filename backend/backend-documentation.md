# `backend/app/config.py`
---

## Overview

`config.py` contains a few variables that read important variables from the .env file. These are stored in the variables and can be used later on in the code. Examples of this usage can be found later on. To read these values we use a python library called pydantic.

---

## Source

Current implementation:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    storage_dir: str = "/data/files"

    llm_provider: str = "ollama"  # "ollama" or "openai"
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_chat_model: str = "llama3.1:8b"
    ollama_embed_model: str = "nomic-embed-text"

    openai_api_key: str | None = None
    openai_chat_model: str = "gpt-4o-mini"
    openai_embed_model: str = "text-embedding-3-small"

    class Config:
        env_prefix = ""
        extra = "ignore"

settings = Settings()
```

---
## How it works

### `BaseSettings`

`Settings` inherits from `BaseSettings`, so Pydantic reads values from environment variables automatically.

Because `env_prefix = ""`, the environment variable names map directly to the field names in uppercase form:

- `database_url` -> `DATABASE_URL`
- `jwt_secret` -> `JWT_SECRET`
- `storage_dir` -> `STORAGE_DIR`
- `llm_provider` -> `LLM_PROVIDER`
### Global settings instance

The line below constructs the configuration once and makes it reusable across the backend:

```python
settings = Settings()
```

Other modules import this object and use it directly.

---

## Example `.env`

```env
DATABASE_URL=postgresql+psycopg://kb:kb@db:5432/kb
JWT_SECRET=replace_with_a_long_random_secret
STORAGE_DIR=/data/files

LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_CHAT_MODEL=llama3.1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

---
## Where settings are used

### `db.py`

`database_url` is used to initialize SQLAlchemy:

```python
engine = create_engine(settings.database_url, pool_pre_ping=True)
```

### `security.py`

`jwt_secret` is used for JWT signing and decoding:

```python
return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
```

### `main.py`

`storage_dir` is used during startup and file upload handling:

```python
Path(settings.storage_dir).mkdir(parents=True, exist_ok=True)
storage_path = Path(settings.storage_dir) / safe_name
```

### `rag.py`

LLM settings are used for embeddings and responses:

```python
if settings.llm_provider != "ollama":
    raise RuntimeError("Only ollama is configured in this build")
```

```python
url = f"{settings.ollama_base_url}/api/embeddings"
```

```python
r = await client.post(url, json={"model": settings.ollama_embed_model, "prompt": t})
```

```python
url = f"{settings.ollama_base_url}/api/generate"
r = await client.post(
    url,
    json={"model": settings.ollama_chat_model, "prompt": prompt, "stream": False},
)
```

---
# `backend/app/db.py`
---
## Source

Current implementation:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---
## Overview

This module sets up the SQLAlchemy database connection and provides the shared database session used throughout the application.

SQLAlchemy is a Python library for working with databases. It provides tools to connect to a database, run SQL queries, and define database tables as Python classes using an ORM (Object-Relational Mapper).

---
```python
engine = create_engine(settings.database_url, pool_pre_ping=True)
```
Creates the SQLAlchemy engine using the database URL from the application settings.
```python
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
```
Sets up a reusable way to create SQLAlchemy Session objects
```python
class Base(DeclarativeBase):
    pass
```
Defines the base class for all ORM models in the project. Its used later on in the models.py file to create our users, document and other tabels
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```
Provides a database session and ensures it is properly closed after use.

---
# `backend/app/models.py`
---
## Source

Current implementation:

```python
from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    documents: Mapped[list["Document"]] = relationship(back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    filepath: Mapped[str] = mapped_column(String(500))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

    owner: Mapped["User"] = relationship(back_populates="documents")
    chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    # embeddings vector (nomic-embed-text = 768 dims)
    embedding: Mapped[list[float]] = mapped_column(Vector(768))

    document: Mapped["Document"] = relationship(back_populates="chunks")


Index("ix_document_chunks_document_chunk", DocumentChunk.document_id, DocumentChunk.chunk_index)
```

---
# `backend/app/models.py`

## Purpose

This file defines the database models for the application using SQLAlchemy. These models represent the main data stored by the system: users, uploaded documents, and document chunks with embeddings.

It derives from the Base class we discussed earlier in db.py
```python
class Base(DeclarativeBase):
    pass
```

## Main Models

### `User`

The `User` model stores account information for each user. It includes:
- `id` as the primary key
- `email` as a unique and indexed field
- `password_hash` for storing the hashed password
- `created_at` for the account creation time

A user also has a relationship to their uploaded documents through the `documents` field.

### `Document`

The `Document` model stores metadata about uploaded files. It includes:
- `id` as the primary key
- `filename` for the original file name
- `filepath` for where the file is stored
- `owner_id` as a foreign key linking the document to a user
- `created_at` for when the document was added

It connects back to the owning user with `owner`, and to its text chunks with `chunks`.

### `DocumentChunk`

The `DocumentChunk` model stores smaller sections of a document for retrieval and embedding search. It includes:
- `id` as the primary key
- `document_id` as a foreign key linking the chunk to a document
- `chunk_index` for the order of the chunk within the document
- `content` for the chunk text
- `embedding` for the vector representation of the chunk

The embedding uses `Vector(768)`, which means each chunk stores a 768-dimensional vector for semantic search.
## Relationships

The models are connected in a simple hierarchy:
- one **User** can have many **Document** records
- one **Document** can have many **DocumentChunk** records

The `Document.chunks` relationship uses `cascade="all, delete-orphan"`, so deleting a document also removes its associated chunks.

## Index

The file also defines an index on `document_id` and `chunk_index` in `DocumentChunk`. This helps make chunk lookups more efficient, especially when retrieving chunks in order for a specific document. 

---
# `backend/app/extractors.py`

## Purpose

This file is responsible for extracting plain text from uploaded document files. It supports PDF, DOCX, and PPTX formats, and returns the extracted text as a single string.

## Main Function

### `extract_text(filepath: str) -> str`

This is the main entry point of the file. It checks the file extension and sends the file to the correct helper function for text extraction. Supported file types are:

- `.pdf`
- `.docx`
- `.pptx`

If the file type is not supported, the function returns an empty string.

## Helper Functions

### `_extract_pdf(filepath: str) -> str`

This function extracts text from PDF files using **PyMuPDF** (`fitz`).

How it works:
- opens the PDF file
- loops through each page
- gets the text from each page
- joins all page text into one string

### `_extract_docx(filepath: str) -> str`

This function extracts text from Word documents using `python-docx`.

How it works:
- opens the `.docx` file
- reads the document paragraphs
- collects non-empty paragraph text
- joins all paragraph text into one string

### `_extract_pptx(filepath: str) -> str`

This function extracts text from PowerPoint files using `python-pptx`.

How it works:
- opens the presentation
- loops through each slide
- checks each shape for text
- collects all text content into one string

---

# `backend/app/security.py`

## Purpose

This file manages authentication and password security for the application. It is used to hash passwords, verify login credentials, create JWT access tokens, and identify the currently authenticated user.

## Main Components

### `pwd_context`

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

This sets up password hashing with **bcrypt** using Passlib.

It is used to:
- securely hash user passwords before storing them
- verify passwords during login

### `oauth2_scheme`

```python
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
```

This defines the OAuth2 bearer token system for FastAPI.

It tells the application that:
- users authenticate through `/auth/login`
- protected routes should expect a bearer token

## Main Functions

### `hash_password(password: str) -> str`

This function converts a plain-text password into a secure hashed password.

It is used when creating new user accounts or updating passwords.

### `verify_password(password: str, password_hash: str) -> bool`

This function checks whether a plain-text password matches the stored hashed password.

It is mainly used during login.

### `create_access_token(user_id: int, expires_minutes: int = 60 * 24) -> str`

This function creates a JWT access token for an authenticated user.

The token includes:
- `sub` for the user ID
- `exp` for the expiration time
- `iat` for the issue time

By default, the token expires after 24 hours.

### `get_user_by_id(db: Session, user_id: int) -> User | None`

This helper function looks up a user in the database using their ID.

It returns the matching user if one exists.

### `get_user_by_email(db: Session, email: str) -> User | None`

This helper function looks up a user in the database by email address.

It is commonly used during login and registration.

### `get_current_user(...) -> User`

This function retrieves the currently authenticated user from the JWT token included in the request.

It works by:
- reading the bearer token
- decoding the JWT
- extracting the user ID
- finding the user in the database
- raising an error if the token is invalid or the user does not exist

---
# `backend/app/rag.py`

## Purpose

This file contains the core Retrieval-Augmented Generation (RAG) logic for the application. It is responsible for:

- splitting extracted document text into chunks
- generating embeddings for those chunks
- retrieving the most relevant stored chunks for a user query
- generating an answer from the retrieved context

## Main Functions

### `chunk_text(text: str, max_chars: int = 1200, overlap: int = 150) -> list[str]`

This function splits a long text into smaller overlapping chunks.

It works by:
- normalizing whitespace
- removing empty input
- cutting the text into sections of up to `max_chars`
- overlapping adjacent chunks by `overlap` characters

The overlap helps preserve context between chunks, which improves retrieval quality.

### `embed_texts(texts: list[str]) -> list[list[float]]`

This asynchronous function generates embeddings for a list of text chunks.

It:
- checks the configured language model provider
- sends each text chunk to the Ollama embeddings API
- collects the returned embedding vectors
- returns them as a list of float arrays

This file currently supports only **Ollama** for embeddings. If `llm_provider` is not set to `"ollama"`, it raises an error.

### `chat_answer(question: str, context_blocks: list[dict]) -> str`

This asynchronous function generates a final answer using the retrieved document chunks as context.

It:
- formats the retrieved chunks into a source block
- builds a prompt with system instructions and the user question
- sends the prompt to the Ollama generation API
- returns the generated response

The prompt instructs the model to:
- answer in English
- use only the provided sources
- say when the answer is unknown

### `retrieve_top_chunks(db: Session, owner_id: int, query_vec: list[float], top_k: int = 6)`

This function retrieves the most relevant document chunks from the database for a given user query embedding.

It:
- queries `DocumentChunk`
- joins each chunk to its related document
- filters results so only the current user's documents are searched **(this is not correct it should search all documents in the future)**
- orders chunks by cosine distance from the query vector
- returns the top matching chunks

This uses **pgvector** similarity search on the `embedding` field stored in `DocumentChunk`.

## Dependencies

`rag.py` depends on:
- `settings` from `config.py` for model and API configuration
- `DocumentChunk` from `models.py` for retrieval
- `httpx` for async HTTP requests to Ollama
- SQLAlchemy `Session` for database access
- `pgvector` for vector similarity search

---

# `backend/app/main.py`

## Purpose

This file is the main entry point for the FastAPI backend. It creates the application, configures middleware, initializes required resources at startup, and defines the API endpoints for authentication, document upload, document listing, and chat-based question answering.

## Application Setup

### `app = FastAPI(...)`

The FastAPI application is created with:
- title: `Research KB API`
- version: `0.2`

This is the main API object used to register all routes.

### CORS Middleware

The file adds CORS middleware to allow requests from:

- `http://localhost:3000`

This is typically used to allow the frontend application to communicate with the backend during development.

## Startup Logic

### `on_startup()`

This function runs when the application starts.

It performs three setup tasks:
- enables the PostgreSQL `vector` extension if it is not already installed
- creates all database tables defined by the SQLAlchemy models
- creates the storage directory for uploaded files if it does not already exist

This ensures the application is ready to store documents and perform vector-based retrieval.

## Request and Response Models

The file defines several Pydantic models used by the API:
Pydantic is a Python library used for **data validation and data modeling**. It lets developers define the expected structure of data using Python classes.

### `RegisterIn`
Used for user registration input.
- `email`
- `password`

### `UserOut`
Used for returning user information.
- `id`
- `email`

### `TokenOut`
Used for returning a login token.
- `access_token`
- `token_type`

### `DocumentOut`
Used for returning uploaded document information.
- `id`
- `filename`
- `created_at`

### `ChatIn`
Used for chat request input.
- `question`
- `top_k`

### `ChatOut`
Used for chat responses.
- `answer`
- `sources`

## Endpoints

### `GET /health`

A simple health check endpoint.

It returns:

```json
{"ok": true}
```

This can be used to confirm that the backend is running.

### `POST /auth/register`

Registers a new user.

It:
- normalizes the email address
- checks that email and password are provided
- verifies the email is not already registered
- hashes the password
- creates and stores the new user

It returns the created user.

### `POST /auth/login`

Logs in an existing user.

It:
- reads credentials from an OAuth2 password form
- looks up the user by email
- verifies the password
- creates a JWT access token

It returns the access token for authenticated requests.

### `GET /me`

Returns the currently authenticated user.

This endpoint depends on `get_current_user`, which reads and validates the JWT token.

### `POST /documents/upload`

Uploads a document for the authenticated user.

It:
- accepts an uploaded file
- checks that the file type is PDF, DOCX, or PPTX
- saves the file in the configured storage directory
- creates a `Document` record in the database
- extracts text from the file
- splits the text into chunks
- generates embeddings for each chunk
- stores each chunk and its embedding in the database

This is the main ingestion endpoint for building the knowledge base.

### `GET /documents`

Returns all uploaded documents for the current user.

The results are ordered by newest document first.

### `POST /chat/ask`

Answers a user question using retrieval-augmented generation.

It:
- validates the question
- generates an embedding for the question
- retrieves the most relevant stored document chunks
- formats the retrieved chunks as context
- sends the question and context to the language model
- returns the generated answer and the source chunk references

This is the main query endpoint for interacting with the stored knowledge base.

## Dependencies

`main.py` connects many parts of the backend together. It uses:

- `config.py` for application settings
- `db.py` for database setup and sessions
- `models.py` for database models
- `security.py` for password hashing, token creation, and authentication
- `extractors.py` for reading file contents
- `rag.py` for chunking, embeddings, retrieval, and answer generation
import json
import re
import zipfile
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile
from pydantic import BaseModel, Field, ValidationError, field_validator
from .config import settings

ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "docx", "pptx"}
ALLOWED_DOCUMENT_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/octet-stream",
}
ALLOWED_DOCUMENT_STATUSES = {"Goedgekeurd", "Afgekeurd", "Aangevraagd", "Done"}
MAX_FILE_SIZE_MB = 25
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TEXT_CONTROL_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
SINGLE_LINE_CONTROL_PATTERN = re.compile(r"[\x00-\x1f\x7f]")
MARKUP_CHARACTER_PATTERN = re.compile(r"[<>]")


def normalize_spaces(value: str) -> str:
    return " ".join(value.split())


def validate_text(
    value: str,
    *,
    field_name: str,
    max_length: int,
    min_length: int = 1,
    multiline: bool = False,
) -> str:
    cleaned = value.strip() if multiline else normalize_spaces(value)
    if len(cleaned) < min_length:
        raise ValueError(f"{field_name} is required")
    if len(cleaned) > max_length:
        raise ValueError(f"{field_name} must be {max_length} characters or fewer")

    pattern = TEXT_CONTROL_PATTERN if multiline else SINGLE_LINE_CONTROL_PATTERN
    if pattern.search(cleaned):
        raise ValueError(f"{field_name} contains unsupported control characters")

    return cleaned


def validate_plain_metadata(value: str, *, field_name: str, max_length: int) -> str:
    cleaned = validate_text(value, field_name=field_name, max_length=max_length)
    if MARKUP_CHARACTER_PATTERN.search(cleaned):
        raise ValueError(f"{field_name} cannot contain angle brackets")
    return cleaned


def validation_error_message(error: ValidationError) -> str:
    first_error = error.errors()[0] if error.errors() else {}
    message = first_error.get("msg", "Invalid input")
    return str(message).removeprefix("Value error, ")


def bad_request_from_validation(error: ValidationError) -> HTTPException:
    return HTTPException(status_code=400, detail=validation_error_message(error))


def validate_allowed_email_domain(cleaned_email: str) -> str:
    if "@" not in cleaned_email:
        raise ValueError("Please enter a valid email address")

    domain = cleaned_email.rsplit("@", 1)[1]
    if domain not in settings.email_domains:
        raise ValueError("Please enter a valid email address")

    return cleaned_email


def validate_login_credentials(email: str, password: str) -> tuple[str, str]:
    cleaned_email = email.strip().lower()
    if not cleaned_email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(cleaned_email) > 320:
        raise HTTPException(status_code=400, detail="Email must be 320 characters or fewer")
    if not EMAIL_PATTERN.match(cleaned_email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
    try:
        validate_allowed_email_domain(cleaned_email)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if len(password) > 128:
        raise HTTPException(status_code=400, detail="Password must be 128 characters or fewer")
    if SINGLE_LINE_CONTROL_PATTERN.search(password):
        raise HTTPException(status_code=400, detail="Password contains unsupported control characters")
    return cleaned_email, password


def parse_string_array(raw_value: str, field_name: str) -> list[str]:
    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must be a valid JSON array") from exc

    if not isinstance(parsed, list):
        raise HTTPException(status_code=400, detail=f"{field_name} must be a valid JSON array")

    if not all(isinstance(item, str) for item in parsed):
        raise HTTPException(status_code=400, detail=f"{field_name} can only contain text values")

    return parsed


def validate_document_file(file: UploadFile, *, required: bool) -> tuple[str, bytes] | None:
    if not file.filename:
        if required:
            raise HTTPException(status_code=400, detail="Please select a document file")
        return None

    filename = validate_text(
        Path(file.filename).name,
        field_name="Filename",
        max_length=255,
    )
    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, PPTX are allowed")

    if file.content_type and file.content_type not in ALLOWED_DOCUMENT_MIME_TYPES:
        raise HTTPException(status_code=400, detail="The uploaded file type is not supported")

    content = file.file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail=f"Please upload a file smaller than {MAX_FILE_SIZE_MB} MB")

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")

    if extension == "pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="The uploaded PDF file is not valid")

    if extension in {"docx", "pptx"}:
        try:
            with zipfile.ZipFile(BytesIO(content)) as archive:
                names = set(archive.namelist())
        except zipfile.BadZipFile as exc:
            raise HTTPException(status_code=400, detail="The uploaded Office file is not valid") from exc

        required_entry = "word/document.xml" if extension == "docx" else "ppt/presentation.xml"
        if required_entry not in names:
            raise HTTPException(status_code=400, detail=f"The uploaded {extension.upper()} file is not valid")

    return filename, content


class RegisterIn(BaseModel):
    email: str
    full_name: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not cleaned:
            raise ValueError("Email is required")
        if len(cleaned) > 320:
            raise ValueError("Email must be 320 characters or fewer")
        if not EMAIL_PATTERN.match(cleaned):
            raise ValueError("Please enter a valid email address")
        return validate_allowed_email_domain(cleaned)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return validate_plain_metadata(value, field_name="Full name", max_length=255)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(value) > 128:
            raise ValueError("Password must be 128 characters or fewer")
        if SINGLE_LINE_CONTROL_PATTERN.search(value):
            raise ValueError("Password contains unsupported control characters")
        return value


class DocumentInput(BaseModel):
    title: str
    topics: list[str]
    status: str
    abstract: str | None = None
    authors: list[str]
    keywords: list[str] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return validate_plain_metadata(value, field_name="Document title", max_length=255)

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, value: list[str]) -> list[str]:
        cleaned_topics = [
            validate_plain_metadata(topic, field_name="Topic", max_length=120)
            for topic in value
        ]
        unique_topics = list(dict.fromkeys(cleaned_topics))
        if not unique_topics:
            raise ValueError("Please select at least one research topic")
        if len(unique_topics) > 6:
            raise ValueError("Please select 6 research topics or fewer")
        return unique_topics

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        cleaned = validate_text(value, field_name="Document status", max_length=40)
        if cleaned not in ALLOWED_DOCUMENT_STATUSES:
            raise ValueError("Please select a valid document status")
        return cleaned

    @field_validator("abstract")
    @classmethod
    def validate_abstract(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return validate_text(value, field_name="Abstract", max_length=5000, multiline=True)

    @field_validator("authors")
    @classmethod
    def validate_authors(cls, value: list[str]) -> list[str]:
        cleaned_authors = [
            validate_plain_metadata(author, field_name="Author", max_length=120)
            for author in value
            if author.strip()
        ]
        unique_authors = list(dict.fromkeys(cleaned_authors))
        if not unique_authors:
            raise ValueError("Please add at least one author")
        if len(unique_authors) > 20:
            raise ValueError("Please add 20 authors or fewer")
        return unique_authors

    @field_validator("keywords")
    @classmethod
    def validate_keywords(cls, value: list[str]) -> list[str]:
        cleaned_keywords = [
            validate_plain_metadata(keyword, field_name="Keyword", max_length=80)
            for keyword in value
            if keyword.strip()
        ]
        unique_keywords = list(dict.fromkeys(cleaned_keywords))
        if len(unique_keywords) > 30:
            raise ValueError("Please add 30 keywords or fewer")
        return unique_keywords


class ChatIn(BaseModel):
    question: str
    top_k: int = Field(default=6, ge=1, le=12)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        return validate_text(value, field_name="Question", max_length=4000, multiline=True)


class ChatConversationUpdateIn(BaseModel):
    title: str

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return validate_plain_metadata(value, field_name="Conversation title", max_length=255)


def validate_document_form(
    *,
    title: str,
    topic: str,
    topics: str,
    status: str,
    abstract: str,
    authors: str,
    keywords: str,
) -> DocumentInput:
    parsed_topics = parse_string_array(topics, "Topics")
    if not parsed_topics and topic.strip():
        parsed_topics = [topic]

    try:
        return DocumentInput.model_validate(
            {
                "title": title,
                "topics": parsed_topics,
                "status": status,
                "abstract": abstract,
                "authors": parse_string_array(authors, "Authors"),
                "keywords": parse_string_array(keywords, "Keywords"),
            }
        )
    except ValidationError as exc:
        raise bad_request_from_validation(exc) from exc

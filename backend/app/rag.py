import re
import httpx
from sqlalchemy.orm import Session

from .config import settings
from .models import DocumentChunk


def chunk_text(text: str, max_chars: int = 1200, overlap: int = 150) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i : i + max_chars]
        chunks.append(chunk)
        i += max_chars - overlap
    return chunks


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if settings.llm_provider != "ollama":
        raise RuntimeError("Only ollama is configured in this build")

    url = f"{settings.ollama_base_url}/api/embeddings"
    vectors: list[list[float]] = []
    async with httpx.AsyncClient(timeout=120) as client:
        for t in texts:
            r = await client.post(url, json={"model": settings.ollama_embed_model, "prompt": t})
            r.raise_for_status()
            vectors.append(r.json()["embedding"])
    return vectors


async def chat_answer(
    question: str,
    context_blocks: list[dict],
    conversation_history: list[dict] | None = None,
) -> str:
    # Keep source IDs out of the prompt text so the model does not print raw chunk references.
    context_text = "\n\n".join(
        [f"[source title={b['title']} file={b['filename']}]\n{b['content']}" for b in context_blocks]
    )

    system = (
        "You are a helpful, conversational assistant for a research knowledge base.\n"
        "Answer in English.\n"
        "Write naturally and clearly, similar to ChatGPT: friendly, direct, and useful.\n"
        "Use short paragraphs or bullets when that makes the answer easier to read.\n"
        "You must use only the provided database sources.\n"
        "Do not use outside knowledge, prior knowledge, web knowledge, or general background knowledge.\n"
        "If the provided sources do not explicitly contain the answer, say that the database does not contain enough information.\n"
        "Do not invent citations, papers, dates, authors, algorithms, or facts.\n"
        "Only refer to facts that are present in the provided source text.\n"
        "Do not include a Sources section, source list, raw document IDs, or chunk IDs in your answer."
    )
    history_text = "\n".join(
        [
            f"{message['role'].upper()}: {message['content']}"
            for message in (conversation_history or [])
        ]
    )

    prompt = (
        f"{system}\n\n"
        f"CONVERSATION HISTORY:\n{history_text or 'No previous messages.'}\n\n"
        f"SOURCES:\n{context_text}\n\n"
        f"QUESTION:\n{question}\n\n"
        "RESPONSE:"
    )

    url = f"{settings.ollama_base_url}/api/generate"
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            url,
            json={"model": settings.ollama_chat_model, "prompt": prompt, "stream": False},
        )
        r.raise_for_status()
        return r.json().get("response", "").strip()


async def conversational_answer(
    question: str,
    conversation_history: list[dict] | None = None,
) -> str:
    history_text = "\n".join(
        [
            f"{message['role'].upper()}: {message['content']}"
            for message in (conversation_history or [])
        ]
    )
    system = (
        "You are a friendly assistant inside the Research Knowledge Engine.\n"
        "Answer naturally, like ChatGPT would, but keep it concise.\n"
        "This message is conversational and does not require document sources.\n"
        "Do not mention sources, documents, citations, or database limitations unless the user asks about research documents.\n"
        "If helpful, invite the user to ask a research question about the uploaded knowledge base."
    )
    prompt = (
        f"{system}\n\n"
        f"CONVERSATION HISTORY:\n{history_text or 'No previous messages.'}\n\n"
        f"USER MESSAGE:\n{question}\n\n"
        "RESPONSE:"
    )

    url = f"{settings.ollama_base_url}/api/generate"
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            url,
            json={"model": settings.ollama_chat_model, "prompt": prompt, "stream": False},
        )
        r.raise_for_status()
        return r.json().get("response", "").strip()


def retrieve_top_chunks(db: Session, query_vec: list[float], top_k: int = 6):
    # Cosine distance using pgvector
    q = (
        db.query(DocumentChunk)
        .join(DocumentChunk.document)
        .order_by(DocumentChunk.embedding.cosine_distance(query_vec))
        .limit(top_k)
    )
    return q.all()

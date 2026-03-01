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

settings = Settings()  # lit les variables d'environnement
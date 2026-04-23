from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    storage_dir: str = "/data/files"
    frontend_origins: str = "http://localhost:5173,http://localhost:3000"
    allowed_email_domains: str

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

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @property
    def email_domains(self) -> list[str]:
        return [domain.strip().lower() for domain in self.allowed_email_domains.split(",") if domain.strip()]


settings = Settings()  # read environment variables and create an instance of the Settings class to use later on

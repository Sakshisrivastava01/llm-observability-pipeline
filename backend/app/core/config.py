from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration settings loaded from environment or .env file."""

    ENVIRONMENT: str = "production"
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/observability"
    )

    # Provider configurations
    OPENAI_API_KEY: str = "mock-openai-key"
    OPENAI_API_BASE: str = "https://api.openai.com/v1"
    OLLAMA_API_BASE: str = "http://localhost:11434"
    JWT_SECRET_KEY: str = (
        "3aef6678ab22cd4f11f43a992bc80918731558291a1a5b827e8a939f8df2d2b5"
    )
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@company.com"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()

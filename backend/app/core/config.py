"""
Core configuration for the AI Call Intelligence Backend
"""
from pydantic_settings import BaseSettings
from typing import List
import os
from pathlib import Path

# Get the backend directory path
backend_dir = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    PROJECT_NAME: str = "AI Call Intelligence API"
    VERSION: str = "1.0.0"
    
    # Database Configuration - PostgreSQL
    DATABASE_URL: str = "postgresql://klassy:yWQe2PJ6E0SWeN7mBYrz5OsYwMdq2wWB@dpg-d3betrjipnbc73fqjag0-a.singapore-postgres.render.com/daviddb_e0aw"
    POSTGRES_USER: str = "klassy"
    POSTGRES_PASSWORD: str = "yWQe2PJ6E0SWeN7mBYrz5OsYwMdq2wWB"
    POSTGRES_DB: str = "daviddb_e0aw"
    POSTGRES_HOST: str = "dpg-d3betrjipnbc73fqjag0-a.singapore-postgres.render.com"
    POSTGRES_PORT: int = 5432
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT Configuration
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI/ML Model Configuration
    OPENAI_API_KEY: str = "your-openai-api-key-here"
    HUGGINGFACE_API_TOKEN: str = "your-huggingface-token-here"
    
    # Model Names
    ROBERTA_MODEL: str = "j-hartmann/emotion-english-distilroberta-base"
    SENTIMENT_MODEL: str = "cardiffnlp/twitter-roberta-base-sentiment-latest"
    LLAMA_MODEL: str = "meta-llama/Llama-2-8b-chat-hf"
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]
    
    # Speech-to-Text Configuration
    STT_API_URL: str = "https://api.openai.com/v1/audio/transcriptions"
    STT_MODEL: str = "whisper-1"
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = str(backend_dir / "logs" / "app.log")
    
    class Config:
        env_file = str(backend_dir / ".env")
        case_sensitive = True

# Create a global settings instance
settings = Settings()

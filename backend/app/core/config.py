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
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./ai_call_intelligence.db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password123"
    POSTGRES_DB: str = "ai_call_intelligence"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT Configuration
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI/ML Model Configuration
    # Note: Using local models - no external API keys needed
    
    # Model Names - Using local models
    ROBERTA_MODEL: str = "/home/klassy/Desktop/roberta_finetuned"
    SENTIMENT_MODEL: str = "/home/klassy/Desktop/roberta_finetuned"
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
    # Note: STT functionality can be implemented with local models if needed
    STT_API_URL: str = ""
    STT_MODEL: str = ""
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = str(backend_dir / "logs" / "app.log")
    
    class Config:
        env_file = str(backend_dir / ".env")
        case_sensitive = True

# Create a global settings instance
settings = Settings()

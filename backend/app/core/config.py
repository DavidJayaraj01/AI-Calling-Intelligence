"""
Core configuration for the AI Call Intelligence Backend
"""
from pydantic_settings import BaseSettings
from typing import List, Union
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
    DATABASE_URL: str = "postgresql://db:t5KGZJ3OZUfpUtUaUgADVez06AWKcPTn@dpg-d3bjmni4d50c73bs649g-a.oregon-postgres.render.com/jerwindb"
    POSTGRES_USER: str = "db"
    POSTGRES_PASSWORD: str = "t5KGZJ3OZUfpUtUaUgADVez06AWKcPTn"
    POSTGRES_DB: str = "jerwindb"
    POSTGRES_HOST: str = "dpg-d3bjmni4d50c73bs649g-a.oregon-postgres.render.com"
    POSTGRES_PORT: int = 5432
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_PRO_MODEL: str = "gemini-2.5-pro"
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 25 * 1024 * 1024  # 25MB for audio files
    ALLOWED_AUDIO_EXTENSIONS: List[str] = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"]
    UPLOAD_DIR: str = str(backend_dir / "uploads")
    
    # CORS Configuration - Using property to avoid pydantic parsing issues
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        # Check if environment variable is set
        env_origins = os.getenv("ALLOWED_ORIGINS")
        if env_origins:
            if env_origins == "*":
                return ["*"]
            else:
                # Split by comma and strip whitespace
                return [origin.strip() for origin in env_origins.split(",")]
        
        # Default origins for development and production
        return [
            "http://localhost:3000",
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "https://ai-calling-intelligence-1.onrender.com",
            "https://ai-calling-intelligence.onrender.com",
            "*"  # Allow all origins for now - should be more restrictive in production
        ]
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = str(backend_dir / "logs" / "app.log")
    
    class Config:
        env_file = str(backend_dir / ".env")
        case_sensitive = True

# Create a global settings instance
settings = Settings()

# Validation function for Gemini API key
def validate_gemini_key():
    """Validate that Gemini API key is properly configured"""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is required but not set")
    if not settings.GEMINI_API_KEY.startswith("AIza"):
        raise ValueError("GEMINI_API_KEY must be a valid Google Gemini API key starting with 'AIza'")
    return True

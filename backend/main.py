"""
Main application entry point for AI Call Intelligence Backend
Run with: python main.py or uvicorn main:app --reload
"""
from app.main import app

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings
    
    print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    print(f"📊 Server: http://{settings.API_HOST}:{settings.API_PORT}")
    print(f"📖 Docs: http://{settings.API_HOST}:{settings.API_PORT}/docs")
    print(f"🔍 Debug mode: {settings.DEBUG}")
    
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

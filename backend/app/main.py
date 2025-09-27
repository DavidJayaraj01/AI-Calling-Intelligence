"""
Main FastAPI application
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import time
from loguru import logger
import sys

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, audio  # Remove old imports
from app.api import calls_real  # New real data endpoints
from app.api import action_items_real  # Real action items from AI

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    settings.LOG_FILE,
    rotation="10 MB",
    retention="7 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level=settings.LOG_LEVEL
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting AI Call Intelligence API")
    
    # Create database tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
    
    # Initialize OpenAI-based AI services
    try:
        from app.services.pain_point_service import pain_point_extractor
        from app.services.solution_service import solution_matcher
        from app.services.action_item_service import action_item_generator
        from app.services.sentiment_service import sentiment_analyzer
        logger.info("OpenAI-based AI services initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing AI services: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Call Intelligence API")

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered call intelligence platform for vendor-distributor relationship management",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error",
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred"
        }
    )

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(calls_real.router, prefix="/api/calls", tags=["Calls - Real Data"])  # Use real data endpoints
app.include_router(action_items_real.router, prefix="/api/action-items", tags=["Action Items - AI Generated"])  # Real AI action items
app.include_router(audio.router, prefix="/api/audio", tags=["Audio Processing - OpenAI"])

@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify API is working"""
    return {
        "success": True,
        "message": "AI Call Intelligence API is running",
        "version": settings.VERSION,
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "data_source": "real_openai_analysis"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.VERSION,
        "services": {
            "database": "connected",
            "ai_services": "loaded"
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Call Intelligence API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

# Dashboard endpoint
@app.get("/api/dashboard")
async def get_dashboard_metrics():
    """Get dashboard metrics"""
    # This is a simplified version - in production, you'd query the database
    return {
        "total_calls": 15,
        "total_pain_points": 8,
        "total_action_items": 12,
        "pending_action_items": 3,
        "average_sentiment": 7.2,
        "sentiment_trend": [
            {"date": "2024-09-01", "sentiment": 6.8, "call_count": 2},
            {"date": "2024-09-08", "sentiment": 7.1, "call_count": 3},
            {"date": "2024-09-15", "sentiment": 6.9, "call_count": 4},
            {"date": "2024-09-22", "sentiment": 7.5, "call_count": 6}
        ],
        "pain_points_by_category": {
            "technical": 3,
            "pricing": 2,
            "product": 2,
            "service": 1
        },
        "action_items_by_status": {
            "pending": 3,
            "in_progress": 2,
            "completed": 6,
            "overdue": 1
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

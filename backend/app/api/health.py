"""
Health Check API routes for model status
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from loguru import logger

from app.api.auth import get_current_user
from app.models import User
# Try to import full AI services, fallback to minimal versions
try:
    from app.services.pain_point_service import pain_point_extractor
    from app.services.sentiment_service import sentiment_analyzer
    from app.services.solution_service import solution_matcher
    from app.services.speech_to_text_service import speech_to_text_service
    USING_FULL_MODELS = True
except ImportError:
    from app.services.minimal_pain_point_service import pain_point_extractor
    from app.services.minimal_sentiment_service import sentiment_analyzer
    from app.services.minimal_solution_service import solution_matcher
    from app.services.minimal_speech_to_text_service import speech_to_text_service
    USING_FULL_MODELS = False
from app.schemas import APIResponse

router = APIRouter()

@router.get("/models", response_model=APIResponse)
async def check_model_health(
    current_user: User = Depends(get_current_user)
):
    """Check the health status of all AI models"""
    try:
        if USING_FULL_MODELS:
            model_status = {
                "roberta_model": pain_point_extractor.model is not None and pain_point_extractor.tokenizer is not None,
                "sentiment_model": sentiment_analyzer.sentiment_pipeline is not None,
                "vector_model": (
                    pain_point_extractor.embedding_model is not None and 
                    solution_matcher.embedding_model is not None
                ),
                "stt_model": speech_to_text_service.model is not None and speech_to_text_service.processor is not None
            }
        else:
            model_status = {
                "roberta_model": False,  # Minimal service
                "sentiment_model": False,  # Minimal service
                "vector_model": False,  # Minimal service
                "stt_model": False  # Minimal service
            }
        
        all_healthy = all(model_status.values())
        
        status_message = "Model health check completed"
        if not USING_FULL_MODELS:
            status_message = "Using minimal AI services for development"
        elif not all_healthy:
            status_message = "Some models are not loaded"
        
        return APIResponse(
            success=True,  # Always return success for minimal services
            message=status_message,
            data={
                "overall_status": "development" if not USING_FULL_MODELS else ("healthy" if all_healthy else "degraded"),
                "using_full_models": USING_FULL_MODELS,
                "models": model_status,
                "details": {
                    "roberta_model": "Fine-tuned RoBERTa for pain point detection" if USING_FULL_MODELS else "Mock pain point detection",
                    "sentiment_model": "Multilingual sentiment analysis model" if USING_FULL_MODELS else "Mock sentiment analysis",
                    "vector_model": "all-MiniLM-L6-v2 for embeddings" if USING_FULL_MODELS else "Mock vector embeddings",
                    "stt_model": "s2t_small_librispeech for speech-to-text" if USING_FULL_MODELS else "Mock speech-to-text"
                }
            }
        )
        
    except Exception as e:
        logger.error(f"Error checking model health: {e}")
        raise HTTPException(status_code=500, detail="Failed to check model health")

@router.get("/system", response_model=APIResponse)
async def check_system_health(
    current_user: User = Depends(get_current_user)
):
    """Check overall system health"""
    try:
        import torch
        import psutil
        import os
        
        # System info
        system_info = {
            "cpu_count": psutil.cpu_count(),
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_total": psutil.virtual_memory().total,
            "memory_available": psutil.virtual_memory().available,
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "gpu_available": torch.cuda.is_available(),
            "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
        }
        
        if torch.cuda.is_available():
            system_info["gpu_memory"] = {
                f"gpu_{i}": {
                    "total": torch.cuda.get_device_properties(i).total_memory,
                    "allocated": torch.cuda.memory_allocated(i),
                    "cached": torch.cuda.memory_reserved(i)
                }
                for i in range(torch.cuda.device_count())
            }
        
        return APIResponse(
            success=True,
            message="System health check completed",
            data=system_info
        )
        
    except Exception as e:
        logger.error(f"Error checking system health: {e}")
        raise HTTPException(status_code=500, detail="Failed to check system health")

@router.get("/database", response_model=APIResponse)
async def check_database_health(
    current_user: User = Depends(get_current_user)
):
    """Check database connection health"""
    try:
        from app.core.database import get_db
        from sqlalchemy import text
        
        # Test database connection
        db = next(get_db())
        result = db.execute(text("SELECT 1")).fetchone()
        
        if result:
            return APIResponse(
                success=True,
                message="Database connection healthy",
                data={"status": "connected", "test_query": "passed"}
            )
        else:
            return APIResponse(
                success=False,
                message="Database connection failed",
                data={"status": "disconnected", "test_query": "failed"}
            )
            
    except Exception as e:
        logger.error(f"Error checking database health: {e}")
        return APIResponse(
            success=False,
            message="Database health check failed",
            data={"error": str(e)}
        )

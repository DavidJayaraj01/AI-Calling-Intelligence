"""
Audio processing API endpoints for OpenAI Whisper integration
Real-time audio transcription and analysis with database storage
"""
import os
import tempfile
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Depends
from fastapi.responses import JSONResponse
from openai import AsyncOpenAI
from loguru import logger
from typing import Dict, Any, Optional
from pathlib import Path
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models import Call, PainPoint, ActionItem, CallSentiment, PainPointSeverity, ActionItemPriority, ActionItemStatus
import json

router = APIRouter()

# Initialize OpenAI client
if not settings.OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not set. Audio processing will not work.")
    client = None
else:
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class TranscriptAnalysisRequest(BaseModel):
    transcript: str
    metadata: Optional[Dict[str, Any]] = None

def validate_audio_file(filename: str) -> bool:
    """Validate if the uploaded file is an audio file"""
    file_ext = Path(filename).suffix.lower()
    return file_ext in settings.ALLOWED_AUDIO_EXTENSIONS

@router.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)) -> JSONResponse:
    """
    Transcribe audio file using OpenAI Whisper API
    """
    try:
        # Validate API key
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        # Validate file type
        if not validate_audio_file(file.filename or ""):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed formats: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
            )
        
        # Check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB"
            )
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Create temporary file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename or "audio.mp3").suffix) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        logger.info(f"Processing audio file: {file.filename} ({file_size} bytes)")
        
        try:
            # Transcribe using OpenAI Whisper
            with open(temp_file_path, "rb") as audio_file:
                transcript = await client.audio.transcriptions.create(
                    model=settings.OPENAI_WHISPER_MODEL,
                    file=audio_file,
                    response_format="text"
                )
            
            logger.info(f"Transcription completed successfully. Length: {len(transcript)} characters")
            
            return JSONResponse(content={
                "success": True,
                "transcript": transcript,
                "filename": file.filename,
                "file_size": file_size,
                "model_used": settings.OPENAI_WHISPER_MODEL
            })
        
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing audio file: {str(e)}"
        )

@router.post("/analyze-transcript")
async def analyze_transcript(data: Dict[str, Any]) -> JSONResponse:
    """
    Analyze transcript using OpenAI GPT model
    """
    try:
        # Validate API key
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
            )
        
        transcript = data.get("transcript", "").strip()
        if not transcript:
            raise HTTPException(status_code=400, detail="No transcript provided")
        
        logger.info(f"Analyzing transcript of length: {len(transcript)} characters")
        
        # Create analysis prompt
        system_prompt = """You are an AI assistant specialized in analyzing business call transcripts between distributors and vendors. 
        Analyze the transcript and provide insights in the following JSON format. ALWAYS return valid JSON.

        {
            "overall_sentiment": "positive|negative|neutral|mixed",
            "confidence_score": 0.85,
            "pain_points": [
                {
                    "description": "Brief description of the pain point",
                    "category": "pricing|product|service|delivery|communication|technical|other", 
                    "severity": "low|medium|high|critical",
                    "segment": "Relevant quote from transcript"
                }
            ],
            "action_items": [
                {
                    "title": "Action item title",
                    "description": "Detailed description",
                    "priority": "low|medium|high|urgent",
                    "category": "follow_up|research|documentation|training|escalation|communication|other",
                    "estimated_days": 3
                }
            ],
            "key_topics": ["topic1", "topic2", "topic3"],
            "summary": "Brief summary of the call",
            "recommendations": [
                "Specific recommendation 1",
                "Specific recommendation 2"
            ]
        }

        IMPORTANT RULES:
        1. ALWAYS extract at least 1-3 pain points from any business conversation
        2. ALWAYS generate at least 2-4 action items based on the discussion
        3. If no obvious pain points exist, identify potential areas for improvement
        4. Make recommendations specific and actionable
        5. Return ONLY valid JSON, no additional text
        
        Be specific and actionable in your analysis. Base everything on the actual transcript content."""
        
        user_prompt = f"Please analyze this call transcript:\n\n{transcript}"
        
        # Call OpenAI API
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        analysis_text = response.choices[0].message.content
        logger.info("Analysis completed successfully")
        
        # Try to parse as JSON
        import json
        try:
            analysis_data = json.loads(analysis_text)
        except json.JSONDecodeError:
            # If not valid JSON, return structured response
            analysis_data = {
                "overall_sentiment": "neutral",
                "confidence_score": 0.7,
                "pain_points": [],
                "action_items": [],
                "key_topics": ["analysis", "discussion"],
                "summary": analysis_text[:500],
                "recommendations": ["Review the call analysis", "Follow up as needed"]
            }
        
        return JSONResponse(content={
            "success": True,
            "analysis": analysis_data,
            "model_used": settings.OPENAI_MODEL,
            "tokens_used": response.usage.total_tokens if response.usage else 0
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing transcript: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing transcript: {str(e)}"
        )

@router.post("/process-complete")
async def process_complete_call(
    file: UploadFile = File(...), 
    title: str = Form(None),
    description: str = Form(None),
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Complete call processing pipeline: transcribe + analyze + save to database
    This replaces all mock data with real OpenAI analysis
    """
    try:
        logger.info(f"Starting complete call processing for: {file.filename}")
        
        # Step 1: Transcribe audio
        transcription_response = await transcribe_audio(file)
        transcription_data = transcription_response.body.decode()
        transcription_result = json.loads(transcription_data)
        
        if not transcription_result.get("success"):
            raise HTTPException(status_code=500, detail="Transcription failed")
        
        transcript_text = transcription_result["transcript"]
        
        # Step 2: Analyze transcript  
        analysis_response = await analyze_transcript({"transcript": transcript_text})
        analysis_data = analysis_response.body.decode()
        analysis_result = json.loads(analysis_data)
        
        if not analysis_result.get("success"):
            raise HTTPException(status_code=500, detail="Analysis failed")
        
        analysis = analysis_result["analysis"]
        
        # Step 3: Save real data to database
        try:
            # Create new call record with real data
            new_call = Call(
                title=title or f"Call Analysis - {file.filename}",
                description=description,
                transcript=transcript_text,
                audio_filename=file.filename,
                duration_seconds=transcription_result.get("file_size", 0) / 1000,  # Estimate
                
                # Real sentiment analysis from OpenAI
                overall_sentiment=CallSentiment(analysis.get("overall_sentiment", "neutral")),
                sentiment_confidence=analysis.get("confidence_score", 0.0),
                positive_percentage=analysis.get("sentiment_breakdown", {}).get("positive_percentage", 0),
                negative_percentage=analysis.get("sentiment_breakdown", {}).get("negative_percentage", 0),
                neutral_percentage=analysis.get("sentiment_breakdown", {}).get("neutral_percentage", 0),
                
                # AI generated content
                ai_summary=analysis.get("summary", ""),
                key_topics=analysis.get("key_topics", []),
                recommendations=analysis.get("recommendations", []),
                
                # OpenAI usage tracking
                tokens_used=analysis_result.get("tokens_used", 0),
                openai_model_used=analysis_result.get("model_used", "gpt-4o-mini"),
                whisper_model_used=transcription_result.get("model_used", "whisper-1")
            )
            
            db.add(new_call)
            db.commit()
            db.refresh(new_call)
            
            # Save real pain points from AI analysis
            for pain_point_data in analysis.get("pain_points", []):
                pain_point = PainPoint(
                    call_id=new_call.id,
                    description=pain_point_data.get("description", ""),
                    category=pain_point_data.get("category", "other"),
                    severity=PainPointSeverity(pain_point_data.get("severity", "medium")),
                    confidence_score=pain_point_data.get("confidence", 0.0),
                    transcript_segment=pain_point_data.get("segment", "")
                )
                db.add(pain_point)
            
            # Save real action items from AI analysis
            for action_data in analysis.get("action_items", []):
                action_item = ActionItem(
                    call_id=new_call.id,
                    title=action_data.get("title", ""),
                    description=action_data.get("description", ""),
                    priority=ActionItemPriority(action_data.get("priority", "medium")),
                    status=ActionItemStatus.PENDING,
                    category=action_data.get("category", "other"),
                    estimated_days=action_data.get("estimated_days", 3)
                )
                db.add(action_item)
            
            db.commit()
            
            logger.info(f"Successfully saved call analysis to database. Call ID: {new_call.id}")
            
            return JSONResponse(content={
                "success": True,
                "call_id": new_call.id,
                "filename": file.filename,
                "transcription": transcription_result,
                "analysis": analysis,
                "pain_points_saved": len(analysis.get("pain_points", [])),
                "action_items_saved": len(analysis.get("action_items", [])),
                "total_tokens_used": analysis_result.get("tokens_used", 0),
                "message": "Call processed and saved successfully with real AI analysis"
            })
            
        except Exception as db_error:
            logger.error(f"Database error: {str(db_error)}")
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error saving to database: {str(db_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Complete processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during complete processing: {str(e)}"
        )
"""
Calls API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import asyncio
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User, Call, Distributor, Vendor, PainPoint, ActionItem, SentimentSegment
from app.schemas import (
    CallCreate, CallResponse, CallDetailResponse, CallProcessRequest,
    PaginationParams, PaginatedResponse, CallFilters, APIResponse
)
# Try to import full AI services, fallback to minimal versions
try:
    from app.services.pain_point_service import pain_point_extractor
    from app.services.solution_service import solution_matcher
    from app.services.sentiment_service import sentiment_analyzer
    from app.services.speech_to_text_service import speech_to_text_service
except ImportError as e:
    logger.warning(f"Failed to import full AI services: {e}")
    logger.info("Using minimal AI services for development")
    from app.services.minimal_pain_point_service import pain_point_extractor
    from app.services.minimal_solution_service import solution_matcher
    from app.services.minimal_sentiment_service import sentiment_analyzer
    from app.services.minimal_speech_to_text_service import speech_to_text_service

from app.services.action_item_service import action_item_generator

router = APIRouter()

@router.post("/", response_model=CallResponse)
async def create_call(
    call_data: CallCreate,
    db: Session = Depends(get_db)
):
    """Create a new call record"""
    try:
        # Verify distributor and vendor exist
        distributor = db.query(Distributor).filter(Distributor.id == call_data.distributor_id).first()
        vendor = db.query(Vendor).filter(Vendor.id == call_data.vendor_id).first()
        
        if not distributor:
            raise HTTPException(status_code=404, detail="Distributor not found")
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        
        # Create call
        call = Call(
            distributor_id=call_data.distributor_id,
            vendor_id=call_data.vendor_id,
            seed_brief=call_data.seed_brief,
            transcript=call_data.transcript,
            metadata_json=call_data.metadata_json or {}
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        logger.info(f"Created new call: {call.id}")
        return call
        
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create call")

@router.post("/process", response_model=APIResponse)
async def process_call(
    request: CallProcessRequest,
    db: Session = Depends(get_db)
):
    """Process a call with full AI analysis pipeline"""
    try:
        # Create the call record first
        call = Call(
            distributor_id=request.distributor_id,
            vendor_id=request.vendor_id,
            seed_brief=request.seed_brief,
            transcript=request.transcript,
            metadata_json=request.metadata or {}
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        call_id = str(call.call_id)
        logger.info(f"Processing call {call_id} with AI pipeline")
        
        # Run AI analysis pipeline
        results = await run_ai_pipeline(call_id, request.transcript, db)
        
        # Update call with overall sentiment
        if results.get('sentiment_analysis'):
            call.overall_sentiment = results['sentiment_analysis']['overall_sentiment']
            call.confidence_score = results['sentiment_analysis']['overall_confidence']
            db.commit()
        
        return APIResponse(
            success=True,
            message="Call processed successfully",
            data={
                "call_id": call_id,
                "pain_points_count": len(results.get('pain_points', [])),
                "action_items_count": len(results.get('action_items', [])),
                "sentiment_segments_count": len(results.get('sentiment_segments', [])),
                "overall_sentiment": results.get('sentiment_analysis', {}).get('overall_sentiment')
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing call: {e}")
        if 'call' in locals():
            db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process call: {str(e)}")

async def run_ai_pipeline(call_id: str, transcript: str, db: Session) -> dict:
    """Run the complete AI analysis pipeline"""
    results = {}
    
    try:
        # Step 1: Extract pain points using RoBERTa
        logger.info(f"Extracting pain points for call {call_id}")
        pain_points_data = await pain_point_extractor.extract_pain_points(transcript, call_id)
        
        # Save pain points to database
        pain_points = []
        for pp_data in pain_points_data:
            pain_point = PainPoint(
                call_id=call_id,
                description=pp_data['description'],
                category=pp_data['category'],
                severity=pp_data['severity'],
                confidence=pp_data['confidence'],
                vector_embedding=pp_data['vector_embedding'],
                start_time=pp_data.get('start_time'),
                end_time=pp_data.get('end_time')
            )
            db.add(pain_point)
            pain_points.append(pain_point)
        
        db.commit()
        results['pain_points'] = pain_points_data
        
        # Step 2: Find matching solutions using OpenAI
        logger.info(f"Finding solutions for {len(pain_points)} pain points")
        all_solutions = []
        for i, pain_point in enumerate(pain_points):
            solutions = await solution_matcher.find_matching_solutions(
                pain_points_data[i], db, top_k=3
            )
            all_solutions.extend(solutions)
            
            # Create solution mappings
            await solution_matcher.create_solution_mappings(
                call_id, str(pain_point.id), solutions, db
            )
        
        results['solutions'] = all_solutions
        
        # Step 3: Generate action items using Llama 8B (OpenAI fallback)
        logger.info(f"Generating action items for call {call_id}")
        call_context = {
            'participants': ['Customer', 'Vendor'],
            'call_date': datetime.utcnow().isoformat(),
            'distributor_name': 'Distributor',
            'vendor_name': 'Vendor'
        }
        
        action_items_data = await action_item_generator.generate_action_items(
            transcript, pain_points_data, all_solutions, call_context
        )
        
        # Save action items to database
        action_items = []
        for ai_data in action_items_data:
            # Find a suitable assignee (for demo, use current user or first vendor user)
            assignee = db.query(User).filter(User.role.in_(['vendor_user', 'vendor_admin'])).first()
            if not assignee:
                assignee = db.query(User).first()  # Fallback to any user
            
            if assignee:
                action_item = ActionItem(
                    call_id=call_id,
                    title=ai_data['title'],
                    description=ai_data['description'],
                    assignee_id=assignee.id,
                    priority=ai_data['priority'],
                    status=ai_data['status'],
                    category=ai_data['category'],
                    due_date=datetime.fromisoformat(ai_data['due_date'].replace('Z', '+00:00')),
                    notes=ai_data.get('success_criteria', '')
                )
                db.add(action_item)
                action_items.append(action_item)
        
        db.commit()
        results['action_items'] = action_items_data
        
        # Step 4: Analyze sentiment using multilingual model
        logger.info(f"Analyzing sentiment for call {call_id}")
        sentiment_analysis = await sentiment_analyzer.analyze_sentiment(transcript, call_id)
        
        # Save sentiment segments to database
        sentiment_segments = []
        for seg_data in sentiment_analysis['sentiment_segments']:
            segment = SentimentSegment(
                call_id=call_id,
                start_time=seg_data['start_time'],
                end_time=seg_data['end_time'],
                sentiment=seg_data['sentiment'],
                confidence=seg_data['confidence'],
                speaker=seg_data.get('speaker'),
                transcript_excerpt=seg_data.get('transcript_excerpt'),
                emotions_json=seg_data.get('emotions_json', {})
            )
            db.add(segment)
            sentiment_segments.append(segment)
        
        db.commit()
        results['sentiment_analysis'] = sentiment_analysis
        results['sentiment_segments'] = sentiment_analysis['sentiment_segments']
        
        logger.info(f"Completed AI pipeline for call {call_id}")
        return results
        
    except Exception as e:
        logger.error(f"Error in AI pipeline: {e}")
        db.rollback()
        raise

@router.get("/", response_model=PaginatedResponse)
async def get_calls(
    pagination: PaginationParams = Depends(),
    filters: CallFilters = Depends(),
    db: Session = Depends(get_db)
):
    """Get paginated list of calls with filters"""
    try:
        query = db.query(Call)
        
        # Apply filters
        if filters.distributor_id:
            query = query.filter(Call.distributor_id == filters.distributor_id)
        if filters.vendor_id:
            query = query.filter(Call.vendor_id == filters.vendor_id)
        if filters.start_date:
            query = query.filter(Call.created_at >= filters.start_date)
        if filters.end_date:
            query = query.filter(Call.created_at <= filters.end_date)
        if filters.sentiment:
            query = query.filter(Call.overall_sentiment == filters.sentiment)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (pagination.page - 1) * pagination.limit
        calls = query.offset(offset).limit(pagination.limit).all()
        
        return PaginatedResponse(
            items=[CallResponse.from_orm(call) for call in calls],
            total=total,
            page=pagination.page,
            limit=pagination.limit,
            has_next=offset + pagination.limit < total,
            has_prev=pagination.page > 1
        )
        
    except Exception as e:
        logger.error(f"Error getting calls: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve calls")

@router.get("/{call_id}", response_model=CallDetailResponse)
async def get_call_detail(
    call_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed call information with related data"""
    try:
        call = db.query(Call).filter(Call.call_id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Get related data
        pain_points = db.query(PainPoint).filter(PainPoint.call_id == call_id).all()
        action_items = db.query(ActionItem).filter(ActionItem.call_id == call_id).all()
        sentiment_segments = db.query(SentimentSegment).filter(SentimentSegment.call_id == call_id).all()
        
        # Create response
        response_data = CallDetailResponse.from_orm(call)
        response_data.pain_points = pain_points
        response_data.action_items = action_items
        response_data.sentiment_segments = sentiment_segments
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting call detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve call details")

@router.post("/transcribe", response_model=APIResponse)
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: str = "en"
):
    """Transcribe audio file to text using local Speech-to-Text model"""
    try:
        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an audio file."
            )
        
        # Check file size (limit to 25MB)
        if audio_file.size > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 25MB."
            )
        
        logger.info(f"Transcribing audio file: {audio_file.filename}")
        
        # Transcribe using local model
        transcription_result = await speech_to_text_service.transcribe_audio(
            audio_file.file, 
            language=language
        )
        
        return APIResponse(
            success=True,
            message="Audio transcribed successfully",
            data=transcription_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")

@router.get("/supported-languages")
async def get_supported_languages():
    """Get list of supported languages for speech-to-text"""
    try:
        languages = await speech_to_text_service.get_supported_languages()
        return APIResponse(
            success=True,
            message="Supported languages retrieved successfully",
            data=languages
        )
    except Exception as e:
        logger.error(f"Error getting supported languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve supported languages")

@router.delete("/{call_id}")
async def delete_call(
    call_id: int,
    db: Session = Depends(get_db)
):
    """Delete a call and all related data"""
    try:
        call = db.query(Call).filter(Call.call_id == call_id).first()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Delete the call (cascading delete will handle related data)
        db.delete(call)
        db.commit()
        
        logger.info(f"Deleted call {call_id}")
        return {"message": "Call deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting call: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete call")

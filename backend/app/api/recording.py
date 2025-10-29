"""
Real-time Recording API routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import asyncio
import json
import uuid
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User
from app.schemas import APIResponse
from app.services.recording_service import recording_service

router = APIRouter()

# Store WebSocket connections
active_connections: Dict[str, WebSocket] = {}


@router.post("/start-recording", response_model=APIResponse)
async def start_recording(
    metadata: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db)
):
    """
    Start a new recording session
    
    Request body (optional):
    - metadata: Additional information about the recording (meeting name, participants, etc.)
    """
    try:
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Add user info to metadata (demo mode - no auth required)
        if metadata is None:
            metadata = {}
        metadata["user_id"] = "demo-user"
        metadata["user_email"] = "demo@example.com"
        metadata["started_at"] = datetime.utcnow().isoformat()
        
        # Start recording session
        result = await recording_service.start_recording_session(session_id, metadata)
        
        if result["success"]:
            return APIResponse(
                success=True,
                message="Recording session started successfully",
                data={
                    "session_id": session_id,
                    "status": "active",
                    "started_at": metadata["started_at"]
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except Exception as e:
        logger.error(f"Error starting recording: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start recording: {str(e)}")


@router.post("/upload-chunk/{session_id}", response_model=APIResponse)
async def upload_audio_chunk(
    session_id: str,
    audio_chunk: UploadFile = File(...)
):
    """
    Upload an audio chunk for processing
    
    This endpoint receives audio chunks during recording and returns
    the transcription for that chunk in real-time.
    """
    try:
        # Read audio data
        audio_data = await audio_chunk.read()
        
        # Process the chunk
        result = await recording_service.process_audio_chunk(
            session_id=session_id,
            audio_chunk=audio_data,
            sample_rate=16000
        )
        
        if result["success"]:
            return APIResponse(
                success=True,
                message="Chunk processed successfully",
                data={
                    "session_id": session_id,
                    "text": result["text"],
                    "is_partial": result.get("is_partial", False),
                    "timestamp": result.get("timestamp", 0)
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to process chunk"))
            
    except Exception as e:
        logger.error(f"Error processing audio chunk: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process chunk: {str(e)}")


@router.post("/stop-recording/{session_id}", response_model=APIResponse)
async def stop_recording(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Stop a recording session and get complete results
    
    Returns the full transcript and saves the recording to the database
    """
    try:
        # Stop the recording session
        result = await recording_service.stop_recording_session(session_id)
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result.get("message", "Session not found"))
        
        # Save to database
        from app.models import Call, Distributor, Vendor
        
        # Get or create default entities
        distributor = db.query(Distributor).first()
        if not distributor:
            distributor = Distributor(
                name="Live Recording",
                contact_email="recording@system.com",
                contact_phone="+0000000000"
            )
            db.add(distributor)
            db.commit()
            db.refresh(distributor)
        
        vendor = db.query(Vendor).first()
        if not vendor:
            vendor = Vendor(
                name="Meeting Participant",
                contact_email="participant@system.com",
                contact_phone="+0000000000"
            )
            db.add(vendor)
            db.commit()
            db.refresh(vendor)
        
        # Create call record
        call = Call(
            distributor_id=distributor.distributor_id,
            vendor_id=vendor.vendor_id,
            seed_brief=result["metadata"].get("meeting_name", "Live Recording"),
            transcript=result["transcript"],
            metadata_json={
                "recording_session_id": session_id,
                "duration": result["duration"],
                "segments_count": len(result["segments"]),
                **result["metadata"]
            }
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        logger.info(f"Created call record {call.call_id} from recording session {session_id}")
        
        # Run AI analysis if transcript is not empty
        if result["transcript"]:
            from app.api.model_test import run_ai_pipeline
            try:
                ai_results = await run_ai_pipeline(str(call.call_id), result["transcript"], db)
                
                # Update call with sentiment
                if ai_results.get('sentiment_analysis'):
                    call.overall_sentiment = ai_results['sentiment_analysis']['overall_sentiment']
                    call.confidence_score = ai_results['sentiment_analysis']['overall_confidence']
                    db.commit()
                    
            except Exception as ai_error:
                logger.error(f"Error running AI analysis: {ai_error}")
                # Continue even if AI analysis fails
        
        return APIResponse(
            success=True,
            message="Recording stopped and saved successfully",
            data={
                "session_id": session_id,
                "call_id": str(call.call_id),
                "transcript": result["transcript"],
                "duration": result["duration"],
                "segments_count": len(result["segments"]),
                "segments": result["segments"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping recording: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to stop recording: {str(e)}")


@router.get("/recording-status/{session_id}", response_model=APIResponse)
async def get_recording_status(
    session_id: str
):
    """
    Get the current status of a recording session
    """
    try:
        status = await recording_service.get_session_status(session_id)
        
        if status["success"]:
            return APIResponse(
                success=True,
                message="Status retrieved successfully",
                data=status
            )
        else:
            raise HTTPException(status_code=404, detail=status.get("message", "Session not found"))
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recording status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/active-recordings", response_model=APIResponse)
async def get_active_recordings():
    """
    Get list of all active recording sessions
    """
    try:
        sessions = recording_service.get_active_sessions()
        
        # Get details for each session
        session_details = []
        for session_id in sessions:
            status = await recording_service.get_session_status(session_id)
            if status["success"]:
                session_details.append(status)
        
        return APIResponse(
            success=True,
            message=f"Found {len(session_details)} active recording(s)",
            data={
                "active_sessions": session_details,
                "count": len(session_details)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting active recordings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get active recordings: {str(e)}")


@router.websocket("/ws/recording/{session_id}")
async def websocket_recording(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time audio streaming and transcription
    
    The client sends audio chunks as binary data, and receives
    transcription results as JSON messages.
    """
    await websocket.accept()
    active_connections[session_id] = websocket
    
    logger.info(f"WebSocket connection established for session: {session_id}")
    
    try:
        while True:
            # Receive audio data as bytes
            try:
                data = await websocket.receive_bytes()
                
                # Process the audio chunk
                result = await recording_service.process_audio_chunk(
                    session_id=session_id,
                    audio_chunk=data,
                    sample_rate=16000
                )
                
                # Send transcription back to client
                if result["success"] and result.get("text"):
                    await websocket.send_json({
                        "type": "transcription",
                        "text": result["text"],
                        "timestamp": result.get("timestamp", 0),
                        "is_partial": result.get("is_partial", False)
                    })
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session: {session_id}")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket processing: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        if session_id in active_connections:
            del active_connections[session_id]
        logger.info(f"WebSocket connection closed for session: {session_id}")

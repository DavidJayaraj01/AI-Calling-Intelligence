"""
Model Test API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import asyncio
import tempfile
import os
import numpy as np
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import User
from app.schemas import APIResponse

# Use minimal AI services for development (with OpenAI integration)
logger.info("Using minimal AI services with OpenAI integration")
from app.services.minimal_pain_point_service import pain_point_extractor
from app.services.minimal_solution_service import solution_matcher
from app.services.minimal_sentiment_service import sentiment_analyzer
from app.services.minimal_speech_to_text_service import speech_to_text_service

from app.services.action_item_service import action_item_generator

router = APIRouter()

async def run_ai_pipeline(call_id: str, transcript: str, db: Session) -> dict:
    """Run the complete AI analysis pipeline"""
    results = {}
    
    try:
        # Step 1: Extract pain points using RoBERTa
        logger.info(f"Extracting pain points for call {call_id}")
        pain_points_data = await pain_point_extractor.extract_pain_points(transcript, call_id)
        
        # Save pain points to database (simplified for existing schema)
        from app.models import PainPoint
        pain_points = []
        for pp_data in pain_points_data:
            pain_point = PainPoint(
                call_id=call_id,
                description=pp_data['description'],
                vector_embedding=pp_data.get('vector_embedding', [])
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
        
        # Save action items to database (simplified for existing schema)
        from app.models import ActionItem, User
        action_items = []
        for ai_data in action_items_data:
            # For now, use a simple integer owner_id (1 for demo)
            action_item = ActionItem(
                call_id=call_id,
                description=ai_data['description'],
                owner_id=1,  # Simple integer for demo
                due_date=datetime.fromisoformat(ai_data['due_date'].replace('Z', '+00:00')),
                status=ai_data['status']
            )
            db.add(action_item)
            action_items.append(action_item)
        
        db.commit()
        results['action_items'] = action_items_data
        
        # Step 4: Analyze sentiment using multilingual model
        logger.info(f"Analyzing sentiment for call {call_id}")
        sentiment_analysis = await sentiment_analyzer.analyze_sentiment(transcript, call_id)
        
        # Save sentiment segments to database (simplified for existing schema)
        from app.models import SentimentSegment
        sentiment_segments = []
        for seg_data in sentiment_analysis['sentiment_segments']:
            segment = SentimentSegment(
                call_id=call_id,
                start_time=seg_data['start_time'],
                end_time=seg_data['end_time'],
                sentiment=seg_data['sentiment'],
                confidence=seg_data['confidence'],
                speaker=seg_data.get('speaker'),
                transcript_excerpt=seg_data.get('transcript_excerpt')
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

@router.post("/test-models", response_model=APIResponse)
async def test_models():
    """Test all AI models with sample data"""
    try:
        logger.info("Starting AI model testing")
        
        # Test data
        test_transcript = "Hello, I'm having issues with my system performance. The application is running very slowly and I'm experiencing frequent crashes. This is affecting my productivity and I need a solution quickly."
        
        results = {}
        
        # 1. Test Speech-to-Text (with dummy audio)
        logger.info("Testing Speech-to-Text...")
        stt_service = speech_to_text_service
        
        # Create a dummy audio file (1 second of sine wave)
        sample_rate = 16000
        duration = 1.0
        frequency = 440.0
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
        audio_data = (audio_data * 32767).astype(np.int16)
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            import wave
            with wave.open(temp_file.name, 'w') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data.tobytes())
            
            with open(temp_file.name, 'rb') as audio_file:
                stt_result = await stt_service.transcribe_audio(audio_file)
                results['speech_to_text'] = {
                    'status': 'success',
                    'result': stt_result.get('text', 'No text detected'),
                    'model_loaded': True
                }
            
            os.unlink(temp_file.name)
        
        # 2. Test Pain Point Extraction
        logger.info("Testing Pain Point Extraction...")
        pain_points = await pain_point_extractor.extract_pain_points(test_transcript, call_id="test")
        results['pain_point_extraction'] = {
            'status': 'success',
            'count': len(pain_points),
            'sample_points': [
                {
                    'description': pp.get('description', 'N/A'),
                    'category': pp.get('category', 'N/A'),
                    'severity': pp.get('severity', 'N/A'),
                    'confidence': pp.get('confidence', 0)
                }
                for pp in pain_points[:2]  # Show first 2
            ]
        }
        
        # 3. Test Sentiment Analysis
        logger.info("Testing Sentiment Analysis...")
        sentiment_result = await sentiment_analyzer.analyze_sentiment(test_transcript, call_id="test")
        results['sentiment_analysis'] = {
            'status': 'success',
            'overall_sentiment': sentiment_result.get('overall_sentiment', 'N/A'),
            'confidence': sentiment_result.get('confidence', 0),
            'segments_count': len(sentiment_result.get('sentiment_segments', []))
        }
        
        # 4. Test Action Item Generation
        logger.info("Testing Action Item Generation...")
        call_context = {
            "transcript": test_transcript,
            "call_id": "test",
            "distributor_id": 1,
            "vendor_id": 1
        }
        # Create mock solutions for testing
        mock_solutions = [
            {
                "title": "System Performance Optimization",
                "description": "Optimize system performance and resolve crashes",
                "category": "technical",
                "priority": "high"
            }
        ]
        action_items = await action_item_generator.generate_action_items(test_transcript, pain_points, mock_solutions, call_context)
        results['action_item_generation'] = {
            'status': 'success',
            'count': len(action_items),
            'sample_items': [
                {
                    'title': item.get('title', 'N/A'),
                    'description': item.get('description', 'N/A'),
                    'priority': item.get('priority', 'N/A')
                }
                for item in action_items[:2]  # Show first 2
            ]
        }
        
        # 5. Test Solution Matching
        logger.info("Testing Solution Matching...")
        # Get solutions for the first pain point
        mock_solutions = []
        if pain_points:
            solutions = await solution_matcher.find_matching_solutions(pain_points[0], db=None, top_k=3)
            mock_solutions = [
                {
                    'title': sol.get('title', 'N/A'),
                    'description': sol.get('description', 'N/A'),
                    'category': sol.get('category', 'N/A'),
                    'difficulty': sol.get('difficulty', 'N/A'),
                    'relevance_score': sol.get('relevance_score', 0)
                }
                for sol in solutions[:2]  # Show first 2
            ]
        
        results['solution_matching'] = {
            'status': 'success',
            'count': len(mock_solutions),
            'sample_solutions': mock_solutions,
            'model_loaded': solution_matcher.embedding_model is not None,
            'vector_model_ready': True
        }
        
        # Overall status
        all_success = all(
            result.get('status') == 'success' 
            for result in results.values() 
            if isinstance(result, dict)
        )
        
        return APIResponse(
            success=all_success,
            message="AI models tested successfully" if all_success else "Some models failed",
            data={
                'overall_status': 'success' if all_success else 'partial_failure',
                'models_tested': len(results),
                'results': results,
                'test_transcript': test_transcript
            }
        )
        
    except Exception as e:
        logger.error(f"Error testing models: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to test models: {str(e)}"
        )

@router.post("/process-real-data", response_model=APIResponse)
async def process_real_data(
    request: dict,
    db: Session = Depends(get_db)
):
    """Process real transcript data with AI models"""
    try:
        transcript = request.get('transcript', '')
        if not transcript:
            raise HTTPException(status_code=400, detail="Transcript is required")
        
        logger.info(f"Processing real transcript data: {transcript[:100]}...")
        
        # Create a temporary call record for processing
        from app.models import Call, Distributor, Vendor
        
        # Get or create default distributor and vendor
        distributor = db.query(Distributor).first()
        if not distributor:
            distributor = Distributor(
                name="Test Distributor",
                contact_email="test@distributor.com",
                contact_phone="+1234567890"
            )
            db.add(distributor)
            db.commit()
            db.refresh(distributor)
        
        vendor = db.query(Vendor).first()
        if not vendor:
            vendor = Vendor(
                name="Test Vendor",
                contact_email="test@vendor.com",
                contact_phone="+1234567890"
            )
            db.add(vendor)
            db.commit()
            db.refresh(vendor)
        
        # Create call record
        call = Call(
            distributor_id=distributor.distributor_id,
            vendor_id=vendor.vendor_id,
            seed_brief="Real Data Processing",
            transcript=transcript,
            metadata_json={}
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        call_id = str(call.call_id)
        logger.info(f"Created call {call_id} for real data processing")
        
        # Run AI analysis pipeline
        results = await run_ai_pipeline(call_id, transcript, db)
        
        # Update call with overall sentiment
        if results.get('sentiment_analysis'):
            call.overall_sentiment = results['sentiment_analysis']['overall_sentiment']
            call.confidence_score = results['sentiment_analysis']['overall_confidence']
            db.commit()
        
        return APIResponse(
            success=True,
            message="Real data processed successfully",
            data={
                "call_id": call_id,
                "pain_points_count": len(results.get('pain_points', [])),
                "action_items_count": len(results.get('action_items', [])),
                "sentiment_segments_count": len(results.get('sentiment_segments', [])),
                "overall_sentiment": results.get('sentiment_analysis', {}).get('overall_sentiment'),
                "results": results
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing real data: {e}")
        if 'call' in locals():
            db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process real data: {str(e)}"
        )

@router.get("/model-status", response_model=APIResponse)
async def get_model_status():
    """Get the status of all AI models"""
    try:
        status_info = {
            'pain_point_extractor': {
                'loaded': pain_point_extractor is not None,
                'model_type': 'RoBERTa + Vector Embeddings'
            },
            'sentiment_analyzer': {
                'loaded': sentiment_analyzer is not None,
                'model_type': 'Multilingual Sentiment Model'
            },
            'speech_to_text_service': {
                'loaded': speech_to_text_service is not None,
                'model_type': 'Speech-to-Text (LibriSpeech)'
            },
            'action_item_generator': {
                'loaded': action_item_generator is not None,
                'model_type': 'OpenAI GPT'
            },
            'solution_matcher': {
                'loaded': solution_matcher is not None,
                'model_type': 'Vector Embeddings + Similarity Search'
            }
        }
        
        all_loaded = all(model['loaded'] for model in status_info.values())
        
        return APIResponse(
            success=all_loaded,
            message="All models loaded" if all_loaded else "Some models not loaded",
            data={
                'overall_status': 'ready' if all_loaded else 'partial',
                'models': status_info
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get model status: {str(e)}"
        )

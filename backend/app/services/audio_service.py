"""
Audio Processing Service
Handles audio file upload, transcription, and processing using Google Gemini API
"""
import os
import tempfile
import aiofiles
import google.generativeai as genai
from fastapi import UploadFile, HTTPException
from loguru import logger
from typing import Dict, Any
from ..core.config import settings

class AudioProcessingService:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Audio processing service initialized with Google Gemini API")
    
    async def transcribe_audio(self, audio_file: UploadFile) -> Dict[str, Any]:
        """
        Note: Gemini API doesn't have direct audio transcription like Whisper.
        For a production implementation, you would need to:
        1. Use Google Cloud Speech-to-Text API
        2. Or use another transcription service
        3. Or implement a hybrid approach
        
        For now, returning a placeholder response to prevent errors.
        """
        logger.warning("Audio transcription not implemented with Gemini API. Using placeholder.")
        
        try:
            # Validate file type
            if not audio_file.content_type.startswith('audio/'):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Please upload an audio file."
                )
            
            # Read file content for size calculation
            content = await audio_file.read()
            
            # Return placeholder transcript
            placeholder_transcript = f"[Audio transcription placeholder - File: {audio_file.filename}, Size: {len(content)} bytes. Gemini API doesn't support direct audio transcription. Please implement with Google Cloud Speech-to-Text or another service.]"
            
            logger.info(f"Placeholder transcription for audio file: {audio_file.filename}")
            
            return {
                "success": True,
                "transcript": placeholder_transcript,
                "language": "en",
                "duration": 30.0,  # placeholder
                "confidence": 0.95,  # placeholder
                "filename": audio_file.filename,
                "file_size": len(content),
                "note": "Placeholder response - audio transcription needs to be implemented with appropriate service"
            }
                
        except Exception as e:
            logger.error(f"Audio processing failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Audio processing failed: {str(e)}"
            )
    
    async def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Analyze transcript using OpenAI for sentiment, pain points, and action items
        """
        try:
            analysis_prompt = f"""
            Analyze the following call transcript and provide a comprehensive analysis in JSON format:

            Transcript:
            {transcript}

            Please provide analysis in this exact JSON structure:
            {{
                "sentiment_analysis": {{
                    "overall_sentiment": "positive|negative|neutral|mixed",
                    "confidence_score": 0.0-1.0,
                    "sentiment_breakdown": {{
                        "positive_percentage": 0-100,
                        "negative_percentage": 0-100,
                        "neutral_percentage": 0-100
                    }}
                }},
                "pain_points": [
                    {{
                        "description": "specific pain point description",
                        "category": "pricing|product|service|delivery|communication|technical|other",
                        "severity": "low|medium|high|critical",
                        "confidence": 0.0-1.0
                    }}
                ],
                "action_items": [
                    {{
                        "title": "action item title",
                        "description": "detailed description",
                        "priority": "low|medium|high|urgent",
                        "category": "follow_up|research|documentation|training|escalation|communication|other",
                        "estimated_timeline": "timeline description"
                    }}
                ],
                "key_topics": ["topic1", "topic2", "topic3"],
                "summary": "Brief summary of the call",
                "recommendations": ["recommendation1", "recommendation2"]
            }}
            """
            
            logger.info("Analyzing transcript with OpenAI")
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert call analyst. Analyze the transcript and return only valid JSON with the requested structure. Be thorough and accurate."
                    },
                    {
                        "role": "user",
                        "content": analysis_prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            analysis_text = response.choices[0].message.content
            
            # Parse the JSON response
            import json
            analysis = json.loads(analysis_text)
            
            logger.info("Successfully analyzed transcript")
            
            return {
                "success": True,
                "analysis": analysis,
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
            
        except Exception as e:
            logger.error(f"Transcript analysis failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Transcript analysis failed: {str(e)}"
            )

# Global service instance
audio_service = AudioProcessingService()
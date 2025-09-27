"""
Audio Processing Service
Handles audio file upload, transcription, and processing using OpenAI Whisper
"""
import os
import tempfile
import aiofiles
from openai import AsyncOpenAI
from fastapi import UploadFile, HTTPException
from loguru import logger
from typing import Dict, Any
from ..core.config import settings

class AudioProcessingService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")
        
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY
        )
        logger.info("Audio processing service initialized with OpenAI Whisper")
    
    async def transcribe_audio(self, audio_file: UploadFile) -> Dict[str, Any]:
        """
        Transcribe audio file using OpenAI Whisper API
        """
        try:
            # Validate file type
            if not audio_file.content_type.startswith('audio/'):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Please upload an audio file."
                )
            
            # Create temporary file to store upload
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_file.filename.split('.')[-1]}") as temp_file:
                # Read and write audio content
                content = await audio_file.read()
                temp_file.write(content)
                temp_file.flush()
                
                # Transcribe using OpenAI Whisper
                logger.info(f"Transcribing audio file: {audio_file.filename}")
                
                with open(temp_file.name, "rb") as audio_data:
                    transcript = await self.client.audio.transcriptions.create(
                        model=settings.OPENAI_WHISPER_MODEL,
                        file=audio_data,
                        response_format="verbose_json",
                        language="en"  # You can make this dynamic
                    )
                
                # Clean up temporary file
                os.unlink(temp_file.name)
                
                logger.info(f"Successfully transcribed audio: {len(transcript.text)} characters")
                
                return {
                    "success": True,
                    "transcript": transcript.text,
                    "language": transcript.language,
                    "duration": transcript.duration,
                    "confidence": getattr(transcript, 'confidence', None),
                    "filename": audio_file.filename,
                    "file_size": len(content)
                }
                
        except Exception as e:
            logger.error(f"Audio transcription failed: {str(e)}")
            # Clean up temp file if it exists
            try:
                if 'temp_file' in locals():
                    os.unlink(temp_file.name)
            except:
                pass
            
            raise HTTPException(
                status_code=500,
                detail=f"Audio transcription failed: {str(e)}"
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
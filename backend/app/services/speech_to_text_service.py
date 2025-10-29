"""
Speech-to-Text Service using local Whisper model
"""
import asyncio
from typing import Dict, Any, Optional, BinaryIO
import torch
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration
import librosa
import numpy as np
from loguru import logger
from app.core.config import settings
import tempfile
import os

class SpeechToTextService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.processor = None
        self._load_model()

    def _load_model(self):
        """Load local Speech2Text model"""
        try:
            # Load local speech-to-text model
            self.processor = Speech2TextProcessor.from_pretrained(
                settings.STT_LOCAL_MODEL,
                local_files_only=True
            )
            self.model = Speech2TextForConditionalGeneration.from_pretrained(
                settings.STT_LOCAL_MODEL,
                local_files_only=True
            ).to(self.device)
            
            logger.info(f"Speech-to-text model loaded successfully from: {settings.STT_LOCAL_MODEL}")
        except Exception as e:
            logger.error(f"Error loading speech-to-text model: {e}")
            logger.error(f"STT model path: {settings.STT_LOCAL_MODEL}")
            # Set to None for fallback behavior
            self.model = None
            self.processor = None

    def _preprocess_audio(self, audio_path: str) -> np.ndarray:
        """Preprocess audio file for the model"""
        try:
            # Load audio file with error handling
            try:
                audio, sample_rate = librosa.load(audio_path, sr=16000)  # 16kHz sample rate
            except Exception as librosa_error:
                logger.warning(f"Librosa failed, trying alternative method: {librosa_error}")
                # Fallback: try to load with soundfile directly
                import soundfile as sf
                audio, sample_rate = sf.read(audio_path)
                # Resample if needed
                if sample_rate != 16000:
                    audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=16000)
            
            # Normalize audio
            if len(audio) > 0 and np.max(np.abs(audio)) > 0:
                audio = audio / np.max(np.abs(audio))
            else:
                logger.warning("Empty or silent audio detected")
                audio = np.zeros(16000)  # 1 second of silence
            
            return audio
        except Exception as e:
            logger.error(f"Error preprocessing audio: {e}")
            # Return silence as fallback
            return np.zeros(16000)

    async def transcribe_audio(self, audio_file: BinaryIO, language: str = "en") -> Dict[str, Any]:
        """
        Transcribe audio file to text using local model
        
        Args:
            audio_file: Audio file (binary data)
            language: Language code for transcription
            
        Returns:
            Transcription result with text and metadata
        """
        try:
            if self.model is None or self.processor is None:
                return await self._fallback_transcription(audio_file)

            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(audio_file.read())
                temp_audio_path = temp_file.name

            try:
                # Preprocess audio
                audio_array = self._preprocess_audio(temp_audio_path)
                
                # Prepare inputs for the model
                inputs = self.processor(
                    audio_array,
                    sampling_rate=16000,
                    return_tensors="pt"
                ).to(self.device)
                
                # Generate transcription
                with torch.no_grad():
                    generated_ids = self.model.generate(
                        inputs["input_features"],
                        max_length=500,
                        num_beams=5,
                        early_stopping=True
                    )
                
                # Decode the transcription
                transcription = self.processor.batch_decode(
                    generated_ids, 
                    skip_special_tokens=True
                )[0]
                
                # Calculate confidence (simplified)
                confidence = 0.85  # Default confidence for local model
                
                result = {
                    "text": transcription.strip(),
                    "language": language,
                    "confidence": confidence,
                    "duration": len(audio_array) / 16000,  # Duration in seconds
                    "model_used": "local_s2t_small_librispeech",
                    "segments": [
                        {
                            "start": 0.0,
                            "end": len(audio_array) / 16000,
                            "text": transcription.strip(),
                            "confidence": confidence
                        }
                    ]
                }
                
                logger.info(f"Successfully transcribed audio using local model. Text length: {len(transcription)}")
                return result
                
            finally:
                # Clean up temporary file
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)
                    
        except Exception as e:
            logger.error(f"Error transcribing audio with local model: {e}")
            # Return a basic result instead of falling back
            return {
                "text": "Audio transcription failed. Please try again.",
                "language": language,
                "confidence": 0.0,
                "duration": 0.0,
                "model_used": "error_fallback",
                "segments": []
            }

    async def _fallback_transcription(self, audio_file: BinaryIO) -> Dict[str, Any]:
        """Fallback transcription method when local model fails"""
        try:
            # If OpenAI API key is available, use Whisper API
            if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your-openai-api-key-here":
                return await self._transcribe_with_openai(audio_file)
            else:
                # Return empty transcription with warning
                logger.warning("No transcription method available. Returning empty result.")
                return {
                    "text": "[Transcription unavailable - no local model or API key configured]",
                    "language": "en",
                    "confidence": 0.0,
                    "duration": 0.0,
                    "model_used": "fallback",
                    "segments": []
                }
        except Exception as e:
            logger.error(f"Error in fallback transcription: {e}")
            return {
                "text": "[Transcription failed]",
                "language": "en",
                "confidence": 0.0,
                "duration": 0.0,
                "model_used": "error",
                "segments": []
            }

    async def _transcribe_with_openai(self, audio_file: BinaryIO) -> Dict[str, Any]:
        """Use OpenAI Whisper API as fallback"""
        try:
            import httpx
            
            # Reset file pointer
            audio_file.seek(0)
            
            async with httpx.AsyncClient() as client:
                files = {
                    'file': ('audio.wav', audio_file, 'audio/wav'),
                    'model': (None, 'whisper-1'),
                    'response_format': (None, 'verbose_json')
                }
                
                headers = {
                    'Authorization': f'Bearer {settings.OPENAI_API_KEY}'
                }
                
                response = await client.post(
                    'https://api.openai.com/v1/audio/transcriptions',
                    files=files,
                    headers=headers,
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    return {
                        "text": result.get('text', ''),
                        "language": result.get('language', 'en'),
                        "confidence": 0.9,  # OpenAI doesn't provide confidence scores
                        "duration": result.get('duration', 0.0),
                        "model_used": "openai_whisper",
                        "segments": result.get('segments', [])
                    }
                else:
                    logger.error(f"OpenAI transcription error: {response.status_code} - {response.text}")
                    raise Exception(f"OpenAI API error: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error transcribing with OpenAI: {e}")
            raise

    async def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return {
            "en": "English",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "pt": "Portuguese",
            "nl": "Dutch",
            "pl": "Polish",
            "ru": "Russian",
            "zh": "Chinese",
            "ja": "Japanese",
            "ko": "Korean"
        }

    async def transcribe_with_timestamps(self, audio_file: BinaryIO) -> Dict[str, Any]:
        """
        Transcribe audio with detailed timestamps
        This is useful for call analysis and speaker diarization
        """
        # For now, use the regular transcription method
        # In the future, this could be enhanced with more detailed timestamp extraction
        result = await self.transcribe_audio(audio_file)
        
        # Add more detailed timing information if needed
        if result.get("segments"):
            for segment in result["segments"]:
                # Add word-level timestamps if available from the model
                segment["words"] = []  # Placeholder for word-level timing
                
        return result

# Global instance
speech_to_text_service = SpeechToTextService()

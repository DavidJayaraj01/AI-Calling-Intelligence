"""
Minimal Speech-to-Text Service using Google Speech Recognition (free)
"""
import tempfile
import os
import wave
import audioop
from typing import Dict, Any, BinaryIO
from loguru import logger

try:
    import speech_recognition as sr
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    logger.warning("speech_recognition not installed. Install with: pip install SpeechRecognition pydub")

class MinimalSpeechToTextService:
    def __init__(self):
        self.model = None
        self.processor = None
        self.recognizer = sr.Recognizer() if SPEECH_RECOGNITION_AVAILABLE else None
        logger.info(f"Minimal Speech-to-Text Service initialized (speech_recognition: {SPEECH_RECOGNITION_AVAILABLE})")

    async def transcribe_audio(self, audio_file: BinaryIO, language: str = "en") -> Dict[str, Any]:
        """Transcribe audio using Google Speech Recognition (free, no API key needed)"""
        
        try:
            if not SPEECH_RECOGNITION_AVAILABLE:
                logger.warning("speech_recognition not available, using fallback")
                return self._get_fallback_transcription()
            
            # Save uploaded file to temp location
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_file:
                audio_data = audio_file.read()
                temp_file.write(audio_data)
                temp_path = temp_file.name
            
            try:
                # Convert to WAV if needed
                wav_path = temp_path
                if not temp_path.endswith('.wav'):
                    wav_path = temp_path.replace('.webm', '.wav').replace('.mp3', '.wav')
                    try:
                        # Try to convert using pydub
                        from pydub import AudioSegment
                        audio = AudioSegment.from_file(temp_path)
                        audio = audio.set_channels(1).set_frame_rate(16000)
                        audio.export(wav_path, format='wav')
                    except Exception as convert_error:
                        logger.warning(f"Could not convert audio format: {convert_error}")
                        # If conversion fails, try to use the file as-is
                        wav_path = temp_path
                
                # Read audio file
                with sr.AudioFile(wav_path) as source:
                    # Adjust for ambient noise
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    
                    # Record the audio
                    audio_data = self.recognizer.record(source)
                    
                    # Get duration
                    duration = len(audio_data.frame_data) / (audio_data.sample_rate * audio_data.sample_width)
                    
                    # Transcribe using Google Speech Recognition (free)
                    try:
                        text = self.recognizer.recognize_google(audio_data, language=language)
                        confidence = 0.85  # Google doesn't provide confidence, so we use a default
                        
                        logger.info(f"✅ Successfully transcribed audio: {len(text)} characters")
                        
                        result = {
                            "text": text,
                            "language": language,
                            "confidence": confidence,
                            "duration": duration,
                            "model_used": "google_speech_recognition",
                            "segments": [
                                {
                                    "start": 0.0,
                                    "end": duration,
                                    "text": text,
                                    "confidence": confidence
                                }
                            ]
                        }
                        
                        return result
                        
                    except sr.UnknownValueError:
                        logger.warning("Google Speech Recognition could not understand audio")
                        return {
                            "text": "[Could not understand audio - please speak more clearly]",
                            "language": language,
                            "confidence": 0.0,
                            "duration": duration,
                            "model_used": "google_speech_recognition",
                            "error": "Could not understand audio",
                            "segments": []
                        }
                    except sr.RequestError as e:
                        logger.error(f"Google Speech Recognition request failed: {e}")
                        return self._get_fallback_transcription()
                
            finally:
                # Clean up temp files
                try:
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                    if wav_path != temp_path and os.path.exists(wav_path):
                        os.unlink(wav_path)
                except Exception as cleanup_error:
                    logger.warning(f"Could not clean up temp files: {cleanup_error}")
                    
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return self._get_fallback_transcription()

    def _get_fallback_transcription(self) -> Dict[str, Any]:
        """Return fallback mock transcription when real transcription fails"""
        mock_text = """Customer: Hi, I'm having some issues with the API integration. 
The system keeps throwing timeout errors when we try to connect.

Vendor: I understand your concern. Let me help you troubleshoot this issue.
Can you tell me more about the specific error messages you're seeing?

Customer: Sure, it says 'Connection timeout after 30 seconds' and then the whole process fails.
This is quite frustrating as it's blocking our deployment.

Vendor: I see the problem. This is a common issue that we can resolve quickly.
Let me provide you with the updated configuration settings."""
        
        return {
            "text": mock_text.strip(),
            "language": "en",
            "confidence": 0.85,
            "duration": 120.0,
            "model_used": "fallback_mock",
            "segments": [
                {
                    "start": 0.0,
                    "end": 30.0,
                    "text": "Customer: Hi, I'm having some issues with the API integration.",
                    "confidence": 0.9
                }
            ]
        }

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
            "zh": "Chinese",
            "ja": "Japanese"
        }

    async def transcribe_with_timestamps(self, audio_file: BinaryIO) -> Dict[str, Any]:
        """Mock transcription with detailed timestamps"""
        result = await self.transcribe_audio(audio_file)
        
        # Add word-level timestamps (mock)
        for segment in result.get("segments", []):
            words = segment["text"].split()
            segment_duration = segment["end"] - segment["start"]
            word_duration = segment_duration / len(words) if words else 0
            
            segment["words"] = [
                {
                    "word": word,
                    "start": segment["start"] + i * word_duration,
                    "end": segment["start"] + (i + 1) * word_duration,
                    "confidence": 0.85
                }
                for i, word in enumerate(words)
            ]
                
        return result

# Global instance
speech_to_text_service = MinimalSpeechToTextService()

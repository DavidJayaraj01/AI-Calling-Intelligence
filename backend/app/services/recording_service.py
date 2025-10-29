"""
Real-time Call Recording and Transcription Service
Handles live meeting recording with streaming transcription and sentiment analysis
"""
import asyncio
from typing import Dict, Any, Optional, List
import torch
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration
import numpy as np
from loguru import logger
from app.core.config import settings
import io
import wave
import tempfile
import os

# Import sentiment analyzer
try:
    from app.services.sentiment_service import sentiment_analyzer
except ImportError:
    from app.services.minimal_sentiment_service import sentiment_analyzer

class RecordingService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.processor = None
        self.active_recordings = {}  # Store active recording sessions
        self._load_model()

    def _load_model(self):
        """Load local Speech2Text model for real-time transcription"""
        try:
            self.processor = Speech2TextProcessor.from_pretrained(
                settings.STT_LOCAL_MODEL,
                local_files_only=True
            )
            self.model = Speech2TextForConditionalGeneration.from_pretrained(
                settings.STT_LOCAL_MODEL,
                local_files_only=True,
                use_safetensors=True
            ).to(self.device)
            
            logger.info(f"Recording service initialized with model: {settings.STT_LOCAL_MODEL}")
        except Exception as e:
            logger.warning(f"Could not load STT model (using Google Speech Recognition as primary): {e}")
            self.model = None
            self.processor = None

    async def start_recording_session(self, session_id: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Start a new recording session
        
        Args:
            session_id: Unique identifier for this recording session
            metadata: Optional metadata about the recording (participants, meeting name, etc.)
            
        Returns:
            Session information
        """
        try:
            if session_id in self.active_recordings:
                logger.warning(f"Recording session {session_id} already exists")
                return {
                    "success": False,
                    "message": "Session already active",
                    "session_id": session_id
                }
            
            # Initialize recording session
            self.active_recordings[session_id] = {
                "start_time": asyncio.get_event_loop().time(),
                "audio_chunks": [],
                "transcription_segments": [],
                "sentiment_segments": [],  # Store real-time sentiment analysis
                "metadata": metadata or {},
                "status": "active",
                "total_duration": 0
            }
            
            logger.info(f"Started recording session: {session_id}")
            
            return {
                "success": True,
                "message": "Recording session started",
                "session_id": session_id,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"Error starting recording session: {e}")
            return {
                "success": False,
                "message": str(e),
                "session_id": session_id
            }

    async def process_audio_chunk(
        self, 
        session_id: str, 
        audio_chunk: bytes, 
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Process an audio chunk and return transcription
        
        Args:
            session_id: Recording session identifier
            audio_chunk: Raw audio data
            sample_rate: Audio sample rate (default 16000)
            
        Returns:
            Transcription result for this chunk
        """
        try:
            if session_id not in self.active_recordings:
                return {
                    "success": False,
                    "message": "Session not found",
                    "text": ""
                }
            
            session = self.active_recordings[session_id]
            
            # Store audio chunk
            session["audio_chunks"].append(audio_chunk)
            
            # Convert audio bytes to numpy array
            audio_array = np.frombuffer(audio_chunk, dtype=np.int16).astype(np.float32) / 32768.0
            
            # Skip if audio is too short or silent
            if len(audio_array) < sample_rate * 0.5:  # Less than 0.5 seconds
                return {
                    "success": True,
                    "text": "",
                    "is_partial": True
                }
            
            # Check if audio is mostly silent
            if np.abs(audio_array).max() < 0.01:
                return {
                    "success": True,
                    "text": "",
                    "is_partial": True
                }
            
            # Transcribe using the model
            if self.model and self.processor:
                text = await self._transcribe_chunk(audio_array, sample_rate)
            else:
                # Fallback: return placeholder
                text = ""
                logger.warning("Model not loaded, skipping transcription")
            
            # Store transcription segment
            if text:
                segment = {
                    "start_time": session["total_duration"],
                    "end_time": session["total_duration"] + len(audio_array) / sample_rate,
                    "text": text,
                    "chunk_index": len(session["audio_chunks"]) - 1
                }
                session["transcription_segments"].append(segment)
                session["total_duration"] += len(audio_array) / sample_rate
                
                # Perform real-time sentiment analysis on the transcribed text
                sentiment_result = await self._analyze_sentiment(text, segment)
                if sentiment_result:
                    session["sentiment_segments"].append(sentiment_result)
            
            # Get latest sentiment for this response
            latest_sentiment = None
            if text and session["sentiment_segments"]:
                latest_sentiment = session["sentiment_segments"][-1]
            
            return {
                "success": True,
                "text": text,
                "is_partial": False,
                "timestamp": session["total_duration"],
                "sentiment": latest_sentiment
            }
            
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            return {
                "success": False,
                "message": str(e),
                "text": ""
            }

    async def _transcribe_chunk(self, audio_array: np.ndarray, sample_rate: int) -> str:
        """
        Transcribe a single audio chunk
        
        Args:
            audio_array: Audio data as numpy array
            sample_rate: Sample rate of the audio
            
        Returns:
            Transcribed text
        """
        try:
            # Prepare inputs for the model
            inputs = self.processor(
                audio_array,
                sampling_rate=sample_rate,
                return_tensors="pt"
            ).to(self.device)
            
            # Generate transcription
            with torch.no_grad():
                generated_ids = self.model.generate(
                    inputs["input_features"],
                    max_length=100,
                    num_beams=3,
                    early_stopping=True
                )
            
            # Decode the transcription
            transcription = self.processor.batch_decode(
                generated_ids, 
                skip_special_tokens=True
            )[0]
            
            return transcription.strip()
            
        except Exception as e:
            logger.error(f"Error transcribing chunk: {e}")
            return ""

    async def _analyze_sentiment(self, text: str, segment: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analyze sentiment of transcribed text in real-time
        
        Args:
            text: Transcribed text to analyze
            segment: Transcription segment information
            
        Returns:
            Sentiment analysis result
        """
        try:
            if not text or len(text.strip()) < 3:
                return None
            
            # Use the sentiment analyzer service
            # This is a simplified call - you may need to adjust based on your sentiment_analyzer implementation
            sentiment_result = {
                "start_time": segment["start_time"],
                "end_time": segment["end_time"],
                "text": text,
                "sentiment": "neutral",  # default
                "confidence": 0.0,
                "emotions": {}
            }
            
            # Try to analyze with the sentiment service
            try:
                # Call sentiment analyzer - adjust this based on your actual implementation
                analysis = await sentiment_analyzer.analyze_text(text)
                
                if analysis:
                    sentiment_result.update({
                        "sentiment": analysis.get("sentiment", "neutral"),
                        "confidence": analysis.get("confidence", 0.0),
                        "emotions": analysis.get("emotions", {})
                    })
            except Exception as e:
                logger.warning(f"Sentiment analysis failed, using defaults: {e}")
            
            return sentiment_result
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return None

    async def stop_recording_session(self, session_id: str) -> Dict[str, Any]:
        """
        Stop a recording session and return final results
        
        Args:
            session_id: Recording session identifier
            
        Returns:
            Complete recording and transcription data
        """
        try:
            if session_id not in self.active_recordings:
                return {
                    "success": False,
                    "message": "Session not found"
                }
            
            session = self.active_recordings[session_id]
            session["status"] = "completed"
            
            # Combine all transcription segments
            full_transcript = " ".join([
                segment["text"] 
                for segment in session["transcription_segments"]
                if segment["text"]
            ])
            
            # Calculate overall sentiment from all segments
            overall_sentiment = self._calculate_overall_sentiment(session["sentiment_segments"])
            
            # Save combined audio if needed
            combined_audio_path = None
            if session["audio_chunks"]:
                combined_audio_path = await self._save_recording(session_id, session["audio_chunks"])
            
            result = {
                "success": True,
                "session_id": session_id,
                "transcript": full_transcript,
                "segments": session["transcription_segments"],
                "sentiment_segments": session["sentiment_segments"],
                "overall_sentiment": overall_sentiment,
                "duration": session["total_duration"],
                "metadata": session["metadata"],
                "audio_file": combined_audio_path,
                "chunks_processed": len(session["audio_chunks"])
            }
            
            # Clean up session
            del self.active_recordings[session_id]
            
            logger.info(f"Stopped recording session: {session_id}")
            logger.info(f"Final transcript ({len(full_transcript)} chars): {full_transcript[:100]}...")
            
            return result
            
        except Exception as e:
            logger.error(f"Error stopping recording session: {e}")
            return {
                "success": False,
                "message": str(e)
            }

    async def _save_recording(self, session_id: str, audio_chunks: List[bytes]) -> Optional[str]:
        """
        Save the recording to a WAV file
        
        Args:
            session_id: Recording session identifier
            audio_chunks: List of audio chunk bytes
            
        Returns:
            Path to saved audio file
        """
        try:
            # Create a temporary file
            temp_dir = tempfile.gettempdir()
            audio_path = os.path.join(temp_dir, f"recording_{session_id}.wav")
            
            # Combine all chunks
            combined_audio = b"".join(audio_chunks)
            
            # Save as WAV file
            with wave.open(audio_path, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 16-bit
                wav_file.setframerate(16000)  # 16kHz
                wav_file.writeframes(combined_audio)
            
            logger.info(f"Saved recording to: {audio_path}")
            return audio_path
            
        except Exception as e:
            logger.error(f"Error saving recording: {e}")
            return None

    def _calculate_overall_sentiment(self, sentiment_segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate overall sentiment from all segments
        
        Args:
            sentiment_segments: List of sentiment analysis results
            
        Returns:
            Overall sentiment summary
        """
        if not sentiment_segments:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "sentiment_distribution": {},
                "average_confidence": 0.0
            }
        
        # Count sentiment occurrences
        sentiment_counts = {}
        total_confidence = 0.0
        
        for segment in sentiment_segments:
            sentiment = segment.get("sentiment", "neutral")
            confidence = segment.get("confidence", 0.0)
            
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
            total_confidence += confidence
        
        # Determine dominant sentiment
        dominant_sentiment = max(sentiment_counts, key=sentiment_counts.get) if sentiment_counts else "neutral"
        avg_confidence = total_confidence / len(sentiment_segments) if sentiment_segments else 0.0
        
        # Calculate distribution percentages
        total_segments = len(sentiment_segments)
        sentiment_distribution = {
            sentiment: (count / total_segments) * 100
            for sentiment, count in sentiment_counts.items()
        }
        
        return {
            "sentiment": dominant_sentiment,
            "confidence": avg_confidence,
            "sentiment_distribution": sentiment_distribution,
            "average_confidence": avg_confidence,
            "total_segments": total_segments
        }

    async def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get the current status of a recording session
        
        Args:
            session_id: Recording session identifier
            
        Returns:
            Session status information
        """
        if session_id not in self.active_recordings:
            return {
                "success": False,
                "message": "Session not found",
                "status": "not_found"
            }
        
        session = self.active_recordings[session_id]
        
        # Get current sentiment summary
        current_sentiment = self._calculate_overall_sentiment(session["sentiment_segments"])
        
        return {
            "success": True,
            "session_id": session_id,
            "status": session["status"],
            "duration": session["total_duration"],
            "chunks_processed": len(session["audio_chunks"]),
            "segments_count": len(session["transcription_segments"]),
            "sentiment_segments_count": len(session["sentiment_segments"]),
            "current_sentiment": current_sentiment,
            "metadata": session["metadata"]
        }

    def get_active_sessions(self) -> List[str]:
        """Get list of all active recording sessions"""
        return list(self.active_recordings.keys())

# Global instance
recording_service = RecordingService()

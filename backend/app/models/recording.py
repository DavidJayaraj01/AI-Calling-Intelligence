"""
Add recording table to store audio files
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, LargeBinary, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Recording(Base):
    __tablename__ = "recording"
    
    recording_id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("call.call_id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    
    # Audio data
    audio_data = Column(LargeBinary, nullable=True)  # Store audio file as binary
    audio_format = Column(String(50), default="wav")  # wav, mp3, webm, etc.
    audio_size = Column(Integer, nullable=True)  # Size in bytes
    
    # Recording metadata
    duration = Column(Integer, nullable=True)  # Duration in seconds
    sample_rate = Column(Integer, default=16000)
    channels = Column(Integer, default=1)
    
    # Transcription
    transcript = Column(Text, nullable=True)
    transcription_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Additional metadata as JSON
    metadata_json = Column(Text, default="{}")
    
    def __repr__(self):
        return f"<Recording(recording_id={self.recording_id}, session_id={self.session_id}, call_id={self.call_id})>"

"""
SQLAlchemy database models for the AI Call Intelligence Platform
Real-time data storage for OpenAI analysis results
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
from datetime import datetime

# Enums for call analysis
class CallSentiment(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"

class PainPointSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ActionItemPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ActionItemStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Core Models for Real Data Storage
class Call(Base):
    """
    Main calls table for storing real transcribed call data
    """
    __tablename__ = "calls"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    transcript = Column(Text, nullable=False)  # Real transcribed content
    audio_filename = Column(String(255))  # Original uploaded file
    duration_seconds = Column(Float)  # Actual call duration
    
    # Real OpenAI Analysis Results
    overall_sentiment = Column(SQLEnum(CallSentiment), default=CallSentiment.NEUTRAL)
    sentiment_confidence = Column(Float, default=0.0)
    positive_percentage = Column(Float, default=0.0)
    negative_percentage = Column(Float, default=0.0)
    neutral_percentage = Column(Float, default=0.0)
    
    # AI Generated Summary and Topics
    ai_summary = Column(Text)  # GPT generated summary
    key_topics = Column(JSONB)  # List of extracted topics
    recommendations = Column(JSONB)  # AI recommendations
    
    # OpenAI Usage Tracking
    tokens_used = Column(Integer, default=0)
    openai_model_used = Column(String(100), default="gpt-4o-mini")
    whisper_model_used = Column(String(100), default="whisper-1")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pain_points = relationship("PainPoint", back_populates="call", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="call", cascade="all, delete-orphan")

class PainPoint(Base):
    """
    Pain points extracted from real call analysis
    """
    __tablename__ = "pain_points"
    
    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False)
    
    description = Column(Text, nullable=False)  # AI extracted pain point
    category = Column(String(100))  # pricing|product|service|delivery|communication|technical|other
    severity = Column(SQLEnum(PainPointSeverity), default=PainPointSeverity.MEDIUM)
    confidence_score = Column(Float, default=0.0)  # AI confidence
    transcript_segment = Column(Text)  # Relevant quote from transcript
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    call = relationship("Call", back_populates="pain_points")

class ActionItem(Base):
    """
    Action items generated from real call analysis
    """
    __tablename__ = "action_items"
    
    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False)
    
    title = Column(String(255), nullable=False)  # AI generated title
    description = Column(Text, nullable=False)  # AI generated description
    priority = Column(SQLEnum(ActionItemPriority), default=ActionItemPriority.MEDIUM)
    status = Column(SQLEnum(ActionItemStatus), default=ActionItemStatus.PENDING)
    category = Column(String(100))  # follow_up|research|documentation|training|escalation|communication|other
    estimated_days = Column(Integer)  # AI estimated timeline
    
    # Tracking
    assigned_to = Column(String(255))  # Who should handle this
    due_date = Column(Date)
    completed_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    call = relationship("Call", back_populates="action_items")

class AnalyticsSnapshot(Base):
    """
    Daily snapshots for dashboard analytics from real data
    """
    __tablename__ = "analytics_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, unique=True)
    
    # Real metrics from actual calls
    total_calls = Column(Integer, default=0)
    total_pain_points = Column(Integer, default=0)
    total_action_items = Column(Integer, default=0)
    
    # Sentiment distribution from real analysis
    positive_calls = Column(Integer, default=0)
    negative_calls = Column(Integer, default=0)
    neutral_calls = Column(Integer, default=0)
    mixed_calls = Column(Integer, default=0)
    
    # Action item status distribution
    pending_action_items = Column(Integer, default=0)
    completed_action_items = Column(Integer, default=0)
    overdue_action_items = Column(Integer, default=0)
    
    # Top categories (JSON arrays)
    top_pain_point_categories = Column(JSONB)
    top_topics = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Export all models
__all__ = [
    "Call",
    "PainPoint", 
    "ActionItem",
    "AnalyticsSnapshot",
    "CallSentiment",
    "PainPointSeverity",
    "ActionItemPriority",
    "ActionItemStatus"
]
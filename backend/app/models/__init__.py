"""
SQLAlchemy database models for the AI Call Intelligence Platform
Updated schema to match the specified PostgreSQL table structure
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator
import enum
from app.core.database import Base

# Vector type for PostgreSQL pgvector
class Vector(TypeDecorator):
    """Vector type for PostgreSQL with pgvector extension.
    Stores vector embeddings as TEXT (JSON) for compatibility.
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        # Store as JSON string
        import json
        if isinstance(value, (list, tuple)):
            return json.dumps(list(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        # Parse JSON string back to list
        import json
        try:
            return json.loads(value) if isinstance(value, str) else value
        except (json.JSONDecodeError, TypeError):
            return value

# Enums for the new schema
class UserRole(str, enum.Enum):
    VENDOR = "vendor"
    DISTRIBUTOR = "distributor"
    ADMIN = "admin"
    ANALYST = "analyst"

class ResourceType(str, enum.Enum):
    PLAYBOOK = "playbook"
    WORKSHOP = "workshop"
    DOC = "doc"
    TRAINING = "training"
    OTHER = "other"

class ActionItemStatus(str, enum.Enum):
    OPEN = "open"
    DONE = "done"
    OVERDUE = "overdue"
    PENDING = "pending"

class SentimentType(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"

class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    SENT = "sent"

class PainPointCategory(str, enum.Enum):
    TECHNICAL = "technical"
    PRICING = "pricing"
    PRODUCT = "product"
    SERVICE = "service"
    DELIVERY = "delivery"
    COMMUNICATION = "communication"
    OTHER = "other"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ActionItemCategory(str, enum.Enum):
    FOLLOW_UP = "follow_up"
    RESEARCH = "research"
    DOCUMENTATION = "documentation"
    TRAINING = "training"
    ESCALATION = "escalation"
    COMMUNICATION = "communication"
    OTHER = "other"

# Database Models matching the specified schema
class Distributor(Base):
    __tablename__ = "distributor"

    distributor_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    profile_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    vendors = relationship("Vendor", back_populates="distributor")
    calls = relationship("Call", back_populates="distributor")
    qbr_drafts = relationship("QBRDraft", back_populates="distributor")

class Vendor(Base):
    __tablename__ = "vendor"

    vendor_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    resource_docs = Column(JSONB)  # Array: linked docs/playbooks/training IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="vendors")
    calls = relationship("Call", back_populates="vendor")


class Call(Base):
    __tablename__ = "call"

    call_id = Column(Integer, primary_key=True, autoincrement=True)
    distributor_id = Column(Integer, ForeignKey("distributor.distributor_id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendor.vendor_id"), nullable=False)
    seed_brief = Column(Text)  # Initial challenge summary/seed brief
    transcript = Column(Text, nullable=False)  # Raw call transcript
    metadata_json = Column(JSONB)  # Extra: call datetime, duration, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="calls")
    vendor = relationship("Vendor", back_populates="calls")
    pain_points = relationship("PainPoint", back_populates="call", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="call", cascade="all, delete-orphan")
    sentiment_segments = relationship("SentimentSegment", back_populates="call", cascade="all, delete-orphan")


class PainPoint(Base):
    __tablename__ = "painpoint"

    painpoint_id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey("call.call_id"), nullable=False)
    description = Column(Text, nullable=False)  # Detected pain point/question/issue
    vector_embedding = Column(Vector())  # Vector for semantic search (pgvector)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    call = relationship("Call", back_populates="pain_points")
    problem_solution_mappings = relationship("ProblemSolutionMapping", back_populates="pain_point", cascade="all, delete-orphan")

class SolutionResource(Base):
    __tablename__ = "solutionresource"

    resource_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)  # Resource title
    type = Column(String, nullable=False)  # Type (playbook, workshop, doc, etc)
    uri = Column(Text)  # Link or location of resource
    content = Column(Text)  # Full/summary text for search
    vector_embedding = Column(Vector())  # Semantic vector (pgvector)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    problem_solution_mappings = relationship("ProblemSolutionMapping", back_populates="solution_resource", cascade="all, delete-orphan")

class ProblemSolutionMapping(Base):
    __tablename__ = "problemsolutionmapping"

    mapping_id = Column(Integer, primary_key=True, autoincrement=True)
    painpoint_id = Column(Integer, ForeignKey("painpoint.painpoint_id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("solutionresource.resource_id"), nullable=False)
    matching_score = Column(Float, nullable=False)  # Relevance/confidence score
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pain_point = relationship("PainPoint", back_populates="problem_solution_mappings")
    solution_resource = relationship("SolutionResource", back_populates="problem_solution_mappings")

class ActionItem(Base):
    __tablename__ = "actionitem"

    action_id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey("call.call_id"), nullable=False)
    description = Column(Text, nullable=False)  # Task details
    owner_id = Column(Integer, ForeignKey("user.user_id"))  # Linked user assigned
    due_date = Column(Date)  # Deadline
    status = Column(String, default="open")  # Status (open, done, overdue, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    call = relationship("Call", back_populates="action_items")
    owner = relationship("User", back_populates="assigned_action_items")
    notifications = relationship("Notification", back_populates="action_item")

class SentimentSegment(Base):
    __tablename__ = "sentimentsegment"

    segment_id = Column(Integer, primary_key=True, autoincrement=True)
    call_id = Column(Integer, ForeignKey("call.call_id"), nullable=False)
    start_time = Column(Float, nullable=False)  # Segment start (seconds)
    end_time = Column(Float, nullable=False)  # Segment end (seconds)
    speaker = Column(String)  # Speaker label
    sentiment = Column(String, nullable=False)  # Sentiment (positive/neutral/negative)
    confidence = Column(Float, nullable=False)  # Sentiment confidence score
    transcript_excerpt = Column(Text)  # Excerpt/comment

    # Relationships
    call = relationship("Call", back_populates="sentiment_segments")

class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)  # User's name
    email = Column(String, nullable=False)  # Email address
    role = Column(String, nullable=False)  # Role (vendor, distributor, admin, analyst)

    # Relationships
    assigned_action_items = relationship("ActionItem", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")

class Notification(Base):
    __tablename__ = "notification"

    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    action_id = Column(Integer, ForeignKey("actionitem.action_id"), nullable=True)  # Linked action item (if related)
    message = Column(Text, nullable=False)  # Notification text/content
    status = Column(String, default="unread")  # (unread, read, sent)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
    action_item = relationship("ActionItem", back_populates="notifications")

class QBRDraft(Base):
    __tablename__ = "qbrdraft"

    qbr_id = Column(Integer, primary_key=True, autoincrement=True)
    distributor_id = Column(Integer, ForeignKey("distributor.distributor_id"), nullable=False)
    content = Column(Text, nullable=False)  # Full draft content
    review_period = Column(String, nullable=False)  # (e.g., '2025 Q3')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="qbr_drafts")

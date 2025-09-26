"""
SQLAlchemy database models for the AI Call Intelligence Platform
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PostgreSQL_UUID
import uuid
import enum
from app.core.database import Base

# Cross-database UUID type
class UUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type when available, otherwise uses CHAR(36) storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PostgreSQL_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value

# Cross-database Vector type for embeddings
class Vector(TypeDecorator):
    """Platform-independent Vector type.
    Uses pgvector for PostgreSQL, TEXT for SQLite (stored as JSON).
    """
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            try:
                from pgvector.sqlalchemy import Vector as PGVector
                return dialect.type_descriptor(PGVector(1536))  # OpenAI embedding dimension
            except ImportError:
                return dialect.type_descriptor(Text())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value  # pgvector handles this
        else:
            # For SQLite, store as JSON string
            import json
            if isinstance(value, (list, tuple)):
                return json.dumps(list(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value  # pgvector handles this
        else:
            # For SQLite, parse JSON string back to list
            import json
            try:
                return json.loads(value) if isinstance(value, str) else value
            except (json.JSONDecodeError, TypeError):
                return value

# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DISTRIBUTOR_ADMIN = "distributor_admin"
    DISTRIBUTOR_USER = "distributor_user"
    VENDOR_ADMIN = "vendor_admin"
    VENDOR_USER = "vendor_user"

class PainPointCategory(str, enum.Enum):
    PRODUCT = "product"
    SERVICE = "service"
    PRICING = "pricing"
    DELIVERY = "delivery"
    COMMUNICATION = "communication"
    TECHNICAL = "technical"
    OTHER = "other"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ResourceType(str, enum.Enum):
    DOCUMENT = "document"
    VIDEO = "video"
    ARTICLE = "article"
    FAQ = "faq"
    TUTORIAL = "tutorial"
    CONTACT = "contact"
    OTHER = "other"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ActionItemStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class ActionItemCategory(str, enum.Enum):
    FOLLOW_UP = "follow_up"
    RESEARCH = "research"
    DOCUMENTATION = "documentation"
    TRAINING = "training"
    ESCALATION = "escalation"
    COMMUNICATION = "communication"
    OTHER = "other"

class SentimentType(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"

class NotificationType(str, enum.Enum):
    ACTION_ITEM_ASSIGNED = "action_item_assigned"
    ACTION_ITEM_DUE = "action_item_due"
    ACTION_ITEM_OVERDUE = "action_item_overdue"
    CALL_ANALYZED = "call_analyzed"
    QBR_READY = "qbr_ready"
    SYSTEM = "system"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"

class QBRStatus(str, enum.Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"

# Database Models
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    distributor_id = Column(UUID(), ForeignKey("distributors.id"), nullable=True)
    vendor_id = Column(UUID(), ForeignKey("vendors.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="users")
    vendor = relationship("Vendor", back_populates="users")
    assigned_action_items = relationship("ActionItem", back_populates="assignee")
    notifications = relationship("Notification", back_populates="user")

class Distributor(Base):
    __tablename__ = "distributors"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String)
    address = Column(Text)
    profile_json = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    users = relationship("User", back_populates="distributor")
    vendors = relationship("Vendor", back_populates="distributor")
    calls = relationship("Call", back_populates="distributor")
    qbr_drafts = relationship("QBRDraft", back_populates="distributor")

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    contact_phone = Column(String)
    address = Column(Text)
    distributor_id = Column(UUID(), ForeignKey("distributors.id"), nullable=False)
    resource_docs = Column(JSON)  # Array of resource IDs
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="vendors")
    users = relationship("User", back_populates="vendor")
    calls = relationship("Call", back_populates="vendor")
    qbr_drafts = relationship("QBRDraft", back_populates="vendor")

class Call(Base):
    __tablename__ = "calls"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    distributor_id = Column(UUID(), ForeignKey("distributors.id"), nullable=False)
    vendor_id = Column(UUID(), ForeignKey("vendors.id"), nullable=False)
    seed_brief = Column(Text)
    transcript = Column(Text, nullable=False)
    metadata_json = Column(JSON)  # Call duration, participants, etc.
    overall_sentiment = Column(SQLEnum(SentimentType))
    confidence_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="calls")
    vendor = relationship("Vendor", back_populates="calls")
    pain_points = relationship("PainPoint", back_populates="call", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="call", cascade="all, delete-orphan")
    sentiment_segments = relationship("SentimentSegment", back_populates="call", cascade="all, delete-orphan")
    problem_solution_mappings = relationship("ProblemSolutionMapping", back_populates="call", cascade="all, delete-orphan")

class PainPoint(Base):
    __tablename__ = "pain_points"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    call_id = Column(UUID(), ForeignKey("calls.id"), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(PainPointCategory), nullable=False)
    severity = Column(SQLEnum(SeverityLevel), nullable=False)
    vector_embedding = Column(Vector(768))  # 768-dimensional vector for RoBERTa embeddings
    extracted_at = Column(DateTime(timezone=True), server_default=func.now())
    start_time = Column(Float)  # Timestamp in call (seconds)
    end_time = Column(Float)    # Timestamp in call (seconds)
    confidence = Column(Float, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    call = relationship("Call", back_populates="pain_points")
    problem_solution_mappings = relationship("ProblemSolutionMapping", back_populates="pain_point", cascade="all, delete-orphan")

class SolutionResource(Base):
    __tablename__ = "solution_resources"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    resource_type = Column(SQLEnum(ResourceType), nullable=False)
    uri = Column(Text)  # Link or location
    content = Column(Text)  # Full/summary text for search
    vector_embedding = Column(Vector(768))  # 768-dimensional vector for semantic search
    tags = Column(JSON)  # Array of tags
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User")
    problem_solution_mappings = relationship("ProblemSolutionMapping", back_populates="solution_resource", cascade="all, delete-orphan")

class ProblemSolutionMapping(Base):
    __tablename__ = "problem_solution_mappings"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    call_id = Column(UUID(), ForeignKey("calls.id"), nullable=False)
    pain_point_id = Column(UUID(), ForeignKey("pain_points.id"), nullable=False)
    solution_resource_id = Column(UUID(), ForeignKey("solution_resources.id"), nullable=False)
    matching_score = Column(Float, nullable=False)  # Relevance/confidence score
    is_effective = Column(Boolean)
    feedback = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    call = relationship("Call", back_populates="problem_solution_mappings")
    pain_point = relationship("PainPoint", back_populates="problem_solution_mappings")
    solution_resource = relationship("SolutionResource", back_populates="problem_solution_mappings")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    call_id = Column(UUID(), ForeignKey("calls.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    assignee_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    priority = Column(SQLEnum(Priority), nullable=False)
    status = Column(SQLEnum(ActionItemStatus), default=ActionItemStatus.PENDING)
    category = Column(SQLEnum(ActionItemCategory), nullable=False)
    due_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    call = relationship("Call", back_populates="action_items")
    assignee = relationship("User", back_populates="assigned_action_items")
    notifications = relationship("Notification", back_populates="action_item")

class SentimentSegment(Base):
    __tablename__ = "sentiment_segments"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    call_id = Column(UUID(), ForeignKey("calls.id"), nullable=False)
    start_time = Column(Float, nullable=False)  # Seconds into call
    end_time = Column(Float, nullable=False)    # Seconds into call
    sentiment = Column(SQLEnum(SentimentType), nullable=False)
    confidence = Column(Float, nullable=False)
    speaker = Column(String)
    transcript_excerpt = Column(Text)
    emotions_json = Column(JSON)  # Emotion scores
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    call = relationship("Call", back_populates="sentiment_segments")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(), ForeignKey("users.id"), nullable=False)
    action_item_id = Column(UUID(), ForeignKey("action_items.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(SQLEnum(NotificationType), nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    action_url = Column(String)
    metadata_json = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
    action_item = relationship("ActionItem", back_populates="notifications")

class QBRDraft(Base):
    __tablename__ = "qbr_drafts"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    distributor_id = Column(UUID(), ForeignKey("distributors.id"), nullable=False)
    vendor_id = Column(UUID(), ForeignKey("vendors.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    review_period = Column(String, nullable=False)  # e.g., '2025 Q3'
    status = Column(SQLEnum(QBRStatus), default=QBRStatus.DRAFT)
    metrics_json = Column(JSON)  # QBR metrics
    key_insights = Column(JSON)  # Array of insights
    action_items_summary = Column(JSON)  # Action items summary
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(UUID(), ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    distributor = relationship("Distributor", back_populates="qbr_drafts")
    vendor = relationship("Vendor", back_populates="qbr_drafts")
    reviewer = relationship("User")

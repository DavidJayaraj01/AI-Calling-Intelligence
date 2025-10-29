"""
Pydantic schemas for API request/response models
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum
import uuid

# Enums (matching database models)
class UserRole(str, Enum):
    ADMIN = "admin"
    DISTRIBUTOR_ADMIN = "distributor_admin"
    DISTRIBUTOR_USER = "distributor_user"
    VENDOR_ADMIN = "vendor_admin"
    VENDOR_USER = "vendor_user"

class PainPointCategory(str, Enum):
    PRODUCT = "product"
    SERVICE = "service"
    PRICING = "pricing"
    DELIVERY = "delivery"
    COMMUNICATION = "communication"
    TECHNICAL = "technical"
    OTHER = "other"

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ActionItemStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class ActionItemCategory(str, Enum):
    FOLLOW_UP = "follow_up"
    RESEARCH = "research"
    DOCUMENTATION = "documentation"
    TRAINING = "training"
    ESCALATION = "escalation"
    COMMUNICATION = "communication"
    OTHER = "other"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseSchema):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    distributor_id: Optional[uuid.UUID] = None
    vendor_id: Optional[uuid.UUID] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseSchema):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

# Authentication schemas
class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"

class LoginRequest(BaseSchema):
    email: EmailStr
    password: str

# Distributor schemas
class DistributorBase(BaseSchema):
    name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    profile_json: Optional[Dict[str, Any]] = None
    is_active: bool = True

class DistributorCreate(DistributorBase):
    pass

class DistributorResponse(DistributorBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# Vendor schemas
class VendorBase(BaseSchema):
    name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    distributor_id: uuid.UUID
    resource_docs: Optional[Dict[str, Any]] = None
    is_active: bool = True

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# Call schemas
class CallBase(BaseSchema):
    distributor_id: int
    vendor_id: int
    seed_brief: Optional[str] = None
    transcript: str
    metadata_json: Optional[Dict[str, Any]] = None

class CallCreate(CallBase):
    pass

class CallProcessRequest(BaseSchema):
    """Request schema for processing a call with AI analysis"""
    audio_file: Optional[str] = None  # Base64 encoded audio or file path
    transcript: Optional[str] = None  # Direct transcript input
    distributor_id: int
    vendor_id: int
    seed_brief: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CallResponse(CallBase):
    call_id: int
    created_at: datetime

class CallDetailResponse(CallResponse):
    pain_points: List['PainPointResponse'] = []
    action_items: List['ActionItemResponse'] = []
    sentiment_segments: List['SentimentSegmentResponse'] = []

# Pain Point schemas
class PainPointBase(BaseSchema):
    call_id: int
    description: str

class PainPointCreate(PainPointBase):
    vector_embedding: Optional[List[float]] = None

class PainPointResponse(PainPointBase):
    painpoint_id: int
    vector_embedding: Optional[List[float]] = None
    created_at: datetime

# Solution Resource schemas
class SolutionResourceBase(BaseSchema):
    title: str
    description: str
    resource_type: str
    uri: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = []
    is_active: bool = True

class SolutionResourceCreate(SolutionResourceBase):
    created_by: Optional[uuid.UUID] = None

class SolutionResourceResponse(SolutionResourceBase):
    id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

# Action Item schemas
class ActionItemBase(BaseSchema):
    call_id: int
    description: str
    owner_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: str = "pending"

class ActionItemCreate(ActionItemBase):
    pass

class ActionItemUpdate(BaseSchema):
    description: Optional[str] = None
    owner_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None

class ActionItemResponse(ActionItemBase):
    action_id: int
    created_at: datetime

# Sentiment Segment schemas
class SentimentSegmentBase(BaseSchema):
    call_id: int
    start_time: float
    end_time: float
    sentiment: str
    confidence: float
    speaker: Optional[str] = None
    transcript_excerpt: Optional[str] = None

class SentimentSegmentCreate(SentimentSegmentBase):
    pass

class SentimentSegmentResponse(SentimentSegmentBase):
    segment_id: int

# Analytics schemas
class DashboardMetrics(BaseSchema):
    total_calls: int
    total_pain_points: int
    total_action_items: int
    pending_action_items: int
    average_sentiment: float
    sentiment_trend: List[Dict[str, Any]]
    pain_points_by_category: Dict[str, int]
    action_items_by_status: Dict[str, int]

class SentimentAnalysisResponse(BaseSchema):
    call_id: int
    overall_sentiment: SentimentType
    overall_confidence: float
    sentiment_segments: List[SentimentSegmentResponse]
    sentiment_timeline: List[Dict[str, Any]]
    key_moments: List[Dict[str, Any]]
    analysis_metadata: Dict[str, Any]

# QBR schemas
class QBRMetrics(BaseSchema):
    total_calls: int
    average_sentiment: float
    total_pain_points: int
    resolved_pain_points: int
    total_action_items: int
    completed_action_items: int
    average_call_duration: float
    sentiment_trend: List[Dict[str, Any]]

class QBRDraftBase(BaseSchema):
    distributor_id: uuid.UUID
    vendor_id: uuid.UUID
    title: str
    content: str
    review_period: str
    metrics_json: Optional[Dict[str, Any]] = None
    key_insights: Optional[List[str]] = []

class QBRDraftCreate(QBRDraftBase):
    pass

class QBRDraftResponse(QBRDraftBase):
    id: uuid.UUID
    status: str
    generated_at: datetime
    created_at: datetime
    updated_at: datetime

# Notification schemas
class NotificationBase(BaseSchema):
    user_id: uuid.UUID
    title: str
    message: str
    notification_type: str
    action_url: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class NotificationCreate(NotificationBase):
    action_item_id: Optional[uuid.UUID] = None

class NotificationResponse(NotificationBase):
    id: uuid.UUID
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

# Pagination schemas
class PaginationParams(BaseSchema):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

class PaginatedResponse(BaseSchema):
    items: List[Any]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool

# Search and filter schemas
class CallFilters(BaseSchema):
    distributor_id: Optional[uuid.UUID] = None
    vendor_id: Optional[uuid.UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    sentiment: Optional[SentimentType] = None
    has_pain_points: Optional[bool] = None

class ActionItemFilters(BaseSchema):
    assignee_id: Optional[uuid.UUID] = None
    status: Optional[ActionItemStatus] = None
    priority: Optional[Priority] = None
    category: Optional[ActionItemCategory] = None
    overdue: Optional[bool] = None

# API Response schemas
class APIResponse(BaseSchema):
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None

class HealthCheck(BaseSchema):
    status: str = "healthy"
    timestamp: datetime
    version: str
    services: Dict[str, str]

# Forward references
CallDetailResponse.model_rebuild()
PaginatedResponse.model_rebuild()

/**
 * Core TypeScript interfaces and types for the AI Call Intelligence Platform
 * Based on the database schema requirements
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User and Authentication
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  distributorId?: string;
  vendorId?: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  DISTRIBUTOR_ADMIN = 'distributor_admin',
  DISTRIBUTOR_USER = 'distributor_user',
  VENDOR_ADMIN = 'vendor_admin',
  VENDOR_USER = 'vendor_user'
}

// Business entities
export interface Distributor extends BaseEntity {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  vendors: Vendor[];
}

export interface Vendor extends BaseEntity {
  name: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  distributorId: string;
  distributor: Distributor;
  isActive: boolean;
}

// Call and Call Analysis
export interface Call extends BaseEntity {
  distributorId: string;
  vendorId: string;
  distributor: Distributor;
  vendor: Vendor;
  transcript: string;
  duration: number; // in seconds
  callDate: Date;
  participants: string[];
  overallSentiment: SentimentType;
  confidenceScore: number;
  painPoints: PainPoint[];
  actionItems: ActionItem[];
  sentimentSegments: SentimentSegment[];
  problemSolutionMappings: ProblemSolutionMapping[];
}

export interface PainPoint extends BaseEntity {
  callId: string;
  call: Call;
  description: string;
  category: PainPointCategory;
  severity: SeverityLevel;
  extractedAt: Date;
  startTime?: number; // timestamp in call
  endTime?: number; // timestamp in call
  confidence: number;
  isResolved: boolean;
  solutionResources: SolutionResource[];
}

export enum PainPointCategory {
  PRODUCT = 'product',
  SERVICE = 'service',
  PRICING = 'pricing',
  DELIVERY = 'delivery',
  COMMUNICATION = 'communication',
  TECHNICAL = 'technical',
  OTHER = 'other'
}

export enum SeverityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Solution and Resources
export interface SolutionResource extends BaseEntity {
  title: string;
  description: string;
  resourceType: ResourceType;
  content?: string;
  url?: string;
  filePath?: string;
  tags: string[];
  isActive: boolean;
  createdBy: string;
  painPoints: PainPoint[];
}

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
  ARTICLE = 'article',
  FAQ = 'faq',
  TUTORIAL = 'tutorial',
  CONTACT = 'contact',
  OTHER = 'other'
}

export interface ProblemSolutionMapping extends BaseEntity {
  callId: string;
  painPointId: string;
  solutionResourceId: string;
  call: Call;
  painPoint: PainPoint;
  solutionResource: SolutionResource;
  relevanceScore: number;
  isEffective?: boolean;
  feedback?: string;
}

// Action Items and Tasks
export interface ActionItem extends BaseEntity {
  callId: string;
  call: Call;
  title: string;
  description: string;
  assigneeId: string;
  assignee: User;
  priority: Priority;
  status: ActionItemStatus;
  dueDate?: Date;
  completedAt?: Date;
  notes?: string;
  category: ActionItemCategory;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export enum ActionItemCategory {
  FOLLOW_UP = 'follow_up',
  RESEARCH = 'research',
  DOCUMENTATION = 'documentation',
  TRAINING = 'training',
  ESCALATION = 'escalation',
  COMMUNICATION = 'communication',
  OTHER = 'other'
}

// Sentiment Analysis
export interface SentimentSegment extends BaseEntity {
  callId: string;
  call: Call;
  startTime: number; // seconds into call
  endTime: number; // seconds into call
  sentiment: SentimentType;
  confidence: number;
  text?: string;
  speaker?: string;
  emotions: EmotionScore[];
}

export enum SentimentType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

export interface EmotionScore {
  emotion: EmotionType;
  score: number; // 0-1
}

export enum EmotionType {
  JOY = 'joy',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  ANTICIPATION = 'anticipation',
  TRUST = 'trust'
}

// Notifications
export interface Notification extends BaseEntity {
  userId: string;
  user: User;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export enum NotificationType {
  ACTION_ITEM_ASSIGNED = 'action_item_assigned',
  ACTION_ITEM_DUE = 'action_item_due',
  ACTION_ITEM_OVERDUE = 'action_item_overdue',
  CALL_ANALYZED = 'call_analyzed',
  QBR_READY = 'qbr_ready',
  SYSTEM = 'system',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// QBR (Quarterly Business Review)
export interface QBRDraft extends BaseEntity {
  distributorId: string;
  vendorId: string;
  distributor: Distributor;
  vendor: Vendor;
  quarter: number;
  year: number;
  title: string;
  content: string;
  status: QBRStatus;
  generatedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  publishedAt?: Date;
  metrics: QBRMetrics;
  keyInsights: string[];
  actionItemsSummary: ActionItemsSummary;
}

export enum QBRStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface QBRMetrics {
  totalCalls: number;
  averageSentiment: number;
  totalPainPoints: number;
  resolvedPainPoints: number;
  totalActionItems: number;
  completedActionItems: number;
  averageCallDuration: number;
  sentimentTrend: SentimentTrendData[];
}

export interface SentimentTrendData {
  date: Date;
  sentiment: number;
  callCount: number;
}

export interface ActionItemsSummary {
  totalCreated: number;
  totalCompleted: number;
  completionRate: number;
  averageCompletionTime: number; // in days
  byCategory: Record<ActionItemCategory, number>;
  byPriority: Record<Priority, number>;
}

// Dashboard and Analytics
export interface DashboardMetrics {
  totalCalls: number;
  totalPainPoints: number;
  totalActionItems: number;
  pendingActionItems: number;
  averageSentiment: number;
  sentimentTrend: SentimentTrendData[];
  painPointsByCategory: Record<PainPointCategory, number>;
  actionItemsByStatus: Record<ActionItemStatus, number>;
  recentCalls: Call[];
  upcomingDueTasks: ActionItem[];
}

// Chart and Visualization Data
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Filter and Search Types
export interface CallFilters {
  distributorId?: string;
  vendorId?: string;
  startDate?: Date;
  endDate?: Date;
  sentiment?: SentimentType;
  minDuration?: number;
  maxDuration?: number;
  hasActionItems?: boolean;
  hasPainPoints?: boolean;
}

export interface ActionItemFilters {
  assigneeId?: string;
  status?: ActionItemStatus;
  priority?: Priority;
  category?: ActionItemCategory;
  dueDate?: Date;
  overdue?: boolean;
}

export interface PainPointFilters {
  category?: PainPointCategory;
  severity?: SeverityLevel;
  isResolved?: boolean;
  minConfidence?: number;
}

// UI Component Props Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  badge?: number;
  children?: MenuItem[];
}

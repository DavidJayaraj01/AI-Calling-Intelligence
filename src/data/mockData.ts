/**
 * Mock data for the AI Call Intelligence Platform
 * Used for testing and development purposes
 */

import type {
  User,
  Distributor,
  Vendor,
  Call,
  PainPoint,
  SolutionResource,
  ActionItem,
  SentimentSegment,
  Notification,
  QBRDraft,
  DashboardMetrics,
  ChartDataPoint,
  TimeSeriesDataPoint,
} from '../types';

import {
  UserRole,
  PainPointCategory,
  SeverityLevel,
  ResourceType,
  Priority,
  ActionItemStatus,
  ActionItemCategory,
  SentimentType,
  EmotionType,
  NotificationType,
  QBRStatus,
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@platform.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    email: 'john.doe@distributor1.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.DISTRIBUTOR_ADMIN,
    distributorId: 'dist-1',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    email: 'jane.smith@vendor1.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.VENDOR_USER,
    vendorId: 'vendor-1',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '4',
    email: 'mike.wilson@distributor1.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    role: UserRole.DISTRIBUTOR_USER,
    distributorId: 'dist-1',
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

// Mock Distributors
export const mockDistributors: Distributor[] = [
  {
    id: 'dist-1',
    name: 'TechFlow Distribution',
    contactEmail: 'contact@techflow.com',
    contactPhone: '+1-555-0123',
    address: '123 Business Ave, Tech City, TC 12345',
    isActive: true,
    vendors: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'dist-2',
    name: 'Global Supply Partners',
    contactEmail: 'info@globalsupply.com',
    contactPhone: '+1-555-0456',
    address: '456 Commerce St, Business Park, BP 67890',
    isActive: true,
    vendors: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

// Mock Vendors
export const mockVendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'InnoTech Solutions',
    contactEmail: 'support@innotech.com',
    contactPhone: '+1-555-0789',
    address: '789 Innovation Blvd, Tech Hub, TH 11111',
    distributorId: 'dist-1',
    distributor: mockDistributors[0],
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'vendor-2',
    name: 'Smart Systems Corp',
    contactEmail: 'hello@smartsystems.com',
    contactPhone: '+1-555-0321',
    address: '321 Smart Way, Digital City, DC 22222',
    distributorId: 'dist-1',
    distributor: mockDistributors[0],
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

// Mock Solution Resources
export const mockSolutionResources: SolutionResource[] = [
  {
    id: 'resource-1',
    title: 'Product Integration Guide',
    description: 'Comprehensive guide for integrating our product with existing systems',
    resourceType: ResourceType.DOCUMENT,
    content: 'Detailed integration steps and best practices...',
    tags: ['integration', 'technical', 'setup'],
    isActive: true,
    createdBy: '1',
    painPoints: [],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'resource-2',
    title: 'Pricing FAQ',
    description: 'Frequently asked questions about pricing and billing',
    resourceType: ResourceType.FAQ,
    url: 'https://help.platform.com/pricing-faq',
    tags: ['pricing', 'billing', 'faq'],
    isActive: true,
    createdBy: '2',
    painPoints: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'resource-3',
    title: 'Training Video: Advanced Features',
    description: 'Video tutorial covering advanced product features',
    resourceType: ResourceType.VIDEO,
    url: 'https://videos.platform.com/advanced-features',
    tags: ['training', 'video', 'advanced'],
    isActive: true,
    createdBy: '1',
    painPoints: [],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
];

// Mock Pain Points
export const mockPainPoints: PainPoint[] = [
  {
    id: 'pain-1',
    callId: 'call-1',
    call: {} as Call, // Will be populated later
    description: 'Customer experiencing slow response times during peak hours',
    category: PainPointCategory.TECHNICAL,
    severity: SeverityLevel.HIGH,
    extractedAt: new Date('2024-09-20T10:30:00'),
    startTime: 180,
    endTime: 240,
    confidence: 0.92,
    isResolved: false,
    solutionResources: [mockSolutionResources[0]],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: 'pain-2',
    callId: 'call-1',
    call: {} as Call,
    description: 'Confusion about pricing tiers and what each includes',
    category: PainPointCategory.PRICING,
    severity: SeverityLevel.MEDIUM,
    extractedAt: new Date('2024-09-20T10:35:00'),
    startTime: 420,
    endTime: 480,
    confidence: 0.87,
    isResolved: true,
    solutionResources: [mockSolutionResources[1]],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-22'),
  },
];

// Mock Sentiment Segments
export const mockSentimentSegments: SentimentSegment[] = [
  {
    id: 'segment-1',
    callId: 'call-1',
    call: {} as Call,
    startTime: 0,
    endTime: 120,
    sentiment: SentimentType.NEUTRAL,
    confidence: 0.85,
    text: 'Initial greeting and agenda setting',
    speaker: 'Customer',
    emotions: [
      { emotion: EmotionType.TRUST, score: 0.7 },
      { emotion: EmotionType.ANTICIPATION, score: 0.6 },
    ],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: 'segment-2',
    callId: 'call-1',
    call: {} as Call,
    startTime: 120,
    endTime: 300,
    sentiment: SentimentType.NEGATIVE,
    confidence: 0.78,
    text: 'Discussion about performance issues',
    speaker: 'Customer',
    emotions: [
      { emotion: EmotionType.ANGER, score: 0.6 },
      { emotion: EmotionType.ANGER, score: 0.8 },
    ],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: 'segment-3',
    callId: 'call-1',
    call: {} as Call,
    startTime: 300,
    endTime: 600,
    sentiment: SentimentType.POSITIVE,
    confidence: 0.82,
    text: 'Resolution discussion and next steps',
    speaker: 'Both',
    emotions: [
      { emotion: EmotionType.JOY, score: 0.7 },
      { emotion: EmotionType.TRUST, score: 0.8 },
    ],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-20'),
  },
];

// Mock Action Items
export const mockActionItems: ActionItem[] = [
  {
    id: 'action-1',
    callId: 'call-1',
    call: {} as Call,
    title: 'Investigate performance optimization options',
    description: 'Research and propose solutions for improving response times during peak hours',
    assigneeId: '3',
    assignee: mockUsers[2],
    priority: Priority.HIGH,
    status: ActionItemStatus.IN_PROGRESS,
    dueDate: new Date('2024-10-01'),
    category: ActionItemCategory.RESEARCH,
    notes: 'Customer specifically mentioned slowdowns between 2-4 PM EST',
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-22'),
  },
  {
    id: 'action-2',
    callId: 'call-1',
    call: {} as Call,
    title: 'Send pricing comparison document',
    description: 'Create and send detailed pricing tier comparison to help customer understand options',
    assigneeId: '2',
    assignee: mockUsers[1],
    priority: Priority.MEDIUM,
    status: ActionItemStatus.COMPLETED,
    dueDate: new Date('2024-09-25'),
    completedAt: new Date('2024-09-22'),
    category: ActionItemCategory.DOCUMENTATION,
    notes: 'Document sent via email on 09/22',
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-22'),
  },
  {
    id: 'action-3',
    callId: 'call-2',
    call: {} as Call,
    title: 'Schedule training session',
    description: 'Set up product training session for customer team',
    assigneeId: '4',
    assignee: mockUsers[3],
    priority: Priority.MEDIUM,
    status: ActionItemStatus.PENDING,
    dueDate: new Date('2024-09-30'),
    category: ActionItemCategory.TRAINING,
    createdAt: new Date('2024-09-21'),
    updatedAt: new Date('2024-09-21'),
  },
  {
    id: 'action-4',
    callId: 'call-3',
    call: {} as Call,
    title: 'Follow up on integration issues',
    description: 'Check with customer on integration progress and address any blockers',
    assigneeId: '3',
    assignee: mockUsers[2],
    priority: Priority.URGENT,
    status: ActionItemStatus.OVERDUE,
    dueDate: new Date('2024-09-18'),
    category: ActionItemCategory.FOLLOW_UP,
    notes: 'Customer had technical difficulties during last call',
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-09-15'),
  },
];

// Mock Calls
export const mockCalls: Call[] = [
  {
    id: 'call-1',
    distributorId: 'dist-1',
    vendorId: 'vendor-1',
    distributor: mockDistributors[0],
    vendor: mockVendors[0],
    transcript: 'Customer: Hi, I wanted to discuss some performance issues we\'ve been experiencing...\n\nSupport: Thank you for reaching out. Can you describe the specific issues you\'re seeing?\n\nCustomer: During peak hours, particularly between 2-4 PM, our system response times are significantly slower. It\'s affecting our productivity.\n\nSupport: I understand your concern. Let me help you with this. Have you noticed any patterns or specific operations that are slower?\n\nCustomer: Yes, mainly the data processing and report generation features. Also, I wanted to clarify our pricing tier - what exactly is included in our current plan?\n\nSupport: Let me address both issues. For the performance, I\'ll have our technical team investigate optimization options. Regarding pricing, I\'ll send you a detailed comparison of all tiers...',
    duration: 600, // 10 minutes
    callDate: new Date('2024-09-20T10:00:00'),
    participants: ['John Doe (Distributor)', 'Jane Smith (Vendor)', 'Customer Representative'],
    overallSentiment: SentimentType.MIXED,
    confidenceScore: 0.84,
    painPoints: mockPainPoints,
    actionItems: [mockActionItems[0], mockActionItems[1]],
    sentimentSegments: mockSentimentSegments,
    problemSolutionMappings: [],
    createdAt: new Date('2024-09-20'),
    updatedAt: new Date('2024-09-20'),
  },
  {
    id: 'call-2',
    distributorId: 'dist-1',
    vendorId: 'vendor-2',
    distributor: mockDistributors[0],
    vendor: mockVendors[1],
    transcript: 'Customer: We need help with implementing the new features...',
    duration: 420, // 7 minutes
    callDate: new Date('2024-09-21T14:30:00'),
    participants: ['Mike Wilson (Distributor)', 'Smart Systems Rep', 'Customer Team Lead'],
    overallSentiment: SentimentType.POSITIVE,
    confidenceScore: 0.91,
    painPoints: [],
    actionItems: [mockActionItems[2]],
    sentimentSegments: [],
    problemSolutionMappings: [],
    createdAt: new Date('2024-09-21'),
    updatedAt: new Date('2024-09-21'),
  },
  {
    id: 'call-3',
    distributorId: 'dist-1',
    vendorId: 'vendor-1',
    distributor: mockDistributors[0],
    vendor: mockVendors[0],
    transcript: 'Customer: We\'re having integration challenges...',
    duration: 480, // 8 minutes
    callDate: new Date('2024-09-15T09:15:00'),
    participants: ['John Doe (Distributor)', 'Jane Smith (Vendor)', 'Technical Lead'],
    overallSentiment: SentimentType.NEGATIVE,
    confidenceScore: 0.79,
    painPoints: [],
    actionItems: [mockActionItems[3]],
    sentimentSegments: [],
    problemSolutionMappings: [],
    createdAt: new Date('2024-09-15'),
    updatedAt: new Date('2024-09-15'),
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: '2',
    user: mockUsers[1],
    title: 'Action Item Overdue',
    message: 'Follow up on integration issues is overdue',
    type: NotificationType.ACTION_ITEM_OVERDUE,
    isRead: false,
    actionUrl: '/action-items/action-4',
    metadata: { actionItemId: 'action-4' },
    createdAt: new Date('2024-09-25T08:00:00'),
    updatedAt: new Date('2024-09-25T08:00:00'),
  },
  {
    id: 'notif-2',
    userId: '3',
    user: mockUsers[2],
    title: 'New Action Item Assigned',
    message: 'You have been assigned: Investigate performance optimization options',
    type: NotificationType.ACTION_ITEM_ASSIGNED,
    isRead: true,
    readAt: new Date('2024-09-20T15:30:00'),
    actionUrl: '/action-items/action-1',
    metadata: { actionItemId: 'action-1' },
    createdAt: new Date('2024-09-20T10:30:00'),
    updatedAt: new Date('2024-09-20T15:30:00'),
  },
  {
    id: 'notif-3',
    userId: '2',
    user: mockUsers[1],
    title: 'Call Analysis Complete',
    message: 'Analysis for call with InnoTech Solutions is ready',
    type: NotificationType.CALL_ANALYZED,
    isRead: false,
    actionUrl: '/calls/call-1',
    metadata: { callId: 'call-1' },
    createdAt: new Date('2024-09-20T11:00:00'),
    updatedAt: new Date('2024-09-20T11:00:00'),
  },
];

// Mock QBR Draft
export const mockQBRDraft: QBRDraft = {
  id: 'qbr-1',
  distributorId: 'dist-1',
  vendorId: 'vendor-1',
  distributor: mockDistributors[0],
  vendor: mockVendors[0],
  quarter: 3,
  year: 2024,
  title: 'Q3 2024 Business Review - TechFlow & InnoTech Partnership',
  content: `
# Quarterly Business Review - Q3 2024

## Executive Summary
The partnership between TechFlow Distribution and InnoTech Solutions has shown significant growth in Q3 2024...

## Key Metrics
- Total Calls: 15
- Average Sentiment: 7.2/10
- Action Items Completion Rate: 78%
- Customer Satisfaction: 8.1/10

## Key Insights
1. Performance optimization remains a top concern for customers
2. Pricing transparency has improved customer satisfaction
3. Training sessions are highly valued by customer teams

## Action Items Summary
- 12 total action items created
- 9 completed on time
- 3 requiring follow-up in Q4

## Recommendations for Q4
1. Implement proactive performance monitoring
2. Expand training program offerings
3. Develop self-service pricing tools
  `,
  status: QBRStatus.DRAFT,
  generatedAt: new Date('2024-09-25T09:00:00'),
  metrics: {
    totalCalls: 15,
    averageSentiment: 7.2,
    totalPainPoints: 8,
    resolvedPainPoints: 6,
    totalActionItems: 12,
    completedActionItems: 9,
    averageCallDuration: 520,
    sentimentTrend: [
      { date: new Date('2024-07-01'), sentiment: 6.8, callCount: 4 },
      { date: new Date('2024-08-01'), sentiment: 7.1, callCount: 6 },
      { date: new Date('2024-09-01'), sentiment: 7.2, callCount: 5 },
    ],
  },
  keyInsights: [
    'Performance optimization remains a top concern',
    'Pricing transparency improved satisfaction',
    'Training sessions highly valued',
  ],
  actionItemsSummary: {
    totalCreated: 12,
    totalCompleted: 9,
    completionRate: 0.75,
    averageCompletionTime: 3.2,
    byCategory: {
      [ActionItemCategory.FOLLOW_UP]: 4,
      [ActionItemCategory.RESEARCH]: 3,
      [ActionItemCategory.DOCUMENTATION]: 2,
      [ActionItemCategory.TRAINING]: 2,
      [ActionItemCategory.ESCALATION]: 1,
      [ActionItemCategory.COMMUNICATION]: 0,
      [ActionItemCategory.OTHER]: 0,
    },
    byPriority: {
      [Priority.URGENT]: 1,
      [Priority.HIGH]: 3,
      [Priority.MEDIUM]: 6,
      [Priority.LOW]: 2,
    },
  },
  createdAt: new Date('2024-09-25'),
  updatedAt: new Date('2024-09-25'),
};

// Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  totalCalls: 15,
  totalPainPoints: 8,
  totalActionItems: 12,
  pendingActionItems: 3,
  averageSentiment: 7.2,
  sentimentTrend: [
    { date: new Date('2024-09-01'), sentiment: 6.8, callCount: 2 },
    { date: new Date('2024-09-08'), sentiment: 7.1, callCount: 3 },
    { date: new Date('2024-09-15'), sentiment: 6.9, callCount: 4 },
    { date: new Date('2024-09-22'), sentiment: 7.5, callCount: 6 },
  ],
  painPointsByCategory: {
    [PainPointCategory.TECHNICAL]: 3,
    [PainPointCategory.PRICING]: 2,
    [PainPointCategory.PRODUCT]: 2,
    [PainPointCategory.SERVICE]: 1,
    [PainPointCategory.DELIVERY]: 0,
    [PainPointCategory.COMMUNICATION]: 0,
    [PainPointCategory.OTHER]: 0,
  },
  actionItemsByStatus: {
    [ActionItemStatus.PENDING]: 3,
    [ActionItemStatus.IN_PROGRESS]: 2,
    [ActionItemStatus.COMPLETED]: 6,
    [ActionItemStatus.CANCELLED]: 0,
    [ActionItemStatus.OVERDUE]: 1,
  },
  recentCalls: mockCalls.slice(0, 5),
  upcomingDueTasks: mockActionItems.filter(
    item => item.status !== ActionItemStatus.COMPLETED && 
           item.dueDate && 
           item.dueDate > new Date()
  ).slice(0, 5),
};

// Mock Chart Data
export const mockPainPointCategoryData: ChartDataPoint[] = [
  { label: 'Technical', value: 3, color: '#ef4444' },
  { label: 'Pricing', value: 2, color: '#f59e0b' },
  { label: 'Product', value: 2, color: '#3b82f6' },
  { label: 'Service', value: 1, color: '#10b981' },
  { label: 'Delivery', value: 0, color: '#8b5cf6' },
];

export const mockSentimentTimelineData: TimeSeriesDataPoint[] = [
  { timestamp: new Date('2024-09-01'), value: 6.8, label: 'Week 1' },
  { timestamp: new Date('2024-09-08'), value: 7.1, label: 'Week 2' },
  { timestamp: new Date('2024-09-15'), value: 6.9, label: 'Week 3' },
  { timestamp: new Date('2024-09-22'), value: 7.5, label: 'Week 4' },
];

export const mockActionItemStatusData: ChartDataPoint[] = [
  { label: 'Completed', value: 6, color: '#10b981' },
  { label: 'Pending', value: 3, color: '#f59e0b' },
  { label: 'In Progress', value: 2, color: '#3b82f6' },
  { label: 'Overdue', value: 1, color: '#ef4444' },
];

// Helper function to get current user (for testing)
export const getCurrentUser = (): User => mockUsers[1]; // John Doe as default

// Helper function to get unread notifications count
export const getUnreadNotificationsCount = (userId: string): number => {
  return mockNotifications.filter(n => n.userId === userId && !n.isRead).length;
};

// Helper function to get recent activity
export const getRecentActivity = () => {
  return [
    {
      id: '1',
      type: 'call',
      title: 'New call analyzed',
      description: 'Call with InnoTech Solutions - 2 pain points identified',
      timestamp: new Date('2024-09-25T10:30:00'),
      icon: '📞',
    },
    {
      id: '2',
      type: 'action_item',
      title: 'Action item completed',
      description: 'Send pricing comparison document',
      timestamp: new Date('2024-09-22T14:15:00'),
      icon: '✅',
    },
    {
      id: '3',
      type: 'qbr',
      title: 'QBR draft generated',
      description: 'Q3 2024 review ready for review',
      timestamp: new Date('2024-09-25T09:00:00'),
      icon: '📊',
    },
  ];
};

/**
 * API Service for AI Call Intelligence Frontend
 * Handles all backend communication including local model endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface Call {
  call_id: number;
  distributor_id: number;
  vendor_id: number;
  seed_brief: string;
  transcript: string;
  created_at: string;
  metadata_json?: Record<string, any>;
}

export interface CallDetail extends Call {
  pain_points: PainPoint[];
  action_items: ActionItem[];
  sentiment_segments: SentimentSegment[];
}

export interface PainPoint {
  painpoint_id: number;
  call_id: number;
  description: string;
  vector_embedding?: number[];
  created_at: string;
}

export interface ActionItem {
  action_id: number;
  call_id: number;
  description: string;
  owner_id?: number;
  due_date?: string;
  status: string;
  created_at: string;
}

export interface SentimentSegment {
  segment_id: number;
  call_id: number;
  start_time: number;
  end_time: number;
  sentiment: string;
  confidence: number;
  speaker?: string;
  transcript_excerpt?: string;
}

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
  model_used: string;
  segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  distributor_id?: string;
  vendor_id?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  distributor_id?: string;
  vendor_id?: string;
}

export interface DashboardMetrics {
  total_calls: number;
  total_pain_points: number;
  total_action_items: number;
  pending_action_items: number;
  average_sentiment: number;
  sentiment_trend: Array<{
    date: string;
    sentiment: number;
    call_count: number;
  }>;
  pain_points_by_category: Record<string, number>;
  action_items_by_status: Record<string, number>;
}

class APIService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Demo mode - no token required
    // if (this.token) {
    //   headers.append('Authorization', `Bearer ${this.token}`);
    // }

    return headers;
  }

  private getFormHeaders(): Headers {
    const headers = new Headers();

    // Demo mode - no token required
    // if (this.token) {
    //   headers.append('Authorization', `Bearer ${this.token}`);
    // }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string): Promise<Token> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    const result = await this.handleResponse<Token>(response);
    this.token = result.access_token;
    localStorage.setItem('authToken', this.token);
    return result;
  }

  async register(userData: UserCreate): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    return this.handleResponse<User>(response);
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/api/auth/me`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  // Calls
  async getCalls(params?: {
    page?: number;
    limit?: number;
    distributor_id?: string;
    vendor_id?: string;
    start_date?: string;
    end_date?: string;
    sentiment?: string;
  }): Promise<PaginatedResponse<Call>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/api/calls/?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<Call>>(response);
  }

  async getCallDetail(callId: string): Promise<CallDetail> {
    const response = await fetch(`${this.baseURL}/api/calls/${callId}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<CallDetail>(response);
  }

  async createCall(callData: {
    distributor_id: string;
    vendor_id: string;
    seed_brief: string;
    transcript: string;
    metadata_json?: Record<string, any>;
  }): Promise<Call> {
    const response = await fetch(`${this.baseURL}/api/calls/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(callData),
    });

    return this.handleResponse<Call>(response);
  }

  async processCall(callData: {
    distributor_id: number;
    vendor_id: number;
    seed_brief?: string;
    transcript: string;
    metadata?: Record<string, any>;
  }): Promise<APIResponse> {
    const response = await fetch(`${this.baseURL}/api/calls/process`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(callData),
    });

    return this.handleResponse<APIResponse>(response);
  }

  async deleteCall(callId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/api/calls/${callId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ message: string }>(response);
  }

  // Speech-to-Text (Local Model)
  async transcribeAudio(audioFile: File, language: string = 'en'): Promise<APIResponse<TranscriptionResult>> {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('language', language);

    const response = await fetch(`${this.baseURL}/api/calls/transcribe`, {
      method: 'POST',
      headers: this.getFormHeaders(),
      body: formData,
    });

    return this.handleResponse<APIResponse<TranscriptionResult>>(response);
  }

  async getSupportedLanguages(): Promise<APIResponse<Record<string, string>>> {
    const response = await fetch(`${this.baseURL}/api/calls/supported-languages`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<Record<string, string>>>(response);
  }

  // Action Items
  async getActionItems(params?: {
    page?: number;
    limit?: number;
    call_id?: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
  }): Promise<PaginatedResponse<ActionItem>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/api/action-items/?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<ActionItem>>(response);
  }

  async updateActionItem(actionItemId: string, updates: Partial<ActionItem>): Promise<ActionItem> {
    const response = await fetch(`${this.baseURL}/api/action-items/${actionItemId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });

    return this.handleResponse<ActionItem>(response);
  }

  async deleteActionItem(actionItemId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/api/action-items/${actionItemId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ message: string }>(response);
  }

  async completeActionItem(actionItemId: string): Promise<ActionItem> {
    const response = await fetch(`${this.baseURL}/api/action-items/${actionItemId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<ActionItem>(response);
  }

  // Dashboard Analytics
  async getDashboardData(): Promise<DashboardMetrics> {
    const response = await fetch(`${this.baseURL}/api/dashboard`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<DashboardMetrics>(response);
  }

  // Sentiment Analysis
  async getSentimentSegments(callId: string): Promise<SentimentSegment[]> {
    const response = await fetch(`${this.baseURL}/api/calls/${callId}/sentiment-segments`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<SentimentSegment[]>(response);
  }

  async getSentimentTrend(params?: {
    start_date?: string;
    end_date?: string;
    distributor_id?: string;
    vendor_id?: string;
  }): Promise<Array<{
    date: string;
    sentiment: number;
    call_count: number;
  }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/api/analytics/sentiment-trend?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Array<{
      date: string;
      sentiment: number;
      call_count: number;
    }>>(response);
  }

  // Email Notifications
  async sendEmailNotification(data: {
    actionItemId: string;
    recipientEmail: string;
    type: 'overdue_reminder' | 'due_reminder' | 'assignment';
    subject?: string;
    message?: string;
  }): Promise<APIResponse<{ message: string; emailId: string }>> {
    const response = await fetch(`${this.baseURL}/api/notifications/email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<APIResponse<{ message: string; emailId: string }>>(response);
  }

  async getEmailNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    recipientEmail: string;
    subject: string;
    type: string;
    status: string;
    sentAt: string;
    actionItemId?: string;
  }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/api/notifications/email?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<PaginatedResponse<{
      id: string;
      recipientEmail: string;
      subject: string;
      type: string;
      status: string;
      sentAt: string;
      actionItemId?: string;
    }>>(response);
  }

  // Model Health Check
  async checkModelHealth(): Promise<APIResponse<{
    roberta_model: boolean;
    sentiment_model: boolean;
    vector_model: boolean;
    stt_model: boolean;
  }>> {
    const response = await fetch(`${this.baseURL}/api/health/models`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  // System Health Check
  async checkSystemHealth(): Promise<APIResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/health/system`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  // Database Health Check
  async checkDatabaseHealth(): Promise<APIResponse<any>> {
    const response = await fetch(`${this.baseURL}/api/health/database`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  // Model Testing
  async testModels(): Promise<APIResponse<{
    overall_status: string;
    models_tested: number;
    results: Record<string, any>;
    test_transcript: string;
  }>> {
    const response = await fetch(`${this.baseURL}/api/models/test-models`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  async processRealData(transcript: string): Promise<APIResponse<{
    call_id: string;
    pain_points_count: number;
    action_items_count: number;
    sentiment_segments_count: number;
    overall_sentiment: string;
    results: Record<string, any>;
  }>> {
    const response = await fetch(`${this.baseURL}/api/models/process-real-data`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ transcript }),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  async getModelStatus(): Promise<APIResponse<{
    overall_status: string;
    models: Record<string, {
      loaded: boolean;
      model_type: string;
    }>;
  }>> {
    const response = await fetch(`${this.baseURL}/api/models/model-status`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  // Real-time Recording
  async startRecording(metadata?: Record<string, any>): Promise<APIResponse<{
    session_id: string;
    status: string;
    started_at: string;
  }>> {
    const response = await fetch(`${this.baseURL}/api/recording/start-recording`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ metadata }),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  async uploadAudioChunk(sessionId: string, audioBlob: Blob): Promise<APIResponse<{
    session_id: string;
    text: string;
    is_partial: boolean;
    timestamp: number;
    sentiment?: {
      sentiment: string;
      confidence: number;
      emotions?: Record<string, number>;
      start_time: number;
      end_time: number;
      text: string;
    };
  }>> {
    const formData = new FormData();
    formData.append('audio_chunk', audioBlob);

    const response = await fetch(`${this.baseURL}/api/recording/upload-chunk/${sessionId}`, {
      method: 'POST',
      headers: this.getFormHeaders(),
      body: formData,
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  async stopRecording(sessionId: string): Promise<APIResponse<{
    session_id: string;
    call_id: string;
    transcript: string;
    duration: number;
    segments_count: number;
    segments: Array<{
      start_time: number;
      end_time: number;
      text: string;
      chunk_index: number;
    }>;
  }>> {
    const response = await fetch(`${this.baseURL}/api/recording/stop-recording/${sessionId}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  async getRecordingStatus(sessionId: string): Promise<APIResponse<{
    session_id: string;
    status: string;
    duration: number;
    chunks_processed: number;
    segments_count: number;
    metadata: Record<string, any>;
  }>> {
    const response = await fetch(`${this.baseURL}/api/recording/recording-status/${sessionId}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  async getActiveRecordings(): Promise<APIResponse<{
    active_sessions: Array<{
      session_id: string;
      status: string;
      duration: number;
      chunks_processed: number;
      segments_count: number;
      metadata: Record<string, any>;
    }>;
    count: number;
  }>> {
    const response = await fetch(`${this.baseURL}/api/recording/active-recordings`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<APIResponse<any>>(response);
  }

  // Get WebSocket URL for real-time recording
  getRecordingWebSocketURL(sessionId: string): string {
    const wsProtocol = this.baseURL.startsWith('https') ? 'wss' : 'ws';
    const wsBaseURL = this.baseURL.replace('http://', '').replace('https://', '');
    return `${wsProtocol}://${wsBaseURL}/api/recording/ws/recording/${sessionId}`;
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;

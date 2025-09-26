/**
 * API service for connecting to the FastAPI backend
 */
import type { 
  Call, 
  ActionItem, 
  User, 
  DashboardMetrics,
  PaginatedResponse,
  ApiResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    
    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }): Promise<User> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/auth/me');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
  }

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await this.request<any>('/dashboard');
    
    // Transform snake_case API response to camelCase for frontend
    return {
      totalCalls: response.total_calls,
      totalPainPoints: response.total_pain_points,
      totalActionItems: response.total_action_items,
      pendingActionItems: response.pending_action_items,
      averageSentiment: response.average_sentiment,
      sentimentTrend: response.sentiment_trend?.map((item: any) => ({
        date: new Date(item.date),
        sentiment: item.sentiment,
        callCount: item.call_count
      })) || [],
      painPointsByCategory: response.pain_points_by_category || {},
      actionItemsByStatus: response.action_items_by_status || {},
      recentCalls: [],
      upcomingDueTasks: []
    };
  }

  // Calls
  async getCalls(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<Call>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/calls?${params.toString()}`);
  }

  async getCall(callId: string): Promise<Call> {
    return this.request(`/calls/${callId}`);
  }

  async createCall(callData: {
    distributor_id: string;
    vendor_id: string;
    transcript: string;
    seed_brief?: string;
    metadata_json?: any;
  }): Promise<Call> {
    return this.request('/calls', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async processCall(callData: {
    transcript: string;
    distributor_id: string;
    vendor_id: string;
    seed_brief?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> {
    return this.request('/calls/process', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  async deleteCall(callId: string): Promise<{ message: string }> {
    return this.request(`/calls/${callId}`, {
      method: 'DELETE',
    });
  }

  // Action Items
  async getActionItems(page = 1, limit = 10, filters?: any): Promise<PaginatedResponse<ActionItem>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/action-items?${params.toString()}`);
  }

  async getActionItem(actionItemId: string): Promise<ActionItem> {
    return this.request(`/action-items/${actionItemId}`);
  }

  async createActionItem(actionItemData: {
    call_id: string;
    title: string;
    description: string;
    assignee_id: string;
    priority: string;
    category: string;
    due_date?: string;
    notes?: string;
  }): Promise<ActionItem> {
    return this.request('/action-items', {
      method: 'POST',
      body: JSON.stringify(actionItemData),
    });
  }

  async updateActionItem(
    actionItemId: string, 
    updates: Partial<ActionItem>
  ): Promise<ActionItem> {
    return this.request(`/action-items/${actionItemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteActionItem(actionItemId: string): Promise<{ message: string }> {
    return this.request(`/action-items/${actionItemId}`, {
      method: 'DELETE',
    });
  }

  async completeActionItem(actionItemId: string): Promise<ActionItem> {
    return this.request(`/action-items/${actionItemId}/complete`, {
      method: 'POST',
    });
  }

  async getActionItemsByCall(callId: string): Promise<ActionItem[]> {
    return this.request(`/action-items/call/${callId}`);
  }

  async getActionItemsByAssignee(userId: string): Promise<ActionItem[]> {
    return this.request(`/action-items/assignee/${userId}`);
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: number; version: string }> {
    return fetch(`${this.baseURL.replace('/api', '')}/health`).then(res => res.json());
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;

/**
 * Dashboard Page
 * Main dashboard showing key metrics, recent activity, and overview charts
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, AlertTriangle, CheckCircle, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SentimentLineChart, CategoryPieChart, StatusBarChart } from '../components/ui/Charts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  mockDashboardMetrics, 
  mockPainPointCategoryData, 
  mockSentimentTimelineData, 
  mockActionItemStatusData,
  getRecentActivity 
} from '../data/mockData';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import type { DashboardMetrics } from '../types';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockDashboardMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recentActivity = getRecentActivity();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always try to fetch from API first (dashboard endpoint is public)
        try {
          const dashboardData = await apiService.getDashboardMetrics();
          setMetrics(dashboardData);
          console.log('✅ Dashboard data loaded from API:', dashboardData);
        } catch (apiError) {
          console.warn('API call failed, using mock data:', apiError);
          // Fallback to mock data if API fails
          setMetrics(mockDashboardMetrics);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
        // Final fallback to mock data on error
        setMetrics(mockDashboardMetrics);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Stats cards data
  const stats = [
    {
      title: 'Total Calls',
      value: metrics.totalCalls,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Phone,
    },
    {
      title: 'Pain Points',
      value: metrics.totalPainPoints,
      change: '-8%',
      changeType: 'positive' as const,
      icon: AlertTriangle,
    },
    {
      title: 'Action Items',
      value: metrics.totalActionItems,
      change: '+23%',
      changeType: 'neutral' as const,
      icon: CheckCircle,
    },
    {
      title: 'Avg. Sentiment',
      value: metrics.averageSentiment.toFixed(1),
      change: '+0.3',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <p className="text-error-600 mb-2">Error loading dashboard</p>
          <p className="text-secondary-500 text-sm">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">
            Welcome back! Here's what's happening with your calls today.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={<Calendar className="h-4 w-4" />}>
            This Month
          </Button>
          <Button icon={<Users className="h-4 w-4" />}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Badge
                  variant={stat.changeType === 'positive' ? 'success' : 'secondary'}
                  size="sm"
                >
                  {stat.change}
                </Badge>
                <span className="ml-2 text-sm text-secondary-600">
                  from last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sentiment Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentLineChart data={mockSentimentTimelineData} height={250} />
          </CardContent>
        </Card>

        {/* Pain Points by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Pain Points by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={mockPainPointCategoryData} height={250} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Action Items Status */}
        <Card>
          <CardHeader>
            <CardTitle>Action Items Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart data={mockActionItemStatusData} height={200} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Link to="/calls">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100">
                    <span className="text-sm">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {activity.description}
                    </p>
                    <p className="text-xs text-secondary-400 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/calls" className="block">
              <div className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                <Phone className="h-8 w-8 text-primary-600 mb-2" />
                <h3 className="font-medium text-secondary-900">View All Calls</h3>
                <p className="text-sm text-secondary-600">Browse call history and analysis</p>
              </div>
            </Link>
            
            <Link to="/action-items" className="block">
              <div className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                <CheckCircle className="h-8 w-8 text-success-600 mb-2" />
                <h3 className="font-medium text-secondary-900">Action Items</h3>
                <p className="text-sm text-secondary-600">Manage tasks and follow-ups</p>
              </div>
            </Link>
            
            <Link to="/sentiment" className="block">
              <div className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                <TrendingUp className="h-8 w-8 text-warning-600 mb-2" />
                <h3 className="font-medium text-secondary-900">Sentiment Analysis</h3>
                <p className="text-sm text-secondary-600">Analyze call sentiment trends</p>
              </div>
            </Link>
            
            <Link to="/qbr" className="block">
              <div className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                <Users className="h-8 w-8 text-secondary-600 mb-2" />
                <h3 className="font-medium text-secondary-900">QBR Reports</h3>
                <p className="text-sm text-secondary-600">Generate quarterly reviews</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

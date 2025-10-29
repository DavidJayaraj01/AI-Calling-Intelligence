/**
 * Dashboard Page
 * Main dashboard showing key metrics, recent activity, and overview charts
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, AlertTriangle, CheckCircle, Users, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SentimentLineChart, CategoryPieChart, StatusBarChart } from '../components/ui/Charts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { apiService, type DashboardMetrics } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDashboardData();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mock recent activity for now
  const recentActivity = [
    {
      id: '1',
      title: 'New call processed',
      description: 'Call with Vendor ABC completed analysis',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      icon: '📞'
    },
    {
      id: '2',
      title: 'Action item completed',
      description: 'Follow up with customer completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      icon: '✅'
    },
    {
      id: '3',
      title: 'Pain point identified',
      description: 'Technical issue flagged in recent call',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      icon: '⚠️'
    }
  ];

  // Stats cards data
  const stats = metrics ? [
    {
      title: 'Total Calls',
      value: metrics.total_calls,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Phone,
    },
    {
      title: 'Pain Points',
      value: metrics.total_pain_points,
      change: '-8%',
      changeType: 'positive' as const,
      icon: AlertTriangle,
    },
    {
      title: 'Action Items',
      value: metrics.total_action_items,
      change: '+23%',
      changeType: 'neutral' as const,
      icon: CheckCircle,
    },
    {
      title: 'Avg. Sentiment',
      value: metrics.average_sentiment.toFixed(1),
      change: '+0.3',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
  ] : [];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: '#ef4444',
      pricing: '#f59e0b',
      product: '#3b82f6',
      service: '#10b981',
      delivery: '#8b5cf6',
      communication: '#06b6d4',
      other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      cancelled: '#6b7280',
      overdue: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-800 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>
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
            {metrics?.sentiment_trend ? (
              <SentimentLineChart 
                data={metrics.sentiment_trend.map(item => ({
                  timestamp: new Date(item.date),
                  value: item.sentiment,
                  label: new Date(item.date).toLocaleDateString()
                }))} 
                height={250} 
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-secondary-500">
                No sentiment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pain Points by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Pain Points by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.pain_points_by_category ? (
              <CategoryPieChart 
                data={Object.entries(metrics.pain_points_by_category).map(([key, value]) => ({ 
                  label: key, 
                  value,
                  color: getCategoryColor(key)
                }))} 
                height={250} 
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-secondary-500">
                No pain point data available
              </div>
            )}
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
            {metrics?.action_items_by_status ? (
              <StatusBarChart 
                data={Object.entries(metrics.action_items_by_status).map(([key, value]) => ({ 
                  label: key, 
                  value,
                  color: getStatusColor(key)
                }))} 
                height={200} 
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-secondary-500">
                No action item data available
              </div>
            )}
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

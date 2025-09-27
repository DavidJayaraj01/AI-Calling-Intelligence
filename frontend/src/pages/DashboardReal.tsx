/**
 * Dashboard Page - REAL DATA ONLY
 * NO MOCK DATA - Everything comes from actual OpenAI call analysis stored in database
 * Real-time metrics, sentiment analysis, and insights from actual call transcriptions
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, AlertTriangle, CheckCircle, Calendar, RefreshCw, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CategoryPieChart, StatusBarChart } from '../components/ui/Charts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import api from '../services/api';  // Use the updated api service
import type { RealDashboardAnalytics } from '../types/realData';
import { Link } from 'react-router-dom';

const RealDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<RealDashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Load real dashboard data
  const loadRealDashboardData = async () => {
    try {
      setError(null);
      
      // Get real analytics from database
      const analyticsResponse = await api.getDashboardAnalytics();
      
      if (!analyticsResponse.success || !analyticsResponse.data) {
        throw new Error(analyticsResponse.error || 'Failed to load dashboard analytics');
      }

      setAnalytics(analyticsResponse.data as RealDashboardAnalytics);

      // Get recent calls from database
      const callsResponse = await api.getCalls({ limit: 10 });
      
      if (callsResponse.success && callsResponse.data) {
        // Recent calls are available in analytics.recent_calls
        console.log('Recent calls loaded:', callsResponse.data.length);
      }

      setLastUpdated(new Date().toLocaleString());
      
    } catch (error) {
      console.error('Dashboard loading error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRealDashboardData();
  };

  // Load data on component mount
  useEffect(() => {
    loadRealDashboardData();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Loading Real Dashboard Data</h2>
            <p className="mt-2 text-gray-600">Fetching analytics from actual call analysis database...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-red-900">Error Loading Dashboard</h2>
            <p className="mt-2 text-red-600">{error}</p>
            <Button onClick={handleRefresh} className="mt-4 bg-blue-600 text-white">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No Call Data Available</h2>
            <p className="mt-2 text-gray-600">Upload and analyze your first call to see dashboard metrics.</p>
            <Link to="/call-analysis">
              <Button className="mt-4 bg-blue-600 text-white">
                Analyze Your First Call
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare chart data from real analytics
  const sentimentChartData = Object.entries(analytics.sentiment_distribution).map(([label, value]) => ({
    label,
    value,
    color: label === 'positive' ? '#10B981' : label === 'negative' ? '#EF4444' : label === 'mixed' ? '#F59E0B' : '#6B7280'
  }));

  const painPointsChartData = analytics.pain_point_categories.map((cat, index) => ({
    label: cat.category,
    value: cat.count,
    color: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'][index % 5]
  }));

  const actionItemsChartData = analytics.action_item_priorities.map((pri, index) => ({
    label: pri.priority,
    value: pri.count,
    color: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'][index % 4]
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real-Time Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Analytics from {analytics.overview.total_calls} actual call transcriptions and AI analysis
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm text-blue-600">
              <span>🤖 Data Source: {analytics.data_source}</span>
              <span>📊 Generated: {new Date(analytics.generated_at).toLocaleString()}</span>
              {lastUpdated && <span>🔄 Last Updated: {lastUpdated}</span>}
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </>
            )}
          </Button>
        </div>

        {/* Real Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Calls Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.total_calls}</p>
                  <p className="text-sm text-green-600">
                    +{analytics.overview.calls_last_7_days} this week
                  </p>
                </div>
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pain Points Detected</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.total_pain_points}</p>
                  <p className="text-sm text-gray-600">By AI Analysis</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Action Items Generated</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.overview.total_action_items}</p>
                  <p className="text-sm text-gray-600">By AI Recommendations</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg AI Confidence</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(analytics.overview.avg_sentiment_confidence * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Analysis Quality</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Real Sentiment Distribution</CardTitle>
              <p className="text-sm text-gray-600">From OpenAI analysis of {analytics.overview.total_calls} calls</p>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={sentimentChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pain Point Categories</CardTitle>
              <p className="text-sm text-gray-600">AI-extracted and categorized issues</p>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={painPointsChartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Item Priorities</CardTitle>
              <p className="text-sm text-gray-600">AI-assessed urgency levels</p>
            </CardHeader>
            <CardContent>
              <StatusBarChart data={actionItemsChartData} />
            </CardContent>
          </Card>
        </div>

        {/* Real Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Call Analysis</CardTitle>
              <p className="text-sm text-gray-600">Latest AI-processed calls</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recent_calls.length > 0 ? (
                  analytics.recent_calls.slice(0, 5).map((call) => (
                    <div key={call.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{call.title}</h4>
                          <Badge className={getSentimentColor(call.sentiment)}>
                            {call.sentiment.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {call.pain_points} pain points • {call.action_items} action items
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Link to={`/calls/${call.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent calls available</p>
                )}
              </div>
              <div className="mt-4 text-center">
                <Link to="/calls">
                  <Button variant="outline">View All Calls</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <p className="text-sm text-gray-600">Call volume and analysis trends</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthly_trends.length > 0 ? (
                  analytics.monthly_trends.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {new Date(trend.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {trend.calls} calls analyzed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">{trend.pain_points} pain points</p>
                        <p className="text-sm font-medium text-green-600">{trend.action_items} action items</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No trend data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-gray-600">Manage your real call analysis data</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/call-analysis">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Phone className="mr-2 h-4 w-4" />
                  Analyze New Call
                </Button>
              </Link>
              <Link to="/action-items">
                <Button variant="outline" className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Manage Action Items
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('/api/calls/analytics/dashboard', '_blank')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Export Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealDashboard;
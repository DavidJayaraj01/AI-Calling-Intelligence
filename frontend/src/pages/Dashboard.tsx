/**
 * Dashboard Page
 * Main dashboard showing key metrics, recent activity, and overview charts
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, AlertTriangle, CheckCircle, Users, Calendar, Play } from 'lucide-react';
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
import api from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState(mockDashboardMetrics);
  const [recentActivity, setRecentActivity] = useState(getRecentActivity());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [isGeneratingQBR, setIsGeneratingQBR] = useState(false);
  const [timeFilter, setTimeFilter] = useState('This Month');

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleTimeFilter = (filter: string) => {
    setTimeFilter(filter);
    setProcessingMessage(`📊 Loading ${filter.toLowerCase()} data...`);
    
    setTimeout(() => {
      // Simulate data filtering
      const multiplier = filter === 'This Month' ? 1 : filter === 'This Week' ? 0.7 : 0.3;
      const filteredMetrics = {
        ...mockDashboardMetrics,
        totalCalls: Math.floor(mockDashboardMetrics.totalCalls * multiplier),
        totalPainPoints: Math.floor(mockDashboardMetrics.totalPainPoints * multiplier),
        totalActionItems: Math.floor(mockDashboardMetrics.totalActionItems * multiplier),
        averageSentiment: mockDashboardMetrics.averageSentiment,
      };
      setMetrics(filteredMetrics);
      setProcessingMessage(`✅ ${filter} data loaded successfully!`);
      
      setTimeout(() => setProcessingMessage(''), 3000);
    }, 1500);
  };

  const handleGenerateQBR = async () => {
    setIsGeneratingQBR(true);
    setProcessingMessage('🚀 Generating QBR report with AI analysis...');
    
    try {
      // Simulate QBR generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setProcessingMessage('✅ QBR report generated successfully! Redirecting to QBR page...');
      
      setTimeout(() => {
        window.location.href = '/qbr';
      }, 2000);
      
    } catch (error) {
      setProcessingMessage('❌ Failed to generate QBR report. Please try again.');
    } finally {
      setIsGeneratingQBR(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // In a real app, you would load from API
      // const response = await api.dashboard.getMetrics();
      // if (response.success) {
      //   setMetrics(response.data);
      // }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleDemoCall = async () => {
    setIsProcessing(true);
    setProcessingMessage('Processing sample call with OpenAI...');
    
    try {
      const response = await api.demo.processSampleCall();
      
      if (response.success) {
        setProcessingMessage('✅ Call analyzed successfully! Pain points and action items generated.');
        
        // Update metrics to show new analysis
        setMetrics(prev => ({
          ...prev,
          totalCalls: prev.totalCalls + 1,
          totalPainPoints: prev.totalPainPoints + 3,
          totalActionItems: prev.totalActionItems + 3,
        }));

        // Add to recent activity
        const newActivity = {
          id: `activity_${Date.now()}`,
          type: 'call_analyzed',
          title: 'AI Call Analysis Complete',
          description: 'AI analyzed sample call and found 3 pain points',
          timestamp: new Date(),
          icon: '🤖'
        };
        
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
        
        setTimeout(() => {
          setProcessingMessage('');
        }, 3000);
      } else {
        setProcessingMessage('❌ Error processing call: Failed to analyze');
      }
    } catch (error) {
      setProcessingMessage('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Stats cards data
  const stats = [
    {
      title: 'Total Calls Analyzed',
      value: metrics.totalCalls,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Phone,
      description: 'Calls processed by AI'
    },
    {
      title: 'Pain Points Identified',
      value: metrics.totalPainPoints,
      change: '-8%',
      changeType: 'positive' as const,
      icon: AlertTriangle,
      description: 'Issues detected by OpenAI'
    },
    {
      title: 'Action Items Generated',
      value: metrics.totalActionItems,
      change: '+23%',
      changeType: 'neutral' as const,
      icon: CheckCircle,
      description: 'AI-generated follow-ups'
    },
    {
      title: 'Avg. Sentiment Score',
      value: metrics.averageSentiment.toFixed(1),
      change: '+0.3',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'Overall call sentiment'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Call Intelligence Dashboard</h1>
          <p className="text-secondary-600">
            Real-time insights from your vendor-distributor conversations powered by OpenAI
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            icon={<Play className="h-4 w-4" />}
            onClick={handleDemoCall}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Demo AI Analysis'}
          </Button>
          <Button 
            variant="outline" 
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => handleTimeFilter(timeFilter === 'This Month' ? 'This Week' : 'This Month')}
          >
            {timeFilter}
          </Button>
          <Button 
            icon={<Users className="h-4 w-4" />}
            onClick={handleGenerateQBR}
            disabled={isGeneratingQBR}
          >
            {isGeneratingQBR ? 'Generating...' : 'Generate QBR'}
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {processingMessage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium">{processingMessage}</p>
        </div>
      )}

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
                  <p className="text-xs text-secondary-500 mt-1">
                    {stat.description}
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
            <CardTitle>AI Sentiment Analysis Timeline</CardTitle>
            <p className="text-sm text-secondary-600 mt-1">
              Real-time sentiment tracking powered by OpenAI's advanced language models
            </p>
          </CardHeader>
          <CardContent>
            <SentimentLineChart data={mockSentimentTimelineData} height={250} />
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-secondary-500">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Positive sentiment trending up
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                AI confidence: 94%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pain Points by Category */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Detected Pain Point Categories</CardTitle>
            <p className="text-sm text-secondary-600 mt-1">
              Automated categorization using natural language processing
            </p>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={mockPainPointCategoryData} height={250} />
            <div className="mt-4 text-xs text-secondary-500">
              <p>Categories automatically identified by OpenAI analysis of call transcripts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Action Items Status */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Generated Action Items</CardTitle>
            <p className="text-sm text-secondary-600 mt-1">
              Intelligent follow-up tasks created by OpenAI
            </p>
          </CardHeader>
          <CardContent>
            <StatusBarChart data={mockActionItemStatusData} height={200} />
            <div className="mt-4 text-xs text-secondary-500">
              <p>Automatically prioritized based on urgency and impact analysis</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent AI Analysis Activity</CardTitle>
                <p className="text-sm text-secondary-600 mt-1">
                  Latest AI-powered insights from your calls
                </p>
              </div>
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

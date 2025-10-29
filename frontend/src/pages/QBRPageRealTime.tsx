/**
 * QBR (Quarterly Business Review) Page with Real-Time Data
 * Displays comprehensive sentiment analysis and business metrics
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface QBRData {
  overview: {
    title: string;
    subtitle: string;
    partnership: string;
    period: {
      start: string;
      end: string;
      quarter: number;
      year: number;
    };
    total_calls: number;
    status: string;
    completion_rate: number;
  };
  executive_summary: {
    summary: string;
    key_metrics: {
      total_calls: number;
      avg_sentiment_score: number;
      total_pain_points: number;
      resolved_pain_points: number;
      resolution_rate: number;
    };
  };
  call_metrics: {
    total_calls: number;
    avg_sentiment: number;
    sentiment_trend: string;
    pain_points: {
      total: number;
      resolved: number;
      pending: number;
      resolution_rate: number;
    };
    action_items: {
      total: number;
      completed: number;
      pending: number;
      completion_rate: number;
    };
  };
  sentiment_analysis: {
    trend_data: Array<{
      date: string;
      sentiment: number;
      call_count: number;
    }>;
    overall_average: number;
    sentiment_distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    total_segments_analyzed: number;
  };
  pain_point_analysis: {
    by_category: Record<string, number>;
    by_severity: Record<string, number>;
    top_pain_points: Array<{
      description: string;
      category: string;
      severity: string;
      occurrences: number;
    }>;
    total_pain_points: number;
  };
  action_items_summary: {
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    overdue: number;
    completion_rate: number;
  };
  recommendations: Array<{
    priority: string;
    category: string;
    title: string;
    description: string;
    action: string;
  }>;
}

const QBRPage: React.FC = () => {
  const [qbrData, setQbrData] = useState<QBRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuarter] = useState(3);
  const [selectedYear] = useState(2024);

  useEffect(() => {
    loadQBRData();
  }, [selectedQuarter, selectedYear]);

  const loadQBRData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/qbr/generate?quarter=${selectedQuarter}&year=${selectedYear}`
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        setQbrData(result.data);
      }
    } catch (error) {
      console.error('Error loading QBR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadQBRData();
    setRefreshing(false);
  };

  const exportPDF = () => {
    // Implement PDF export
    console.log('Exporting PDF...');
  };

  const shareReport = () => {
    // Implement share functionality
    console.log('Sharing report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Generating QBR Report...</span>
      </div>
    );
  }

  if (!qbrData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const COLORS = {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280',
    primary: '#3B82F6',
    warning: '#F59E0B',
    success: '#10B981',
  };

  const sentimentDistributionData = [
    { name: 'Positive', value: qbrData.sentiment_analysis.sentiment_distribution.positive, color: COLORS.positive },
    { name: 'Neutral', value: qbrData.sentiment_analysis.sentiment_distribution.neutral, color: COLORS.neutral },
    { name: 'Negative', value: qbrData.sentiment_analysis.sentiment_distribution.negative, color: COLORS.negative },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {qbrData.overview.title}
          </h1>
          <p className="text-gray-600 mt-1">{qbrData.overview.subtitle}</p>
          <p className="text-sm text-gray-500 mt-1">
            {qbrData.overview.partnership}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={refreshData}
            variant="outline"
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={shareReport}
            variant="outline"
            className="flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={exportPDF}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* QBR Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              QBR Overview
            </span>
            <Badge variant="secondary">{qbrData.overview.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {qbrData.overview.period.quarter}
              </div>
              <div className="text-sm text-gray-600 mt-1">Quarter</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {qbrData.overview.period.year}
              </div>
              <div className="text-sm text-gray-600 mt-1">Year</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {new Date(qbrData.overview.period.start).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-sm text-gray-600 mt-1">Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {qbrData.overview.completion_rate}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-6">
            {qbrData.executive_summary.summary}
          </p>

          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Calls</div>
                    <div className="text-3xl font-bold text-blue-600 mt-1">
                      {qbrData.executive_summary.key_metrics.total_calls}
                    </div>
                  </div>
                  <Calendar className="w-10 h-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Avg Sentiment</div>
                    <div className="text-3xl font-bold text-green-600 mt-1">
                      {qbrData.executive_summary.key_metrics.avg_sentiment_score}/10
                    </div>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Pain Points</div>
                    <div className="text-3xl font-bold text-yellow-600 mt-1">
                      {qbrData.executive_summary.key_metrics.resolved_pain_points}/
                      {qbrData.executive_summary.key_metrics.total_pain_points}
                    </div>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Action Items</div>
                    <div className="text-3xl font-bold text-purple-600 mt-1">
                      {qbrData.call_metrics.action_items.completed}/
                      {qbrData.call_metrics.action_items.total}
                    </div>
                  </div>
                  <CheckCircle className="w-10 h-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Analysis */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Sentiment Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={qbrData.sentiment_analysis.trend_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={sentimentDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Action Items by Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Action Items by Priority
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(qbrData.action_items_summary.by_priority).map(([name, value]) => ({ name, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={COLORS.primary} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Pain Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Top Pain Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {qbrData.pain_point_analysis.top_pain_points.slice(0, 5).map((painPoint, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {painPoint.description.substring(0, 100)}...
                  </p>
                  <div className="flex items-center mt-1 space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {painPoint.category}
                    </Badge>
                    <Badge 
                      variant={
                        painPoint.severity === 'high' || painPoint.severity === 'critical' 
                          ? 'error' 
                          : 'warning'
                      } 
                      className="text-xs"
                    >
                      {painPoint.severity}
                    </Badge>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {painPoint.occurrences}
                  </div>
                  <div className="text-xs text-gray-500">occurrences</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qbrData.recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <Badge 
                    variant={
                      rec.priority === 'URGENT' ? 'error' :
                      rec.priority === 'HIGH' ? 'warning' :
                      'secondary'
                    }
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                <p className="text-sm text-blue-600 font-medium">
                  Action: {rec.action}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QBRPage;

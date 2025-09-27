/**
 * Sentiment Timeline Page
 * Visualizes sentiment analysis data from calls with interactive charts
 */

import React, { useState } from 'react';
import { TrendingUp, Calendar, BarChart3, LineChart, PieChart, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SentimentLineChart, CategoryPieChart } from '../components/ui/Charts';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { mockCalls, mockSentimentTimelineData } from '../data/mockData';
import { SentimentType } from '../types';

const SentimentTimelinePage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [viewMode, setViewMode] = useState<'timeline' | 'calls' | 'insights'>('timeline');

  // Calculate sentiment statistics
  const sentimentStats = {
    total: mockCalls.length,
    positive: mockCalls.filter(call => call.overallSentiment === SentimentType.POSITIVE).length,
    negative: mockCalls.filter(call => call.overallSentiment === SentimentType.NEGATIVE).length,
    neutral: mockCalls.filter(call => call.overallSentiment === SentimentType.NEUTRAL).length,
    mixed: mockCalls.filter(call => call.overallSentiment === SentimentType.MIXED).length,
  };

  const sentimentPercentages = {
    positive: Math.round((sentimentStats.positive / sentimentStats.total) * 100),
    negative: Math.round((sentimentStats.negative / sentimentStats.total) * 100),
    neutral: Math.round((sentimentStats.neutral / sentimentStats.total) * 100),
    mixed: Math.round((sentimentStats.mixed / sentimentStats.total) * 100),
  };

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case SentimentType.POSITIVE: return 'success';
      case SentimentType.NEGATIVE: return 'error';
      case SentimentType.MIXED: return 'warning';
      default: return 'secondary';
    }
  };

  const handleTimeFilterChange = (filter: string) => {
    setTimeFilter(filter);
  };

  const recentCalls = mockCalls.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Sentiment Timeline</h1>
          <p className="text-secondary-600">
            Track emotional patterns and sentiment trends from your vendor-distributor calls
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant={timeFilter === 'This Week' ? 'primary' : 'outline'}
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => handleTimeFilterChange('This Week')}
          >
            This Week
          </Button>
          <Button 
            variant={timeFilter === 'This Month' ? 'primary' : 'outline'}
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => handleTimeFilterChange('This Month')}
          >
            This Month
          </Button>
          <Button 
            variant={timeFilter === 'This Quarter' ? 'primary' : 'outline'}
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => handleTimeFilterChange('This Quarter')}
          >
            This Quarter
          </Button>
        </div>
      </div>

      {/* View Mode Selector */}
      <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'timeline' ? 'primary' : 'outline'}
              icon={<LineChart className="h-4 w-4" />}
              onClick={() => setViewMode('timeline')}
            >
              Timeline View
            </Button>
            <Button
              variant={viewMode === 'calls' ? 'primary' : 'outline'}
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => setViewMode('calls')}
            >
              Call Analysis
            </Button>
            <Button
              variant={viewMode === 'insights' ? 'primary' : 'outline'}
              icon={<Brain className="h-4 w-4" />}
              onClick={() => setViewMode('insights')}
            >
              AI Insights
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Positive Sentiment</p>
                <p className="text-2xl font-bold text-success-700">{sentimentPercentages.positive}%</p>
                <p className="text-xs text-secondary-500">{sentimentStats.positive} calls</p>
              </div>
              <div className="h-12 w-12 bg-success-100 rounded-full flex items-center justify-center">
                <span className="text-success-600 text-xl">😊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Negative Sentiment</p>
                <p className="text-2xl font-bold text-error-700">{sentimentPercentages.negative}%</p>
                <p className="text-xs text-secondary-500">{sentimentStats.negative} calls</p>
              </div>
              <div className="h-12 w-12 bg-error-100 rounded-full flex items-center justify-center">
                <span className="text-error-600 text-xl">😞</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Mixed Sentiment</p>
                <p className="text-2xl font-bold text-warning-700">{sentimentPercentages.mixed}%</p>
                <p className="text-xs text-secondary-500">{sentimentStats.mixed} calls</p>
              </div>
              <div className="h-12 w-12 bg-warning-100 rounded-full flex items-center justify-center">
                <span className="text-warning-600 text-xl">😐</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Neutral Sentiment</p>
                <p className="text-2xl font-bold text-secondary-700">{sentimentPercentages.neutral}%</p>
                <p className="text-xs text-secondary-500">{sentimentStats.neutral} calls</p>
              </div>
              <div className="h-12 w-12 bg-secondary-100 rounded-full flex items-center justify-center">
                <span className="text-secondary-600 text-xl">😶</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sentiment Timeline ({timeFilter})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <SentimentLineChart data={mockSentimentTimelineData} />
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Sentiment Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <CategoryPieChart data={[
                  { label: 'Positive', value: sentimentStats.positive },
                  { label: 'Negative', value: sentimentStats.negative },
                  { label: 'Mixed', value: sentimentStats.mixed },
                  { label: 'Neutral', value: sentimentStats.neutral }
                ]} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'calls' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Call Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div key={call.id} className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-secondary-900">
                        {call.distributor.name} ↔ {call.vendor.name}
                      </h4>
                      <p className="text-sm text-secondary-600">
                        {new Date(call.callDate).toLocaleDateString()} • {Math.floor(call.duration / 60)} min
                      </p>
                    </div>
                    <Badge variant={getSentimentColor(call.overallSentiment)} size="lg">
                      {call.overallSentiment}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div className="text-sm">
                      <span className="font-medium text-secondary-700">Pain Points: </span>
                      <span className="text-secondary-600">{call.painPoints.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-secondary-700">Action Items: </span>
                      <span className="text-secondary-600">{call.actionItems.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-secondary-700">Confidence: </span>
                      <span className="text-secondary-600">{Math.round(call.confidenceScore * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Insights */}
          <Card className="border-primary-200 bg-primary-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-900">
                <Brain className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-secondary-900 mb-2">📈 Trend Analysis</h4>
                <ul className="text-sm space-y-1 text-secondary-600">
                  <li>• Sentiment has improved 12% over the last month</li>
                  <li>• Tuesday calls show consistently higher satisfaction</li>
                  <li>• Morning calls (9-11 AM) have 23% better sentiment</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-secondary-900 mb-2">🎯 Recommendations</h4>
                <ul className="text-sm space-y-1 text-secondary-600">
                  <li>• Focus on pricing discussions during high-sentiment periods</li>
                  <li>• Address delivery concerns proactively</li>
                  <li>• Schedule follow-ups within 24 hours of negative calls</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Drivers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Sentiment Drivers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <span className="font-medium text-success-900">Product Quality</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-success-200 rounded-full h-2">
                      <div className="bg-success-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-success-700 text-sm">+85%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <span className="font-medium text-success-900">Customer Service</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-success-200 rounded-full h-2">
                      <div className="bg-success-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                    <span className="text-success-700 text-sm">+72%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                  <span className="font-medium text-error-900">Pricing Concerns</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-error-200 rounded-full h-2">
                      <div className="bg-error-600 h-2 rounded-full" style={{ width: '63%' }}></div>
                    </div>
                    <span className="text-error-700 text-sm">-63%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                  <span className="font-medium text-error-900">Delivery Issues</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-error-200 rounded-full h-2">
                      <div className="bg-error-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-error-700 text-sm">-45%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SentimentTimelinePage;
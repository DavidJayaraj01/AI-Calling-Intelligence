/**
 * Call Detail Page
 * Shows detailed view of a specific call including transcript, pain points, and action items
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckSquare,
  MessageSquare,
  TrendingUp,
  Download,
  Share
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SentimentLineChart } from '../components/ui/Charts';
import { mockCalls, mockUsers } from '../data/mockData';
import type { SentimentSegment } from '../types';

const CallDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const call = mockCalls.find(c => c.id === id);

  if (!call) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-medium text-secondary-900">Call not found</h2>
          <p className="text-secondary-600">The requested call could not be found.</p>
          <Link to="/calls" className="mt-4 inline-block">
            <Button>Back to Calls</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'mixed': return 'warning';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'overdue': return 'error';
      default: return 'secondary';
    }
  };

  // Transform sentiment segments for chart
  const sentimentChartData = call.sentimentSegments.map((segment: SentimentSegment, index: number) => ({
    timestamp: new Date(Date.now() + index * 60000),
    value: segment.sentiment === 'positive' ? 8 : segment.sentiment === 'negative' ? 3 : 5,
    label: `Segment ${index + 1}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/calls">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Call Details</h1>
            <p className="text-secondary-600">
              {call.distributor.name} • {call.vendor.name}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="outline" icon={<Share className="h-4 w-4" />}>
            Share
          </Button>
        </div>
      </div>

      {/* Call Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Call Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-sm font-medium">Date & Time</p>
                  <p className="text-sm text-secondary-600">{formatDate(call.callDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-secondary-600">{formatDuration(call.duration)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-sm font-medium">Participants</p>
                  <p className="text-sm text-secondary-600">{call.participants.length} people</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-secondary-400" />
                <div>
                  <p className="text-sm font-medium">Overall Sentiment</p>
                  <Badge variant={getSentimentColor(call.overallSentiment)} size="sm">
                    {call.overallSentiment}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Participants</p>
              <div className="space-y-2">
                {call.participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-secondary-600">{participant}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning-700">{call.painPoints.length}</p>
              <p className="text-sm text-warning-600">Pain Points</p>
            </div>
            
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <CheckSquare className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-primary-700">{call.actionItems.length}</p>
              <p className="text-sm text-primary-600">Action Items</p>
            </div>
            
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-success-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-success-700">{(call.confidenceScore * 100).toFixed(0)}%</p>
              <p className="text-sm text-success-600">Confidence Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Timeline */}
      {call.sentimentSegments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Throughout Call</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentLineChart data={sentimentChartData} height={250} />
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Call Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary-50 rounded-lg p-6">
            <div className="whitespace-pre-wrap text-sm text-secondary-700 leading-relaxed">
              {call.transcript}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pain Points and Action Items */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pain Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <span>Pain Points Identified</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {call.painPoints.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-8">
                No pain points identified in this call
              </p>
            ) : (
              <div className="space-y-4">
                {call.painPoints.map((painPoint) => (
                  <div key={painPoint.id} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="warning" size="sm">
                        {painPoint.category}
                      </Badge>
                      <Badge variant="error" size="sm">
                        {painPoint.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-secondary-900 mb-2">{painPoint.description}</p>
                    <div className="flex items-center justify-between text-xs text-secondary-500">
                      <span>Confidence: {(painPoint.confidence * 100).toFixed(0)}%</span>
                      <span>
                        {painPoint.startTime && painPoint.endTime && 
                          `${Math.floor(painPoint.startTime / 60)}:${(painPoint.startTime % 60).toString().padStart(2, '0')} - ${Math.floor(painPoint.endTime / 60)}:${(painPoint.endTime % 60).toString().padStart(2, '0')}`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-primary-600" />
              <span>Action Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {call.actionItems.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-8">
                No action items created for this call
              </p>
            ) : (
              <div className="space-y-4">
                {call.actionItems.map((actionItem) => {
                  const assignee = mockUsers.find(u => u.id === actionItem.assigneeId);
                  return (
                    <div key={actionItem.id} className="border border-secondary-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={getPriorityColor(actionItem.priority)} size="sm">
                          {actionItem.priority}
                        </Badge>
                        <Badge variant={getStatusColor(actionItem.status)} size="sm">
                          {actionItem.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-medium text-secondary-900 mb-1">
                        {actionItem.title}
                      </h4>
                      <p className="text-sm text-secondary-600 mb-2">{actionItem.description}</p>
                      <div className="flex items-center justify-between text-xs text-secondary-500">
                        <span>Assigned to: {assignee?.firstName} {assignee?.lastName}</span>
                        {actionItem.dueDate && (
                          <span>Due: {new Intl.DateTimeFormat('en-US').format(actionItem.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallDetailPage;

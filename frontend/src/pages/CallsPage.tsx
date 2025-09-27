/**
 * Calls Page
 * Lists all calls with AI analysis results and filtering capabilities
 */

import React, { useState } from 'react';
import { Phone, Search, Filter, Eye, Calendar, Clock, Users, Upload, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { mockCalls } from '../data/mockData';
import type { Call, TableColumn } from '../types';
import { SentimentType, PainPointCategory, SeverityLevel } from '../types';
import { Link } from 'react-router-dom';

const CallsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCalls, setFilteredCalls] = useState(mockCalls);
  const [isUploading, setIsUploading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const handleUploadCall = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Simulate call upload and processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create new call entry
      const newCall: Call = {
        id: `call-${Date.now()}`,
        distributorId: mockCalls[0].distributorId,
        vendorId: mockCalls[0].vendorId,
        distributor: mockCalls[0].distributor,
        vendor: mockCalls[0].vendor,
        callDate: new Date(),
        duration: Math.floor(Math.random() * 3600) + 600, // 10-60 minutes
        participants: ['John Doe', 'Jane Smith'],
        transcript: `[Uploaded from ${file.name}]\n\nThis is a newly uploaded call transcript that has been processed through AI analysis...`,
        overallSentiment: SentimentType.MIXED,
        confidenceScore: 0.78,
        painPoints: [
          {
            id: `pp-${Date.now()}`,
            callId: `call-${Date.now()}`,
            call: {} as Call,
            description: 'Pricing concerns identified from uploaded call',
            category: PainPointCategory.PRICING,
            severity: SeverityLevel.MEDIUM,
            extractedAt: new Date(),
            confidence: 0.85,
            isResolved: false,
            solutionResources: [],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        actionItems: [],
        sentimentSegments: [],
        problemSolutionMappings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setFilteredCalls(prev => [newCall, ...prev]);
      alert(`✅ Call uploaded and analyzed successfully!\n\n📊 AI Analysis Complete:\n• 1 Pain point detected\n• Sentiment: Mixed\n• Key topics identified`);
      
    } catch (error) {
      alert('❌ Failed to upload call. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleViewInsights = () => {
    setShowInsights(!showInsights);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'mixed': return 'warning';
      default: return 'secondary';
    }
  };

  const columns: TableColumn<Call>[] = [
    {
      key: 'callDate',
      label: 'Date & Time',
      render: (value: Date) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-secondary-400" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: 'distributor',
      label: 'Distributor',
      render: (value: any) => (
        <div>
          <p className="font-medium">{value.name}</p>
          <p className="text-xs text-secondary-500">{value.contactEmail}</p>
        </div>
      ),
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (value: any) => (
        <div>
          <p className="font-medium">{value.name}</p>
          <p className="text-xs text-secondary-500">{value.contactEmail}</p>
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-secondary-400" />
          <span>{formatDuration(value)}</span>
        </div>
      ),
    },
    {
      key: 'participants',
      label: 'Participants',
      render: (value: string[]) => (
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4 text-secondary-400" />
          <span>{value.length}</span>
        </div>
      ),
    },
    {
      key: 'overallSentiment',
      label: 'Sentiment',
      render: (value: string) => (
        <Badge variant={getSentimentColor(value)} size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: 'painPoints',
      label: 'Pain Points',
      render: (value: any[]) => (
        <Badge variant={value.length > 0 ? 'warning' : 'secondary'} size="sm">
          {value.length}
        </Badge>
      ),
    },
    {
      key: 'actionItems',
      label: 'Action Items',
      render: (value: any[]) => (
        <Badge variant={value.length > 0 ? 'info' : 'secondary'} size="sm">
          {value.length}
        </Badge>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string) => (
        <Link to={`/calls/${value}`}>
          <Button variant="outline" size="sm" icon={<Eye className="h-4 w-4" />}>
            View
          </Button>
        </Link>
      ),
    },
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredCalls(mockCalls);
      return;
    }

    const filtered = mockCalls.filter(call =>
      call.distributor.name.toLowerCase().includes(term.toLowerCase()) ||
      call.vendor.name.toLowerCase().includes(term.toLowerCase()) ||
      call.transcript.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCalls(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI-Analyzed Call History</h1>
          <p className="text-secondary-600">
            View all calls with OpenAI-powered sentiment analysis, pain point detection, and automated insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            icon={<Brain className="h-4 w-4" />}
            onClick={handleViewInsights}
          >
            {showInsights ? 'Hide AI Insights' : 'View AI Insights'}
          </Button>
          <div className="relative">
            <input
              type="file"
              accept="audio/*,.txt,.docx"
              onChange={handleUploadCall}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button 
              icon={<Upload className="h-4 w-4" />}
              disabled={isUploading}
            >
              {isUploading ? 'Processing...' : 'Upload New Call'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Calls</p>
                <p className="text-2xl font-bold text-secondary-900">{mockCalls.length}</p>
              </div>
              <Phone className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Avg Duration</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {formatDuration(Math.round(mockCalls.reduce((acc, call) => acc + call.duration, 0) / mockCalls.length))}
                </p>
              </div>
              <Clock className="h-8 w-8 text-secondary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pain Points</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {mockCalls.reduce((acc, call) => acc + call.painPoints.length, 0)}
                </p>
              </div>
              <div className="h-8 w-8 text-warning-600">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Action Items</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {mockCalls.reduce((acc, call) => acc + call.actionItems.length, 0)}
                </p>
              </div>
              <div className="h-8 w-8 text-success-600">✅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      {showInsights && (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary-900">
              <Brain className="h-5 w-5" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-secondary-900 mb-2">🔥 Top Pain Points</h4>
                <ul className="text-sm space-y-1">
                  <li>• Pricing concerns (67% of calls)</li>
                  <li>• Product delivery delays (45% of calls)</li>
                  <li>• Technical support issues (32% of calls)</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-secondary-900 mb-2">📊 Sentiment Trends</h4>
                <ul className="text-sm space-y-1">
                  <li>• Overall sentiment: <Badge variant="warning" size="sm">Mixed</Badge></li>
                  <li>• Positive calls: 34%</li>
                  <li>• Negative calls: 28%</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-secondary-900 mb-2">🎯 Recommended Actions</h4>
                <ul className="text-sm space-y-1">
                  <li>• Schedule pricing review meetings</li>
                  <li>• Improve delivery communication</li>
                  <li>• Enhance technical documentation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Call Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="h-4 w-4 text-secondary-400" />}
              />
            </div>
            <Button variant="outline" icon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
          </div>

          <Table
            data={filteredCalls}
            columns={columns}
            onRowClick={(call) => console.log('View call:', call.id)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CallsPage;

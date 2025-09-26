/**
 * Calls Page
 * Lists all calls with filtering and search capabilities
 */

import React, { useState } from 'react';
import { Phone, Search, Filter, Eye, Calendar, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { mockCalls } from '../data/mockData';
import type { Call, TableColumn } from '../types';
import { Link } from 'react-router-dom';

const CallsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCalls, setFilteredCalls] = useState(mockCalls);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Call History</h1>
          <p className="text-secondary-600">
            View and analyze all recorded calls and their insights
          </p>
        </div>
        <Button icon={<Phone className="h-4 w-4" />}>
          Add New Call
        </Button>
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

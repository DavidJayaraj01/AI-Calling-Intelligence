/**
 * Calls Page
 * Lists all calls with filtering and search capabilities
 */

import React, { useState, useEffect } from 'react';
import { Phone, Search, Filter, Eye, Calendar, Clock, Users, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import CreateCallModal from '../components/modals/CreateCallModal';
import { apiService, type Call, type PaginatedResponse } from '../services/api';
import { Link } from 'react-router-dom';

const CallsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [calls, setCalls] = useState<Call[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load calls from API
  useEffect(() => {
    loadCalls();
  }, [pagination.page]);

  const loadCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCalls({
        page: pagination.page,
        limit: pagination.limit
      });
      
      setCalls(response.items);
      setFilteredCalls(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        hasNext: response.has_next,
        hasPrev: response.has_prev
      }));
    } catch (err) {
      console.error('Error loading calls:', err);
      setError('Failed to load calls. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const columns = [
    {
      key: 'created_at',
      label: 'Date & Time',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-secondary-400" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: 'distributor_id',
      label: 'Distributor ID',
      render: (value: string) => (
        <div>
          <p className="font-medium">{value}</p>
        </div>
      ),
    },
    {
      key: 'vendor_id',
      label: 'Vendor ID',
      render: (value: string) => (
        <div>
          <p className="font-medium">{value}</p>
        </div>
      ),
    },
    {
      key: 'seed_brief',
      label: 'Brief',
      render: (value: string) => (
        <div className="max-w-xs truncate">
          <p className="text-sm">{value}</p>
        </div>
      ),
    },
    {
      key: 'overall_sentiment',
      label: 'Sentiment',
      render: (value: string) => (
        <Badge variant={getSentimentColor(value || 'neutral')} size="sm">
          {value || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'confidence_score',
      label: 'Confidence',
      render: (value: number) => (
        <div className="text-sm">
          {value ? `${(value * 100).toFixed(1)}%` : 'N/A'}
        </div>
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
      setFilteredCalls(calls);
      return;
    }

    const filtered = calls.filter(call =>
      call.distributor_id.toLowerCase().includes(term.toLowerCase()) ||
      call.vendor_id.toLowerCase().includes(term.toLowerCase()) ||
      call.seed_brief.toLowerCase().includes(term.toLowerCase()) ||
      call.transcript.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredCalls(filtered);
  };

  const handleCallCreated = async (newCallData: any) => {
    console.log('New call created:', newCallData);
    // Refresh the calls list from the API
    await loadCalls();
    setIsCreateModalOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
        <Button 
          icon={<Phone className="h-4 w-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
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
                <p className="text-2xl font-bold text-secondary-900">{pagination.total}</p>
              </div>
              <Phone className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Current Page</p>
                <p className="text-2xl font-bold text-secondary-900">{pagination.page}</p>
              </div>
              <Clock className="h-8 w-8 text-secondary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Items per Page</p>
                <p className="text-2xl font-bold text-secondary-900">{pagination.limit}</p>
              </div>
              <div className="h-8 w-8 text-warning-600">📄</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Status</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {loading ? 'Loading...' : 'Ready'}
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

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadCalls}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-secondary-600">Loading calls...</span>
            </div>
          ) : (
            <>
              <Table
                data={filteredCalls}
                columns={columns}
                onRowClick={(call) => console.log('View call:', call.id)}
              />
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-secondary-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} calls
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Call Modal */}
      <CreateCallModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCallCreated={handleCallCreated}
      />
    </div>
  );
};

export default CallsPage;

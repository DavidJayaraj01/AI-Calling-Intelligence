/**
 * Action Items Page
 * Manage all action items with filtering, editing, and status updates
 */

import React, { useState, useEffect } from 'react';
import { CheckSquare, Search, Filter, Plus, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { apiService, type ActionItem, type PaginatedResponse } from '../services/api';
import { Link } from 'react-router-dom';

const ActionItemsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load action items from API
  useEffect(() => {
    loadActionItems();
  }, [pagination.page, statusFilter]);

  const loadActionItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getActionItems({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      setActionItems(response.items);
      setFilteredItems(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        hasNext: response.has_next,
        hasPrev: response.has_prev
      }));
    } catch (err) {
      console.error('Error loading action items:', err);
      setError('Failed to load action items. Please try again.');
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
    }).format(date);
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
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const isOverdue = (dueDate: string | undefined, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date() > new Date(dueDate);
  };

  const columns = [
    {
      key: 'description',
      label: 'Task',
      render: (value: string, item: ActionItem) => (
        <div>
          <p className="font-medium text-secondary-900">{value}</p>
          <p className="text-sm text-secondary-500">Action Item #{item.action_id}</p>
        </div>
      ),
    },
    {
      key: 'owner_id',
      label: 'Assignee',
      render: (value: number | undefined) => (
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100">
            <span className="text-xs font-medium text-primary-700">
              {value ? value.toString().substring(0, 2) : 'N/A'}
            </span>
          </div>
          <span className="text-sm">{value ? `User ${value}` : 'Unassigned'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string, item: ActionItem) => (
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor(value)} size="sm">
            {value.replace('_', ' ')}
          </Badge>
          {isOverdue(item.due_date, value) && (
            <AlertCircle className="h-4 w-4 text-error-500" />
          )}
        </div>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (value: string | undefined, item: ActionItem) => {
        if (!value) return <span className="text-secondary-400">No due date</span>;
        const overdue = isOverdue(value, item.status);
        return (
          <span className={overdue ? 'text-error-600 font-medium' : 'text-secondary-700'}>
            {formatDate(value)}
          </span>
        );
      },
    },
    {
      key: 'call_id',
      label: 'Related Call',
      render: (value: number) => (
        <Link to={`/calls/${value}`} className="text-primary-600 hover:text-primary-700 text-sm">
          View Call
        </Link>
      ),
    },
    {
      key: 'action_id',
      label: 'Actions',
      render: (value: number, item: ActionItem) => (
        <div className="flex space-x-2">
          {item.status !== 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCompleteItem(value.toString())}
            >
              Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const applyFilters = (search: string, status: string) => {
    let filtered = actionItems;

    if (search) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleCompleteItem = async (itemId: string) => {
    try {
      await apiService.completeActionItem(itemId);
      await loadActionItems(); // Refresh the list
    } catch (err) {
      console.error('Error completing action item:', err);
      setError('Failed to complete action item. Please try again.');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Calculate statistics
  const stats = {
    total: pagination.total,
    pending: actionItems.filter(item => item.status === 'pending').length,
    inProgress: actionItems.filter(item => item.status === 'in_progress').length,
    completed: actionItems.filter(item => item.status === 'completed').length,
    overdue: actionItems.filter(item => 
      item.status !== 'completed' && 
      item.due_date && 
      new Date() > new Date(item.due_date)
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Action Items</h1>
          <p className="text-secondary-600">
            Manage and track all action items across calls
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>
          New Action Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-secondary-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pending</p>
                <p className="text-2xl font-bold text-warning-700">{stats.pending}</p>
              </div>
              <Calendar className="h-8 w-8 text-warning-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">In Progress</p>
                <p className="text-2xl font-bold text-primary-700">{stats.inProgress}</p>
              </div>
              <User className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Completed</p>
                <p className="text-2xl font-bold text-success-700">{stats.completed}</p>
              </div>
              <div className="h-8 w-8 text-success-600">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Overdue</p>
                <p className="text-2xl font-bold text-error-700">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-error-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search action items..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="h-4 w-4 text-secondary-400" />}
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="input w-40"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <Button variant="outline" icon={<Filter className="h-4 w-4" />}>
                More Filters
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadActionItems}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-2 text-secondary-600">Loading action items...</span>
            </div>
          ) : (
            <>
              <Table
                data={filteredItems}
                columns={columns}
                emptyMessage="No action items found"
              />
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-secondary-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} action items
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overdue Items</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.overdue === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-4">
                No overdue items! Great job! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {actionItems
                  .filter(item => 
                    item.status !== 'completed' && 
                    item.due_date && 
                    new Date() > new Date(item.due_date)
                  )
                  .slice(0, 3)
                  .map((item) => (
                    <div key={item.action_id} className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-error-900">{item.description}</p>
                        <p className="text-xs text-error-600">
                          Assigned to {item.owner_id ? `User ${item.owner_id}` : 'Unassigned'}
                        </p>
                      </div>
                      <Badge variant="error" size="sm">
                        {item.due_date && Math.ceil((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems
                .filter(item => item.status === 'completed')
                .slice(0, 3)
                .map((item) => (
                    <div key={item.action_id} className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success-900">{item.description}</p>
                        <p className="text-xs text-success-600">
                          Completed by {item.owner_id ? `User ${item.owner_id}` : 'Unknown'}
                        </p>
                      </div>
                    <Badge variant="success" size="sm">
                      ✓ Done
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActionItemsPage;

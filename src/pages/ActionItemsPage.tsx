/**
 * Action Items Page
 * Manage all action items with filtering, editing, and status updates
 */

import React, { useState } from 'react';
import { CheckSquare, Search, Filter, Plus, Calendar, User, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { mockActionItems, mockUsers } from '../data/mockData';
import type { ActionItem, TableColumn } from '../types';
import { Link } from 'react-router-dom';

const ActionItemsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState(mockActionItems);

  const formatDate = (date: Date) => {
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

  const isOverdue = (dueDate: Date | undefined, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date() > dueDate;
  };

  const columns: TableColumn<ActionItem>[] = [
    {
      key: 'title',
      label: 'Task',
      render: (value: string, item: ActionItem) => (
        <div>
          <p className="font-medium text-secondary-900">{value}</p>
          <p className="text-sm text-secondary-500">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'assigneeId',
      label: 'Assignee',
      render: (value: string) => {
        const assignee = mockUsers.find(u => u.id === value);
        return assignee ? (
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100">
              <span className="text-xs font-medium text-primary-700">
                {assignee.firstName[0]}{assignee.lastName[0]}
              </span>
            </div>
            <span className="text-sm">{assignee.firstName} {assignee.lastName}</span>
          </div>
        ) : (
          <span className="text-sm text-secondary-500">Unassigned</span>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value: string) => (
        <Badge variant={getPriorityColor(value)} size="sm">
          {value}
        </Badge>
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
          {isOverdue(item.dueDate, value) && (
            <AlertCircle className="h-4 w-4 text-error-500" />
          )}
        </div>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value: Date | undefined, item: ActionItem) => {
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
      key: 'category',
      label: 'Category',
      render: (value: string) => (
        <Badge variant="secondary" size="sm">
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'callId',
      label: 'Related Call',
      render: (value: string) => (
        <Link to={`/calls/${value}`} className="text-primary-600 hover:text-primary-700 text-sm">
          View Call
        </Link>
      ),
    },
  ];

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (search: string, status: string) => {
    let filtered = mockActionItems;

    if (search) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }

    setFilteredItems(filtered);
  };

  // Calculate statistics
  const stats = {
    total: mockActionItems.length,
    pending: mockActionItems.filter(item => item.status === 'pending').length,
    inProgress: mockActionItems.filter(item => item.status === 'in_progress').length,
    completed: mockActionItems.filter(item => item.status === 'completed').length,
    overdue: mockActionItems.filter(item => 
      item.status !== 'completed' && 
      item.dueDate && 
      new Date() > item.dueDate
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

          <Table
            data={filteredItems}
            columns={columns}
            emptyMessage="No action items found"
          />
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
                {mockActionItems
                  .filter(item => 
                    item.status !== 'completed' && 
                    item.dueDate && 
                    new Date() > item.dueDate
                  )
                  .slice(0, 3)
                  .map((item) => {
                    const assignee = mockUsers.find(u => u.id === item.assigneeId);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-error-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-error-900">{item.title}</p>
                          <p className="text-xs text-error-600">
                            Assigned to {assignee?.firstName} {assignee?.lastName}
                          </p>
                        </div>
                        <Badge variant="error" size="sm">
                          {item.dueDate && Math.ceil((new Date().getTime() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                    );
                  })}
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
              {mockActionItems
                .filter(item => item.status === 'completed')
                .slice(0, 3)
                .map((item) => {
                  const assignee = mockUsers.find(u => u.id === item.assigneeId);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success-900">{item.title}</p>
                        <p className="text-xs text-success-600">
                          Completed by {assignee?.firstName} {assignee?.lastName}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">
                        ✓ Done
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActionItemsPage;

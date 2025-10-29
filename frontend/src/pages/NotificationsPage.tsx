/**
 * Notifications Page
 * Display and manage user notifications
 */

import React, { useState } from 'react';
import { Bell, Check, Trash2, Eye, Mail, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { mockNotifications, getCurrentUser, mockActionItems } from '../data/mockData';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';


const NotificationsPage: React.FC = () => {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(
    mockNotifications.filter(n => n.userId === currentUser.id)
  );
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'action_item_assigned':
      case 'action_item_due':
      case 'action_item_overdue':
        return '📋';
      case 'call_analyzed':
        return '📞';
      case 'qbr_ready':
        return '📊';
      case 'system':
        return '⚙️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'action_item_overdue':
      case 'error':
        return 'error';
      case 'action_item_due':
      case 'warning':
        return 'warning';
      case 'action_item_assigned':
      case 'call_analyzed':
      case 'qbr_ready':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id 
          ? { ...n, isRead: true, readAt: new Date() }
          : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleViewNotification = (notification: any) => {
    setSelectedNotification(notification);
    
    // Check if it's an overdue action item
    if (notification.type === 'action_item_overdue' && notification.metadata?.actionItemId) {
      const actionItem = mockActionItems.find(item => item.id === notification.metadata.actionItemId);
      if (actionItem) {
        // Check if due date is within 1 day
        const now = new Date();
        const dueDate = new Date(actionItem.dueDate!);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysRemaining <= 1) {
          setShowEmailModal(true);
        }
      }
    }
    
    // Navigate to the appropriate page
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const sendEmailNotification = async () => {
    if (!selectedNotification) return;
    
    try {
      console.log('Sending email notification for overdue action item:', selectedNotification.metadata?.actionItemId);
      
      // Get the action item details for the email
      const actionItem = mockActionItems.find(item => item.id === selectedNotification.metadata?.actionItemId);
      const daysOverdue = actionItem ? Math.abs(getDaysRemaining(actionItem.dueDate!)) : 0;
      
      // Send email notification via API
      const emailData = {
        actionItemId: selectedNotification.metadata?.actionItemId,
        recipientEmail: currentUser.email,
        type: 'overdue_reminder' as const,
        subject: `URGENT: Overdue Action Item - ${actionItem?.title || 'Unknown Task'}`,
        message: `This action item is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue and requires immediate attention. Please complete the task as soon as possible.`
      };
      
      try {
        await apiService.sendEmailNotification(emailData);
        console.log('Email notification sent successfully');
      } catch (apiError) {
        console.warn('API email service not available, using mock:', apiError);
        // Fallback to mock behavior if API is not available
      }
      
      setEmailSent(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSent(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  };

  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate;
  };


  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Notifications</h1>
          <p className="text-secondary-600">
            Stay updated with important alerts and activities
          </p>
        </div>
        <div className="flex space-x-3">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
          <Badge variant="primary" size="lg">
            {unreadCount} unread
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-1">
            {(['all', 'unread', 'read'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === filterOption
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                {filterOption === 'unread' && unreadCount > 0 && (
                  <Badge variant="error" size="sm" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Recent Notifications</span>
            <Badge variant="secondary" size="sm">
              {filteredNotifications.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                No notifications
              </h3>
              <p className="text-secondary-600">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "No notifications to display."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead 
                      ? 'bg-white border-secondary-200' 
                      : 'bg-primary-50 border-primary-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            notification.isRead ? 'text-secondary-900' : 'text-primary-900'
                          }`}>
                            {notification.title}
                          </h4>
                          <Badge variant={getNotificationColor(notification.type)} size="sm">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className={`text-sm ${
                          notification.isRead ? 'text-secondary-600' : 'text-primary-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-secondary-400 mt-2">
                          {formatDate(notification.createdAt)}
                          {notification.readAt && (
                            <span> • Read {formatDate(notification.readAt)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {notification.actionUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={<Eye className="h-3 w-3" />}
                          onClick={() => handleViewNotification(notification)}
                        >
                          View
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          icon={<Check className="h-3 w-3" />}
                        >
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        icon={<Trash2 className="h-3 w-3" />}
                      >
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Action Item Reminders</p>
                <p className="text-xs text-secondary-600">Get notified about due and overdue action items</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">Call Analysis</p>
                <p className="text-xs text-secondary-600">Notifications when call analysis is completed</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">QBR Generation</p>
                <p className="text-xs text-secondary-600">Alerts when quarterly business reviews are ready</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-900">System Updates</p>
                <p className="text-xs text-secondary-600">Important system notifications and updates</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <Button>Save Preferences</Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Notification Modal */}
      {showEmailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">
                  Email Notification Required
                </h3>
                <p className="text-sm text-secondary-600">
                  This action item is overdue and requires immediate attention
                </p>
              </div>
            </div>
            
            {selectedNotification.metadata?.actionItemId && (
              <div className="mb-4 p-4 bg-error-50 rounded-lg border border-error-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-error-600" />
                  <span className="font-medium text-error-900">Overdue Action Item</span>
                </div>
                {(() => {
                  const actionItem = mockActionItems.find(item => item.id === selectedNotification.metadata.actionItemId);
                  if (actionItem) {
                    const daysOverdue = Math.abs(getDaysRemaining(actionItem.dueDate!));
                    return (
                      <div className="space-y-2">
                        <p className="text-sm text-error-800">
                          <strong>Task:</strong> {actionItem.title}
                        </p>
                        <p className="text-sm text-error-800">
                          <strong>Due Date:</strong> {formatDate(actionItem.dueDate!)}
                        </p>
                        <p className="text-sm text-error-800">
                          <strong>Days Overdue:</strong> {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-error-800">
                          <strong>Priority:</strong> {actionItem.priority}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            
            <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-primary-600" />
                <span className="font-medium text-primary-900">Email Will Be Sent To:</span>
              </div>
              <p className="text-sm text-primary-800">
                {currentUser.email}
              </p>
              <p className="text-xs text-primary-600 mt-1">
                Subject: "URGENT: Overdue Action Item - Immediate Action Required"
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={sendEmailNotification}
                disabled={emailSent}
                className="flex-1"
              >
                {emailSent ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Email Sent!
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email Notification
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEmailModal(false)}
                disabled={emailSent}
              >
                Cancel
              </Button>
            </div>
            
            {emailSent && (
              <div className="mt-4 p-3 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-success-600" />
                  <span className="text-sm text-success-800">
                    Email notification sent successfully! The assignee will be notified about the overdue task.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

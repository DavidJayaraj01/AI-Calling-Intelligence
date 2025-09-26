/**
 * Notifications Page
 * Display and manage user notifications
 */

import React, { useState } from 'react';
import { Bell, Check, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { mockNotifications, getCurrentUser } from '../data/mockData';


const NotificationsPage: React.FC = () => {
  const currentUser = getCurrentUser();
  const [notifications, setNotifications] = useState(
    mockNotifications.filter(n => n.userId === currentUser.id)
  );
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

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
                        <Button variant="outline" size="sm" icon={<Eye className="h-3 w-3" />}>
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
    </div>
  );
};

export default NotificationsPage;

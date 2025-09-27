/**
 * Sidebar Navigation Component
 * Main navigation for the application
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Phone, 
  CheckSquare, 
  FileText, 
  Bell, 
  Settings,
  TrendingUp,
  Brain,
  TestTube
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getUnreadNotificationsCount, getCurrentUser } from '../../data/mockData';
import Badge from '../ui/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Calls', href: '/calls', icon: Phone },
  { name: 'AI Analysis', href: '/analyze', icon: Brain },
  { name: 'Model Test', href: '/model-test', icon: TestTube },
  { name: 'Action Items', href: '/action-items', icon: CheckSquare },
  { name: 'Sentiment Timeline', href: '/sentiment', icon: TrendingUp },
  { name: 'QBR', href: '/qbr', icon: FileText },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const currentUser = getCurrentUser();
  const unreadCount = getUnreadNotificationsCount(currentUser.id);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-secondary-200">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-secondary-900">
                Call Intelligence
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  )}
                  onClick={() => onClose()}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-500'
                    )}
                  />
                  {item.name}
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <Badge variant="error" size="sm" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-secondary-200 p-4">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <span className="text-sm font-medium text-primary-700">
                  {currentUser.firstName[0]}{currentUser.lastName[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-900">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-xs text-secondary-500">
                  {currentUser.role.replace('_', ' ').toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

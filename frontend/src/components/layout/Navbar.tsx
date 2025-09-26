/**
 * Navbar Component
 * Top navigation bar with mobile menu toggle and user actions
 */

import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getUnreadNotificationsCount, getCurrentUser } from '../../data/mockData';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const currentUser = getCurrentUser();
  const unreadCount = getUnreadNotificationsCount(currentUser.id);

  return (
    <header className="bg-white border-b border-secondary-200 lg:pl-64">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
            icon={<Menu className="h-5 w-5" />}
          >
          </Button>
          
          <div className="ml-4 flex items-center lg:ml-0">
            <h1 className="text-lg font-semibold text-secondary-900">
              AI Call Intelligence Platform
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search calls, action items..."
                className="w-64 pl-10 pr-4 py-2 text-sm border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notifications */}
          <Link to="/notifications" className="relative">
            <Button variant="ghost" size="sm" icon={<Bell className="h-5 w-5" />}>
            </Button>
            {unreadCount > 0 && (
              <Badge 
                variant="error" 
                size="sm" 
                className="absolute -top-1 -right-1 min-w-[1.25rem] h-5"
              >
                {unreadCount}
              </Badge>
            )}
          </Link>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-secondary-900">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-xs text-secondary-500">
                {currentUser.role.replace('_', ' ').toLowerCase()}
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
              <span className="text-sm font-medium text-primary-700">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

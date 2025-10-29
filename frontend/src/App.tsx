/**
 * Main App Component
 * Sets up routing and layout for the AI Call Intelligence Platform
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginForm from './components/LoginForm';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import CallsPage from './pages/CallsPage';
import CallDetailPage from './pages/CallDetailPage';
import ActionItemsPage from './pages/ActionItemsPage';
import CallProcessingPage from './pages/CallProcessingPage';
import ModelTestPage from './pages/ModelTestPage';
import NotificationsPage from './pages/NotificationsPage';
import QBRPage from './pages/QBRPage';

// Import SentimentTimelinePage
import SentimentTimelinePage from './pages/SentimentTimelinePage';

const SettingsPage: React.FC = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-secondary-900 mb-4">Settings</h1>
    <p className="text-secondary-600">Platform settings and configuration options will be available here.</p>
  </div>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        {/* Main Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Calls */}
        <Route path="/calls" element={<CallsPage />} />
        <Route path="/calls/:id" element={<CallDetailPage />} />
        <Route path="/calls/process" element={<CallProcessingPage />} />
        
        {/* Model Testing */}
        <Route path="/models/test" element={<ModelTestPage />} />
        
        {/* Action Items */}
        <Route path="/action-items" element={
          <ErrorBoundary>
            <ActionItemsPage />
          </ErrorBoundary>
        } />
        
        {/* Sentiment Analysis */}
        <Route path="/sentiment" element={
          <ErrorBoundary>
            <SentimentTimelinePage />
          </ErrorBoundary>
        } />
        
        {/* QBR */}
        <Route path="/qbr" element={<QBRPage />} />
        
        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />
        
        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        
        {/* 404 - Not Found */}
        <Route path="*" element={
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-secondary-900 mb-4">Page Not Found</h1>
            <p className="text-secondary-600">The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

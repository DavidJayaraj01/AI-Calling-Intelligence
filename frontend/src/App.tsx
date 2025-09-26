/**
 * Main App Component
 * Sets up routing and layout for the AI Call Intelligence Platform
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CallsPage from './pages/CallsPage';
import CallDetailPage from './pages/CallDetailPage';
import ActionItemsPage from './pages/ActionItemsPage';
import NotificationsPage from './pages/NotificationsPage';
import QBRPage from './pages/QBRPage';

// Placeholder components for routes not yet implemented
const SentimentTimelinePage: React.FC = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-secondary-900 mb-4">Sentiment Timeline</h1>
    <p className="text-secondary-600">This page will show detailed sentiment analysis across calls.</p>
  </div>
);

const SettingsPage: React.FC = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-secondary-900 mb-4">Settings</h1>
    <p className="text-secondary-600">Platform settings and configuration options will be available here.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Calls */}
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/calls/:id" element={<CallDetailPage />} />
          
          {/* Action Items */}
          <Route path="/action-items" element={<ActionItemsPage />} />
          
          {/* Sentiment Analysis */}
          <Route path="/sentiment" element={<SentimentTimelinePage />} />
          
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
    </Router>
  );
}

export default App;

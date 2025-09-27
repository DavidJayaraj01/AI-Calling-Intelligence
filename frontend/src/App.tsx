/**
 * Main App Component
 * Sets up routing and layout for the AI Call Intelligence Platform
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardReal from './pages/DashboardReal';  // Real dashboard
import CallsPage from './pages/CallsPage';
import CallDetailPage from './pages/CallDetailPage';
import CallAnalysisPageReal from './pages/CallAnalysisPageReal';  // Real call analysis
import ModelTestPage from './pages/ModelTestPage';  // AI Model Testing
import ActionItemsPage from './pages/ActionItemsPage';
import NotificationsPage from './pages/NotificationsPage';
import QBRPage from './pages/QBRPage';
import SentimentTimelinePage from './pages/SentimentTimelinePage';

// Placeholder components for routes

const SettingsPage: React.FC = () => (
  <div className="text-center py-12 max-w-2xl mx-auto">
    <h1 className="text-2xl font-bold text-secondary-900 mb-4">OpenAI Configuration</h1>
    <p className="text-secondary-600 mb-6">
      Configure your OpenAI API settings, model preferences, and analysis parameters 
      for optimal AI-powered call intelligence.
    </p>
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
      <h3 className="font-semibold text-green-900 mb-2">Settings Available:</h3>
      <ul className="text-green-700 text-sm space-y-1">
        <li>• OpenAI API key management</li>
        <li>• Model selection (GPT-4o-mini, GPT-4, etc.)</li>
        <li>• Analysis sensitivity tuning</li>
        <li>• Cost monitoring and limits</li>
      </ul>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Main Dashboard - REAL DATA ONLY */}
          <Route path="/" element={<DashboardReal />} />
          
          {/* Calls */}
          <Route path="/calls" element={<CallsPage />} />
          <Route path="/calls/:id" element={<CallDetailPage />} />
          
          {/* AI Analysis - REAL OPENAI INTEGRATION */}
          <Route path="/analyze" element={<CallAnalysisPageReal />} />
          <Route path="/call-analysis" element={<CallAnalysisPageReal />} />
          
          {/* Model Testing */}
          <Route path="/models/test" element={<ModelTestPage />} />
          <Route path="/model-test" element={<ModelTestPage />} />
          
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

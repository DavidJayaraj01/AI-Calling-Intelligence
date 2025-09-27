/**
 * QBR (Quarterly Business Review) Page
 * View and manage quarterly business review reports
 */

import React from 'react';
import { FileText, Download, Share, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SentimentLineChart, StatusBarChart } from '../components/ui/Charts';
import { mockQBRDraft } from '../data/mockData';

const QBRPage: React.FC = () => {
  const qbr = mockQBRDraft;

  const handleExportPDF = async () => {
    // Simulate PDF generation
    alert('📄 Generating PDF report...\n\n⏳ Please wait while we compile your QBR data.');
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real application, you would generate and download the PDF
      const reportContent = `
QBR Report - ${qbr.title}
Quarter: ${qbr.quarter} ${qbr.year}
Status: ${qbr.status}

Key Metrics:
• Total Calls: ${qbr.metrics.totalCalls}
• Pain Points: ${qbr.metrics.totalPainPoints}  
• Action Items: ${qbr.metrics.totalActionItems}
• Completion Rate: ${(qbr.actionItemsSummary.completionRate * 100).toFixed(0)}%

Generated on: ${new Date().toLocaleDateString()}
      `.trim();
      
      // Create and download a text file (in real app, this would be a PDF)
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `QBR-${qbr.quarter}-${qbr.year}-${qbr.distributor.name}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('✅ QBR report exported successfully!\n\n📁 Check your Downloads folder.');
      
    } catch (error) {
      alert('❌ Failed to export report. Please try again.');
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `${qbr.title} - QBR Report`,
      text: `Check out our Q${qbr.quarter} ${qbr.year} business review for ${qbr.distributor.name} and ${qbr.vendor.name}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      // Use native Web Share API if available
      navigator.share(shareData)
        .then(() => alert('✅ QBR report shared successfully!'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback: copy link to clipboard
      const shareText = `${shareData.title}\n\n${shareData.text}\n\nLink: ${shareData.url}`;
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText)
          .then(() => {
            alert('📋 QBR report link copied to clipboard!\n\nYou can now paste it in emails, messages, or documents.');
          })
          .catch(() => {
            // Fallback alert with info
            alert(`📤 Share this QBR report:\n\n${shareText}`);
          });
      } else {
        // Final fallback
        alert(`📤 Share this QBR report:\n\n${shareText}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'success';
      case 'approved': return 'info';
      case 'under_review': return 'warning';
      default: return 'secondary';
    }
  };

  // Transform metrics for charts
  const sentimentTrendData = qbr.metrics.sentimentTrend.map(item => ({
    timestamp: item.date,
    value: item.sentiment,
    label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(item.date),
  }));

  const actionItemsData = Object.entries(qbr.actionItemsSummary.byPriority).map(([priority, count]) => ({
    label: priority.charAt(0).toUpperCase() + priority.slice(1),
    value: count,
    color: priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f59e0b' : '#0ea5e9',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Quarterly Business Review</h1>
          <p className="text-secondary-600">
            {qbr.title}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            icon={<Share className="h-4 w-4" />}
            onClick={handleShare}
          >
            Share
          </Button>
          <Button 
            icon={<Download className="h-4 w-4" />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* QBR Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>QBR Overview</span>
            </CardTitle>
            <Badge variant={getStatusColor(qbr.status)} size="lg">
              {qbr.status.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-700">{qbr.quarter}</div>
              <div className="text-sm text-secondary-600">Quarter</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">{qbr.year}</div>
              <div className="text-sm text-secondary-600">Year</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900">
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(qbr.generatedAt)}
              </div>
              <div className="text-sm text-secondary-600">Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-700">
                {((qbr.actionItemsSummary.completionRate) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-secondary-600">Completion Rate</div>
            </div>
          </div>

          <div className="bg-secondary-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Executive Summary</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-secondary-700 leading-relaxed">
                The partnership between {qbr.distributor.name} and {qbr.vendor.name} has shown significant progress in Q{qbr.quarter} {qbr.year}. 
                With {qbr.metrics.totalCalls} calls analyzed, we've maintained an average sentiment score of {qbr.metrics.averageSentiment.toFixed(1)}/10 
                and successfully resolved {qbr.metrics.resolvedPainPoints} out of {qbr.metrics.totalPainPoints} identified pain points.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Total Calls</p>
                <p className="text-2xl font-bold text-secondary-900">{qbr.metrics.totalCalls}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Avg Sentiment</p>
                <p className="text-2xl font-bold text-secondary-900">{qbr.metrics.averageSentiment.toFixed(1)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Pain Points</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {qbr.metrics.resolvedPainPoints}/{qbr.metrics.totalPainPoints}
                </p>
              </div>
              <div className="h-8 w-8 text-warning-600">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">Action Items</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {qbr.metrics.completedActionItems}/{qbr.metrics.totalActionItems}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentLineChart data={sentimentTrendData} height={250} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Items by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBarChart data={actionItemsData} height={250} />
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qbr.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary-700">{index + 1}</span>
                </div>
                <p className="text-sm text-secondary-700">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-700">{qbr.actionItemsSummary.totalCreated}</div>
              <div className="text-sm text-primary-600">Total Created</div>
            </div>
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <div className="text-2xl font-bold text-success-700">{qbr.actionItemsSummary.totalCompleted}</div>
              <div className="text-sm text-success-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-accent-50 rounded-lg">
              <div className="text-2xl font-bold text-accent-700">{(qbr.actionItemsSummary.completionRate * 100).toFixed(0)}%</div>
              <div className="text-sm text-accent-600">Completion Rate</div>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary-700">{qbr.actionItemsSummary.averageCompletionTime.toFixed(1)}</div>
              <div className="text-sm text-secondary-600">Avg Days to Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QBR Content */}
      <Card>
        <CardHeader>
          <CardTitle>Full Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary-50 rounded-lg p-6">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-secondary-700 leading-relaxed">
                {qbr.content}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QBRPage;

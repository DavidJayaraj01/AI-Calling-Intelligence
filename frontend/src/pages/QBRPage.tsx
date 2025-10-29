/**
 * QBR (Quarterly Business Review) Page
 * View and manage quarterly business review reports
 */

import React, { useState, useRef } from 'react';
import { FileText, Download, Share, Calendar, TrendingUp, CheckCircle, Copy, Mail, Link, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { SentimentLineChart, StatusBarChart } from '../components/ui/Charts';
import { mockQBRDraft } from '../data/mockData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const QBRPage: React.FC = () => {
  const qbr = mockQBRDraft;
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const qbrRef = useRef<HTMLDivElement>(null);

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

  // Export PDF functionality
  const exportToPDF = async () => {
    if (!qbrRef.current) return;
    
    setIsExporting(true);
    try {
      // Create canvas from the QBR content
      const canvas = await html2canvas(qbrRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: qbrRef.current.scrollWidth,
        height: qbrRef.current.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = `QBR_Q${qbr.quarter}_${qbr.year}_${qbr.distributor.name.replace(/\s+/g, '_')}_${qbr.vendor.name.replace(/\s+/g, '_')}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Share functionality
  const handleShare = () => {
    // Generate share URL (in a real app, this would be a unique URL)
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/qbr/share/${qbr.id}`;
    setShareUrl(shareUrl);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`QBR Report - Q${qbr.quarter} ${qbr.year}`);
    const body = encodeURIComponent(`Please find the Quarterly Business Review report for Q${qbr.quarter} ${qbr.year} between ${qbr.distributor.name} and ${qbr.vendor.name}.\n\nView the report: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(`QBR Report - Q${qbr.quarter} ${qbr.year}`);
    const summary = encodeURIComponent(`Quarterly Business Review for ${qbr.distributor.name} and ${qbr.vendor.name}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out our Q${qbr.quarter} ${qbr.year} Quarterly Business Review report!`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  };

  return (
    <div className="space-y-6" ref={qbrRef}>
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
            icon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={exportToPDF}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Share QBR Report</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Share URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-secondary-300 rounded-md text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    onClick={copyToClipboard}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Share via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Mail className="h-4 w-4" />}
                    onClick={shareViaEmail}
                  >
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Link className="h-4 w-4" />}
                    onClick={shareViaLinkedIn}
                  >
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Link className="h-4 w-4" />}
                    onClick={shareViaTwitter}
                  >
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="h-4 w-4" />}
                    onClick={exportToPDF}
                    disabled={isExporting}
                  >
                    {isExporting ? 'Exporting...' : 'PDF'}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-secondary-200">
                <Button
                  variant="primary"
                  onClick={() => setShowShareModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QBRPage;

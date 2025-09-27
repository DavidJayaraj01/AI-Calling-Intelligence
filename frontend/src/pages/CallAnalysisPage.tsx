/**
 * Call Analysis Page
 * Allows users to input transcripts and get AI analysis
 */

import React, { useState } from 'react';
import { Upload, FileText, Brain, TrendingUp, AlertTriangle, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../services/api';

const CallAnalysisPage: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (MP3, WAV, M4A, etc.)');
      return;
    }

    setIsTranscribing(true);
    setError('');

    try {
      // Simulate audio transcription with OpenAI Whisper
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const sampleTranscript = `[Transcribed from ${file.name}]
      
Hello, this is Sarah from Global Distributors. I'm calling regarding the pricing concerns that were raised in our last meeting. Our team has been reviewing the new product line, and we're experiencing some challenges with the current pricing structure.

The main issues we're facing are:
1. The pricing is significantly higher than our previous supplier
2. Our customers are finding it difficult to justify the cost increase
3. We're losing competitive advantage in the market

I wanted to discuss potential volume discounts and see if there's any flexibility in the pricing model. Our sales have dropped by about 15% since the price change, and we really need to find a solution that works for both parties.

Could we schedule a meeting to discuss this further? We value our partnership and want to find a way to make this work.`;

      setTranscript(sampleTranscript);
      setError('');
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError('Please enter a transcript to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    try {
      const response = await api.demo.processCall(transcript, {
        distributorId: 'dist-1',
        vendorId: 'vendor-1',
        seedBrief: 'User-provided call transcript'
      });

      if (response.success) {
        setAnalysisResult(response.data);
      } else {
        setError('Failed to analyze call. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleTranscript = () => {
    const sample = `Hello, this is John from TechFlow Distribution. I'm calling about the recent issues we've been having with your new software platform.

Hi John, this is Sarah from VendorTech. What specific issues are you experiencing?

Well, we've had several problems. First, the system has been really slow during peak hours. Our users are complaining that it takes 30 seconds just to load the dashboard. This is causing major productivity issues for our team.

I understand that's frustrating. Let me look into the performance issues.

Also, the pricing seems much higher than what we initially discussed. We were quoted $50 per user per month, but the invoice shows $75 per user. That's a 50% increase that we weren't prepared for.

That doesn't sound right. Let me check with our billing department.

And one more thing - the training documentation you provided is really confusing. Our team has been struggling to understand how to use the advanced features. We need better support materials.

I apologize for these issues. Let me schedule a follow-up call to address each of these concerns properly.`;
    
    setTranscript(sample);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Call Analysis</h1>
          <p className="text-secondary-600">
            Upload transcripts or paste text to get intelligent insights powered by OpenAI
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={loadSampleTranscript}>
            Load Sample
          </Button>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Call Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your call transcript here or click 'Load Sample' to see a demo..."
              className="w-full h-64 p-3 border border-secondary-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !transcript.trim()}
                icon={<Brain className="h-4 w-4" />}
                className="flex-1"
              >
                {isAnalyzing ? 'Analyzing with AI...' : 'Analyze with OpenAI'}
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isTranscribing}
                />
                <Button 
                  variant="outline" 
                  icon={<Upload className="h-4 w-4" />}
                  disabled={isTranscribing}
                >
                  {isTranscribing ? 'Transcribing...' : 'Upload Audio'}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!analysisResult && !isAnalyzing && (
              <div className="text-center py-12 text-secondary-500">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter a transcript and click "Analyze" to see AI insights</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full mx-auto mb-4"></div>
                <p className="text-secondary-600">OpenAI is analyzing your call...</p>
                <p className="text-sm text-secondary-500 mt-2">
                  Detecting pain points, sentiment, and generating action items
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                {/* Sentiment Overview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900">Overall Sentiment</h3>
                    <Badge variant={analysisResult.analysis.sentiment.overall_sentiment === 'POSITIVE' ? 'success' : 
                                   analysisResult.analysis.sentiment.overall_sentiment === 'NEGATIVE' ? 'error' : 'secondary'}>
                      {analysisResult.analysis.sentiment.overall_sentiment}
                    </Badge>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">
                    Confidence: {Math.round(analysisResult.analysis.sentiment.confidence * 100)}%
                  </p>
                </div>

                {/* Pain Points Summary */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">
                      {analysisResult.analysis.pain_points.length} Pain Points Detected
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.analysis.pain_points.slice(0, 2).map((pp: any, index: number) => (
                      <div key={index} className="flex items-start justify-between">
                        <p className="text-orange-700 text-sm flex-1">{pp.description}</p>
                        <Badge variant={getSeverityColor(pp.severity)} className="ml-2 text-xs">
                          {pp.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items Summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-green-900">
                      {analysisResult.analysis.action_items.length} Action Items Generated
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.analysis.action_items.slice(0, 2).map((ai: any, index: number) => (
                      <div key={index} className="flex items-start justify-between">
                        <p className="text-green-700 text-sm flex-1">{ai.title}</p>
                        <Badge variant={getPriorityColor(ai.priority)} className="ml-2 text-xs">
                          {ai.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      {analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pain Points Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Pain Points Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.analysis.pain_points.map((pp: any, index: number) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-secondary-900">{pp.category}</h4>
                      <Badge variant={getSeverityColor(pp.severity)}>{pp.severity}</Badge>
                    </div>
                    <p className="text-sm text-secondary-700 mb-2">{pp.description}</p>
                    <p className="text-xs text-secondary-500 italic">
                      "{pp.text_segment}"
                    </p>
                    <p className="text-xs text-secondary-400 mt-1">
                      Confidence: {Math.round(pp.confidence * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Items Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                Action Items Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.analysis.action_items.map((ai: any, index: number) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4 pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-secondary-900">{ai.title}</h4>
                      <Badge variant={getPriorityColor(ai.priority)}>{ai.priority}</Badge>
                    </div>
                    <p className="text-sm text-secondary-700 mb-2">{ai.description}</p>
                    <div className="flex items-center justify-between text-xs text-secondary-500">
                      <span>Category: {ai.category}</span>
                      <span>Due: {new Date(ai.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Solutions Detail */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Recommended Solutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.analysis.solutions.map((sol: any, index: number) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 pb-4">
                    <h4 className="font-medium text-secondary-900 mb-2">{sol.title}</h4>
                    <p className="text-sm text-secondary-700 mb-2">{sol.description}</p>
                    <div className="flex items-center justify-between text-xs text-secondary-500">
                      <span>Type: {sol.resource_type}</span>
                      <span>Match: {Math.round(sol.similarity_score * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-secondary-500 mt-1">
                      <span>Difficulty: {sol.difficulty}</span>
                      <span>Impact: {sol.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CallAnalysisPage;
/**
 * Call Analysis Page - REAL OpenAI Integration
 * NO MOCK DATA - Uses actual Whisper transcription and GPT analysis
 * Uploads audio files and processes them with real OpenAI APIs
 */

import React, { useState } from 'react';
import { Upload, FileText, Brain, TrendingUp, AlertTriangle, CheckSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import api from '../services/api';  // Use the updated api service
import type { AudioProcessingResult } from '../types/realData';

interface AnalysisState {
  isProcessing: boolean;
  isTranscribing: boolean;
  isAnalyzing: boolean;
  currentStep: string;
  progress: number;
}

const CallAnalysisPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [callTitle, setCallTitle] = useState('');
  const [callDescription, setCallDescription] = useState('');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isProcessing: false,
    isTranscribing: false,
    isAnalyzing: false,
    currentStep: '',
    progress: 0
  });
  const [analysisResult, setAnalysisResult] = useState<AudioProcessingResult | null>(null);
  const [error, setError] = useState('');

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validAudioTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 
      'audio/mp4', 'audio/webm', 'audio/ogg'
    ];

    if (!validAudioTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|mp4|webm|ogg)$/i)) {
      setError('Please upload a valid audio file (MP3, WAV, M4A, MP4, WebM, OGG)');
      return;
    }

    // Check file size (max 25MB as per backend config)
    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Auto-generate title from filename if empty
    if (!callTitle) {
      const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setCallTitle(`Call Analysis - ${name}`);
    }
  };

  const processAudioWithOpenAI = async () => {
    if (!selectedFile) {
      setError('Please select an audio file first');
      return;
    }

    setAnalysisState({
      isProcessing: true,
      isTranscribing: true,
      isAnalyzing: false,
      currentStep: 'Uploading and transcribing audio with OpenAI Whisper...',
      progress: 10
    });
    setError('');
    setAnalysisResult(null);

    try {
      // Step 1: Process audio with OpenAI (transcription + analysis)
      setAnalysisState(prev => ({
        ...prev,
        currentStep: 'Processing with OpenAI Whisper API...',
        progress: 30
      }));

      const response = await api.processAudio(selectedFile, callTitle || undefined, callDescription || undefined);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to process audio');
      }

      setAnalysisState(prev => ({
        ...prev,
        isTranscribing: false,
        isAnalyzing: true,
        currentStep: 'Analyzing transcript with OpenAI GPT...',
        progress: 70
      }));

      // Wait a moment to show the analysis step
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAnalysisState(prev => ({
        ...prev,
        currentStep: 'Saving analysis results to database...',
        progress: 90
      }));

      // Wait a moment more
      await new Promise(resolve => setTimeout(resolve, 500));

      // Set the real results
      setAnalysisResult(response.data as AudioProcessingResult);
      setTranscript(response.data.transcription?.transcript || '');

      setAnalysisState(prev => ({
        ...prev,
        isProcessing: false,
        isAnalyzing: false,
        currentStep: 'Analysis complete!',
        progress: 100
      }));

      // Clear the step message after success
      setTimeout(() => {
        setAnalysisState(prev => ({ ...prev, currentStep: '' }));
      }, 2000);

    } catch (error) {
      console.error('Audio processing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process audio. Please check your OpenAI API key and try again.');
      setAnalysisState({
        isProcessing: false,
        isTranscribing: false,
        isAnalyzing: false,
        currentStep: '',
        progress: 0
      });
    }
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Call Analysis</h1>
          <p className="text-gray-600">Upload audio files for real-time OpenAI Whisper transcription and GPT analysis</p>
          <div className="mt-2 text-sm text-blue-600 font-medium">
            🤖 Powered by OpenAI Whisper + GPT-4o-mini • No Mock Data
          </div>
        </div>

        {/* Audio Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} />
              Upload Audio File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Call Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Title</label>
                <input
                  type="text"
                  value={callTitle}
                  onChange={(e) => setCallTitle(e.target.value)}
                  placeholder="e.g., Client Meeting - Q4 Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={callDescription}
                  onChange={(e) => setCallDescription(e.target.value)}
                  placeholder="Brief description of the call"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.mp4,.webm,.ogg"
                onChange={handleAudioUpload}
                className="hidden"
                id="audio-upload"
                disabled={analysisState.isProcessing}
              />
              <label 
                htmlFor="audio-upload" 
                className={`cursor-pointer ${analysisState.isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  {selectedFile ? selectedFile.name : 'Click to upload audio file'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports MP3, WAV, M4A, MP4, WebM, OGG (max 25MB)
                </p>
              </label>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-blue-900">{selectedFile.name}</p>
                    <p className="text-sm text-blue-700">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
                    </p>
                  </div>
                  <Button
                    onClick={processAudioWithOpenAI}
                    disabled={analysisState.isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {analysisState.isProcessing ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Brain size={16} className="mr-2" />
                        Analyze with OpenAI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Processing Status */}
            {analysisState.isProcessing && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={20} className="animate-spin text-yellow-600" />
                  <span className="font-medium text-yellow-900">{analysisState.currentStep}</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysisState.progress}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-yellow-700">
                  This uses real OpenAI APIs and may take 30-60 seconds depending on audio length
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckSquare size={24} className="mx-auto text-green-600 mb-2" />
              <p className="text-green-800 font-medium">
                ✅ Audio processed successfully with OpenAI! 
                Call saved to database (ID: {analysisResult.call_id})
              </p>
              <p className="text-sm text-green-600 mt-1">
                Tokens used: {analysisResult.total_tokens_used} • 
                Pain points: {analysisResult.pain_points_saved} • 
                Action items: {analysisResult.action_items_saved}
              </p>
            </div>

            {/* Real Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Real Whisper Transcription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-gray-900">
                    {analysisResult.transcription?.transcript || transcript}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Real Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  AI Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Overall Sentiment</h4>
                    <Badge className={getSentimentColor(analysisResult.analysis.overall_sentiment)}>
                      {analysisResult.analysis.overall_sentiment?.toUpperCase() || 'NEUTRAL'}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      Confidence: {Math.round((analysisResult.analysis.confidence_score || 0) * 100)}%
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.analysis.key_topics?.map((topic, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* AI Summary */}
                {analysisResult.analysis.summary && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">AI Generated Summary</h4>
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                      {analysisResult.analysis.summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Real Pain Points */}
            {analysisResult.analysis.pain_points && analysisResult.analysis.pain_points.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle size={20} />
                    AI Extracted Pain Points ({analysisResult.analysis.pain_points.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.analysis.pain_points.map((painPoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{painPoint.description}</h4>
                          <div className="flex gap-2">
                            <Badge className={getSeverityColor(painPoint.severity)}>
                              {painPoint.severity?.toUpperCase() || 'MEDIUM'}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800">
                              {painPoint.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          AI Confidence: {Math.round((painPoint.confidence || 0) * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Real Action Items */}
            {analysisResult.analysis.action_items && analysisResult.analysis.action_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare size={20} />
                    AI Generated Action Items ({analysisResult.analysis.action_items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.analysis.action_items.map((actionItem, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{actionItem.title}</h4>
                          <div className="flex gap-2">
                            <Badge className={getPriorityColor(actionItem.priority)}>
                              {actionItem.priority?.toUpperCase() || 'MEDIUM'}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-800">
                              {actionItem.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{actionItem.description}</p>
                        <p className="text-sm text-gray-600">
                          Estimated timeline: {actionItem.estimated_days} days
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Recommendations */}
            {analysisResult.analysis.recommendations && analysisResult.analysis.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain size={20} />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.analysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallAnalysisPage;
import React, { useState, useRef } from 'react';
import { 
  Mic, MicOff, Upload, Play, Pause, Square, FileText, Brain, AlertTriangle, CheckCircle, Loader2, Download, Trash2, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import { apiService, type TranscriptionResult, type APIResponse } from '../services/api';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

const SimpleAIPipeline: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'transcription', name: 'Speech-to-Text', status: 'pending' },
    { id: 'sentiment', name: 'Sentiment Analysis', status: 'pending' },
    { id: 'pain_points', name: 'Pain Point Extraction', status: 'pending' },
    { id: 'solutions', name: 'Solution Matching', status: 'pending' },
    { id: 'action_items', name: 'Action Item Generation', status: 'pending' },
  ]);
  const [callData, setCallData] = useState({
    distributor_id: '',
    vendor_id: '',
    seed_brief: '',
    metadata: {}
  });
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const updateStepStatus = (stepId: string, status: ProcessingStep['status'], result?: any, error?: string) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, result, error }
        : step
    ));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioFile(new File([audioBlob], 'recording.webm', { type: 'audio/webm' }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setError(null);
    }
  };

  const processAIPipeline = async () => {
    if (!audioFile && !transcript) {
      setError('Please record/upload audio or enter transcript text first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      let finalTranscript = transcript;
      
      // Step 1: Speech-to-Text Transcription (if audio provided)
      if (audioFile) {
        updateStepStatus('transcription', 'processing');
        
        // Create a temporary call for transcription
        const tempCall = await apiService.createCall({
          distributor_id: 2,
          vendor_id: 2,
          seed_brief: 'AI Pipeline Processing',
          transcript: 'Processing...'
        });

        const transcriptionResult = await apiService.transcribeAudio(tempCall.call_id, audioFile);
        finalTranscript = transcriptionResult.transcript;
        setTranscript(finalTranscript);
        updateStepStatus('transcription', 'completed', transcriptionResult);
      } else {
        updateStepStatus('transcription', 'completed', { transcript: finalTranscript });
      }

      // Step 2: Process the call with complete AI pipeline
      updateStepStatus('sentiment', 'processing');
      updateStepStatus('pain_points', 'processing');
      updateStepStatus('solutions', 'processing');
      updateStepStatus('action_items', 'processing');

      const processResult = await apiService.processCall({
        transcript: finalTranscript,
        distributor_id: 2,
        vendor_id: 2,
        seed_brief: callData.seed_brief || 'AI Pipeline Processing',
        metadata: callData.metadata || {}
      });

      // Mark all steps as completed
      updateStepStatus('sentiment', 'completed', { overall_sentiment: processResult.overall_sentiment });
      updateStepStatus('pain_points', 'completed', { count: processResult.pain_points_count });
      updateStepStatus('solutions', 'completed', { count: processResult.action_items_count });
      updateStepStatus('action_items', 'completed', { count: processResult.action_items_count });

      setProcessingResult({
        call_id: processResult.call_id,
        transcript: finalTranscript,
        processing_completed: true,
        results: processResult
      });

    } catch (error) {
      console.error('Pipeline processing error:', error);
      setError(`Pipeline processing failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Mark all steps as error
      processingSteps.forEach(step => {
        if (step.status === 'processing') {
          updateStepStatus(step.id, 'error', null, 'Processing failed');
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessing = () => {
    setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'pending', result: undefined, error: undefined })));
    setProcessingResult(null);
    setError(null);
    setTranscript('');
    setAudioFile(null);
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'processing': return 'bg-blue-50 border-blue-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Call Intelligence Pipeline</h1>
        <p className="text-gray-600">Upload audio or enter text to process with AI analysis</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Audio Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Audio Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <Button onClick={startRecording} className="flex items-center">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="flex items-center">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload">
                <Button variant="outline" className="flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </label>
            </div>
          </div>

          {/* Audio File Display */}
          {audioFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">{audioFile.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAudioFile(null)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Text Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Text Input (Alternative)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Enter call transcript text here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </CardContent>
      </Card>

      {/* Call Information */}
      <Card>
        <CardHeader>
          <CardTitle>Call Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seed Brief
              </label>
              <Input
                value={callData.seed_brief}
                onChange={(e) => setCallData(prev => ({ ...prev, seed_brief: e.target.value }))}
                placeholder="Brief description of the call"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Generated Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Processing Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processingSteps.map((step) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border ${getStepColor(step.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStepIcon(step.status)}
                    <span className="ml-3 font-medium">{step.name}</span>
                  </div>
                  <Badge variant={step.status === 'completed' ? 'success' : step.status === 'error' ? 'destructive' : 'secondary'}>
                    {step.status}
                  </Badge>
                </div>
                {step.result && (
                  <div className="mt-2 text-sm text-gray-600">
                    {step.id === 'transcription' && step.result.transcript && (
                      <p>Transcribed: {step.result.transcript.substring(0, 100)}...</p>
                    )}
                    {step.id === 'sentiment' && step.result.overall_sentiment && (
                      <p>Sentiment: {step.result.overall_sentiment}</p>
                    )}
                    {step.result.count && (
                      <p>Found: {step.result.count} items</p>
                    )}
                  </div>
                )}
                {step.error && (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={processAIPipeline}
          disabled={isProcessing || (!audioFile && !transcript)}
          className="flex items-center"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          {isProcessing ? 'Processing...' : 'Start AI Pipeline'}
        </Button>
        
        <Button
          onClick={resetProcessing}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Processing Results */}
      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Processing Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {processingResult.results?.pain_points_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Pain Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {processingResult.results?.action_items_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Action Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {processingResult.results?.sentiment_segments_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Sentiment Segments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {processingResult.results?.overall_sentiment || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Overall Sentiment</div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Call ID: {processingResult.call_id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleAIPipeline;



import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Target,
  Lightbulb
} from 'lucide-react';
import { apiService } from '../services/api';

interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  description: string;
  icon: React.ReactNode;
  result?: any;
  error?: string;
}

interface PainPoint {
  description: string;
  category: string;
  severity: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

interface Solution {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  confidence: number;
}

const AIPipeline: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    {
      id: 'transcription',
      name: 'Speech-to-Text',
      status: 'pending',
      description: 'Converting audio to text using s2t_small_librispeech model',
      icon: <Mic className="w-5 h-5" />
    },
    {
      id: 'pain_points',
      name: 'Pain Point Extraction',
      status: 'pending',
      description: 'Extracting pain points using RoBERTa fine-tuned model',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: 'sentiment',
      name: 'Sentiment Analysis',
      status: 'pending',
      description: 'Analyzing sentiment using multilingual sentiment model',
      icon: <Brain className="w-5 h-5" />
    },
    {
      id: 'solutions',
      name: 'Solution Matching',
      status: 'pending',
      description: 'Finding solutions using OpenAI and vector embeddings',
      icon: <Lightbulb className="w-5 h-5" />
    },
    {
      id: 'action_items',
      name: 'Action Item Generation',
      status: 'pending',
      description: 'Generating actionable items using OpenAI',
      icon: <CheckCircle className="w-5 h-5" />
    }
  ]);

  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [sentimentResult, setSentimentResult] = useState<any>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const updateStepStatus = (stepId: string, status: PipelineStep['status'], result?: any, error?: string) => {
    setPipelineSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, result, error }
        : step
    ));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setError(null);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  const processAIPipeline = async () => {
    if (!audioBlob) {
      setError('Please record or upload an audio file first.');
      return;
    }

    setProcessing(true);
    setError(null);
    
    try {
      // Step 1: Create a call entry
      updateStepStatus('transcription', 'in_progress');
      const newCall = await apiService.createCall({
        distributor_id: '2', // Use existing distributor ID
        vendor_id: '2', // Use existing vendor ID
        seed_brief: 'AI Pipeline Processing',
        transcript: 'Processing...'
      });

      // Step 2: Speech-to-Text Transcription
      updateStepStatus('transcription', 'in_progress');
      // Convert Blob to File for API
      const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
      const transcriptionResult = await apiService.transcribeAudio(audioFile);
      if (transcriptionResult.success && transcriptionResult.data) {
        setTranscript(transcriptionResult.data.text);
        updateStepStatus('transcription', 'completed', transcriptionResult);
      } else {
        throw new Error('Transcription failed');
      }

      // Step 3: Pain Point Extraction
      updateStepStatus('pain_points', 'in_progress');
      try {
        const painPointsResponse = await fetch(`http://localhost:8000/api/calls/${newCall.call_id}/extract-pain-points`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcript: transcriptionResult.data?.text || ''
          })
        });
        
        if (painPointsResponse.ok) {
          const painPointsData = await painPointsResponse.json();
          setPainPoints(painPointsData.pain_points || []);
          updateStepStatus('pain_points', 'completed', painPointsData);
        } else {
          throw new Error('Pain point extraction failed');
        }
      } catch (err) {
        updateStepStatus('pain_points', 'error', null, 'Pain point extraction failed');
      }

      // Step 4: Sentiment Analysis
      updateStepStatus('sentiment', 'in_progress');
      try {
        const sentimentResponse = await fetch(`http://localhost:8000/api/calls/${newCall.call_id}/analyze-sentiment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcript: transcriptionResult.data?.text || ''
          })
        });
        
        if (sentimentResponse.ok) {
          const sentimentData = await sentimentResponse.json();
          setSentimentResult(sentimentData);
          updateStepStatus('sentiment', 'completed', sentimentData);
        } else {
          throw new Error('Sentiment analysis failed');
        }
      } catch (err) {
        updateStepStatus('sentiment', 'error', null, 'Sentiment analysis failed');
      }

      // Step 5: Solution Matching
      updateStepStatus('solutions', 'in_progress');
      try {
        const solutionsResponse = await fetch(`http://localhost:8000/api/calls/${newCall.call_id}/find-solutions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pain_points: painPoints
          })
        });
        
        if (solutionsResponse.ok) {
          const solutionsData = await solutionsResponse.json();
          setSolutions(solutionsData.solutions || []);
          updateStepStatus('solutions', 'completed', solutionsData);
        } else {
          throw new Error('Solution matching failed');
        }
      } catch (err) {
        updateStepStatus('solutions', 'error', null, 'Solution matching failed');
      }

      // Step 6: Action Item Generation
      updateStepStatus('action_items', 'in_progress');
      try {
        const actionItemsResponse = await fetch(`http://localhost:8000/api/calls/${newCall.call_id}/generate-action-items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcript: transcriptionResult.data?.text || '',
            pain_points: painPoints,
            solutions: solutions
          })
        });
        
        if (actionItemsResponse.ok) {
          const actionItemsData = await actionItemsResponse.json();
          setActionItems(actionItemsData.action_items || []);
          updateStepStatus('action_items', 'completed', actionItemsData);
        } else {
          throw new Error('Action item generation failed');
        }
      } catch (err) {
        updateStepStatus('action_items', 'error', null, 'Action item generation failed');
      }

    } catch (err) {
      console.error('Pipeline processing error:', err);
      setError(`Pipeline processing failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: PipelineStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: PipelineStep['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'in_progress':
        return 'border-blue-200 bg-blue-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Call Intelligence Pipeline</h1>
        <p className="text-gray-600">Complete AI-powered call analysis with transcription, pain point extraction, and solution matching</p>
      </div>

      {/* Audio Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Mic className="w-5 h-5 mr-2" />
          Audio Input
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recording Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">Record Audio</h3>
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Recording
                </button>
              )}
              {isRecording && (
                <div className="flex items-center text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
                  Recording...
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="font-medium">Upload Audio File</h3>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Audio Preview</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={playAudio}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                Play
              </button>
              <audio ref={audioRef} src={audioUrl} controls className="flex-1" />
            </div>
          </div>
        )}

        {/* Process Button */}
        <div className="mt-6 text-center">
          <button
            onClick={processAIPipeline}
            disabled={!audioBlob || processing}
            className="flex items-center mx-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-5 h-5 mr-2" />
            {processing ? 'Processing...' : 'Start AI Pipeline'}
          </button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">AI Pipeline Steps</h2>
        <div className="space-y-4">
          {pipelineSteps.map((step) => (
            <div
              key={step.id}
              className={`p-4 rounded-lg border-2 transition-all ${getStatusColor(step.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300">
                    {getStatusIcon(step.status)}
                  </div>
                  <div>
                    <h3 className="font-medium">{step.name}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'in_progress' ? 'text-blue-600' :
                    step.status === 'error' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {step.status === 'completed' ? 'Completed' :
                     step.status === 'in_progress' ? 'Processing...' :
                     step.status === 'error' ? 'Error' :
                     'Pending'}
                  </span>
                </div>
              </div>
              
              {step.error && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                  {step.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {(transcript || painPoints.length > 0 || solutions.length > 0 || actionItems.length > 0) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          
          {/* Transcript */}
          {transcript && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Transcript</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{transcript}</p>
              </div>
            </div>
          )}

          {/* Pain Points */}
          {painPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Pain Points</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {painPoints.map((point, index) => (
                  <div key={index} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-800">{point.category}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        point.severity === 'high' ? 'bg-red-100 text-red-800' :
                        point.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {point.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{point.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {(point.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solutions */}
          {solutions.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Recommended Solutions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solutions.map((solution, index) => (
                  <div key={index} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">{solution.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        solution.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        solution.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {solution.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{solution.description}</p>
                    <div className="text-xs text-gray-500">
                      Confidence: {(solution.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Generated Action Items</h3>
              <div className="space-y-3">
                {actionItems.map((item, index) => (
                  <div key={index} className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800">{item.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment Analysis */}
          {sentimentResult && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Sentiment Analysis</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sentimentResult.overall_sentiment || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Overall Sentiment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sentimentResult.confidence ? (sentimentResult.confidence * 100).toFixed(1) + '%' : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {sentimentResult.emotions ? Object.keys(sentimentResult.emotions).length : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Emotions Detected</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPipeline;

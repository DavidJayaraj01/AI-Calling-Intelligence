import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, CheckCircle, XCircle, Loader2, AlertTriangle, 
  Mic, MessageSquare, Target, List, Search, RefreshCw,
  Upload, FileText, Square, Radio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { apiService, type TranscriptionResult, type CallDetail } from '../services/api';
import LiveRecording from './LiveRecording';

interface ModelTestResult {
  status: string;
  result?: string;
  model_loaded?: boolean;
  count?: number;
  sample_points?: Array<{
    description: string;
    painpoint_id: number;
  }>;
  sample_items?: Array<{
    description: string;
    action_id: number;
    status: string;
    owner_id?: number;
  }>;
  sample_solutions?: Array<{
    title: string;
    description: string;
    category: string;
    difficulty: string;
    priority?: string;
    implementation_steps?: string[];
    expected_outcome?: string;
    relevance_score: number;
    source?: string;
  }>;
  overall_sentiment?: string;
  confidence?: number;
  segments_count?: number;
}

interface ModelStatus {
  loaded: boolean;
  model_type: string;
}

interface TestResponse {
  overall_status: string;
  models_tested: number;
  results: Record<string, ModelTestResult>;
  test_transcript: string;
}

const ModelTestResults: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [testResults, setTestResults] = useState<TestResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<Record<string, ModelStatus> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mode selection: 'test' (file upload/text), 'live' (real-time recording)
  const [mode, setMode] = useState<'test' | 'live'>('test');
  
  // Input states
  const [inputType, setInputType] = useState<'audio' | 'text'>('text');
  
  // Debug input type changes
  React.useEffect(() => {
    console.log('Input type changed to:', inputType);
  }, [inputType]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  
  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio recording functions
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
    console.log('handleFileUpload called', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('Audio file selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file (MP3, WAV, etc.)');
        return;
      }
      
      // Validate file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        setError('File too large. Maximum size is 25MB.');
        return;
      }
      
      setAudioFile(file);
      setError(null);
      console.log('Audio file set successfully');
    } else {
      console.log('No file selected');
    }
  };

  const runModelTest = async () => {
    if (!audioFile && !transcript) {
      setError('Please provide audio file or enter text first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let finalTranscript = transcript;
      
      // Step 1: Transcribe audio if provided
      if (audioFile) {
        console.log('Transcribing audio file:', audioFile.name, audioFile.type, audioFile.size);
        try {
          const transcriptionResponse = await apiService.transcribeAudio(audioFile);
          console.log('Transcription response:', transcriptionResponse);
          
          if (transcriptionResponse.success && transcriptionResponse.data) {
            finalTranscript = transcriptionResponse.data.text;
            setTranscript(finalTranscript);
            setTranscriptionResult(transcriptionResponse.data);
            console.log('Transcription successful:', finalTranscript.substring(0, 100) + '...');
          } else {
            throw new Error(transcriptionResponse.message || 'Failed to transcribe audio');
          }
        } catch (transcriptionError) {
          console.error('Transcription error:', transcriptionError);
          const errorMessage = transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error';
          throw new Error(`Audio transcription failed: ${errorMessage}`);
        }
      }

      // Step 2: Process the transcript with AI models
      console.log('Processing transcript with AI models...');
      const processResponse = await apiService.processRealData(finalTranscript);

      if (processResponse.success) {
        // Get detailed call information
        const callDetail: CallDetail = await apiService.getCallDetail(processResponse.data?.call_id || '');
        
        // Get solutions from the process response
        const solutions = processResponse.data?.results?.solutions || [];
        
        // Format results similar to the test endpoint
        const results = {
          speech_to_text: {
            status: 'success',
            result: finalTranscript,
            model_loaded: true
          },
          pain_point_extraction: {
            status: 'success',
            count: callDetail.pain_points.length,
            sample_points: callDetail.pain_points.slice(0, 2).map(pp => ({
              description: pp.description,
              painpoint_id: pp.painpoint_id
            }))
          },
          sentiment_analysis: {
            status: 'success',
            overall_sentiment: callDetail.sentiment_segments[0]?.sentiment || 'neutral',
            confidence: callDetail.sentiment_segments[0]?.confidence || 0,
            segments_count: callDetail.sentiment_segments.length
          },
          action_item_generation: {
            status: 'success',
            count: callDetail.action_items.length,
            sample_items: callDetail.action_items.slice(0, 2).map(item => ({
              description: item.description,
              action_id: item.action_id,
              status: item.status,
              owner_id: item.owner_id
            }))
          },
          solution_matching: {
            status: 'success',
            count: solutions.length,
            sample_solutions: solutions.slice(0, 3).map((sol: any) => ({
              title: sol.title || 'Solution',
              description: sol.description || '',
              category: sol.category || 'general',
              difficulty: sol.difficulty || 'medium',
              priority: sol.priority || 'medium',
              implementation_steps: sol.implementation_steps || [],
              expected_outcome: sol.expected_outcome || '',
              relevance_score: sol.relevance_score || 0.8,
              source: sol.source || 'generated'
            })),
            model_loaded: true,
            vector_model_ready: true
          }
        };

        setTestResults({
          overall_status: 'success',
          models_tested: 5,
          results: results,
          test_transcript: finalTranscript
        });
      } else {
        setError(processResponse.message || 'Model processing failed');
      }
    } catch (err) {
      setError(`Failed to test models: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkModelStatus = async () => {
    setIsCheckingStatus(true);
    setError(null);
    
    try {
      const response = await apiService.getModelStatus();
      if (response.success) {
        setModelStatus(response.data?.models || {});
      } else {
        setError(response.message || 'Failed to get model status');
      }
    } catch (err) {
      setError(`Failed to check model status: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const resetInputs = () => {
    setAudioFile(null);
    setTranscript('');
    setTranscriptionResult(null);
    setTestResults(null);
    setError(null);
  };

  useEffect(() => {
    checkModelStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };


  const getModelIcon = (modelName: string) => {
    switch (modelName) {
      case 'speech_to_text': return <Mic className="w-5 h-5" />;
      case 'pain_point_extraction': return <Target className="w-5 h-5" />;
      case 'sentiment_analysis': return <MessageSquare className="w-5 h-5" />;
      case 'action_item_generation': return <List className="w-5 h-5" />;
      case 'solution_matching': return <Search className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const formatModelName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Model Testing</h1>
        <p className="text-gray-600">Test and verify all AI models are working correctly</p>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex justify-center space-x-4">
        <Button
          variant={mode === 'test' ? 'primary' : 'outline'}
          onClick={() => setMode('test')}
          className="flex items-center"
        >
          <FileText className="w-4 h-4 mr-2" />
          File Upload / Text
        </Button>
        <Button
          variant={mode === 'live' ? 'primary' : 'outline'}
          onClick={() => setMode('live')}
          className="flex items-center"
        >
          <Radio className="w-4 h-4 mr-2" />
          Live Recording
        </Button>
      </div>

      {/* Render based on mode */}
      {mode === 'live' ? (
        <LiveRecording />
      ) : (
        <>{/* Original content */}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Input Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Input Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Type Selection */}
          <div className="flex space-x-4">
            <Button
              variant={inputType === 'text' ? 'primary' : 'outline'}
              onClick={() => setInputType('text')}
              className="flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Text Input
            </Button>
            <Button
              variant={inputType === 'audio' ? 'primary' : 'outline'}
              onClick={() => {
                console.log('Audio input button clicked');
                setInputType('audio');
              }}
              className="flex items-center"
            >
              <Mic className="w-4 h-4 mr-2" />
              Audio Input
            </Button>
          </div>

          {/* Text Input */}
          {inputType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Text to Process
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Enter your text here for AI analysis..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Audio Input */}
          {inputType === 'audio' && (
            <div className="space-y-4">
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
                    ref={(input) => {
                      if (input) {
                        console.log('File input element created:', input);
                      }
                    }}
                  />
                  
                  {/* Primary Upload Button */}
                  <Button 
                    variant="outline" 
                    className="flex items-center cursor-pointer"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Upload button clicked', e);
                      const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
                      if (fileInput) {
                        console.log('Triggering file input click');
                        fileInput.click();
                      } else {
                        console.error('File input not found');
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  
                  {/* Fallback Button for Testing */}
                  <button
                    type="button"
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                      console.log('Fallback button clicked');
                      const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
                      if (fileInput) {
                        fileInput.click();
                      }
                    }}
                  >
                    Test Upload
                  </button>
                </div>
              </div>

              {/* Audio File Display */}
              {audioFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-500 mr-2" />
                      <div>
                        <span className="text-sm text-gray-700 font-medium">{audioFile.name}</span>
                        <div className="text-xs text-gray-500">
                          {audioFile.type} • {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAudioFile(null)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    ✓ Audio file ready for processing
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-4">
            <Button
              onClick={runModelTest}
              disabled={isLoading || (!audioFile && !transcript)}
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Processing...' : 'Process with AI Models'}
            </Button>
            
            <Button
              onClick={checkModelStatus}
              disabled={isCheckingStatus}
              variant="outline"
              className="flex items-center"
            >
              {isCheckingStatus ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Status
            </Button>

            <Button
              onClick={resetInputs}
              variant="outline"
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Display */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              {transcriptionResult ? 'Transcribed Text' : 'Input Text'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
              {transcriptionResult && (
                <div className="mt-2 text-sm text-gray-500">
                  <p>Confidence: {transcriptionResult.confidence.toFixed(2)}</p>
                  <p>Duration: {transcriptionResult.duration.toFixed(2)}s</p>
                  <p>Model: {transcriptionResult.model_used}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Status */}
      {modelStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Model Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(modelStatus).map(([name, status]) => (
                <div
                  key={name}
                  className={`p-4 rounded-lg border ${
                    status.loaded ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getModelIcon(name)}
                      <span className="ml-2 font-medium">{formatModelName(name)}</span>
                    </div>
                    <Badge variant={status.loaded ? 'success' : 'error'}>
                      {status.loaded ? 'Loaded' : 'Not Loaded'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{status.model_type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getStatusIcon(testResults.overall_status)}
                <span className="ml-2">Test Results Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.models_tested}
                  </div>
                  <div className="text-sm text-gray-600">Models Tested</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(testResults.results).filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {testResults.overall_status}
                  </div>
                  <div className="text-sm text-gray-600">Overall Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Test Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{testResults.test_transcript}</p>
              </div>
            </CardContent>
          </Card>

          {/* Individual Model Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(testResults.results).map(([modelName, result]) => (
              <Card key={modelName}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getModelIcon(modelName)}
                    <span className="ml-2">{formatModelName(modelName)}</span>
                    <Badge 
                      variant={result.status === 'success' ? 'success' : 'error'}
                      className="ml-auto"
                    >
                      {result.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.result && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Result:</p>
                        <p className="text-sm text-gray-600">{result.result}</p>
                      </div>
                    )}
                    
                    {result.count !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Count:</p>
                        <p className="text-sm text-gray-600">{result.count}</p>
                      </div>
                    )}
                    
                    {result.overall_sentiment && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sentiment:</p>
                        <p className="text-sm text-gray-600">{result.overall_sentiment}</p>
                      </div>
                    )}
                    
                    {result.confidence !== undefined && result.confidence !== null && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Confidence:</p>
                        <p className="text-sm text-gray-600">{result.confidence.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {result.sample_points && result.sample_points.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sample Points:</p>
                        <div className="space-y-2">
                          {result.sample_points.map((point, index) => (
                            <div key={index} className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600">{point.description}</p>
                              <div className="flex space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  ID: {point.painpoint_id}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.sample_items && result.sample_items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sample Items:</p>
                        <div className="space-y-2">
                          {result.sample_items.map((item, index) => (
                            <div key={index} className="bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600">{item.description}</p>
                              <div className="flex space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  ID: {item.action_id}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {item.status}
                                </Badge>
                                {item.owner_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    Owner: {item.owner_id}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.sample_solutions && result.sample_solutions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">AI-Generated Solutions:</p>
                        <div className="space-y-3">
                          {result.sample_solutions.map((solution, index) => (
                            <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-semibold text-green-800">{solution.title || 'Solution'}</h4>
                                <Badge variant="success" className="text-xs">
                                  {solution.source === 'openai' ? 'AI Generated' : 'Generated'}
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                                {solution.description || 'No description available'}
                              </p>
                              
                              {solution.implementation_steps && solution.implementation_steps.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Implementation Steps:</p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {solution.implementation_steps.slice(0, 3).map((step, stepIndex) => (
                                      <li key={stepIndex} className="flex items-start">
                                        <span className="text-green-600 mr-1">•</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                    {solution.implementation_steps.length > 3 && (
                                      <li className="text-gray-500 italic">...and {solution.implementation_steps.length - 3} more steps</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                              
                              {solution.expected_outcome && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Expected Outcome:</p>
                                  <p className="text-xs text-gray-600 italic">{solution.expected_outcome}</p>
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {solution.category || 'general'}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {solution.difficulty || 'medium'}
                                </Badge>
                                {solution.priority && (
                                  <Badge 
                                    variant={solution.priority === 'high' ? 'error' : solution.priority === 'medium' ? 'warning' : 'secondary'} 
                                    className="text-xs"
                                  >
                                    {solution.priority} priority
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  Score: {((solution.relevance_score || 0.8) * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show message if no solutions available */}
                    {(!result.sample_solutions || result.sample_solutions.length === 0) && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No solutions generated yet</p>
                        <p className="text-xs text-gray-400 mt-1">Solutions will appear here after processing</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default ModelTestResults;

/**
 * Live Recording Component
 * Handles real-time call recording with live transcription
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { apiService } from '../services/api';

interface TranscriptionSegment {
  start_time: number;
  end_time: number;
  text: string;
  chunk_index: number;
}

interface SentimentData {
  sentiment: string;
  confidence: number;
  emotions?: Record<string, number>;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  sessionId: string | null;
  duration: number;
  transcript: string;
  segments: TranscriptionSegment[];
  currentSentiment: SentimentData | null;
  sentimentHistory: SentimentData[];
  error: string | null;
}

const LiveRecording: React.FC = () => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    sessionId: null,
    duration: 0,
    transcript: '',
    segments: [],
    currentSentiment: null,
    sentimentHistory: [],
    error: null,
  });

  const [meetingName, setMeetingName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const chunkIntervalRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    };
  }, []);

  // Format duration display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Start recording session on backend
      const response = await apiService.startRecording({
        meeting_name: meetingName || 'Untitled Meeting',
        started_at: new Date().toISOString(),
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to start recording session');
      }

      const sessionId = response.data.session_id;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);

          // Send chunk to backend for transcription
          try {
            const chunkResponse = await apiService.uploadAudioChunk(
              sessionId,
              event.data
            );

            if (chunkResponse.success && chunkResponse.data?.text) {
              const newSentiment = chunkResponse.data.sentiment;
              
              setState((prev) => ({
                ...prev,
                transcript: prev.transcript + ' ' + chunkResponse.data!.text,
                segments: [
                  ...prev.segments,
                  {
                    start_time: chunkResponse.data!.timestamp,
                    end_time: chunkResponse.data!.timestamp,
                    text: chunkResponse.data!.text,
                    chunk_index: prev.segments.length,
                  },
                ],
                currentSentiment: newSentiment || prev.currentSentiment,
                sentimentHistory: newSentiment 
                  ? [...prev.sentimentHistory, newSentiment]
                  : prev.sentimentHistory,
              }));
            }
          } catch (error) {
            console.error('Error processing audio chunk:', error);
          }
        }
      };

      // Start recording in chunks (every 3 seconds)
      mediaRecorder.start();
      chunkIntervalRef.current = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.requestData();
        }
      }, 3000);

      // Update state
      setState((prev) => ({
        ...prev,
        isRecording: true,
        sessionId,
        duration: 0,
        transcript: '',
        segments: [],
      }));

      // Start duration timer
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime) / 1000),
        }));
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start recording. Please check microphone permissions.',
      }));
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      setIsProcessing(true);

      // Stop timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Stop recording session on backend
      if (state.sessionId) {
        const response = await apiService.stopRecording(state.sessionId);

        if (response.success && response.data) {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            transcript: response.data!.transcript,
            segments: response.data!.segments || prev.segments,
          }));

          setCallId(response.data.call_id);
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset recording
  const resetRecording = () => {
    setState({
      isRecording: false,
      isPaused: false,
      sessionId: null,
      duration: 0,
      transcript: '',
      segments: [],
      currentSentiment: null,
      sentimentHistory: [],
      error: null,
    });
    setCallId(null);
    setMeetingName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Live Call Recording & Transcription
        </h1>
        <p className="text-gray-600">
          Record your meeting in real-time with live AI transcription
        </p>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mic className="w-5 h-5 mr-2" />
            Recording Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meeting Name Input */}
          {!state.isRecording && !callId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Name (Optional)
              </label>
              <input
                type="text"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Enter meeting name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Recording Status */}
          <div className="flex items-center justify-center space-x-6 py-6">
            {state.isRecording ? (
              <>
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-red-500 animate-pulse" />
                  <Badge variant="error">Recording</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-2xl font-mono font-bold text-gray-900">
                    {formatDuration(state.duration)}
                  </span>
                </div>
              </>
            ) : callId ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <Badge variant="success">Recording Complete</Badge>
              </div>
            ) : (
              <Badge variant="secondary">Ready to Record</Badge>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!state.isRecording && !callId && (
              <Button
                onClick={startRecording}
                className="flex items-center"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {state.isRecording && (
              <Button
                onClick={stopRecording}
                disabled={isProcessing}
                variant="destructive"
                className="flex items-center"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Square className="w-5 h-5 mr-2" />
                )}
                {isProcessing ? 'Processing...' : 'Stop Recording'}
              </Button>
            )}

            {callId && (
              <Button
                onClick={resetRecording}
                variant="outline"
                className="flex items-center"
              >
                Start New Recording
              </Button>
            )}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="text-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Finalizing recording and running AI analysis...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-Time Sentiment Analysis */}
      {state.isRecording && state.currentSentiment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Real-Time Sentiment Analysis
              <Badge variant="error" className="ml-auto">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Sentiment */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Current Sentiment</div>
              <div className="flex items-center justify-center space-x-3">
                <Badge 
                  variant={
                    state.currentSentiment.sentiment === 'positive' ? 'success' :
                    state.currentSentiment.sentiment === 'negative' ? 'error' :
                    'secondary'
                  }
                  className="text-lg px-4 py-2"
                >
                  {state.currentSentiment.sentiment.toUpperCase()}
                </Badge>
                <span className="text-2xl font-bold text-gray-900">
                  {(state.currentSentiment.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Confidence Level
              </div>
            </div>

            {/* Sentiment History */}
            {state.sentimentHistory.length > 1 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Sentiment Timeline ({state.sentimentHistory.length} segments)
                </div>
                <div className="flex space-x-1 h-12 items-end">
                  {state.sentimentHistory.slice(-20).map((sentiment, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-all ${
                        sentiment.sentiment === 'positive' 
                          ? 'bg-green-400' 
                          : sentiment.sentiment === 'negative' 
                          ? 'bg-red-400' 
                          : 'bg-gray-300'
                      }`}
                      style={{
                        height: `${Math.max(20, sentiment.confidence * 100)}%`,
                        opacity: 0.7 + (idx / state.sentimentHistory.slice(-20).length) * 0.3
                      }}
                      title={`${sentiment.sentiment}: ${(sentiment.confidence * 100).toFixed(0)}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Earlier</span>
                  <span>Recent</span>
                </div>
              </div>
            )}

            {/* Emotions (if available) */}
            {state.currentSentiment.emotions && Object.keys(state.currentSentiment.emotions).length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Detected Emotions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(state.currentSentiment.emotions)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([emotion, score]) => (
                      <div key={emotion} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm capitalize">{emotion}</span>
                        <span className="text-sm font-semibold text-gray-700">
                          {(score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Transcription */}
      {(state.isRecording || state.transcript) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Live Transcription
              {state.isRecording && (
                <Badge variant="error" className="ml-auto">
                  Live
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              {state.transcript ? (
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {state.transcript}
                </p>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-center text-gray-500">
                    <Mic className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    <p>Listening... Speak to see transcription</p>
                  </div>
                </div>
              )}
            </div>

            {/* Segments Info */}
            {state.segments.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Transcription segments: {state.segments.length}</p>
                <p>Total duration: {formatDuration(state.duration)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {callId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Recording Saved Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-700">
              Your recording has been saved and analyzed with AI. The call has been
              processed for pain points, sentiment, and action items.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Call ID:</span>
              <Badge variant="secondary">{callId}</Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => window.location.href = `/calls/${callId}`}
                variant="primary"
              >
                View Call Details
              </Button>
              <Button
                onClick={resetRecording}
                variant="outline"
              >
                Record Another Call
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!state.isRecording && !callId && (
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Enter an optional meeting name to identify your recording</li>
              <li>Click "Start Recording" to begin capturing audio</li>
              <li>
                Speak naturally - the AI will transcribe your speech in real-time
              </li>
              <li>Click "Stop Recording" when your meeting is complete</li>
              <li>
                The system will automatically analyze the recording for pain points,
                sentiment, and generate action items
              </li>
              <li>View the complete analysis in the call details page</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveRecording;

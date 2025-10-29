/**
 * Audio Transcription Component
 * Handles audio recording, file upload, and transcription using the backend API
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { apiService, type TranscriptionResult } from '../services/api';

interface AudioTranscriptionProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onTranscriptChange?: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

const AudioTranscription: React.FC<AudioTranscriptionProps> = ({
  onTranscriptionComplete,
  onTranscriptChange,
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { 
          type: 'audio/webm;codecs=opus' 
        });
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setError(null);
        setTranscriptionResult(null);
      } else {
        setError('Please select a valid audio file.');
      }
    }
  }, []);

  const transcribeAudio = useCallback(async () => {
    if (!audioFile) {
      setError('Please record or upload an audio file first.');
      return;
    }

    try {
      setIsTranscribing(true);
      setError(null);
      
      const response = await apiService.transcribeAudio(audioFile, 'en');
      
      if (response.success && response.data) {
        setTranscriptionResult(response.data);
        onTranscriptionComplete?.(response.data);
        onTranscriptChange?.(response.data.text);
      } else {
        throw new Error('Transcription failed');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioFile, onTranscriptionComplete, onTranscriptChange]);

  const playAudio = useCallback(() => {
    if (audioFile && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioFile, isPlaying]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const clearAudio = useCallback(() => {
    setAudioFile(null);
    setTranscriptionResult(null);
    setError(null);
    stopAudio();
  }, [stopAudio]);

  const downloadTranscript = useCallback(() => {
    if (transcriptionResult) {
      const blob = new Blob([transcriptionResult.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [transcriptionResult]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Audio Input Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            <span>Audio Input</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recording Controls */}
            <div className="flex items-center space-x-4">
              <Button
                variant={isRecording ? "error" : "primary"}
                icon={isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled || isTranscribing}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={disabled || isTranscribing}
                  className="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>

            {/* Audio File Display */}
            {audioFile && (
              <div className="p-4 bg-secondary-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-secondary-600" />
                    <span className="text-sm font-medium">{audioFile.name}</span>
                    <Badge variant="secondary" size="sm">
                      {formatFileSize(audioFile.size)}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      onClick={playAudio}
                      disabled={disabled || isTranscribing}
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Square className="h-4 w-4" />}
                      onClick={stopAudio}
                      disabled={disabled || isTranscribing}
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={clearAudio}
                      disabled={disabled || isTranscribing}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                
                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={audioFile ? URL.createObjectURL(audioFile) : undefined}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* Transcription Button */}
            {audioFile && (
              <Button
                icon={isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                onClick={transcribeAudio}
                disabled={disabled || isTranscribing}
                className="w-full"
              >
                {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Transcription Results */}
      {transcriptionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success-600" />
                <span>Transcription Results</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="h-4 w-4" />}
                onClick={downloadTranscript}
                disabled={disabled}
              >
                Download
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Transcript Text */}
              <div className="p-4 bg-secondary-50 rounded-lg">
                <p className="text-sm text-secondary-700 whitespace-pre-wrap">
                  {transcriptionResult.text}
                </p>
              </div>

              {/* Transcription Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="font-medium text-primary-700">Confidence</p>
                  <p className="text-lg font-bold text-primary-900">
                    {(transcriptionResult.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-success-50 rounded-lg">
                  <p className="font-medium text-success-700">Duration</p>
                  <p className="text-lg font-bold text-success-900">
                    {formatDuration(transcriptionResult.duration)}
                  </p>
                </div>
                <div className="p-3 bg-warning-50 rounded-lg">
                  <p className="font-medium text-warning-700">Language</p>
                  <p className="text-lg font-bold text-warning-900">
                    {transcriptionResult.language}
                  </p>
                </div>
                <div className="p-3 bg-info-50 rounded-lg">
                  <p className="font-medium text-info-700">Model Used</p>
                  <p className="text-sm font-bold text-info-900">
                    {transcriptionResult.model_used}
                  </p>
                </div>
              </div>

              {/* Segments */}
              {transcriptionResult.segments && transcriptionResult.segments.length > 0 && (
                <div>
                  <h4 className="font-medium text-secondary-700 mb-2">Segments</h4>
                  <div className="space-y-2">
                    {transcriptionResult.segments.map((segment, index) => (
                      <div key={index} className="p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary-500">
                            {formatDuration(segment.start)} - {formatDuration(segment.end)}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {(segment.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-secondary-700">{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AudioTranscription;
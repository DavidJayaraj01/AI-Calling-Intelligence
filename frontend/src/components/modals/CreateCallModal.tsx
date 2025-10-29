import React, { useState } from 'react';
import { X, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import AudioTranscription from '../AudioTranscription';
import type { TranscriptionResult } from '../../services/api';

interface CreateCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallCreated?: (callData: any) => void;
}

const CreateCallModal: React.FC<CreateCallModalProps> = ({
  isOpen,
  onClose,
  onCallCreated
}) => {
  const [step, setStep] = useState(1);
  const [callData, setCallData] = useState({
    distributorId: '',
    vendorId: '',
    seedBrief: '',
    transcript: '',
    metadata: {} as Record<string, any>
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleTranscriptionComplete = (transcription: TranscriptionResult) => {
    setCallData(prev => ({
      ...prev,
      transcript: transcription.text,
      metadata: {
        ...prev.metadata,
        transcriptionConfidence: transcription.confidence,
        duration: transcription.duration,
        language: transcription.language,
        modelUsed: transcription.model_used
      }
    }));
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // Here you would call the API to process the call
      // const result = await apiService.processCall(callData);
      
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onCallCreated?.(callData);
      onClose();
      setStep(1);
      setCallData({
        distributorId: '',
        vendorId: '',
        seedBrief: '',
        transcript: '',
        metadata: {}
      });
    } catch (error) {
      console.error('Error processing call:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Call Record
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {step} of 2: {step === 1 ? 'Audio Transcription' : 'Call Details'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Upload or Record Audio
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Upload an audio file or record directly to generate a transcript using our local AI model.
                </p>
                
                <AudioTranscription
                  onTranscriptionComplete={handleTranscriptionComplete}
                  className="space-y-4"
                />
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => setStep(2)}
                      disabled={!callData.transcript}
                    >
                      Continue to Details
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Call Details
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Provide additional information about the call before processing.
                  </p>
                </div>

                {/* Transcript Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Generated Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-md p-4 max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {callData.transcript}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Confidence: {((callData.metadata.transcriptionConfidence || 0) * 100).toFixed(1)}%
                      {' • '}
                      Duration: {(callData.metadata.duration || 0).toFixed(1)}s
                      {' • '}
                      Model: {callData.metadata.modelUsed}
                    </div>
                  </CardContent>
                </Card>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distributor *
                    </label>
                    <select
                      value={callData.distributorId}
                      onChange={(e) => setCallData(prev => ({ ...prev, distributorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Distributor</option>
                      <option value="dist-1">TechDistrib Solutions</option>
                      <option value="dist-2">Global Partners Inc</option>
                      <option value="dist-3">Regional Systems Ltd</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor *
                    </label>
                    <select
                      value={callData.vendorId}
                      onChange={(e) => setCallData(prev => ({ ...prev, vendorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Vendor</option>
                      <option value="vendor-1">CloudTech Systems</option>
                      <option value="vendor-2">DataFlow Solutions</option>
                      <option value="vendor-3">InnovateSoft</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call Brief/Summary
                  </label>
                  <textarea
                    value={callData.seedBrief}
                    onChange={(e) => setCallData(prev => ({ ...prev, seedBrief: e.target.value }))}
                    placeholder="Provide a brief summary of the call purpose and key topics discussed..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back to Audio
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!callData.distributorId || !callData.vendorId || isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Call...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Process Call with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCallModal;

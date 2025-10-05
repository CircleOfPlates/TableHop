import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input } from './ui';
import { matchingApi } from '../lib/api';
import type { OptInRequest } from '../lib/api';
import { toast } from 'sonner';

interface OptInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  onSuccess: () => void;
}



export function OptInDialog({ isOpen, onClose, eventId, eventDate, eventStartTime, eventEndTime, onSuccess }: OptInDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OptInRequest>({
    hostingAvailable: false,
  });
  const [partnerEmail, setPartnerEmail] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        hostingAvailable: false,
      });
      setPartnerEmail('');
    }
  }, [isOpen]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData: OptInRequest = {
        ...formData,
        partnerEmail: partnerEmail.trim() || undefined,
      };

      await matchingApi.optIn(eventId, submitData);
      toast.success('Successfully opted in for matching!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Opt-in error:', error);
      
      // Parse the error message from the response
      let errorMessage = 'Failed to opt in. Please try again.';
      
      try {
        // Try to parse the error response as JSON
        const errorData = JSON.parse(error.message);
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // If parsing fails, use the raw error message
        if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold">
              Opt In for Matching
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                You're opting in for the dinner event on{' '}
                <span className="font-medium">{new Date(eventDate).toLocaleDateString()}</span>.
                We'll match you with other participants based on your preferences.
              </p>
              
              {/* Event Date and Time Display */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📅</span>
                    <span className="font-medium">
                      {new Date(eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🕒</span>
                    <span className="font-medium">
                      {eventStartTime} - {eventEndTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner (Optional)
              </label>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter partner's email address..."
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Enter your partner's email address. If they don't have an account, we'll create a guest account and invite them to sign up.
                </p>
              </div>
            </div>

            {/* Hosting Availability */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hostingAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, hostingAvailable: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  I'm available to host
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Hosts provide the venue and coordinate the dinner experience
              </p>
            </div>



            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Opting In...' : 'Opt In'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

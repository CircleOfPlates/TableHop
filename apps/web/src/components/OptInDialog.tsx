import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button, Input } from './ui';
import { matchingApi, eventsApi } from '../lib/api';
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
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerResults, setPartnerResults] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [selectedPartner, setSelectedPartner] = useState<{ id: number; name: string } | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        hostingAvailable: false,
      });
      setPartnerSearch('');
      setPartnerResults([]);
      setSelectedPartner(null);
    }
  }, [isOpen]);

  const handlePartnerSearch = async (query: string) => {
    if (query.length < 2) {
      setPartnerResults([]);
      return;
    }

    try {
      const data = await eventsApi.searchPartners(query);
      setPartnerResults(data);
    } catch (error) {
      console.error('Partner search error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData: OptInRequest = {
        ...formData,
        partnerId: selectedPartner?.id,
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
                  type="text"
                  placeholder="Search for partner by name or email..."
                  value={partnerSearch}
                  onChange={(e) => {
                    setPartnerSearch(e.target.value);
                    handlePartnerSearch(e.target.value);
                  }}
                />
                {partnerResults.length > 0 && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {partnerResults.map((partner) => (
                      <button
                        key={partner.id}
                        type="button"
                        onClick={() => {
                          setSelectedPartner(partner);
                          setPartnerSearch(partner.name);
                          setPartnerResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm text-gray-500">{partner.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPartner && (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm">
                      Partner: <span className="font-medium">{selectedPartner.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPartner(null);
                        setPartnerSearch('');
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
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

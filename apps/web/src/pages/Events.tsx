import { useState, useEffect } from 'react'
import { Card, Button } from '../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, matchingApi } from '../lib/api'
import type { MatchingStatus } from '../lib/api'
import { toast } from 'sonner'

import AuthGuard from '../components/AuthGuard'
import { OptInDialog } from '../components/OptInDialog'
import { CircleDetails } from '../components/CircleDetails'
import { 
  CheckCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline'

interface Event {
  id: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  totalSpots: number
  spotsRemaining: number
  format: 'matching'
  neighbourhood: string
  matchingStatus: 'open' | 'matching' | 'closed'
  optInCount: number
  circleCount: number
  createdAt: string
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isOptInOpen, setIsOptInOpen] = useState(false)
  const [selectedEventStatus, setSelectedEventStatus] = useState<MatchingStatus | null>(null)
  const [optedInEvents, setOptedInEvents] = useState<Set<number>>(new Set())
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<Event[]>('/api/events'),
  })

  // Fetch user's events to check participation (only for events with completed matching)
  const { data: userEvents } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => api<any[]>('/api/events/my-events'),
  })

  // Create a set of event IDs that the user is already participating in (after matching)
  const userParticipatingEventIds = new Set(userEvents?.map((event: any) => event.id) || [])

  const optOutMutation = useMutation({
    mutationFn: (eventId: number) => matchingApi.optOut(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['user-events'] })
      // Remove from opted-in events
      setOptedInEvents(prev => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
      toast.success('Successfully opted out of matching!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to opt out')
    },
  })

  const handleOptIn = (event: Event) => {
    setSelectedEvent(event)
    setIsOptInOpen(true)
  }

  const handleOptOut = (eventId: number) => {
    if (confirm('Are you sure you want to opt out of this event? This will also remove your partner if you have one.')) {
      optOutMutation.mutate(eventId)
    }
  }

  const handleOptInSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
    queryClient.invalidateQueries({ queryKey: ['user-events'] })
    // Re-check opted-in events after successful opt-in
    if (selectedEvent) {
      setOptedInEvents(prev => new Set([...prev, selectedEvent.id]))
    }
  }

  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatEventTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }



  const getMatchingStatus = async (eventId: number) => {
    try {
      const status = await matchingApi.getStatus(eventId)
      setSelectedEventStatus(status)
    } catch (error) {
      console.error('Failed to get matching status:', error)
    }
  }

  // Check if user has opted in for a specific event
  const checkUserOptIn = async (eventId: number): Promise<boolean> => {
    try {
      const participation = await api(`/api/events/${eventId}/my-participation`)
      return participation !== null
    } catch (error) {
      return false
    }
  }

  // Check which events the user has opted in for
  useEffect(() => {
    const checkOptedInEvents = async () => {
      if (!events) return
      
      const optedInSet = new Set<number>()
      for (const event of events) {
        const isOptedIn = await checkUserOptIn(event.id)
        if (isOptedIn) {
          optedInSet.add(event.id)
        }
      }
      setOptedInEvents(optedInSet)
    }

    checkOptedInEvents()
  }, [events])

  return (
    <AuthGuard>
      <div className="container py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium">
            <span>❤️</span>
            Your Next Adventure Awaits
          </div>
          
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              FIND YOUR NEXT<br />
              DINNER PARTY
            </h1>
            <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
              Join neighbors for unforgettable evenings of <strong>great food, genuine conversation, and lasting connections</strong> right in your neighborhood.
            </p>
          </div>

          {/* Statistics */}
          <div className="flex justify-center items-center gap-8 md:gap-12 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.9</div>
              <div className="text-sm text-gray-600">⭐ average rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">would attend again</div>
            </div>
          </div>
        </div>

        

        {/* Events List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-8">
            {/* Catchy Message */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Exciting Dinner Adventures Await!
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Ready to create unforgettable memories with amazing neighbors? Choose your perfect dinner date and let the magic begin!
              </p>
            </div>

            {/* Events Grid */}
            <div className="grid gap-4">
            {events.map((event) => {
              const isOptedIn = optedInEvents.has(event.id)
              const isParticipating = userParticipatingEventIds.has(event.id)
              const isInvolved = isOptedIn || isParticipating
              
              return (
                <Card key={event.id} className="p-4">
                  <div className="flex items-center justify-between">
                                         <div className="flex-1">
                       <div className="flex items-center gap-4">
                         <span className="text-sm text-gray-600">
                           {formatEventDate(event.date)} • {formatEventTime(event.startTime, event.endTime)}
                         </span>
                         {isInvolved && (
                           <div className="flex items-center gap-2 text-green-600">
                             <CheckCircleIcon className="w-4 h-4" />
                             <span className="text-sm font-medium">
                               {isParticipating ? 'Matched' : 'Opted In'}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>

                    <div className="flex gap-2">
                      {isInvolved ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleOptOut(event.id)}
                            disabled={optOutMutation.isPending}
                            className="text-sm px-3 py-1"
                          >
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Opt Out
                          </Button>
                          {event.matchingStatus === 'closed' && isParticipating && (
                            <Button
                              variant="outline"
                              onClick={() => getMatchingStatus(event.id)}
                              className="text-sm px-3 py-1"
                            >
                              View Circle
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={() => handleOptIn(event)}
                          disabled={event.matchingStatus !== 'open'}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Join us on {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
            </div>
          </div>
        ) : (
          <Card className="bg-gray-50 border-gray-200">
            <div className="p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                NEW DINNER PARTIES COMING<br />
                SOON!
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                We're working on scheduling new dinner parties in your area. Check back soon or join our waitlist to be notified first!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-red-600 hover:bg-red-700">
                  Join Waitlist
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Back to Home
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Opt In Dialog */}
        {selectedEvent && (
          <OptInDialog
            isOpen={isOptInOpen}
            onClose={() => {
              setIsOptInOpen(false)
              setSelectedEvent(null)
            }}
            eventId={selectedEvent.id}
            eventDate={selectedEvent.date}
            eventStartTime={selectedEvent.startTime}
            eventEndTime={selectedEvent.endTime}
            onSuccess={handleOptInSuccess}
          />
        )}

        {/* Circle Details Dialog */}
        {selectedEventStatus?.userCircle && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Circle Details</h2>
                  <button
                    onClick={() => setSelectedEventStatus(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                                         <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <CircleDetails
                  circle={selectedEventStatus.userCircle}
                  currentUserId={1} // TODO: Get from auth context
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}



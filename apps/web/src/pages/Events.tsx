import { useState } from 'react'
import { Card, Button, Badge } from '../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import AuthGuard from '../components/AuthGuard'
import { Calendar, Clock, MapPin, Users, ChefHat, Home } from 'lucide-react'

interface Event {
  id: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  totalSpots: number
  spotsRemaining: number
  format: 'rotating' | 'hosted'
  neighbourhood: string
  isWaitlist: boolean
  createdAt: string
}

interface EventRegistration {
  eventId: number
  coursePreference?: 'starter' | 'main' | 'dessert'
  bringPartner: boolean
  partnerName?: string
  partnerEmail?: string
}

export default function Events() {
  const { user } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [registrationData, setRegistrationData] = useState<EventRegistration>({
    eventId: 0,
    coursePreference: undefined,
    bringPartner: false,
  })
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<Event[]>('/api/events'),
  })

  const registerMutation = useMutation({
    mutationFn: (data: EventRegistration) =>
      api('/api/events/register', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setIsRegistrationOpen(false)
      setSelectedEvent(null)
      toast.success('Successfully registered for event!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to register for event')
    },
  })

  const handleRegister = (event: Event) => {
    setSelectedEvent(event)
    setRegistrationData({ ...registrationData, eventId: event.id })
    setIsRegistrationOpen(true)
  }

  const handleSubmitRegistration = () => {
    if (!registrationData.eventId) {
      toast.error('Please select an event')
      return
    }

    if (selectedEvent?.format === 'rotating' && !registrationData.coursePreference) {
      toast.error('Please select a course preference for rotating dinners')
      return
    }

    if (registrationData.bringPartner && (!registrationData.partnerName || !registrationData.partnerEmail)) {
      toast.error('Please provide partner details')
      return
    }

    registerMutation.mutate(registrationData)
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

  const getEventStatus = (event: Event) => {
    if (event.isWaitlist) return { text: 'Waitlist', color: 'bg-yellow-100 text-yellow-800' }
    if (event.spotsRemaining === 0) return { text: 'Full', color: 'bg-red-100 text-red-800' }
    if (event.spotsRemaining <= 3) return { text: 'Few Spots Left', color: 'bg-orange-100 text-orange-800' }
    return { text: 'Available', color: 'bg-green-100 text-green-800' }
  }

  return (
    <AuthGuard>
      <div className="container py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Dinner Events</h1>
          <p className="text-muted-foreground mt-2">
            Join your neighbors for memorable dining experiences in your community
          </p>
        </div>

        {/* Event Formats Explanation */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Rotating Dinners</h3>
              </div>
              <p className="text-muted-foreground">
                Experience three courses across different homes. Each participant hosts one course
                and enjoys all three. Perfect for meeting multiple neighbors!
              </p>
              <ul className="text-sm space-y-1">
                <li>• Starter at first host's home</li>
                <li>• Main course at second host's home</li>
                <li>• Dessert at third host's home</li>
                <li>• Partners required for rotating format</li>
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Hosted Dinners</h3>
              </div>
              <p className="text-muted-foreground">
                Traditional dinner party hosted by one neighbor. All courses served at one location
                with optional contributions from guests.
              </p>
              <ul className="text-sm space-y-1">
                <li>• All courses at host's home</li>
                <li>• Optional partner/guest</li>
                <li>• More intimate experience</li>
                <li>• Guests can contribute dishes</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Available Events</h2>
          
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-8 bg-muted rounded animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          ) : events?.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Events Available</h3>
                <p className="text-muted-foreground">
                  Check back soon for upcoming dinner events in your neighborhood!
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events?.map((event) => {
                const status = getEventStatus(event)
                return (
                  <Card key={event.id} className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge className={status.color}>{status.text}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{event.description}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatEventTime(event.startTime, event.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{event.neighbourhood}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{event.spotsRemaining} of {event.totalSpots} spots available</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {event.format} format
                      </Badge>
                      <Button
                        onClick={() => handleRegister(event)}
                        disabled={event.spotsRemaining === 0 && !event.isWaitlist}
                        className="w-full"
                      >
                        {event.spotsRemaining === 0 && !event.isWaitlist ? 'Full' : 'Register'}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Registration Modal */}
        {isRegistrationOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-semibold">Register for Event</h3>
              <p className="text-sm text-muted-foreground">{selectedEvent.title}</p>

              {selectedEvent.format === 'rotating' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course Preference (Required)</label>
                  <select
                    value={registrationData.coursePreference || ''}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      coursePreference: e.target.value as 'starter' | 'main' | 'dessert'
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select course preference</option>
                    <option value="starter">Starter (Appetizers)</option>
                    <option value="main">Main Course</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={registrationData.bringPartner}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      bringPartner: e.target.checked
                    })}
                  />
                  <span className="text-sm font-medium">
                    {selectedEvent.format === 'rotating' ? 'Bring Partner (Required)' : 'Bring Partner (Optional)'}
                  </span>
                </label>
              </div>

              {registrationData.bringPartner && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Partner Name"
                    value={registrationData.partnerName || ''}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      partnerName: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="Partner Email"
                    value={registrationData.partnerEmail || ''}
                    onChange={(e) => setRegistrationData({
                      ...registrationData,
                      partnerEmail: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsRegistrationOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitRegistration}
                  disabled={registerMutation.isPending}
                  className="flex-1"
                >
                  {registerMutation.isPending ? 'Registering...' : 'Register'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}



import { useState } from 'react'
import { Card, Button, Badge } from '../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'sonner'

import AuthGuard from '../components/AuthGuard'
import { Calendar, Clock, MapPin, Users, ChefHat, Home, Search } from 'lucide-react'

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

interface User {
  id: number
  username: string
  name: string
  email: string
}

interface EventRegistration {
  eventId: number
  coursePreference?: 'starter' | 'main' | 'dessert'
  isHost?: boolean
  partnerId?: number
}

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [registrationData, setRegistrationData] = useState<EventRegistration>({
    eventId: 0,
    coursePreference: undefined,
    isHost: false,
  })
  const [partnerSearch, setPartnerSearch] = useState('')
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const queryClient = useQueryClient()

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<Event[]>('/api/events'),
  })

  // Fetch user's events to check participation
  const { data: userEvents } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => api<any[]>('/api/events/my-events'),
  })

  // Create a set of event IDs that the user is already participating in
  const userParticipatingEventIds = new Set(userEvents?.map((event: any) => event.id) || [])

  const registerMutation = useMutation({
    mutationFn: (data: EventRegistration) =>
      api(`/api/events/${data.eventId}/join`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['user-events'] })
      setIsRegistrationOpen(false)
      setSelectedEvent(null)
      setPartnerSearch('')
      setFilteredUsers([])
      toast.success('Successfully registered for event!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to register for event')
    },
  })

  const handleRegister = (event: Event) => {
    setSelectedEvent(event)
    setRegistrationData({ 
      eventId: event.id,
      coursePreference: undefined,
      isHost: false,
    })
    setIsRegistrationOpen(true)
  }

  const handlePartnerSearch = async (searchTerm: string) => {
    setPartnerSearch(searchTerm)
    
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setFilteredUsers([])
      setShowPartnerDropdown(false)
      return
    }

    try {
      const response = await api<User[]>(`/api/events/partners/search?q=${encodeURIComponent(searchTerm.trim())}`)
      setFilteredUsers(response)
      setShowPartnerDropdown(response.length > 0)
    } catch (error) {
      console.error('Partner search error:', error)
      setFilteredUsers([])
      setShowPartnerDropdown(false)
    }
  }

  const selectPartner = (user: User) => {
    setRegistrationData(prev => ({ ...prev, partnerId: user.id }))
    setPartnerSearch(user.name)
    setShowPartnerDropdown(false)
  }

  const handleSubmitRegistration = () => {
    if (!registrationData.eventId) {
      toast.error('Please select an event')
      return
    }

    if (selectedEvent?.format === 'rotating') {
      // For rotating dinners, course preference is required
      if (!registrationData.coursePreference) {
        toast.error('Please select a course preference for rotating dinners')
        return
      }
      
      // For rotating dinners, partner is required
      if (!registrationData.partnerId) {
        toast.error('Partner is required for rotating dinners. Please select a partner.')
        return
      }
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
            Join your neighbors for memorable dining experiences in your community. Only upcoming events are shown.
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
          <h2 className="text-2xl font-semibold">Upcoming Events</h2>
          
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
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground mb-4">
                  There are no upcoming dinner events scheduled at the moment.
                </p>
                <p className="text-sm text-muted-foreground">
                  Check back soon or consider hosting your own event to bring the community together!
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events?.map((event) => {
                const status = getEventStatus(event)
                return (
                  <Card key={event.id} className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <h3 className="font-semibold text-base sm:text-lg break-words">{event.title}</h3>
                        <Badge className={`${status.color} shrink-0`}>{status.text}</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{formatEventDate(event.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{formatEventTime(event.startTime, event.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{event.neighbourhood}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{event.spotsRemaining} of {event.totalSpots} spots available</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <Badge variant="outline" className="capitalize shrink-0 self-start">
                        {event.format} format
                      </Badge>
                      <Button
                        onClick={() => handleRegister(event)}
                        disabled={event.spotsRemaining === 0 && !event.isWaitlist || userParticipatingEventIds.has(event.id)}
                        className="w-full sm:w-auto"
                      >
                        {userParticipatingEventIds.has(event.id) 
                          ? 'Already Registered' 
                          : event.spotsRemaining === 0 && !event.isWaitlist 
                            ? 'Full' 
                            : 'Register'
                        }
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
            <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-semibold">Register for Event</h3>
                <p className="text-sm text-muted-foreground break-words">{selectedEvent.title}</p>

                {/* Course Preference - Only for rotating dinners */}
                {selectedEvent.format === 'rotating' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Course Preference (Required)
                    </label>
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
                    <p className="text-xs text-muted-foreground">
                      Note: Course preference is not guaranteed and will be assigned by the system
                    </p>
                  </div>
                )}

                {/* Partner Registration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Partner {selectedEvent.format === 'rotating' ? '(Required)' : '(Optional)'}
                  </label>
                  
                  <div className="relative">
                    <div className="flex items-center border rounded-md">
                      <Search className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search for a partner by name..."
                        value={partnerSearch}
                        onChange={(e) => handlePartnerSearch(e.target.value)}
                        onFocus={() => setShowPartnerDropdown(true)}
                        className="flex-1 px-3 py-2 outline-none min-w-0"
                      />
                    </div>
                    
                    {/* Partner Dropdown */}
                    {showPartnerDropdown && filteredUsers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectPartner(user)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                          >
                            <div className="font-medium truncate">{user.name}</div>
                            <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedEvent.format === 'hosted' && (
                    <p className="text-xs text-muted-foreground">
                      Optional: Bring a partner to share the experience
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRegistrationOpen(false)
                      setPartnerSearch('')
                      setFilteredUsers([])
                    }}
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
              </div>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}



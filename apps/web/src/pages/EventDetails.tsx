import { Card, Button, Badge } from '../components/ui'
import { useLocation, useRoute } from 'wouter'
import { toast } from 'sonner'
import AuthGuard from '../components/AuthGuard'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChefHat, 
  Users, 
  ArrowLeft,
  AlertTriangle,
  User,
  UserCheck
} from 'lucide-react'
import { useState } from 'react'

interface EventDetails {
  id: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  format: 'rotating' | 'hosted'
  neighbourhood: string
  coursePreference?: string
  isHost: boolean
  registeredAt: string
  partnerId?: number
  partnerName?: string
}

export default function EventDetails() {
  const [location, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const [isOptingOut, setIsOptingOut] = useState(false)
  
  // Extract event ID from URL params
  const [, params] = useRoute('/event/:id')
  const eventId = params?.id
  
  const { data: event, isLoading } = useQuery<EventDetails>({
    queryKey: ['event-details', eventId],
    queryFn: () => api(`/api/events/${eventId}`),
    enabled: !!eventId,
  })

  const { data: participants } = useQuery<any[]>({
    queryKey: ['event-participants', eventId],
    queryFn: () => api(`/api/events/${eventId}/participants`),
    enabled: !!eventId,
  })

  const { data: userParticipation } = useQuery<any>({
    queryKey: ['user-participation', eventId],
    queryFn: () => api(`/api/events/${eventId}/my-participation`),
    enabled: !!eventId,
    retry: false, // Don't retry if it fails
  })

  const optOutMutation = useMutation({
    mutationFn: () => api(`/api/events/${eventId}/leave`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Successfully opted out of the event')
      queryClient.invalidateQueries({ queryKey: ['user-events'] })
      queryClient.invalidateQueries({ queryKey: ['user-participation', eventId] })
      setLocation('/dashboard')
    },
    onError: (error) => {
      toast.error('Failed to opt out of the event')
      console.error('Opt out error:', error)
    },
  })

  const handleOptOut = async () => {
    if (!event) return
    
    setIsOptingOut(true)
    try {
      await optOutMutation.mutateAsync()
    } finally {
      setIsOptingOut(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="container py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => setLocation('/dashboard')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event details...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!event) {
    return (
      <AuthGuard>
        <div className="container py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => setLocation('/dashboard')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => setLocation('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const isUpcoming = new Date(event.date) > new Date()
  const participantCount = participants?.length || 0
  const participation = userParticipation



  return (
    <AuthGuard>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">Event Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Event Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold">Event Information</h2>
                <Badge variant={event.format === 'rotating' ? 'default' : 'outline'}>
                  {event.format === 'rotating' ? 'Rotating Dinner' : 'Hosted Dinner'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">{event.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{event.neighbourhood}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{participantCount} participants</span>
                  </div>
                </div>

                {participation?.coursePreference && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-muted-foreground" />
                    <span>Course Preference: <Badge variant="outline">{participation.coursePreference}</Badge></span>
                  </div>
                )}
              </div>
            </Card>

            {/* Your Participation */}
            {participation && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Participation</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>Registered on {new Date(participation.registeredAt).toLocaleDateString()}</span>
                  </div>
                  
                  {participation.isHost && (
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                      <span>You are hosting this event</span>
                    </div>
                  )}

                  {participation.partnerName && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span>Partner: {participation.partnerName}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Event Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={isUpcoming ? 'default' : 'outline'}>
                    {isUpcoming ? 'Upcoming' : 'Past'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Format:</span>
                  <span className="capitalize">{event.format}</span>
                </div>
                
                {participation && (
                  <div className="flex items-center justify-between">
                    <span>Role:</span>
                    <span>{participation.isHost ? 'Host' : 'Guest'}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              
              <div className="space-y-3">
                {isUpcoming && participation && (
                  <Button 
                    variant="outline" 
                    onClick={handleOptOut}
                    disabled={isOptingOut}
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    {isOptingOut ? 'Opting Out...' : 'Opt Out of Event'}
                  </Button>
                )}
                
                {isUpcoming && !participation && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    You are not participating in this event
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/events')}
                  className="w-full"
                >
                  Browse More Events
                </Button>
              </div>
            </Card>

            {/* Warning for Opting Out */}
            {isUpcoming && participation && (
              <Card className="p-4 border-amber-200 bg-amber-50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Opting out will:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Remove you from this event</li>
                      {participation.partnerName && <li>Also remove your partner ({participation.partnerName})</li>}
                      <li>Free up your spot for other participants</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

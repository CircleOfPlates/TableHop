import { useState } from 'react'
import { Card, Button, Input, Label, Dialog } from '../../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import AdminGuard from '../../components/AdminGuard'
import { useLocation, useRoute } from 'wouter'
import { ArrowLeftIcon, CheckIcon, CalendarIcon, ClockIcon, UsersIcon, MapPinIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface EventDetail {
  id: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  totalSpots: number
  spotsRemaining: number
  format: string
  neighbourhood: string
  createdAt: string
  updatedAt: string
  participants: Array<{
    id: number
    userId: number
    user: {
      name: string
      username: string
      email: string
    }
    partnerId?: number
    partner?: {
      name: string
      username: string
      email: string
    }
    coursePreference?: string
    createdAt: string
  }>
}

interface Neighbourhood {
  id: number
  name: string
  city: string
  state: string
  zip: string
}

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  neighbourhoodId: z.number().min(1, 'Neighbourhood is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  totalSpots: z.number().min(1, 'Total spots must be at least 1'),
  format: z.enum(['rotating', 'hosted']),
})

export default function AdminEventDetail() {
  const [, setLocation] = useLocation()
  const [, params] = useRoute('/admin/events/:id')
  const queryClient = useQueryClient()
  const [isPencilIconing, setIsPencilIconing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Extract event ID from URL params
  const eventId = params?.id

  const { data: event, isLoading, error } = useQuery<EventDetail>({
    queryKey: ['admin-event-detail', eventId],
    queryFn: () => api(`/api/admin/events/${eventId}`),
    enabled: !!eventId,
  })

  const { data: neighbourhoods } = useQuery({
    queryKey: ['admin-neighbourhoods'],
    queryFn: () => api<Neighbourhood[]>('/api/admin/neighbourhoods'),
  })

  const updateEventMutation = useMutation({
    mutationFn: (data: z.infer<typeof eventSchema>) =>
      api(`/api/admin/events/${eventId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-detail', eventId] })
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setIsPencilIconing(false)
      toast.success('Event updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update event')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: () => api(`/api/admin/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setLocation('/admin/events')
      toast.success('Event deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete event')
    },
  })

  const handleDeleteEvent = () => {
    deleteEventMutation.mutate()
  }

  if (error) {
    return (
      <AdminGuard>
        <div className="container py-6 sm:py-10 px-4 sm:px-6">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading event: {error.message}</p>
            <Button onClick={() => setLocation('/admin/events')} className="mt-4">
              Back to Events
            </Button>
          </div>
        </div>
      </AdminGuard>
    )
  }

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="container py-6 sm:py-10 px-4 sm:px-6">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="container py-6 sm:py-10 px-4 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin/events')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Events
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">{event?.title}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Event details and participant management
            </p>
          </div>
          {!isPencilIconing && event && (
            <div className="flex gap-2">
              <Button onClick={() => setIsPencilIconing(true)} className="flex items-center gap-2">
                <PencilIcon className="w-4 h-4" />
                PencilIcon Event
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {event && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Event Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-4 sm:p-6 space-y-6">
                  <h2 className="text-lg sm:text-xl font-semibold">Event Information</h2>

                  {isPencilIconing ? (
                    <PencilIconEventForm 
                      event={event}
                      neighbourhoods={neighbourhoods || []}
                      onSubmit={updateEventMutation.mutate}
                      isLoading={updateEventMutation.isPending}
                      onCancel={() => setIsPencilIconing(false)}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-base mt-1">{event.description}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Date
                          </label>
                          <p className="text-base font-medium mt-1">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            Time
                          </label>
                          <p className="text-base font-medium mt-1">{event.startTime} - {event.endTime}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <UsersIcon className="w-4 h-4" />
                            Spots
                          </label>
                          <p className="text-base font-medium mt-1">{event.spotsRemaining}/{event.totalSpots}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Format</label>
                          <p className="text-base font-medium mt-1 capitalize">{event.format}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          Neighbourhood
                        </label>
                        <p className="text-base font-medium mt-1">{event.neighbourhood}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Created</label>
                          <p className="text-sm mt-1">{new Date(event.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                          <p className="text-sm mt-1">{new Date(event.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Participants */}
              <Card>
                <div className="p-4 sm:p-6 space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Participants ({event.participants.length})</h2>
                  
                  {event.participants.length > 0 ? (
                    <div className="space-y-3">
                      {event.participants.map((participant) => (
                        <div key={participant.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">{participant.user.name}</div>
                              <div className="text-sm text-muted-foreground">{participant.user.email}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(participant.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {participant.partner && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Partner: </span>
                              <span className="font-medium">{participant.partner.name}</span>
                            </div>
                          )}
                          
                          {participant.coursePreference && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Course Preference: </span>
                              <span className="font-medium">{participant.coursePreference}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No participants yet</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card>
                <div className="p-4 sm:p-6 space-y-4">
                  <h3 className="font-semibold">Event Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Spots</span>
                      <span className="font-medium">{event.totalSpots}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Spots Remaining</span>
                      <span className="font-medium">{event.spotsRemaining}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Participants</span>
                      <span className="font-medium">{event.participants.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fill Rate</span>
                      <span className="font-medium">
                        {Math.round(((event.totalSpots - event.spotsRemaining) / event.totalSpots) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4 sm:p-6 space-y-4">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Export Participants
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Send Reminder
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      View Event Analytics
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <Dialog.Content className="max-w-md mx-4">
            <Dialog.Title>Delete Event</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete "{event?.title}"? This action cannot be undone and will remove all participant registrations.
            </Dialog.Description>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteEvent}
                disabled={deleteEventMutation.isPending}
                className="flex-1"
              >
                {deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </AdminGuard>
  )
}

function PencilIconEventForm({ 
  event, 
  neighbourhoods, 
  onSubmit, 
  isLoading, 
  onCancel 
}: { 
  event: EventDetail
  neighbourhoods: Neighbourhood[]
  onSubmit: (data: z.infer<typeof eventSchema>) => void
  isLoading: boolean
  onCancel: () => void
}) {
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      totalSpots: event.totalSpots,
      format: event.format as 'rotating' | 'hosted',
      neighbourhoodId: neighbourhoods.find(n => n.name === event.neighbourhood)?.id || 0,
    },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input {...form.register('title')} />
        {form.formState.errors.title && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <Label>Description</Label>
        <Input {...form.register('description')} />
        {form.formState.errors.description && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input type="date" {...form.register('date')} />
          {form.formState.errors.date && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>

        <div>
          <Label>Total Spots</Label>
          <Input type="number" {...form.register('totalSpots', { valueAsNumber: true })} />
          {form.formState.errors.totalSpots && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.totalSpots.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Start Time</Label>
          <Input type="time" {...form.register('startTime')} />
          {form.formState.errors.startTime && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.startTime.message}</p>
          )}
        </div>

        <div>
          <Label>End Time</Label>
          <Input type="time" {...form.register('endTime')} />
          {form.formState.errors.endTime && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.endTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label>Format</Label>
        <select {...form.register('format')} className="w-full px-3 py-2 border rounded-md">
          <option value="rotating">Rotating</option>
          <option value="hosted">Hosted</option>
        </select>
        {form.formState.errors.format && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.format.message}</p>
        )}
      </div>

      <div>
        <Label>Neighbourhood</Label>
        <select 
          {...form.register('neighbourhoodId', { valueAsNumber: true })} 
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select a neighbourhood</option>
          {neighbourhoods?.map((neighbourhood) => (
            <option key={neighbourhood.id} value={neighbourhood.id}>
              {neighbourhood.name}
            </option>
          ))}
        </select>
        {form.formState.errors.neighbourhoodId && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.neighbourhoodId.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          <CheckIcon className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'CheckIcon Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}

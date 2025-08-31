import { useState } from 'react'
import { Card, Button, Input, Label, Dialog } from '../../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, matchingApi } from '../../lib/api'
import { toast } from 'sonner'
import AdminGuard from '../../components/AdminGuard'
import { useLocation } from 'wouter'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  PlayIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface Event {
  id: number
  date: string
  startTime: string
  endTime: string
  matchingStatus: string
  matchingTriggeredAt: string | null
  matchingCompletedAt: string | null
  createdAt: string
  optInCount: number
  circleCount: number
}

// Neighbourhood interface removed - no longer needed for simplified event creation

const eventSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
})

export default function AdminEvents() {
  const [, setLocation] = useLocation()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isMatchingDialogOpen, setIsMatchingDialogOpen] = useState(false)
  const [selectedEventForMatching, setSelectedEventForMatching] = useState<Event | null>(null)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-events', page],
    queryFn: () => api<{ events: Event[], pagination: any }>(`/api/admin/events?page=${page}`),
  })

  // No longer need neighbourhoods for simplified event creation

  const createEventMutation = useMutation({
    mutationFn: (data: z.infer<typeof eventSchema>) =>
      api('/api/admin/events', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setIsCreateDialogOpen(false)
      toast.success('Event created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create event')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) =>
      api(`/api/admin/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      toast.success('Event deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete event')
    },
  })

  const triggerMatchingMutation = useMutation({
    mutationFn: (eventId: number) => matchingApi.triggerMatching(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] })
      setIsMatchingDialogOpen(false)
      setSelectedEventForMatching(null)
      toast.success('Matching triggered successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to trigger matching')
    },
  })

  // Helper functions
  const getNextUpcomingEvent = () => {
    if (!data?.events) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcomingEvents = data.events.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= today && event.matchingStatus === 'open'
    })
    
    return upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null
  }

  const handleTriggerMatching = (event: Event) => {
    setSelectedEventForMatching(event)
    setIsMatchingDialogOpen(true)
  }

  const confirmTriggerMatching = () => {
    if (selectedEventForMatching) {
      triggerMatchingMutation.mutate(selectedEventForMatching.id)
    }
  }

  const handleDeleteEvent = (eventId: number) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEventMutation.mutate(eventId)
    }
  }

  if (error) {
    return <div className="container py-10">Error loading events: {error.message}</div>
  }



  return (
    <AdminGuard>
      <div className="container py-6 sm:py-10 space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Create and manage dinner events</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          Create Event
        </Button>
      </div>

      {/* Next Upcoming Event Section */}
      {(() => {
        const nextEvent = getNextUpcomingEvent()
        if (!nextEvent) return null
        
        return (
          <Card className="border-blue-200 bg-blue-50">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-blue-900">Next Upcoming Event</h2>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {new Date(nextEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-blue-600">
                        {nextEvent.startTime} - {nextEvent.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-blue-700">
                      <span>Opt-ins: {nextEvent.optInCount}</span>
                      <span>Status: {nextEvent.matchingStatus}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleTriggerMatching(nextEvent)}
                    disabled={nextEvent.optInCount < 6 || triggerMatchingMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    {triggerMatchingMutation.isPending ? 'Triggering...' : 'Trigger Matching'}
                  </Button>
                  {nextEvent.optInCount < 6 && (
                    <div className="text-xs text-orange-600 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      Need at least 6 opt-ins
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })()}

      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table Headers - Hidden on Mobile */}
              <div className="hidden lg:grid grid-cols-6 gap-4 font-medium text-sm text-muted-foreground">
                <div>Date</div>
                <div>Time</div>
                <div>Status</div>
                <div>Opt-ins</div>
                <div>Circles</div>
                <div>Actions</div>
              </div>

              {data?.events?.map((event) => (
                <div key={event.id}>
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-6 gap-4 items-center py-3 border-b last:border-b-0">
                    <div className="text-sm">{new Date(event.date).toLocaleDateString()}</div>
                    <div className="text-sm">{event.startTime} - {event.endTime}</div>
                    <div className="text-sm capitalize">{event.matchingStatus}</div>
                    <div className="text-sm">{event.optInCount}</div>
                    <div className="text-sm">{event.circleCount}</div>
                                         <div className="flex gap-2">
                       <Button variant="outline"  onClick={() => setLocation(`/admin/events/${event.id}`)}>
                         Edit
                       </Button>
                       <Button variant="outline"  onClick={() => handleDeleteEvent(event.id)}>
                         Delete
                       </Button>
                     </div>
                  </div>

                  {/* Mobile Card Layout */}
                  <div className="lg:hidden border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-base truncate">{new Date(event.date).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">{event.startTime} - {event.endTime}</div>
                      </div>
                      <div className="ml-2 shrink-0">
                        <span className="text-xs px-2 py-1 bg-muted rounded capitalize">{event.matchingStatus}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Opt-ins:</span>
                        <div className="font-medium">{event.optInCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Circles:</span>
                        <div className="font-medium">{event.circleCount}</div>
                      </div>
                    </div>
                    
                                         <div className="flex gap-2 pt-2">
                       <Button variant="outline"  className="flex-1" onClick={() => setLocation(`/admin/events/${event.id}`)}>
                         Edit
                       </Button>
                       <Button variant="outline"  className="flex-1" onClick={() => handleDeleteEvent(event.id)}>
                         Delete
                       </Button>
                     </div>
                  </div>
                </div>
              ))}

              {data?.events?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No events found. Create your first event to get started.
                </div>
              )}
            </div>
          )}

          {data?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                {data.pagination.total} events
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  
                  disabled={page >= data.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Content className="max-h-[90vh] overflow-y-auto mx-4 max-w-lg">
          <Dialog.Title>Create New Event</Dialog.Title>
          <Dialog.Description>Fill in the details for the new dinner event.</Dialog.Description>
          <CreateEventForm 
            onSubmit={createEventMutation.mutate} 
            isLoading={createEventMutation.isPending}
          />
        </Dialog.Content>
      </Dialog.Root>

            {/* Matching Confirmation Dialog */}
      <Dialog.Root open={isMatchingDialogOpen} onOpenChange={setIsMatchingDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto mx-4 max-w-2xl z-50 border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 rounded-t-xl border-b border-red-100">
              <Dialog.Title className="text-red-700 font-bold text-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-red-600" />
                </div>
                Confirm Matching Trigger
              </Dialog.Title>
              <Dialog.Description className="text-red-600 mt-2 text-base">
                Are you sure you want to trigger matching for this event? This action cannot be undone.
              </Dialog.Description>
            </div>
            
            {/* Event Details Card */}
            {selectedEventForMatching && (
              <div className="px-6 py-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-blue-900 text-lg">Event Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Date:</span>
                        <span className="text-blue-900 font-semibold">
                          {new Date(selectedEventForMatching.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Time:</span>
                        <span className="text-blue-900 font-semibold">
                          {selectedEventForMatching.startTime} - {selectedEventForMatching.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Opt-ins:</span>
                        <span className="text-blue-900 font-semibold text-lg">
                          {selectedEventForMatching.optInCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700 font-medium">Status:</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                          {selectedEventForMatching.matchingStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Important Information */}
            <div className="px-6 py-2">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-5 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 text-lg mb-3">Important Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-orange-700 text-sm">Opt-ins will be closed for this event</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-orange-700 text-sm">Users will be grouped into circles of 6</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-orange-700 text-sm">Dinner format and roles will be assigned</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-orange-700 text-sm">This process cannot be reversed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMatchingDialogOpen(false)}
                  disabled={triggerMatchingMutation.isPending}
                  className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmTriggerMatching}
                  disabled={triggerMatchingMutation.isPending}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {triggerMatchingMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Triggering...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PlayIcon className="w-4 h-4" />
                      Yes, Trigger Matching
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </div>
    </AdminGuard>
  )
}

function CreateEventForm({ 
  onSubmit, 
  isLoading
}: { 
  onSubmit: (data: z.infer<typeof eventSchema>) => void, 
  isLoading: boolean
}) {
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Date</Label>
          <Input type="date" {...form.register('date')} />
          {form.formState.errors.date && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>

        <div>
          <Label>Start Time</Label>
          <Input type="time" {...form.register('startTime')} />
          {form.formState.errors.startTime && (
            <p className="text-red-600 text-sm mt-1">{form.formState.errors.startTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label>End Time</Label>
        <Input type="time" {...form.register('endTime')} />
        {form.formState.errors.endTime && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.endTime.message}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => form.reset()} className="w-full sm:w-auto">
          Reset
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}

import { useState } from 'react'
import { Card, Button, Input, Label, Dialog } from '../../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import AdminGuard from '../../components/AdminGuard'
import { useLocation } from 'wouter'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface Event {
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

export default function AdminEvents() {
  const [, setLocation] = useLocation()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-events', page],
    queryFn: () => api<{ events: Event[], pagination: any }>(`/api/admin/events?page=${page}`),
  })

  const { data: neighbourhoods } = useQuery({
    queryKey: ['admin-neighbourhoods'],
    queryFn: () => api<Neighbourhood[]>('/api/admin/neighbourhoods'),
  })

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
              <div className="hidden lg:grid grid-cols-7 gap-4 font-medium text-sm text-muted-foreground">
                <div>Title</div>
                <div>Date</div>
                <div>Time</div>
                <div>Spots</div>
                <div>Format</div>
                <div>Neighbourhood</div>
                <div>Actions</div>
              </div>

              {data?.events?.map((event) => (
                <div key={event.id}>
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-7 gap-4 items-center py-3 border-b last:border-b-0">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm">{new Date(event.date).toLocaleDateString()}</div>
                    <div className="text-sm">{event.startTime} - {event.endTime}</div>
                    <div className="text-sm">{event.spotsRemaining}/{event.totalSpots}</div>
                    <div className="text-sm capitalize">{event.format}</div>
                    <div className="text-sm">{event.neighbourhood}</div>
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
                        <div className="font-medium text-base truncate">{event.title}</div>
                        <div className="text-sm text-muted-foreground">{new Date(event.date).toLocaleDateString()}</div>
                      </div>
                      <div className="ml-2 shrink-0">
                        <span className="text-xs px-2 py-1 bg-muted rounded capitalize">{event.format}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="font-medium">{event.startTime} - {event.endTime}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Spots:</span>
                        <div className="font-medium">{event.spotsRemaining}/{event.totalSpots}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Neighbourhood:</span>
                        <div className="font-medium truncate">{event.neighbourhood}</div>
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
            neighbourhoods={neighbourhoods || []}
          />
        </Dialog.Content>
      </Dialog.Root>
      </div>
    </AdminGuard>
  )
}

function CreateEventForm({ 
  onSubmit, 
  isLoading, 
  neighbourhoods 
}: { 
  onSubmit: (data: z.infer<typeof eventSchema>) => void, 
  isLoading: boolean,
  neighbourhoods: Neighbourhood[]
}) {
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      format: 'rotating',
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
          {neighbourhoods?.map((neighbourhood: Neighbourhood) => (
            <option key={neighbourhood.id} value={neighbourhood.id}>
              {neighbourhood.name}
            </option>
          ))}
        </select>
        {form.formState.errors.neighbourhoodId && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.neighbourhoodId.message}</p>
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

import { Button, Card, Skeleton } from './ui'
import RegisterDialog from './RegisterDialog'
import { useState } from 'react'

export type EventItem = {
  id: number
  title: string
  description?: string | null
  date: string
  startTime: string
  endTime: string
  format: 'rotating' | 'hosted'
}

export function EventCard({ event }: { event: EventItem }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <div className="space-y-3">
        <div className="h-32 w-full rounded-md bg-muted" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight">{event.title}</h3>
            <p className="text-xs text-muted-foreground">{event.date} · {event.format === 'rotating' ? 'Rotating dinner' : 'Hosted dinner'}</p>
          </div>
        </div>
        <Button className="w-full" onClick={() => setOpen(true)}>Register</Button>
      </div>
      <RegisterDialog open={open} onOpenChange={setOpen} event={event} />
    </Card>
  )
}

export function EventCardSkeleton() {
  return (
    <Card>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  )
}



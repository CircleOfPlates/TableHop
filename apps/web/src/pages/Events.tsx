import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import PageHeader from '../components/PageHeader'
import { EventCard, EventCardSkeleton } from '../components/EventCard'

type Event = {
  id: number
  title: string
  description: string | null
  date: string
  startTime: string
  endTime: string
  format: 'rotating' | 'hosted'
}

export default function Events() {
  const { data, isLoading } = useQuery({ queryKey: ['events'], queryFn: () => api<Event[]>('/api/events') })
  return (
    <div>
      <PageHeader title="Find events" subtitle="Browse upcoming dinners in your neighbourhood" />
      <div className="container pb-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        {data?.map((e) => <EventCard key={e.id} event={e as any} />)}
      </div>
    </div>
  )
}



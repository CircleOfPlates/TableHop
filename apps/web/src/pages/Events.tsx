import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Button, Card } from '../components/ui'

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
    <div className="container py-10">
      <h1 className="text-2xl font-semibold">Find events</h1>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Card key={i}><div className="h-40 animate-pulse bg-muted rounded" /></Card>)}
        {data?.map((e) => (
          <Card key={e.id}>
            <div className="space-y-2">
              <div className="h-28 bg-muted rounded-md" />
              <h3 className="font-medium">{e.title}</h3>
              <p className="text-sm text-muted-foreground">{e.date} · {e.format === 'rotating' ? 'Rotating dinner' : 'Hosted dinner'}</p>
              <Button className="w-full">View details</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}



import { Card, Button } from '../../components/ui'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import AdminGuard from '../../components/AdminGuard'
import { useState } from 'react'

interface OverviewData {
  totalUsers: number
  totalEvents: number
  totalParticipants: number
  totalTestimonials: number
  recentUsers: number
  recentEvents: number
}

interface NeighbourhoodStats {
  id: number
  name: string
  city: string
  userCount: number
  eventCount: number
  participantCount: number
}

interface EngagementData {
  dailyRegistrations: Array<{ date: string; count: number }>
  dailyParticipations: Array<{ date: string; count: number }>
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState(30)

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => api<{ overview: OverviewData }>('/api/admin/analytics/overview'),
  })

  const { data: neighbourhoodStats, isLoading: neighbourhoodLoading } = useQuery({
    queryKey: ['admin-analytics-neighbourhoods'],
    queryFn: () => api<NeighbourhoodStats[]>('/api/admin/analytics/neighbourhoods'),
  })

  const { data: engagement, isLoading: engagementLoading } = useQuery({
    queryKey: ['admin-analytics-engagement', timeRange],
    queryFn: () => api<EngagementData>(`/api/admin/analytics/engagement?days=${timeRange}`),
  })

  return (
    <AdminGuard>
      <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">Platform metrics and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Total Users</h3>
            <p className="text-3xl font-bold">
              {overviewLoading ? '...' : overview?.overview.totalUsers.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              +{overview?.overview.recentUsers || 0} this month
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Total Events</h3>
            <p className="text-3xl font-bold">
              {overviewLoading ? '...' : overview?.overview.totalEvents.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              +{overview?.overview.recentEvents || 0} this month
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Total Participants</h3>
            <p className="text-3xl font-bold">
              {overviewLoading ? '...' : overview?.overview.totalParticipants.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Average per event: {overview?.overview.totalEvents ? Math.round(overview.overview.totalParticipants / overview.overview.totalEvents) : 0}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Testimonials</h3>
            <p className="text-3xl font-bold">
              {overviewLoading ? '...' : overview?.overview.totalTestimonials.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Engagement rate: {overview?.overview.totalUsers ? Math.round((overview.overview.totalTestimonials / overview.overview.totalUsers) * 100) : 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Neighbourhood Stats */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Neighbourhood Performance</h2>
          {neighbourhoodLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 font-medium text-sm text-muted-foreground">
                <div>Neighbourhood</div>
                <div>Users</div>
                <div>Events</div>
                <div>Participants</div>
              </div>

              {neighbourhoodStats?.map((neighbourhood) => (
                <div key={neighbourhood.id} className="grid grid-cols-4 gap-4 items-center py-3 border-b last:border-b-0">
                  <div className="font-medium">{neighbourhood.name}</div>
                  <div className="text-sm">{neighbourhood.userCount}</div>
                  <div className="text-sm">{neighbourhood.eventCount}</div>
                  <div className="text-sm">{neighbourhood.participantCount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Engagement Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Registrations</h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            {engagementLoading ? (
              <div className="h-64 bg-muted rounded animate-pulse" />
            ) : (
              <div className="h-64 flex items-end justify-between gap-1">
                {engagement?.dailyRegistrations.map((day) => (
                  <div
                    key={day.date}
                    className="bg-primary rounded-t"
                    style={{
                      height: `${Math.max((day.count / Math.max(...engagement.dailyRegistrations.map(d => d.count))) * 200, 4)}px`,
                      width: `${100 / engagement.dailyRegistrations.length}%`,
                    }}
                    title={`${day.date}: ${day.count} registrations`}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Event Participations</h2>
            {engagementLoading ? (
              <div className="h-64 bg-muted rounded animate-pulse" />
            ) : (
              <div className="h-64 flex items-end justify-between gap-1">
                {engagement?.dailyParticipations.map((day) => (
                  <div
                    key={day.date}
                    className="bg-secondary rounded-t"
                    style={{
                      height: `${Math.max((day.count / Math.max(...engagement.dailyParticipations.map(d => d.count))) * 200, 4)}px`,
                      width: `${100 / engagement.dailyParticipations.length}%`,
                    }}
                    title={`${day.date}: ${day.count} participations`}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.open('/admin/users', '_blank')}>
              View All Users
            </Button>
            <Button variant="outline" onClick={() => window.open('/admin/events', '_blank')}>
              View All Events
            </Button>
            <Button variant="outline" onClick={() => window.open('/admin/matching', '_blank')}>
              Trigger Matching
            </Button>
          </div>
        </div>
      </Card>
      </div>
    </AdminGuard>
  )
}

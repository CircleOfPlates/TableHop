import { Card, Button, Progress, Badge } from '../components/ui'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import ProfileCompletionBanner from '../components/ProfileCompletionBanner'
import AuthGuard from '../components/AuthGuard'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChefHat, 
  Award, 
  TrendingUp, 
  Users, 
  Target,
  Plus,
  ArrowRight,
  Trophy,
  Activity
} from 'lucide-react'

export default function Dashboard() {
  const [location, setLocation] = useLocation()
  const isWelcome = location.includes('welcome=true')
  
  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => api<any[]>('/api/events/my-events'),
  })

  const { data: pointsData, isLoading: pointsLoading } = useQuery<any>({
    queryKey: ['user-points'],
    queryFn: () => api('/api/rewards/points'),
  })

  const { data: badges, isLoading: badgesLoading } = useQuery<any[]>({
    queryKey: ['user-badges'],
    queryFn: () => api('/api/rewards/badges/progress'),
  })
  
  if (isWelcome) {
    toast.success('Welcome to TableHop! Your profile is complete.')
  }

  const earnedBadges = badges?.filter(b => b.earned) || []
  const recentBadges = earnedBadges.slice(0, 3)
  const upcomingEvents = userEvents?.filter((event: any) => new Date(event.date) > new Date()) || []
  const nextEvent = upcomingEvents[0]

  return (
    <AuthGuard>
      <div className="container py-8 space-y-8">
        <ProfileCompletionBanner />
        
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">Ready to discover amazing dining experiences?</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setLocation('/events')}>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-sm">Browse Events</h3>
            </div>
          </div>

          <div className="card p-4 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setLocation('/rewards')}>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-green-200 transition-colors">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-sm">Rewards</h3>
            </div>
          </div>

          <div className="card p-4 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setLocation('/profile')}>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-200 transition-colors">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-sm">Profile</h3>
            </div>
          </div>

          <div className="card p-4 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setLocation('/events')}>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-orange-200 transition-colors">
                <Plus className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-medium text-sm">Host Event</h3>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Points Card */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">Points Balance</h3>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/rewards')}
                className="text-green-600 hover:text-green-700 border-green-300"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-green-700">
                {pointsLoading ? '...' : pointsData?.currentPoints || 0}
              </div>
              <div className="text-sm text-green-600">
                Total earned: {pointsData?.totalPointsEarned || 0}
              </div>
              <div className="h-2 rounded-full bg-green-200">
                <div 
                  className="h-2 bg-green-500 rounded-full transition-all" 
                  style={{ 
                    width: `${pointsData?.totalPointsEarned ? Math.min((pointsData.currentPoints / pointsData.totalPointsEarned) * 100, 100) : 0}%` 
                  }} 
                />
              </div>
            </div>
          </Card>

          {/* Badges Card */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800">Badges Earned</h3>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/rewards')}
                className="text-purple-600 hover:text-purple-700 border-purple-300"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="text-3xl font-bold text-purple-700">
                {badgesLoading ? '...' : earnedBadges.length}
              </div>
              <div className="text-sm text-purple-600">
                {badges?.length || 0} total available
              </div>
              <div className="flex gap-2">
                {badgesLoading ? (
                  <>
                    <div className="h-8 w-8 bg-purple-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-purple-200 rounded animate-pulse" />
                  </>
                ) : recentBadges.map((badge) => (
                  <div key={badge.id} className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center text-lg hover:scale-110 transition-transform">
                    {badge.icon}
                  </div>
                ))}
                {earnedBadges.length > 3 && (
                  <div className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center text-xs font-medium text-purple-600">
                    +{earnedBadges.length - 3}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Next Event Card */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-orange-800">Next Event</h3>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/events')}
                className="text-orange-600 hover:text-orange-700 border-orange-300"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {nextEvent ? (
                <>
                  <div className="font-semibold text-orange-800 truncate">
                    {nextEvent.title}
                  </div>
                  <div className="text-sm text-orange-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(nextEvent.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {nextEvent.neighbourhood}
                    </div>
                  </div>
                  {nextEvent.courseAssigned && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <ChefHat className="w-3 h-3 mr-1" />
                      Hosting: {nextEvent.courseAssigned}
                    </Badge>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="text-sm text-orange-600">No upcoming events</div>
                  <Button 
                    className="mt-2 bg-orange-600 hover:bg-orange-700"
                    onClick={() => setLocation('/events')}
                  >
                    Find Events
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* My Events Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">My Events</h2>
            </div>
            <Button onClick={() => setLocation('/events')} className="bg-blue-600 hover:bg-blue-700">
              Browse All Events
            </Button>
          </div>
          
          {eventsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : userEvents && userEvents.length > 0 ? (
            <div className="space-y-4">
              {userEvents.slice(0, 3).map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{event.title}</h4>
                      <Badge variant="outline" className="capitalize">
                        {event.format} format
                      </Badge>
                      {event.courseAssigned && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <ChefHat className="w-3 h-3 mr-1" />
                          {event.courseAssigned}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.neighbourhood}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setLocation('/events')}>
                    View Details
                  </Button>
                </div>
              ))}
              {userEvents.length > 3 && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => setLocation('/events')}>
                    View all {userEvents.length} events
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-6">Start your dining adventure by joining your first event!</p>
              <Button onClick={() => setLocation('/events')} className="bg-blue-600 hover:bg-blue-700">
                Browse Events
              </Button>
            </div>
          )}
        </Card>

        {/* Profile Completion */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-amber-800">Profile Completion</h2>
            </div>
            <div className="text-sm text-amber-600">67% Complete</div>
          </div>
          <p className="text-amber-700 mb-4">Complete your profile to improve matching and unlock more features.</p>
          <Progress.Root className="relative h-3 w-full overflow-hidden rounded-full bg-amber-200 mb-4">
            <Progress.Indicator className="h-full bg-amber-500 transition-transform" style={{ transform: 'translateX(0%)', width: '67%' }} />
          </Progress.Root>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/profile')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Edit Profile
            </Button>
            <Button 
              onClick={() => setLocation('/profile')}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Complete Setup
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userEvents?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Events Joined</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{earnedBadges.length}</div>
            <div className="text-sm text-muted-foreground">Badges Earned</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{pointsData?.currentPoints || 0}</div>
            <div className="text-sm text-muted-foreground">Points Balance</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{upcomingEvents.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming Events</div>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}



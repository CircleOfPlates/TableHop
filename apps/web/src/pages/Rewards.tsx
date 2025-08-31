import { useState } from 'react'
import { Card, Button, Badge, Progress } from '../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { toast } from 'sonner'
import AuthGuard from '../components/AuthGuard'
import { TagIcon, ChartBarIcon, StarIcon, BoltIcon, TrophyIcon } from '@heroicons/react/24/outline'

interface Badge {
  id: string
  name?: string
  badgeType?: string
  description?: string
  icon?: string
  category?: string
  earned: boolean
  progress: number
  current: number
  required: number
  StarIconedAt?: string
}

interface PointsData {
  currentPoints: number
  totalPointsEarned: number
  transactions: Array<{
    id: number
    pointsEarned: number
    reason: string
    details?: string
    createdAt: string
    event?: {
      id: number
      title: string
    }
  }>
}

interface LeaderboardEntry {
  userId: number
  points: number
  totalPointsEarned: number
  user?: {
    id: number
    name?: string
    username?: string
  }
}

export default function Rewards() {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'leaderboard' | 'transactions'>('overview')
  const queryClient = useQueryClient()

  const { data: pointsData, isLoading: pointsLoading } = useQuery<PointsData>({
    queryKey: ['user-points'],
    queryFn: () => api('/api/rewards/points'),
  })

  const { data: badges, isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ['user-badges'],
    queryFn: () => api('/api/rewards/badges/progress'),
  })

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: () => api('/api/rewards/leaderboard'),
  })

  const checkBadgesMutation = useMutation({
    mutationFn: () => api('/api/rewards/badges/check', { method: 'POST' }),
    onSuccess: (data: any) => {
      if (data.count > 0) {
        toast.success(`🎉 ${data.count} new badge${data.count > 1 ? 's' : ''} earned!`)
        queryClient.invalidateQueries({ queryKey: ['user-badges'] })
      } else {
        toast.info('No new badges to StarIcon yet. Keep participating!')
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to check badges')
    },
  })

  const earnedBadges = badges?.filter(b => b.earned && (b.name || b.badgeType)) || []
  const inProgressBadges = badges?.filter(b => !b.earned && b.progress > 0 && (b.name || b.badgeType)) || []
  const lockedBadges = badges?.filter(b => !b.earned && b.progress === 0 && (b.name || b.badgeType)) || []



  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'hosting': return 'text-orange-600 bg-orange-100'
      case 'community': return 'text-blue-600 bg-blue-100'
      case 'milestone': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <AuthGuard>
      <div className="container py-6 sm:py-10 space-y-6 sm:space-y-8 px-4 sm:px-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Rewards & Achievements</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Track your progress, earn badges, and compete on the leaderboard
          </p>
        </div>

        {/* Points Overview Card */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BoltIcon className="w-6 h-6 text-yellow-500" />
                  {pointsLoading ? '...' : (pointsData as any)?.currentPoints || 0} Points
                </h2>
                <p className="text-muted-foreground">
                  Total earned: {pointsLoading ? '...' : (pointsData as any)?.totalPointsEarned || 0} points
                </p>
              </div>
              <Button
                onClick={() => checkBadgesMutation.mutate()}
                disabled={checkBadgesMutation.isPending}
                className="flex items-center gap-2"
              >
                <TagIcon className="w-4 h-4" />
                {checkBadgesMutation.isPending ? 'Checking...' : 'Check Badges'}
              </Button>
            </div>

            {/* Badge Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{earnedBadges.length}</div>
                <div className="text-sm text-green-700">Earned Badges</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{inProgressBadges.length}</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{lockedBadges.length}</div>
                <div className="text-sm text-gray-700">Locked</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: <ChartBarIcon className="w-4 h-4" /> },
            { id: 'badges', label: 'Badges', icon: <StarIcon className="w-4 h-4" /> },
            { id: 'leaderboard', label: 'Leaderboard', icon: <TrophyIcon className="w-4 h-4" /> },
            { id: 'transactions', label: 'History', icon: <TagIcon className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none min-w-0 ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Badges */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <StarIcon className="w-5 h-5" />
                  Recent Badges
                </h3>
                {badgesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : earnedBadges.length > 0 ? (
                  <div className="space-y-3">
                    {earnedBadges.slice(0, 3).map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="text-2xl">{badge.icon || '🏆'}</div>
                        <div className="flex-1">
                          <div className="font-medium">{badge.name || badge.badgeType?.replace(/_/g, ' ') || 'Unknown Badge'}</div>
                          <div className="text-sm text-muted-foreground">{badge.description || 'No description available'}</div>
                        </div>
                        <Badge className={getCategoryColor(badge.category)}>
                          {badge.category || 'general'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <StarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No badges earned yet</p>
                    <p className="text-sm">Participate in events to earn your first badge!</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Leaderboard Preview */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5" />
                  Top Contributors
                </h3>
                {leaderboardLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.filter(entry => entry && entry.userId).slice(0, 5).map((entry, index) => (
                      <div key={entry.userId} className="flex items-center gap-3 p-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{entry.user?.name || entry.user?.username || 'Unknown User'}</div>
                        </div>
                        <div className="text-sm font-medium">{entry.points || 0} pts</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrophyIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No leaderboard data yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-green-600">🏆 Earned Badges</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earnedBadges.map((badge) => (
                      <div key={badge.id} className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                        <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
                        <div className="font-semibold">{badge.name || badge.badgeType?.replace(/_/g, ' ') || 'Unknown Badge'}</div>
                        <div className="text-sm text-muted-foreground mb-2">{badge.description || 'No description available'}</div>
                        <Badge className="bg-green-100 text-green-800">
                          Earned
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* In Progress Badges */}
            {inProgressBadges.length > 0 && (
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600">🎯 In Progress</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressBadges.map((badge) => (
                      <div key={badge.id} className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                        <div className="text-3xl mb-2">{badge.icon || '🎯'}</div>
                        <div className="font-semibold">{badge.name || badge.badgeType?.replace(/_/g, ' ') || 'Unknown Badge'}</div>
                        <div className="text-sm text-muted-foreground mb-2">{badge.description || 'No description available'}</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{badge.current || 0}/{badge.required || 1}</span>
                          </div>
                          <Progress.Root className="h-2 bg-blue-200 rounded-full">
                            <Progress.Indicator 
                              className="h-2 bg-blue-600 rounded-full transition-all"
                              style={{ width: `${badge.progress || 0}%` }}
                            />
                          </Progress.Root>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Locked Badges */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-600">🔒 Locked Badges</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedBadges.map((badge) => (
                    <div key={badge.id} className="p-4 border-2 border-gray-200 bg-gray-50 rounded-lg opacity-60">
                      <div className="text-3xl mb-2">{badge.icon || '🔒'}</div>
                      <div className="font-semibold">{badge.name || badge.badgeType?.replace(/_/g, ' ') || 'Unknown Badge'}</div>
                      <div className="text-sm text-muted-foreground mb-2">{badge.description || 'No description available'}</div>
                      <div className="text-xs text-muted-foreground">
                        Requires: {badge.required || 1} events
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrophyIcon className="w-5 h-5" />
                Community Leaderboard
              </h3>
              {leaderboardLoading ? (
                <div className="space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.filter(entry => entry && entry.userId).map((entry, index) => (
                    <div key={entry.userId} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{entry.user?.name || entry.user?.username || 'Unknown User'}</div>
                        <div className="text-sm text-muted-foreground">
                          Total earned: {entry.totalPointsEarned || 0} points
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.points || 0}</div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrophyIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data available</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Points History
              </h3>
              {pointsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : pointsData?.transactions && pointsData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {pointsData.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{transaction.reason}</div>
                        {transaction.event && (
                          <div className="text-sm text-muted-foreground">
                            Event: {transaction.event.title}
                          </div>
                        )}
                        {transaction.details && (
                          <div className="text-sm text-muted-foreground">
                            {transaction.details}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">+{transaction.pointsEarned}</div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transaction history yet</p>
                  <p className="text-sm">Participate in events to start earning points!</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}

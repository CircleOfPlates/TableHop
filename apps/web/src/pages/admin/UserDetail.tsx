import { useState } from 'react'
import { Card, Button, Input, DropdownMenu } from '../../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import AdminGuard from '../../components/AdminGuard'
import { useLocation, useRoute } from 'wouter'
import { ArrowLeftIcon, CheckIcon, UserIcon, EnvelopeIcon, MapPinIcon, CalendarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

interface UserDetail {
  id: number
  username: string
  email: string
  name: string
  role: string
  neighbourhood: string
  createdAt: string
  updatedAt: string
  eventsParticipated: number
  totalPoints: number
  badgesEarned: number
}

export default function AdminUserDetail() {
  const [, setLocation] = useLocation()
  const [, params] = useRoute('/admin/users/:id')
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<UserDetail>>({})

  // Extract user ID from URL params
  const userId = params?.id

  const { data: user, isLoading, error } = useQuery<UserDetail>({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => api(`/api/admin/users/${userId}`),
    enabled: !!userId,
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number, data: any }) =>
      api(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setIsEditing(false)
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user')
    },
  })

  const handleSave = () => {
    if (!userId) return
    updateUserMutation.mutate({ userId: parseInt(userId), data: editData })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  if (error) {
    return (
      <AdminGuard>
        <div className="container py-6 sm:py-10 px-4 sm:px-6">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading user: {error.message}</p>
            <Button onClick={() => setLocation('/admin/users')} className="mt-4">
              Back to Users
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
            onClick={() => setLocation('/admin/Users')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage User account and permissions
            </p>
          </div>
        </div>

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main User Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Basic Information
                    </h2>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit User
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        {isEditing ? (
                          <Input
                            value={editData.name || user.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{user.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">username</label>
                        {isEditing ? (
                          <Input
                            value={editData.username || user.username}
                            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                            className="mt-1"
                          />
                        ) : (
                          <p className="text-base font-medium mt-1">{user.username}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        email Address
                      </label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editData.email || user.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-base font-medium mt-1">{user.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        Neighbourhood
                      </label>
                      {isEditing ? (
                        <Input
                          value={editData.neighbourhood || user.neighbourhood}
                          onChange={(e) => setEditData({ ...editData, neighbourhood: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-base font-medium mt-1">{user.neighbourhood || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <ShieldCheckIcon className="w-4 h-4" />
                        Role
                      </label>
                      {isEditing ? (
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <Button variant="outline" className="mt-1 w-full justify-start">
                              {editData.role || user.role}
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            <DropdownMenu.Item onClick={() => setEditData({ ...editData, role: 'User' })}>
                              User
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={() => setEditData({ ...editData, role: 'admin' })}>
                              Admin
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      ) : (
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          Created
                        </label>
                        <p className="text-sm mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                        <p className="text-sm mt-1">{new Date(user.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card>
                <div className="p-4 sm:p-6 space-y-4">
                  <h3 className="font-semibold">User Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Events Participated</span>
                      <span className="font-medium">{user.eventsParticipated}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Points</span>
                      <span className="font-medium">{user.totalPoints}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Badges Earned</span>
                      <span className="font-medium">{user.badgesEarned}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4 sm:p-6 space-y-4">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      View User Events
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      View User Points
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      View User Badges
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}

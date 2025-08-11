import { useState } from 'react'
import { Card, Button, Input, DropdownMenu } from '../../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import AdminGuard from '../../components/AdminGuard'

interface User {
  id: number
  username: string
  email: string
  name: string
  role: string
  neighbourhood: string
  createdAt: string
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, search, role],
    queryFn: () => api<{ users: User[], pagination: any }>(`/api/admin/users?page=${page}&search=${search}&role=${role}`),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number, data: any }) =>
      api(`/api/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user')
    },
  })

  const handleUpdateUser = (userId: number, field: string, value: string) => {
    updateUserMutation.mutate({ userId, data: { [field]: value } })
  }

  if (error) {
    return <div className="container py-10">Error loading users: {error.message}</div>
  }

  return (
    <AdminGuard>
      <div className="container py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage user accounts and roles</p>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4 font-medium text-sm text-muted-foreground">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Neighbourhood</div>
                <div>Joined</div>
                <div>Actions</div>
              </div>

              {data?.users.map((user) => (
                <div key={user.id} className="grid grid-cols-6 gap-4 items-center py-3 border-b last:border-b-0">
                  <div className="font-medium">{user.name || user.username}</div>
                  <div className="text-sm">{user.email}</div>
                  <div>
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                                                 <Button variant="outline">
                          {user.role}
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item onClick={() => handleUpdateUser(user.id, 'role', 'user')}>
                          User
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => handleUpdateUser(user.id, 'role', 'admin')}>
                          Admin
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  </div>
                  <div className="text-sm">{user.neighbourhood || '-'}</div>
                  <div className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</div>
                  <div>
                                         <Button variant="outline" onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data?.pagination && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                {data.pagination.total} users
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
      </div>
    </AdminGuard>
  )
}

import { useState } from 'react'
import { Card, Button, Input, Label, Dialog } from '../../components/ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import AdminGuard from '../../components/AdminGuard'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

interface AdminUser {
  id: number
  username: string
  email: string
  name: string
  role: string
  createdAt: string
}

const createAdminSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export default function AdminAdmins() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: admins, isLoading, error } = useQuery({
    queryKey: ['admin-admins'],
    queryFn: () => api<{ users: AdminUser[], pagination: any }>('/api/admin/users?role=admin'),
  })

  const createAdminMutation = useMutation({
    mutationFn: (data: z.infer<typeof createAdminSchema>) =>
      api('/api/admin/admins', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admins'] })
      setIsCreateDialogOpen(false)
      toast.success('Admin user created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create admin user')
    },
  })

  if (error) {
    return <div className="container py-10">Error loading admin users: {error.message}</div>
  }

  return (
    <AdminGuard>
      <div className="container py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin User Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage admin accounts</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Admin User
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground">
                <div>Name</div>
                <div>Username</div>
                <div>Email</div>
                <div>Created</div>
                <div>Actions</div>
              </div>

              {admins?.users.map((admin) => (
                <div key={admin.id} className="grid grid-cols-5 gap-4 items-center py-3 border-b last:border-b-0">
                  <div className="font-medium">{admin.name}</div>
                  <div className="text-sm">{admin.username}</div>
                  <div className="text-sm">{admin.email}</div>
                  <div className="text-sm">{new Date(admin.createdAt).toLocaleDateString()}</div>
                  <div>
                    <Button variant="outline" disabled>
                      Admin
                    </Button>
                  </div>
                </div>
              ))}

              {admins?.users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No admin users found
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Dialog.Content>
                            <Dialog.Title>Create New Admin User</Dialog.Title>
                  <Dialog.Description>Create a new admin account with full platform access.</Dialog.Description>
          <CreateAdminForm onSubmit={createAdminMutation.mutate} isLoading={createAdminMutation.isPending} />
        </Dialog.Content>
      </Dialog.Root>
      </div>
    </AdminGuard>
  )
}

function CreateAdminForm({ onSubmit, isLoading }: { onSubmit: (data: z.infer<typeof createAdminSchema>) => void, isLoading: boolean }) {
  const form = useForm<z.infer<typeof createAdminSchema>>({
    resolver: zodResolver(createAdminSchema),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Full Name</Label>
        <Input {...form.register('name')} placeholder="Enter full name" />
        {form.formState.errors.name && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label>Username</Label>
        <Input {...form.register('username')} placeholder="Enter username" />
        {form.formState.errors.username && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div>
        <Label>Email</Label>
        <Input type="email" {...form.register('email')} placeholder="Enter email address" />
        {form.formState.errors.email && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <Label>Password</Label>
        <Input type="password" {...form.register('password')} placeholder="Enter password" />
        {form.formState.errors.password && (
          <p className="text-red-600 text-sm mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Admin Privileges</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Full access to user management</li>
          <li>• Create and manage events</li>
          <li>• View platform analytics</li>
          <li>• Create other admin users</li>
          <li>• Trigger matching algorithms</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Admin User'}
        </Button>
      </div>
    </form>
  )
}

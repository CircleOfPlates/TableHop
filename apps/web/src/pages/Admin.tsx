import { Card, Button } from '../components/ui'
import { useLocation } from 'wouter'
import AdminGuard from '../components/AdminGuard'

export default function Admin() {
  const [, setLocation] = useLocation()

  return (
    <AdminGuard>
      <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage users, circles, and platform analytics</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">User Management</h3>
            <p className="text-sm text-muted-foreground">Manage user accounts, roles, and profiles</p>
            <Button onClick={() => setLocation('/admin/users')} className="w-full">
              Manage Users
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Circle Management</h3>
            <p className="text-sm text-muted-foreground">Create, edit, and manage dinner circles</p>
            <Button onClick={() => setLocation('/admin/events')} className="w-full">
              Manage Circles
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Analytics</h3>
            <p className="text-sm text-muted-foreground">View platform metrics and insights</p>
            <Button onClick={() => setLocation('/admin/analytics')} className="w-full">
              View Analytics
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-2">
            <h3 className="font-semibold">Admin Users</h3>
            <p className="text-sm text-muted-foreground">Create and manage admin accounts</p>
            <Button onClick={() => setLocation('/admin/admins')} className="w-full">
              Manage Admins
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" onClick={() => setLocation('/admin/events')} className="w-full">
                Create New Circle
              </Button>
              <Button variant="outline" onClick={() => setLocation('/admin/admins')} className="w-full">
                Create Admin User
              </Button>
              <Button variant="outline" onClick={() => setLocation('/admin/events')} className="w-full">
                Trigger Matching
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <h3 className="font-semibold">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>New user registrations</span>
                <span className="text-muted-foreground">Loading...</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Circles created</span>
                <span className="text-muted-foreground">Loading...</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active participants</span>
                <span className="text-muted-foreground">Loading...</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </AdminGuard>
  )
}

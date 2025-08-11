import { useAuth } from '../auth/AuthContext'
import { Card, Button } from '../components/ui'
import { api } from '../lib/api'

export default function AuthTest() {
  const { user, isLoading, login, logout } = useAuth()

  const testAuthMe = async () => {
    try {
      console.log('🧪 Testing /api/auth/me...')
      const result = await api('/api/auth/me')
      console.log('✅ /api/auth/me result:', result)
    } catch (error) {
      console.error('❌ /api/auth/me failed:', error)
    }
  }

  const testLogin = async () => {
    try {
      console.log('🧪 Testing login...')
      await login('admin', 'admin123')
      console.log('✅ Login test completed')
    } catch (error) {
      console.error('❌ Login test failed:', error)
    }
  }

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Test Page</h1>
      
      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Current State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
            <p><strong>User ID:</strong> {user?.id || 'null'}</p>
            <p><strong>User Role:</strong> {user?.role || 'null'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Test Actions</h2>
          <div className="flex gap-2">
            <Button onClick={testAuthMe}>Test /api/auth/me</Button>
            <Button onClick={testLogin}>Test Login</Button>
            <Button onClick={logout}>Logout</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          <div className="flex gap-2">
            <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
            <a href="/profile" className="btn btn-primary">Go to Profile</a>
            <a href="/admin" className="btn btn-primary">Go to Admin</a>
          </div>
        </div>
      </Card>
    </div>
  )
}

import { useAuth } from '../auth/AuthContext'
import { useLocation } from 'wouter'
import { useEffect } from 'react'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminGuard({ children, fallback = <div className="container py-10">Loading...</div> }: AdminGuardProps) {
  const { user, isLoading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      console.log('🚫 AdminGuard: User is not admin, redirecting to home')
      setLocation('/')
    }
  }, [user, isLoading, setLocation])

  // Show loading state while checking authentication
  if (isLoading) {
    return <>{fallback}</>
  }

  // Show access denied if user is not admin
  if (user?.role !== 'admin') {
    console.log('🚫 AdminGuard: Access denied, user role:', user?.role)
    return (
      <div className="container py-10">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">Admin privileges required to access this page.</p>
          <button 
            onClick={() => setLocation('/')}
            className="btn btn-primary"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  console.log('✅ AdminGuard: User is admin, showing admin content')
  return <>{children}</>
}

import { useAuth } from '../auth/AuthContext'
import { useLocation } from 'wouter'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback = <div className="container py-10">Loading...</div> }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🚫 AuthGuard: User not authenticated, redirecting to auth')
      setLocation('/auth')
    }
  }, [user, isLoading, setLocation])

  // Show loading state while checking authentication
  if (isLoading) {
    return <>{fallback}</>
  }

  // Show loading state if user is not authenticated (will redirect)
  if (!user) {
    return <>{fallback}</>
  }

  console.log('✅ AuthGuard: User authenticated, showing content')
  return <>{children}</>
}

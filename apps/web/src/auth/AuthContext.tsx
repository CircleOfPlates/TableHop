import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

type AuthUser = { id: number; role?: string } | null

const AuthCtx = createContext<{ 
  user: AuthUser; 
  setUser: (u: AuthUser) => void;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}>({ 
  user: null, 
  setUser: () => {},
  login: async () => {},
  logout: async () => {},
  isLoading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const login = async (identifier: string, password: string) => {
    try {
      console.log('🔐 Attempting login...')
      const response = await api<{ id: number; username: string; email: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      })
      console.log('✅ Login successful:', response)
      
      // After login, fetch the user data with role
      const userData = await api<AuthUser>('/api/auth/me')
      console.log('👤 User data fetched:', userData)
      setUser(userData)
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('🚪 Logging out...')
      await api('/api/auth/logout', { method: 'POST' })
      setUser(null)
      console.log('✅ Logout successful')
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Silently handle logout errors
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication status...')
        const userData = await api<AuthUser>('/api/auth/me')
        console.log('👤 Auth check result:', userData)
        setUser(userData)
      } catch (error) {
        console.log('❌ Auth check failed (user not logged in):', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])
  
  return <AuthCtx.Provider value={{ user, setUser, login, logout, isLoading }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}



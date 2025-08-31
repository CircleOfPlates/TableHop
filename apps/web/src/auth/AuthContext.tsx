import { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenManager } from '../lib/api'

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
      const response = await api<{ id: number; username: string; email: string; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      })
      
      // Store JWT token
      if (response.token) {
        tokenManager.setToken(response.token);
      }
      
      // After login, fetch the user data with role
      const userData = await api<AuthUser>('/api/auth/me')
      setUser(userData)
    } catch (error) {
      console.error('❌ Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Remove JWT token from localStorage
      tokenManager.removeToken();
      setUser(null)
    } catch (error) {
      console.error('❌ Logout failed:', error)
      // Silently handle logout errors
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api<AuthUser>('/api/auth/me')
        setUser(userData)
      } catch (error) {
        setUser(null)
        // Clear any invalid token
        tokenManager.removeToken();
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



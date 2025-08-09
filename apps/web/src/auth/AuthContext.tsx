import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

type AuthUser = { id: number } | null

const AuthCtx = createContext<{ user: AuthUser; setUser: (u: AuthUser) => void }>({ user: null, setUser: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null)
  useEffect(() => {
    api<AuthUser>('/api/auth/me').then(setUser).catch(() => setUser(null))
  }, [])
  return <AuthCtx.Provider value={{ user, setUser }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}



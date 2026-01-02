import type { UserType } from '@/types/auth'
import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next'
import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChildrenType } from '../types/component-props'
import { setupFetchInterceptor } from '@/utils/setupFetchInterceptor' // Make sure this path is correct

export type AuthContextType = {
  user: UserType | undefined
  isAuthenticated: boolean
  saveSession: (session: UserType) => void
  removeSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

const authSessionKey = '_EDUPORT_AUTH_KEY_'

export function AuthProvider({ children }: ChildrenType) {
  const navigate = useNavigate()

  const getSession = (): UserType | undefined => {
    const fetchedCookie = getCookie(authSessionKey)?.toString()
    return fetchedCookie ? JSON.parse(fetchedCookie) : undefined
  }

  const [user, setUser] = useState<UserType | undefined>(getSession())
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getSession())

  const saveSession = (user: UserType) => {
    setCookie(authSessionKey, JSON.stringify(user))
    setUser(user)
    setIsAuthenticated(true)
  }

  const removeSession = () => {
    deleteCookie(authSessionKey)
    setUser(undefined)
    setIsAuthenticated(false)
    localStorage.removeItem('token')
    navigate('/auth/sign-in')
  }

  // ✅ Setup fetch interceptor once on mount
  useEffect(() => {
    setupFetchInterceptor(removeSession)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        saveSession,
        removeSession,
      }}>
      {children}
    </AuthContext.Provider>
  )
}

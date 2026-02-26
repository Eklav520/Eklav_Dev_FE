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
  updateUser: (data: Partial<UserType>) => void
  refreshUser: () => Promise<void>
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

  const updateUser = (data: Partial<UserType>) => {
    setUser((prev) => {
      if (!prev) return prev

      const updatedUser = { ...prev, ...data }

      // update cookie
      setCookie(authSessionKey, JSON.stringify(updatedUser))

      return updatedUser
    })
  }

  const refreshUser = async () => {
    try {
      const currentSession = getSession()
      if (!currentSession?.token) return

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${currentSession.token}`,
          },
        }
      )

      if (!res.ok) throw new Error("Failed to refresh user")

      const data = await res.json()

      console.log("Profile API response:", data)

      // 🔥 Support both structures
      const freshProfile = data.user ?? data

      const updatedUser = {
        ...currentSession,
        ...freshProfile,
      }

      console.log("Updated user after merge:", updatedUser)

      setCookie(authSessionKey, JSON.stringify(updatedUser))
      setUser(updatedUser)

    } catch (err) {
      console.error("Refresh failed:", err)
    }
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
        updateUser,
        refreshUser, // ✅ added
        removeSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

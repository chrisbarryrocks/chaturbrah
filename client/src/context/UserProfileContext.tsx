import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'chaturbrah:username'
const USERNAME_RE = /^[a-zA-Z0-9]{1,30}$/

export function validateUsername(name: string): string | null {
  if (!name) return 'Username is required.'
  if (!USERNAME_RE.test(name)) {
    if (name.length > 30) return 'Username must be 30 characters or fewer.'
    return 'Username can only contain letters and numbers (no spaces or symbols).'
  }
  return null
}

interface UserProfile {
  username: string | null
  setUsername: (name: string) => void
  clearUsername: () => void
}

const UserProfileContext = createContext<UserProfile | null>(null)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? null
    } catch {
      return null
    }
  })

  const setUsername = useCallback((name: string) => {
    const error = validateUsername(name)
    if (error) throw new Error(error)
    localStorage.setItem(STORAGE_KEY, name)
    setUsernameState(name)
  }, [])

  const clearUsername = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUsernameState(null)
  }, [])

  return (
    <UserProfileContext.Provider value={{ username, setUsername, clearUsername }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile(): UserProfile {
  const ctx = useContext(UserProfileContext)
  if (!ctx) throw new Error('useUserProfile must be used inside UserProfileProvider')
  return ctx
}

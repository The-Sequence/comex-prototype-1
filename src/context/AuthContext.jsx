import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as db from '../lib/db'

const AuthContext = createContext(null)

/**
 * Session state from the live backend. `user` is only ever an approved
 * profile (getCurrentUser enforces it). `loading` is true until the first
 * session lookup finishes, so guards do not bounce a signed-in reload.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(db.backendMode === 'live')
  const latest = useRef(0) // only the newest session lookup may set the user

  useEffect(() => {
    if (db.backendMode !== 'live') return undefined
    let live = true
    const refresh = () => {
      const mine = ++latest.current
      const current = () => live && mine === latest.current
      return db
        .getCurrentUser()
        .then((u) => current() && setUser(u ?? null))
        .catch(() => current() && setUser(null))
        .finally(() => current() && setLoading(false))
    }
    refresh()
    const unsubscribe = db.onAuthChange(refresh)
    return () => {
      live = false
      unsubscribe?.()
    }
  }, [])

  /**
   * Returns { user } on success, or { error, code } where code is one of
   * 'invalid' | 'unverified' | 'pending' | 'rejected' | 'error'.
   */
  const signIn = useCallback(async (email, password) => {
    try {
      const result = await db.signIn(email, password)
      if (result.user) {
        latest.current++ // supersede any lookup the sign-in event started
        setUser(result.user)
      }
      return result
    } catch (err) {
      return { code: 'error', error: err?.message || 'Could not sign in. Please try again.' }
    }
  }, [])

  const signOut = useCallback(async () => {
    latest.current++
    setUser(null)
    try {
      await db.signOut()
    } catch {
      /* the local session is already cleared */
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, backendMode: db.backendMode }),
    [user, loading, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext)

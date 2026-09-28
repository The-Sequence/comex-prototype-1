import { createContext, useContext, useEffect, useState } from 'react'
import { findUserByEmail, findUserById, hashPassword } from '../lib/db'

const SESSION_KEY = 'comex-demo-session'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const id = sessionStorage.getItem(SESSION_KEY)
    return id ? findUserById(id) : null
  })

  // Keep the signed-in user in sync if the mock database changes
  // (e.g. "Reset demo data").
  useEffect(() => {
    const refresh = () => {
      const id = sessionStorage.getItem(SESSION_KEY)
      setUser(id ? findUserById(id) : null)
    }
    window.addEventListener('comex-db-change', refresh)
    return () => window.removeEventListener('comex-db-change', refresh)
  }, [])

  /**
   * Returns { user } on success, or { error, code } where code is one of
   * 'invalid' | 'unverified' | 'pending' | 'denied'.
   */
  async function signIn(email, password) {
    const account = findUserByEmail(email)
    if (!account || account.passwordHash !== (await hashPassword(password))) {
      return { code: 'invalid', error: 'Invalid email or password.' }
    }
    if (!account.emailVerified) {
      return { code: 'unverified', error: 'Your email is not verified yet.' }
    }
    if (account.status === 'pending') {
      return { code: 'pending', error: 'Your account is still pending approval by the COMEX office.' }
    }
    if (account.status === 'denied') {
      return { code: 'denied', error: 'Your registration was denied. Please contact the COMEX office.' }
    }
    sessionStorage.setItem(SESSION_KEY, account.id)
    setUser(account)
    return { user: account }
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext)

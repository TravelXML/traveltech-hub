import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import * as authService from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    try {
      setProfile(await authService.getProfile(userId))
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!active) return
      setSession(initialSession)
      loadProfile(initialSession?.user?.id).finally(() => {
        if (active) setLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfile(newSession?.user?.id)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = {
    user: session?.user ?? null,
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut: authService.signOut,
    requestPasswordReset: authService.requestPasswordReset,
    updatePassword: authService.updatePassword,
    resendVerificationEmail: authService.resendVerificationEmail,
    refreshProfile: () => loadProfile(session?.user?.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

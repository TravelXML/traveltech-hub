import { supabase } from '../lib/supabase.js'

function toFriendlyAuthError(error) {
  if (!error) return new Error('Something went wrong. Please try again.')
  // Supabase Auth error messages ("Invalid login credentials", "User
  // already registered", ...) are already written to be shown to users.
  return new Error(error.message || 'Something went wrong. Please try again.')
}

function redirectUrl(path) {
  return `${window.location.origin}${import.meta.env.BASE_URL}${path}`
}

export async function signUp({ email, password, fullName, captchaToken }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
      emailRedirectTo: redirectUrl('login'),
      captchaToken,
    },
  })
  if (error) throw toFriendlyAuthError(error)
  return data
}

export async function signIn({ email, password, captchaToken }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  })
  if (error) throw toFriendlyAuthError(error)
  return data
}

// provider is Supabase's provider id: 'google' or 'azure' (Microsoft/Azure
// AD's id in Supabase Auth - not 'microsoft'). This redirects the whole page
// away; there's no session to return here. detectSessionInUrl (set in
// src/lib/supabase.js) exchanges the code on return, and AuthContext's
// onAuthStateChange picks up the resulting session automatically.
export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectUrl('') },
  })
  if (error) throw toFriendlyAuthError(error)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw toFriendlyAuthError(error)
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl('reset-password'),
  })
  if (error) throw toFriendlyAuthError(error)
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw toFriendlyAuthError(error)
}

export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  if (error) throw toFriendlyAuthError(error)
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw toFriendlyAuthError(error)
  return data ? { id: data.id, fullName: data.full_name, avatarUrl: data.avatar_url, role: data.role } : null
}

export async function updateOwnProfile({ fullName, avatarUrl }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in.')
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, avatar_url: avatarUrl })
    .eq('id', user.id)
  if (error) throw toFriendlyAuthError(error)
}

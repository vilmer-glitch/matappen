import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// A password reset link logs you in and sends a PASSWORD_RECOVERY event. It can arrive before
// React has started, so it is caught here as soon as the app loads.
let recovering = window.location.hash.includes('type=recovery')
const listeners = new Set<() => void>()
supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    recovering = true
    listeners.forEach((notify) => notify())
  }
})

// session: undefined = still loading, null = logged out
// recovering: true when you came from a password reset link and should pick a new password
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isRecovering, setIsRecovering] = useState(recovering)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    const notify = () => setIsRecovering(true)
    listeners.add(notify)
    return () => {
      data.subscription.unsubscribe()
      listeners.delete(notify)
    }
  }, [])

  function finishRecovery() {
    recovering = false
    setIsRecovering(false)
  }

  return { session, isRecovering, finishRecovery }
}

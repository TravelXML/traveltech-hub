import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
let scriptPromise = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Cloudflare Turnstile widget. Renders imperatively via the Turnstile JS API
 * rather than a React wrapper library, matching this codebase's convention
 * of no UI/form dependencies beyond what's already installed.
 *
 * Turnstile tokens are single-use - pass a changing `resetKey` (e.g. a
 * counter bumped on failed submit) to force a fresh widget/token.
 */
export default function Turnstile({ onSuccess, onExpire, resetKey }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return undefined
    let cancelled = false

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onSuccess,
        'expired-callback': () => onExpire?.(),
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null) window.turnstile?.remove(widgetIdRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey, resetKey])

  if (!siteKey) return null

  return <div ref={containerRef} />
}

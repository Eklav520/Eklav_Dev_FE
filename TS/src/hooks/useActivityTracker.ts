import { useEffect, useRef, useCallback } from 'react'

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000      // send heartbeat every 2 min
const IDLE_TIMEOUT_MS        = 15 * 60 * 1000     // show idle warning after 15 min
const MAX_SESSION_MS         = 8 * 60 * 60 * 1000 // auto-logout after 8 hours
const IDLE_EVENTS            = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

interface Options {
  token: string | undefined
  baseURL: string
  onIdle: () => void      // show idle popup
  onAutoLogout: () => void // force logout (8 h)
  onResume: () => void     // user dismissed idle popup → reset timer
}

export function useActivityTracker({ token, baseURL, onIdle, onAutoLogout, onResume }: Options) {
  const lastActivityRef   = useRef<number>(Date.now())
  const sessionStartRef   = useRef<number>(Date.now())
  const lastHeartbeatRef  = useRef<number>(Date.now())
  const idleTimerRef      = useRef<ReturnType<typeof setTimeout>>()
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval>>()
  const isIdleRef         = useRef(false)

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token])

  // ── start session on backend ──
  const startSession = useCallback(async () => {
    if (!token) return
    try {
      await fetch(`${baseURL}/api/session/start`, { method: 'POST', headers: headers() })
    } catch { /* silent */ }
  }, [token, baseURL, headers])

  // ── send heartbeat ──
  const sendHeartbeat = useCallback(async () => {
    if (!token) return
    const now     = Date.now()
    const elapsed = Math.round((now - lastHeartbeatRef.current) / 1000)
    lastHeartbeatRef.current = now
    try {
      await fetch(`${baseURL}/api/session/heartbeat`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ elapsedSeconds: elapsed }),
      })
    } catch { /* silent */ }
  }, [token, baseURL, headers])

  // ── end session on backend ──
  const endSession = useCallback(async () => {
    if (!token) return
    try {
      // Use sendBeacon so the request survives page unload
      const ok = navigator.sendBeacon?.(
        `${baseURL}/api/session/end`,
        JSON.stringify({ _beacon: true })
      )
      if (!ok) {
        await fetch(`${baseURL}/api/session/end`, { method: 'POST', headers: headers() })
      }
    } catch { /* silent */ }
  }, [token, baseURL, headers])

  // ── reset the idle countdown ──
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    isIdleRef.current       = false

    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true
      onIdle()
    }, IDLE_TIMEOUT_MS)
  }, [onIdle])

  // ── called from outside to "resume" after popup dismissal ──
  const resumeSession = useCallback(() => {
    resetIdleTimer()
    onResume()
  }, [resetIdleTimer, onResume])

  useEffect(() => {
    if (!token) return

    sessionStartRef.current  = Date.now()
    lastHeartbeatRef.current = Date.now()

    startSession()
    resetIdleTimer()

    // ── heartbeat interval ──
    heartbeatTimerRef.current = setInterval(() => {
      // Only send heartbeat when the user was active in this window
      if (!isIdleRef.current) sendHeartbeat()

      // 8-hour hard logout
      if (Date.now() - sessionStartRef.current >= MAX_SESSION_MS) {
        onAutoLogout()
      }
    }, HEARTBEAT_INTERVAL_MS)

    // ── activity listeners ──
    const onActivity = () => resetIdleTimer()
    IDLE_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }))

    // ── cleanup on unmount / token change ──
    return () => {
      IDLE_EVENTS.forEach(e => window.removeEventListener(e, onActivity))
      clearTimeout(idleTimerRef.current)
      clearInterval(heartbeatTimerRef.current)
      endSession()
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── send heartbeat & end session on page unload ──
  useEffect(() => {
    const onUnload = () => endSession()
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [endSession])

  return { resumeSession }
}

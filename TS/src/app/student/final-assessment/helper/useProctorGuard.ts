// src/hooks/useProctorGuard.ts
import { useCallback, useEffect, useRef, useState } from 'react'

type ProctorGuardOptions = {
  maxViolations?: number
  lockMessage?: string
  enabled?: boolean                 // allow disabling for non-proctored flows
  captureFullscreenExit?: boolean   // treat exiting fullscreen as violation
}

type ProctorGuard = {
  // state
  locked: boolean
  message: string
  violationCount: number
  maxViolations: number
  isFullscreen: boolean

  // controls
  arm: () => void                   // start counting violations (after you’re ready)
  disarm: () => void
  reset: () => void
  acknowledge: () => void           // clear lock (if not exceeded max)
  setMessage: (m: string) => void

  // helpers
  enterFullscreenFromUserGesture: () => Promise<boolean>
}

export function useProctorGuard(
  {
    maxViolations = 2,
    lockMessage = 'Tab switching is not allowed during the assessment.',
    enabled = true,
    captureFullscreenExit = true,
  }: ProctorGuardOptions,
  {
    onViolation,
    onMaxReached,
  }: {
    onViolation?: (count: number, reason: string) => void
    onMaxReached?: (count: number, reason: string) => void
  } = {}
): ProctorGuard {
  const [locked, setLocked] = useState(false)
  const [message, setMessage] = useState(lockMessage)
  const [violationCount, setViolationCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement)

  const armedRef = useRef(false)

  const raise = useCallback(
    (reason: string) => {
      if (!enabled || !armedRef.current) return

      setViolationCount((prev) => {
        const next = prev + 1
        setMessage(`${lockMessage}\nViolation: ${reason}\nViolations: ${next}/${maxViolations}`)
        setLocked(true)

        onViolation?.(next, reason)

        if (next >= maxViolations) {
          onMaxReached?.(next, reason)
        }
        return next
      })
    },
    [enabled, lockMessage, maxViolations, onViolation, onMaxReached]
  )

  const arm = useCallback(() => {
    armedRef.current = true
  }, [])
  const disarm = useCallback(() => {
    armedRef.current = false
  }, [])
  const reset = useCallback(() => {
    setLocked(false)
    setMessage(lockMessage)
    setViolationCount(0)
    armedRef.current = false
  }, [lockMessage])

  const acknowledge = useCallback(() => {
    setLocked((prev) => {
      // don’t unlock if max already exceeded — calling screen should take action
      if (violationCount >= maxViolations) return prev
      return false
    })
  }, [violationCount, maxViolations])

  const enterFullscreenFromUserGesture = useCallback(async () => {
    const el: any = document.documentElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else if (el.msRequestFullscreen) await el.msRequestFullscreen()
      else return false
      return true
    } catch {
      return false
    }
  }, [])

  // global listeners
  useEffect(() => {
    if (!enabled) return

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        raise('Tab/window hidden')
        setTimeout(() => window.focus(), 50)
      }
    }
    const onBlur = () => {
      raise('Window lost focus')
      setTimeout(() => window.focus(), 50)
    }
    const onFullscreenChange = () => {
      const active = !!document.fullscreenElement
      setIsFullscreen(active)
      if (!active && captureFullscreenExit) {
        raise('Exited fullscreen')
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      // You can expand this list; many OS-level combos can’t be fully blocked
      const key = e.key.toLowerCase()
      if (
        key === 'escape' ||
        (e.ctrlKey && e.shiftKey && key === 'i') ||
        (e.ctrlKey && key === 'tab') ||
        (e.altKey && key === 'tab')
      ) {
        e.preventDefault()
        e.stopPropagation()
        raise(`Keyboard shortcut attempted: ${e.key}`)
      }
    }
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      raise('Right-click context menu attempted')
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // prevents accidental refresh/close during a live attempt
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('contextmenu', onContextMenu, true)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('contextmenu', onContextMenu, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [enabled, captureFullscreenExit, raise])

  return {
    locked,
    message,
    violationCount,
    maxViolations,
    isFullscreen,

    arm,
    disarm,
    reset,
    acknowledge,
    setMessage,
    enterFullscreenFromUserGesture,
  }
}

// src/hooks/useProctorGuard.ts
import { useCallback, useEffect, useRef, useState } from 'react'

type ProctorGuardOptions = {
  maxViolations?: number
  lockMessage?: string
  enabled?: boolean
  captureFullscreenExit?: boolean
  autoReenterFullscreen?: boolean
  preventEscFullscreen?: boolean
}

type ProctorGuard = {
  locked: boolean
  message: string
  violationCount: number
  maxViolations: number
  isFullscreen: boolean
  isRecording: boolean
  recordingStream: MediaStream | null
  arm: () => void
  disarm: () => void
  reset: () => void
  acknowledge: () => void
  setMessage: (m: string) => void
  enterFullscreen: () => Promise<boolean>
  startRecording: (options?: { withAudio?: boolean }) => Promise<MediaStream | null>
  stopRecording: () => void
  getRecordingBlob: () => Blob | null
  uploadRecording: (submissionId: string, roundType: string) => Promise<string | null>
}

export function useProctorGuard(
  {
    maxViolations = 2,
    lockMessage = 'Tab switching is not allowed during the assessment.',
    enabled = true,
    captureFullscreenExit = true,
    autoReenterFullscreen = true,
    preventEscFullscreen = true,
  }: ProctorGuardOptions,
  {
    onViolation,
    onMaxReached,
    onRecordingStart,
    onRecordingStop,
  }: {
    onViolation?: (count: number, reason: string) => void
    onMaxReached?: (count: number, reason: string) => void
    onRecordingStart?: () => void
    onRecordingStop?: () => void
  } = {}
): ProctorGuard {
  const [locked, setLocked] = useState(false)
  const [message, setMessage] = useState(lockMessage)
  const [violationCount, setViolationCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement)
  const [isRecording, setIsRecording] = useState(false)
  
  const armedRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const lastRaiseTimeRef = useRef(0)
  const escPressedRef = useRef(false)

  const raise = useCallback(
    (reason: string) => {
      if (!enabled || !armedRef.current) return

      const now = Date.now()
      if (now - lastRaiseTimeRef.current < 1500) return
      lastRaiseTimeRef.current = now

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
      if (violationCount >= maxViolations) return prev
      return false
    })
  }, [violationCount, maxViolations])

  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen()
      else if ((el as any).msRequestFullscreen) await (el as any).msRequestFullscreen()
      else return false
      return true
    } catch {
      return false
    }
  }, [])

  const startRecording = useCallback(async (options: { withAudio?: boolean } = {}) => {
    try {
      // Get screen stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: options.withAudio || false,
      })
      
      recordingStreamRef.current = screenStream

      // Try to get camera stream
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        })
        cameraStreamRef.current = cameraStream
        
        // Combine streams if both available
        const combinedStream = new MediaStream()
        screenStream.getVideoTracks().forEach(track => combinedStream.addTrack(track))
        cameraStream.getVideoTracks().forEach(track => combinedStream.addTrack(track))
        recordingStreamRef.current = combinedStream
      } catch (camErr) {
        console.warn('Camera access denied:', camErr)
      }

      // Configure recorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      
      const mediaRecorder = new MediaRecorder(recordingStreamRef.current, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      onRecordingStart?.()

      return recordingStreamRef.current
    } catch (err) {
      console.error('Failed to start recording:', err)
      return null
    }
  }, [onRecordingStart])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop())
      recordingStreamRef.current = null
    }
    
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    
    setIsRecording(false)
    onRecordingStop?.()
  }, [onRecordingStop])

  const getRecordingBlob = useCallback(() => {
    if (recordedChunksRef.current.length === 0) return null
    return new Blob(recordedChunksRef.current, { type: 'video/webm' })
  }, [])

  const uploadRecording = useCallback(async (submissionId: string, roundType: string) => {
    const blob = getRecordingBlob()
    if (!blob) return null
    
    const baseURL = import.meta.env.VITE_API_BASE_URL || ''
    const token = localStorage.getItem('token')
    
    try {
      // Get presigned URL
      const presignRes = await fetch(`${baseURL}/api/student/presign/recording`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          roundType,
          fileName: `recording_${submissionId}_${Date.now()}.webm`,
          fileType: 'video/webm',
        }),
      })
      
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      
      const { uploadUrl, key } = await presignRes.json()
      
      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/webm' },
        body: blob,
      })
      
      if (!uploadRes.ok) throw new Error('Upload failed')
      
      return key
    } catch (err) {
      console.error('Recording upload failed:', err)
      return null
    }
  }, [getRecordingBlob])

  // Prevent ESC key from exiting fullscreen (silent — no violation counted)
  useEffect(() => {
    if (!enabled || !preventEscFullscreen) return

    const preventEsc = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && armedRef.current) {
        e.preventDefault()
        e.stopPropagation()
        escPressedRef.current = true
      }
    }

    document.addEventListener('keydown', preventEsc, true)
    return () => document.removeEventListener('keydown', preventEsc, true)
  }, [enabled, preventEscFullscreen])

  // Global event listeners for proctoring
  useEffect(() => {
    if (!enabled) return

    const onVisibilityChange = () => {
      if (document.hidden && !escPressedRef.current) {
        raise('Tab/window switched')
        setTimeout(() => window.focus(), 50)
      }
    }
    
    const onWindowBlur = () => {
      if (escPressedRef.current) return  // ESC fullscreen exit — not a real tab switch
      raise('Window focus lost')
      setTimeout(() => window.focus(), 50)
    }
    
    const onFullscreenChange = () => {
      const active = !!document.fullscreenElement
      setIsFullscreen(active)

      if (!active && captureFullscreenExit && armedRef.current) {
        // Always count as violation — ESC or any other exit
        setTimeout(() => { escPressedRef.current = false }, 300)
        raise('Exited fullscreen mode')
        if (autoReenterFullscreen) {
          enterFullscreen()
        }
      }
    }
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (!armedRef.current) return
      
      const key = e.key.toLowerCase()
      const blockedKeys = ['f12', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11']
      
      if (blockedKeys.includes(key)) {
        e.preventDefault()
        e.stopPropagation()
        raise(`Blocked key pressed: ${key}`)
      }
      
      // Block Alt+Tab, Ctrl+Tab, Alt+F4, etc.
      if ((e.altKey && key === 'tab') || 
          (e.ctrlKey && key === 'tab') ||
          (e.altKey && key === 'f4') ||
          (e.ctrlKey && e.shiftKey && key === 'i')) {
        e.preventDefault()
        e.stopPropagation()
        raise(`System shortcut attempted: ${e.key}`)
      }
    }
    
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      raise('Right-click context menu attempted')
    }

    const onCopy = (e: ClipboardEvent) => {
      if (armedRef.current) e.preventDefault()
    }
    const onCut = (e: ClipboardEvent) => {
      if (armedRef.current) e.preventDefault()
    }

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (armedRef.current) {
        e.preventDefault()
        e.returnValue = 'Assessment in progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('contextmenu', onContextMenu, true)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCut)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('contextmenu', onContextMenu, true)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCut)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [enabled, captureFullscreenExit, autoReenterFullscreen, raise, enterFullscreen])

  return {
    locked,
    message,
    violationCount,
    maxViolations,
    isFullscreen,
    isRecording,
    recordingStream: recordingStreamRef.current,
    arm,
    disarm,
    reset,
    acknowledge,
    setMessage,
    enterFullscreen,
    startRecording,
    stopRecording,
    getRecordingBlob,
    uploadRecording,
  }
}
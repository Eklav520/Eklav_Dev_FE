import { useEffect, useRef, useState } from 'react'

export type GazeDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'no-face' | 'unknown'

export interface GazeState {
  direction: GazeDirection
  isLookingAway: boolean
  violationCount: number        // eye gaze violations
  headDirection: GazeDirection
  isHeadTurned: boolean
  headViolationCount: number    // head pose violations
  faceDetected: boolean
  lookAwaySeconds: number
  headAwaySeconds: number
  landmarks: any | null
  isReady: boolean
}

const THRESHOLD_S = 3 // 3 seconds looking away = 1 violation

// ── Eye gaze: iris position relative to eye corners ─────────────────
function classifyGaze(lm: any[]): GazeDirection {
  if (!lm || lm.length < 478) return 'unknown'
  try {
    const leftIris   = lm[468], rightIris  = lm[473]
    const leftOuter  = lm[33],  leftInner  = lm[133]
    const rightInner = lm[362], rightOuter = lm[263]
    const leftTop    = lm[159], leftBottom = lm[145]
    const rightTop   = lm[386], rightBottom= lm[374]

    const leftW  = leftInner.x  - leftOuter.x
    const rightW = rightOuter.x - rightInner.x
    if (Math.abs(leftW) < 0.001 || Math.abs(rightW) < 0.001) return 'unknown'

    const avgH = ((leftIris.x - leftOuter.x) / leftW + (rightIris.x - rightInner.x) / rightW) / 2
    const leftVH  = Math.abs(leftBottom.y  - leftTop.y)
    const rightVH = Math.abs(rightBottom.y - rightTop.y)
    const avgV = (
      (leftVH  > 0.001 ? (leftIris.y  - leftTop.y)  / leftVH  : 0.5) +
      (rightVH > 0.001 ? (rightIris.y - rightTop.y) / rightVH : 0.5)
    ) / 2

    // Tighter center band so a real sideways glance (e.g. checking a phone
    // propped up next to the laptop) is caught, while still not being so
    // tight that natural eye jitter while looking at the camera trips it —
    // that's handled by the consecutive-frame smoothing below.
    if (avgH < 0.36) return 'right'
    if (avgH > 0.64) return 'left'
    if (avgV < 0.22) return 'up'
    if (avgV > 0.78) return 'down'
    return 'center'
  } catch { return 'unknown' }
}

// ── Head pose: nose tip offset from face midpoint ────────────────────
function classifyHeadPose(lm: any[]): GazeDirection {
  if (!lm || lm.length < 468) return 'unknown'
  try {
    const noseTip  = lm[1]    // nose tip
    const leftEar  = lm[234]  // left cheek/ear
    const rightEar = lm[454]  // right cheek/ear
    const forehead = lm[10]
    const chin     = lm[152]

    const faceWidth = Math.abs(rightEar.x - leftEar.x)
    if (faceWidth < 0.001) return 'unknown'

    // Horizontal: nose displaced from midpoint between ears
    const midX      = (leftEar.x + rightEar.x) / 2
    const hOffset   = (noseTip.x - midX) / faceWidth
    // Threshold 0.12: small head turns shouldn't count, only clear turns
    if (hOffset < -0.12) return 'right'   // person turned right
    if (hOffset >  0.12) return 'left'    // person turned left

    // Vertical: nose displaced from vertical midpoint
    const faceHeight = Math.abs(chin.y - forehead.y)
    if (faceHeight < 0.001) return 'center'
    const midY    = (forehead.y + chin.y) / 2
    const vOffset = (noseTip.y - midY) / faceHeight
    if (vOffset < -0.12) return 'up'
    if (vOffset >  0.12) return 'down'

    return 'center'
  } catch { return 'unknown' }
}

export function useGazeDetection(
  videoElement: HTMLVideoElement | null,
  enabled: boolean,
  // While true, gaze/head "away" time stops accumulating and no new
  // violations are counted — used to exempt legitimate screen-focused
  // activity (e.g. typing a code answer) from being flagged as cheating.
  suspend: boolean = false
): GazeState {
  const [state, setState] = useState<GazeState>({
    direction: 'unknown',
    isLookingAway: false,
    violationCount: 0,
    headDirection: 'unknown',
    isHeadTurned: false,
    headViolationCount: 0,
    faceDetected: false,
    lookAwaySeconds: 0,
    headAwaySeconds: 0,
    landmarks: null,
    isReady: false,
  })

  // Eye gaze refs
  const gazeAwayStartRef  = useRef<number | null>(null)
  const gazeViolationRef  = useRef(0)
  const gazeHistoryRef    = useRef<boolean[]>([]) // recent raw "away" samples, for debouncing

  // Head pose refs
  const headAwayStartRef  = useRef<number | null>(null)
  const headViolationRef  = useRef(0)

  const intervalRef  = useRef<any>(null)
  const cameraRef    = useRef<any>(null)
  const faceMeshRef  = useRef<any>(null)
  const suspendRef   = useRef(suspend)

  useEffect(() => {
    suspendRef.current = suspend
    // Don't let a stale away-timer resume mid-count once un-suspended
    if (suspend) {
      gazeAwayStartRef.current = null
      headAwayStartRef.current = null
    }
  }, [suspend])

  useEffect(() => {
    if (!enabled || !videoElement) return
    let cancelled = false

    const init = async () => {
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh')
        const { Camera }   = await import('@mediapipe/camera_utils')
        if (cancelled) return

        const fm = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
        })
        fm.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        fm.onResults((results: any) => {
          if (cancelled) return
          const hasFace = !!(results.multiFaceLandmarks?.length)
          const lm: any[] | null = hasFace ? results.multiFaceLandmarks[0] : null

          // Eye gaze — debounce raw per-frame noise: only treat gaze as
          // "away" once the majority of the last few frames agree, so a
          // single jittery frame while looking straight at the camera
          // can't start (or keep alive) the away timer, but a real
          // sustained glance to the side (e.g. at a phone) still will.
          const gazeDir: GazeDirection = hasFace ? classifyGaze(lm!) : 'no-face'
          const rawGazeAway = !hasFace || gazeDir !== 'center'
          gazeHistoryRef.current.push(rawGazeAway)
          if (gazeHistoryRef.current.length > 5) gazeHistoryRef.current.shift()
          const awayVotes = gazeHistoryRef.current.filter(Boolean).length
          const gazeAway = awayVotes > gazeHistoryRef.current.length / 2
          if (gazeAway && !suspendRef.current) {
            if (gazeAwayStartRef.current === null) gazeAwayStartRef.current = Date.now()
          } else {
            gazeAwayStartRef.current = null
          }

          // Head pose
          const headDir: GazeDirection = hasFace ? classifyHeadPose(lm!) : 'no-face'
          const headAway = !hasFace || headDir !== 'center'
          if (headAway && !suspendRef.current) {
            if (headAwayStartRef.current === null) headAwayStartRef.current = Date.now()
          } else {
            headAwayStartRef.current = null
          }

          setState(prev => ({
            ...prev,
            faceDetected: hasFace,
            landmarks: lm,
            direction: gazeDir,
            isLookingAway: gazeAway && !suspendRef.current,
            headDirection: headDir,
            isHeadTurned: headAway && !suspendRef.current,
          }))
        })

        faceMeshRef.current = fm
        if (!cancelled) setState(prev => ({ ...prev, isReady: true }))

        const cam = new Camera(videoElement, {
          onFrame: async () => {
            if (videoElement && fm && !cancelled) await fm.send({ image: videoElement })
          },
          width: 640,
          height: 480,
        })
        cam.start()
        cameraRef.current = cam
      } catch (err) {
        console.error('GazeDetection init error:', err)
      }
    }

    init()

    // Every 500ms: tick both eye and head violation timers
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      let update: Partial<GazeState> = {}

      // ── Eye gaze violations ──
      if (gazeAwayStartRef.current !== null) {
        const elapsed = (now - gazeAwayStartRef.current) / 1000
        update.lookAwaySeconds = Math.floor(elapsed)
        update.isLookingAway = true
        if (elapsed >= THRESHOLD_S) {
          gazeViolationRef.current += 1
          gazeAwayStartRef.current = now   // reset for next 3-second window
          update.violationCount = gazeViolationRef.current
        }
      } else {
        update.lookAwaySeconds = 0
        update.isLookingAway = false
      }

      // ── Head pose violations ──
      if (headAwayStartRef.current !== null) {
        const elapsed = (now - headAwayStartRef.current) / 1000
        update.headAwaySeconds = Math.floor(elapsed)
        update.isHeadTurned = true
        if (elapsed >= THRESHOLD_S) {
          headViolationRef.current += 1
          headAwayStartRef.current = now   // reset for next 3-second window
          update.headViolationCount = headViolationRef.current
        }
      } else {
        update.headAwaySeconds = 0
        update.isHeadTurned = false
      }

      if (Object.keys(update).length > 0) {
        setState(prev => ({ ...prev, ...update }))
      }
    }, 500)

    return () => {
      cancelled = true
      cameraRef.current?.stop()
      faceMeshRef.current?.close()
      clearInterval(intervalRef.current)
    }
  }, [enabled, videoElement])

  return state
}

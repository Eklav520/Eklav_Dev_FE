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
  // Mouth/nose covered (mask, hand, cloth, etc.) — FaceMesh keeps predicting
  // a full landmark set even when that region is occluded, so this can't be
  // read off landmark positions; it's a pixel-texture heuristic instead (see
  // sampleTextureScore below).
  maskDetected: boolean
  maskViolationCount: number
  maskAwaySeconds: number
  // No face in frame at all (stepped away, camera blocked, etc.) — tracked
  // as its own violation instead of being folded into eye/head, so the two
  // don't double-count the same "no face" event under different labels.
  noFaceViolationCount: number
  noFaceSeconds: number
  landmarks: any | null
  isReady: boolean
}

const THRESHOLD_S = 3 // 3 seconds looking away = 1 violation

// ── Mask/occlusion heuristic helpers ────────────────────────────────
// A real mouth (lips, teeth, shadows) has noticeably more local pixel
// contrast than cloth/a hand covering it. Comparing the mouth region's
// texture against the forehead's (same lighting, same frame) instead of
// an absolute threshold keeps this reasonably stable across webcams and
// lighting conditions.
function bboxFromLandmarks(lm: any[], indices: number[], padX = 0.02, padY = 0.02) {
  let minX = 1, maxX = 0, minY = 1, maxY = 0
  let any = false
  indices.forEach(i => {
    const p = lm[i]
    if (!p) return
    any = true
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  })
  if (!any) return null
  return {
    minX: Math.max(0, minX - padX), maxX: Math.min(1, maxX + padX),
    minY: Math.max(0, minY - padY), maxY: Math.min(1, maxY + padY),
  }
}

const MOUTH_LM = [61, 291, 13, 14, 78, 308, 87, 317]
const FOREHEAD_LM = [10, 108, 337, 151]

function textureStdDev(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  bbox: { minX: number; maxX: number; minY: number; maxY: number }
): number | null {
  const vw = video.videoWidth, vh = video.videoHeight
  if (!vw || !vh) return null
  const sx = bbox.minX * vw, sy = bbox.minY * vh
  const sw = Math.max(4, (bbox.maxX - bbox.minX) * vw)
  const sh = Math.max(4, (bbox.maxY - bbox.minY) * vh)
  const outW = 24, outH = 16
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  canvas.width = outW
  canvas.height = outH
  try {
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH)
    const data = ctx.getImageData(0, 0, outW, outH).data
    const n = outW * outH
    let sum = 0, sumSq = 0
    for (let i = 0; i < data.length; i += 4) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      sum += g
      sumSq += g * g
    }
    const mean = sum / n
    return Math.sqrt(Math.max(0, sumSq / n - mean * mean))
  } catch {
    return null
  }
}

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

    // Tighter center band so a real sideways/downward glance (e.g. checking
    // a phone propped up next to the laptop, or resting in the lap) is
    // caught even when the head doesn't turn with it, while still not being
    // so tight that natural eye jitter while looking at the camera trips it
    // — that's handled by the consecutive-frame smoothing below. Vertical
    // range in particular was too wide to ever catch a phone-in-lap glance,
    // since eyelids limit how far the iris can travel before the eye looks
    // closed.
    if (avgH < 0.42) return 'right'
    if (avgH > 0.58) return 'left'
    if (avgV < 0.35) return 'up'
    if (avgV > 0.65) return 'down'
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
  suspend: boolean = false,
  // When true, `videoElement` already has a live stream attached by the
  // caller (e.g. one shared with a MediaRecorder) — frames are pulled from
  // it manually via rAF instead of letting mediapipe's Camera utility do
  // its own getUserMedia. That matters because Camera.start() always
  // requests a brand-new camera stream, and on Windows (Media Foundation)
  // most webcams only allow one active capture session — a second
  // concurrent request silently fails, which is why gaze/head detection
  // stopped working once this ran alongside the exam's own camera recording.
  options: { useExternalStream?: boolean } = {}
): GazeState {
  const { useExternalStream = false } = options
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
    maskDetected: false,
    maskViolationCount: 0,
    maskAwaySeconds: 0,
    noFaceViolationCount: 0,
    noFaceSeconds: 0,
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

  // Mask/occlusion refs
  const maskAwayStartRef  = useRef<number | null>(null)
  const maskViolationRef  = useRef(0)
  const maskHistoryRef    = useRef<boolean[]>([])
  const maskCanvasRef     = useRef<HTMLCanvasElement | null>(null)

  // No-face refs
  const noFaceStartRef    = useRef<number | null>(null)
  const noFaceViolationRef = useRef(0)

  const intervalRef  = useRef<any>(null)
  const cameraRef    = useRef<any>(null)
  const rafRef       = useRef<number | null>(null)
  const faceMeshRef  = useRef<any>(null)
  const suspendRef   = useRef(suspend)

  useEffect(() => {
    suspendRef.current = suspend
    // Don't let a stale away-timer resume mid-count once un-suspended
    if (suspend) {
      gazeAwayStartRef.current = null
      headAwayStartRef.current = null
      maskAwayStartRef.current = null
      noFaceStartRef.current = null
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
          // Gated on hasFace — a genuine no-face is its own violation below,
          // not double-counted here too.
          const gazeDir: GazeDirection = hasFace ? classifyGaze(lm!) : 'no-face'
          const rawGazeAway = hasFace && gazeDir !== 'center'
          gazeHistoryRef.current.push(rawGazeAway)
          if (gazeHistoryRef.current.length > 5) gazeHistoryRef.current.shift()
          const awayVotes = gazeHistoryRef.current.filter(Boolean).length
          const gazeAway = awayVotes > gazeHistoryRef.current.length / 2
          if (gazeAway && !suspendRef.current) {
            if (gazeAwayStartRef.current === null) gazeAwayStartRef.current = Date.now()
          } else {
            gazeAwayStartRef.current = null
          }

          // Head pose — likewise gated on hasFace.
          const headDir: GazeDirection = hasFace ? classifyHeadPose(lm!) : 'no-face'
          const headAway = hasFace && headDir !== 'center'
          if (headAway && !suspendRef.current) {
            if (headAwayStartRef.current === null) headAwayStartRef.current = Date.now()
          } else {
            headAwayStartRef.current = null
          }

          // No face in frame at all — own violation track (3s sustained,
          // same as the others), so stepping out of frame isn't silently
          // folded into "eye" or "head" counts.
          if (!hasFace && !suspendRef.current) {
            if (noFaceStartRef.current === null) noFaceStartRef.current = Date.now()
          } else {
            noFaceStartRef.current = null
          }

          // Mask/occlusion — only meaningful while a face is otherwise
          // detected (no-face is already its own signal above); compares
          // mouth-region texture against the forehead's under the same
          // lighting, debounced the same way as eye gaze.
          let rawMaskLikely = false
          if (hasFace && videoElement) {
            if (!maskCanvasRef.current) maskCanvasRef.current = document.createElement('canvas')
            const mouthBox = bboxFromLandmarks(lm!, MOUTH_LM)
            const foreheadBox = bboxFromLandmarks(lm!, FOREHEAD_LM)
            if (mouthBox && foreheadBox) {
              const mouthStd = textureStdDev(videoElement, maskCanvasRef.current, mouthBox)
              const foreheadStd = textureStdDev(videoElement, maskCanvasRef.current, foreheadBox)
              if (mouthStd !== null && foreheadStd !== null && foreheadStd > 3) {
                rawMaskLikely = (mouthStd / foreheadStd) < 0.45
              }
            }
          }
          maskHistoryRef.current.push(rawMaskLikely)
          if (maskHistoryRef.current.length > 5) maskHistoryRef.current.shift()
          const maskVotes = maskHistoryRef.current.filter(Boolean).length
          const maskAway = hasFace && maskVotes > maskHistoryRef.current.length / 2
          if (maskAway && !suspendRef.current) {
            if (maskAwayStartRef.current === null) maskAwayStartRef.current = Date.now()
          } else {
            maskAwayStartRef.current = null
          }

          setState(prev => ({
            ...prev,
            faceDetected: hasFace,
            landmarks: lm,
            direction: gazeDir,
            isLookingAway: gazeAway && !suspendRef.current,
            headDirection: headDir,
            isHeadTurned: headAway && !suspendRef.current,
            maskDetected: maskAway && !suspendRef.current,
          }))
        })

        faceMeshRef.current = fm
        if (!cancelled) setState(prev => ({ ...prev, isReady: true }))

        if (useExternalStream) {
          // Pull frames from the already-playing video element ourselves —
          // no second getUserMedia call.
          const pump = () => {
            if (cancelled) return
            if (videoElement && videoElement.readyState >= 2 && fm) {
              fm.send({ image: videoElement }).finally(() => {
                if (!cancelled) rafRef.current = requestAnimationFrame(pump)
              })
            } else {
              rafRef.current = requestAnimationFrame(pump)
            }
          }
          rafRef.current = requestAnimationFrame(pump)
        } else {
          const cam = new Camera(videoElement, {
            onFrame: async () => {
              if (videoElement && fm && !cancelled) await fm.send({ image: videoElement })
            },
            width: 640,
            height: 480,
          })
          cam.start()
          cameraRef.current = cam
        }
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

      // ── Mask/occlusion violations ──
      if (maskAwayStartRef.current !== null) {
        const elapsed = (now - maskAwayStartRef.current) / 1000
        update.maskAwaySeconds = Math.floor(elapsed)
        update.maskDetected = true
        if (elapsed >= THRESHOLD_S) {
          maskViolationRef.current += 1
          maskAwayStartRef.current = now   // reset for next 3-second window
          update.maskViolationCount = maskViolationRef.current
        }
      } else {
        update.maskAwaySeconds = 0
        update.maskDetected = false
      }

      // ── No-face violations ──
      if (noFaceStartRef.current !== null) {
        const elapsed = (now - noFaceStartRef.current) / 1000
        update.noFaceSeconds = Math.floor(elapsed)
        if (elapsed >= THRESHOLD_S) {
          noFaceViolationRef.current += 1
          noFaceStartRef.current = now   // reset for next 3-second window
          update.noFaceViolationCount = noFaceViolationRef.current
        }
      } else {
        update.noFaceSeconds = 0
      }

      if (Object.keys(update).length > 0) {
        setState(prev => ({ ...prev, ...update }))
      }
    }, 500)

    return () => {
      cancelled = true
      cameraRef.current?.stop()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      faceMeshRef.current?.close()
      clearInterval(intervalRef.current)
    }
  }, [enabled, videoElement, useExternalStream])

  return state
}

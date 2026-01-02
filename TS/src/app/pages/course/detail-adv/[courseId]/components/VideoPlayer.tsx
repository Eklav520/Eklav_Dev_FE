import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import Plyr, { PlyrProps } from 'plyr-react'
import 'plyr-react/plyr.css'
import './VideoPlayer.css'

interface Video {
  _id?: string
  video?: string
  signedUrl?: string
  url?: string
  description: string
  /** 0–100 from parent (backend) */
  progress?: number
}
interface VideoPlayerProps {
  video: Video
  onVideoComplete: () => void
  onProgress?: (percent: number) => void
}

const LS_KEY = (id: string) => `resume:${id}`

const VideoPlayerBase = ({ video, onVideoComplete, onProgress }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<{ plyr?: any } | null>(null)

  const seenFirstFrameRef = useRef(false)
  const resumeTargetRef = useRef<number | null>(null)
  const resumeTriesRef = useRef(0)
  const expectedResumePercentRef = useRef(0)
  const samplerRef = useRef<number | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const playerKey = String(video._id || video.url || video.signedUrl || video.video || 'no-video')
  const videoId = String(video._id || video.url || video.signedUrl || video.video || '')

  const isYouTubeUrl = !!video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'))
  const isS3Video = !!video.signedUrl
  const isLocalVideo = !!video.video && !video.signedUrl

  const source: PlyrProps['source'] | null = useMemo(() => {
    if (isYouTubeUrl) return { type: 'video', sources: [{ src: video.url!, provider: 'youtube' as const }] }
    if (isS3Video)
      return { type: 'video', title: video.description || 'Course Video', sources: [{ src: video.signedUrl!, type: 'video/mp4', size: 1080 }] }
    if (isLocalVideo)
      return { type: 'video', title: video.description || 'Course Video', sources: [{ src: `${baseURL}/uploads/${video.video}`, type: 'video/mp4', size: 1080 }] }
    return null
  }, [isYouTubeUrl, isS3Video, isLocalVideo, video.url, video.signedUrl, video.video, video.description, baseURL])

  const stopSampler = () => {
    if (samplerRef.current != null) {
      clearInterval(samplerRef.current)
      samplerRef.current = null
    }
  }

  const getResumePercent = (): number => {
    const p1 = typeof video.progress === 'number' ? video.progress : 0
    let p2 = 0
    if (videoId) {
      const raw = localStorage.getItem(LS_KEY(videoId))
      if (raw != null) p2 = Number(raw) || 0
    }
    return Math.min(99, Math.max(p1, p2))
  }

  const computeResumeTarget = (plyr: any) => {
    const d = Number(plyr?.duration) || 0
    expectedResumePercentRef.current = getResumePercent()
    if (d <= 0) return
    const percent = expectedResumePercentRef.current
    if (percent > 0) {
      const t = Math.min(Math.max((percent / 100) * d, 0.5), Math.max(d - 0.5, 0.5))
      resumeTargetRef.current = t
      resumeTriesRef.current = 0
    } else {
      resumeTargetRef.current = null
    }
  }

  const ensureSeekSticks = (plyr: any) => {
    if (!plyr) return
    const target = resumeTargetRef.current
    if (target == null) return
    const cur = Number(plyr.currentTime) || 0
    if (Math.abs(cur - target) > 0.5 && resumeTriesRef.current < 20) {
      resumeTriesRef.current += 1
      try { plyr.currentTime = target } catch {}
      try { if (typeof plyr.play === 'function' && (plyr.paused ?? true)) plyr.play().catch(() => {}) } catch {}
      return
    }
    resumeTargetRef.current = null
  }

  // --- NEW: strongest way to hide the loader
  const hideIfPlaying = (plyr: any) => {
    if (!plyr) return
    const ct = Number(plyr.currentTime) || 0
    const ready = Number(plyr?.media?.readyState ?? 0) // 2 = HAVE_CURRENT_DATA
    if (ct > 0.05 || ready >= 2) {
      if (!seenFirstFrameRef.current) seenFirstFrameRef.current = true
      setIsLoading(false)
    }
  }

  // Limit progress emits to once every ~1 s
const lastEmitRef = useRef<number>(0)

const emitProgress = (plyr: any) => {
  if (!plyr) return
  const d = Number(plyr.duration)
  const c = Number(plyr.currentTime)
  if (!isFinite(d) || d <= 0 || !isFinite(c) || c < 0) return

  const now = Date.now()
  if (now - lastEmitRef.current < 1000) return
  lastEmitRef.current = now

  hideIfPlaying(plyr)
  ensureSeekSticks(plyr)

  const p = Math.max(0, Math.min(100, (c / d) * 100))
  const rounded = Math.round(p * 10) / 10
  onProgress?.(rounded)

  if (videoId) {
    if (rounded >= 99) localStorage.removeItem(LS_KEY(videoId))
    else if (expectedResumePercentRef.current === 0 || c >= 0.5)
      localStorage.setItem(LS_KEY(videoId), String(rounded))
  }
}


  const startSampler = () => {
    if (samplerRef.current != null) return
    samplerRef.current = window.setInterval(() => {
      const inst = playerRef.current?.plyr
      if (!inst) return
      hideIfPlaying(inst)           // <— hide as soon as we can see frames or time > 0
      ensureSeekSticks(inst)
      emitProgress(inst)
    }, 300)
  }

  useEffect(() => {
    let unbind: (() => void) | null = null
    let tries = 0

    const bind = () => {
      const plyr = playerRef.current?.plyr
      if (plyr && typeof plyr.on === 'function') {
        seenFirstFrameRef.current = false
        resumeTargetRef.current = null
        resumeTriesRef.current = 0
        expectedResumePercentRef.current = getResumePercent()
        setIsLoading(true)
        setHasError(false)
        stopSampler()

        const onReady = () => { computeResumeTarget(plyr); hideIfPlaying(plyr); startSampler() }
        const onLoadedMetadata = () => { computeResumeTarget(plyr); hideIfPlaying(plyr) }
        const onDurationChange = () => { computeResumeTarget(plyr); hideIfPlaying(plyr) }
        const onLoadedData = () => hideIfPlaying(plyr)
        const onCanPlay = () => hideIfPlaying(plyr)
        const onCanPlayThrough = () => hideIfPlaying(plyr)

        const onPlay = () => { hideIfPlaying(plyr); startSampler() }
        const onPlaying = () => { hideIfPlaying(plyr); startSampler() }
        const onPause = () => emitProgress(plyr)
        const onSeeked = () => emitProgress(plyr)
        const onTimeUpdate = () => emitProgress(plyr)

        const onWaiting = () => setIsLoading(true)       // show loader when buffering
        const onStalled = () => setIsLoading(true)

        const onEnded = () => { emitProgress(plyr); stopSampler(); onVideoComplete() }
        const onError = () => { setHasError(true); setIsLoading(false); stopSampler() }

        plyr.on('ready', onReady)
        plyr.on('loadedmetadata', onLoadedMetadata)
        plyr.on('durationchange', onDurationChange)
        plyr.on('loadeddata', onLoadedData)
        plyr.on('canplay', onCanPlay)
        plyr.on('canplaythrough', onCanPlayThrough)
        plyr.on('play', onPlay)
        plyr.on('playing', onPlaying)
        plyr.on('pause', onPause)
        plyr.on('seeked', onSeeked)
        plyr.on('timeupdate', onTimeUpdate)
        plyr.on('waiting', onWaiting)
        plyr.on('stalled', onStalled)
        plyr.on('ended', onEnded)
        plyr.on('error', onError)

        unbind = () => {
          try {
            plyr.off('ready', onReady)
            plyr.off('loadedmetadata', onLoadedMetadata)
            plyr.off('durationchange', onDurationChange)
            plyr.off('loadeddata', onLoadedData)
            plyr.off('canplay', onCanPlay)
            plyr.off('canplaythrough', onCanPlayThrough)
            plyr.off('play', onPlay)
            plyr.off('playing', onPlaying)
            plyr.off('pause', onPause)
            plyr.off('seeked', onSeeked)
            plyr.off('timeupdate', onTimeUpdate)
            plyr.off('waiting', onWaiting)
            plyr.off('stalled', onStalled)
            plyr.off('ended', onEnded)
            plyr.off('error', onError)
          } catch {}
          stopSampler()
        }
        return
      }
      if (tries++ < 60) setTimeout(bind, 50)
      else setIsLoading(false)
    }

    bind()
    return () => { unbind && unbind(); stopSampler() }
  }, [playerKey, onVideoComplete, onProgress])

  if (!source) return null

  return (
    <div className="video-player rounded-3" ref={containerRef} style={{ position: 'relative' }}>
      {/* Loader overlay */}
      <div
        className="video-loader-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          display: isLoading ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2,
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        <div className="video-loader">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading video...</span>
          </div>
          <p className="mt-2">Loading video...</p>
        </div>
      </div>

      {/* Error overlay */}
      <div
        className="video-error-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          display: hasError ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2,
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        <div className="video-error">
          <div className="text-danger mb-2">
            <i className="fas fa-exclamation-triangle fa-2x" />
          </div>
          <p>Failed to load video. Please try again.</p>
        </div>
      </div>

      <Plyr
        key={playerKey}
        ref={playerRef as any}
        playsInline
        crossOrigin="anonymous"
        controls
        source={source}
        options={{ autoplay: true }}
      />
    </div>
  )
}

export default memo(VideoPlayerBase, (prev, next) => {
  const a = String(prev.video._id || prev.video.url || prev.video.signedUrl || prev.video.video || '')
  const b = String(next.video._id || next.video.url || next.video.signedUrl || next.video.video || '')
  return a === b
})

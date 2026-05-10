import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { LiveAvatarSession, SessionEvent, AgentEventsEnum } from '@heygen/liveavatar-web-sdk'

export interface HeyGenAvatarHandle {
  speak: (text: string) => Promise<boolean>  // true = avatar spoke, false = timed out / failed
  isReady: () => boolean
  startStream: () => Promise<void>
  stopStream: () => Promise<void>
}

interface HeyGenAvatarProps {
  isTyping: boolean
  isListening: boolean
  isSpeaking?: boolean
  onSpeakStart?: () => void
  onSpeakEnd?: () => void
  onReady?: () => void
}

const HeyGenAvatar = forwardRef<HeyGenAvatarHandle, HeyGenAvatarProps>(
  ({ isTyping, isListening, isSpeaking: isSpeakingProp, onSpeakStart, onSpeakEnd, onReady }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const sessionRef = useRef<LiveAvatarSession | null>(null)
    const statusRef = useRef<'idle' | 'connecting' | 'ready' | 'error'>('idle')
    const baseURL = import.meta.env.VITE_API_BASE_URL
    const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'error'>('idle')
    const [isSpeaking, setIsSpeaking] = useState(false)

    const setStatusBoth = (s: typeof status) => {
      statusRef.current = s
      setStatus(s)
    }

    useImperativeHandle(ref, () => ({
      startStream: async () => {
        if (statusRef.current === 'connecting' || statusRef.current === 'ready') return

        try {
          setStatusBoth('connecting')
          const userToken = (window as any).__eklavUserToken

          const res = await fetch(`${baseURL}/api/liveavatar/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userToken}`,
            },
          })
          const data = await res.json()
          if (!data.success) throw new Error(data.error || 'Token fetch failed')

          const session = new LiveAvatarSession(data.token)
          sessionRef.current = session

          session.on(SessionEvent.SESSION_STREAM_READY, () => {
            if (videoRef.current) session.attach(videoRef.current)
            setStatusBoth('ready')
            // onReady is NOT called here — session.state is still 'CONNECTING' at this point.
            // We wait until session.start() resolves (state = CONNECTED) before notifying parent.
          })

          await session.start()
          // session.state is now 'CONNECTED' — safe to notify parent
          onReady?.()

        } catch (err) {
          console.error('LiveAvatar init error:', err)
          setStatusBoth('error')
        }
      },

      stopStream: async () => {
        if (sessionRef.current) {
          try { await sessionRef.current.stop() } catch { }
          sessionRef.current = null
        }
        setStatusBoth('idle')
      },

      speak: async (text: string): Promise<boolean> => {
        if (!sessionRef.current || statusRef.current !== 'ready') return false
        setIsSpeaking(true)

        // LITE mode: app owns TTS; send PCM to avatar for lip-sync, play audio via HTMLAudioElement
        try {
          const userToken = (window as any).__eklavUserToken
          const ttsRes = await fetch(`${baseURL}/api/liveavatar/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
            body: JSON.stringify({ text }),
          })
          const ttsData = await ttsRes.json()

          if (ttsData.success && ttsData.audio) {
            const binaryString = atob(ttsData.audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)

            const socket = (sessionRef.current as any)._sessionEventSocket as WebSocket | null
            if (socket?.readyState === WebSocket.OPEN) {
              // Register AVATAR_SPEAK_ENDED listener before sending chunks to avoid race condition
              const speakDone = new Promise<void>((resolve) => {
                const timeout = setTimeout(resolve, 15000)
                sessionRef.current!.once(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
                  clearTimeout(timeout)
                  resolve()
                })
              })

              // Fire onSpeakStart when server confirms avatar has started speaking
              sessionRef.current!.once(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
                onSpeakStart?.()
              })

              // Send base64 PCM chunks to HeyGen — it plays audio through LiveKit with lip-sync
              const eventId = crypto.randomUUID()
              const CHUNK_BYTES = 960 // 20ms at 24kHz 16-bit mono
              for (let i = 0; i < bytes.length; i += CHUNK_BYTES) {
                const chunk = bytes.subarray(i, i + CHUNK_BYTES)
                socket.send(JSON.stringify({ type: 'agent.speak', event_id: eventId, audio: btoa(String.fromCharCode(...chunk)) }))
              }
              socket.send(JSON.stringify({ type: 'agent.speak_end', event_id: eventId }))

              await speakDone
            }

            setIsSpeaking(false)
            onSpeakEnd?.()
            return true
          }
        } catch (e) {
          console.error('[speak] LITE mode error:', e)
        }

        setIsSpeaking(false)
        onSpeakEnd?.()
        return false
      },

      // 'ready' = tracks subscribed; 'CONNECTED' = WebSocket also established
      isReady: () => statusRef.current === 'ready' && sessionRef.current?.state === 'CONNECTED',
    }))

    const activeSpeaking = isSpeaking || !!isSpeakingProp

    const getStatusLabel = () => {
      if (activeSpeaking) return 'Speaking'
      if (isListening) return 'Listening'
      if (isTyping) return 'Thinking...'
      return 'Ready'
    }

    const getStatusColor = () => {
      if (activeSpeaking) return '#ff7a00'
      if (isListening) return '#28a745'
      if (isTyping) return '#ffc107'
      return '#4ade80'
    }

    return (
      <div className="hg-root">
        {status === 'idle' && (
          <div className="hg-loading">
            <div className="hg-avatar-silhouette">
              <svg viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="48" r="34" fill="#1a1a1a" stroke="#ff7a00" strokeWidth="2" />
                <ellipse cx="60" cy="160" rx="48" ry="52" fill="#1a1a1a" stroke="#ff7a00" strokeWidth="2" />
                <circle cx="60" cy="48" r="34" fill="url(#sh)" opacity="0.4" />
                <ellipse cx="60" cy="160" rx="48" ry="52" fill="url(#sh)" opacity="0.4" />
                <defs>
                  <linearGradient id="sh" x1="0" y1="0" x2="120" y2="200" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff7a00" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#ff7a00" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#ff7a00" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="hg-loading-text">
              <span className="hg-dot-pulse" />
              <span>Press Start to begin</span>
            </div>
          </div>
        )}

        {status === 'connecting' && (
          <div className="hg-loading">
            <div className="hg-avatar-silhouette">
              <svg viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="48" r="34" fill="#1a1a1a" stroke="#ff7a00" strokeWidth="2" />
                <ellipse cx="60" cy="160" rx="48" ry="52" fill="#1a1a1a" stroke="#ff7a00" strokeWidth="2" />
                <circle cx="60" cy="48" r="34" fill="url(#sh2)" opacity="0.4" />
                <ellipse cx="60" cy="160" rx="48" ry="52" fill="url(#sh2)" opacity="0.4" />
                <defs>
                  <linearGradient id="sh2" x1="0" y1="0" x2="120" y2="200" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff7a00" stopOpacity="0" />
                    <stop offset="0.5" stopColor="#ff7a00" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#ff7a00" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="hg-loading-text">
              <div className="hg-spinner" />
              <span>Connecting avatar...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="hg-loading">
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
            <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Avatar unavailable</div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="hg-video"
          style={{ display: status === 'ready' ? 'block' : 'none' }}
        />

        {status === 'ready' && (
          <div className="hg-status-bar">
            <span className="hg-status-dot" style={{ background: getStatusColor() }} />
            <span className="hg-status-label" style={{ color: getStatusColor() }}>
              {getStatusLabel()}
            </span>
          </div>
        )}

        <style>{`
          .hg-root {
            position: relative; width: 100%; height: 100%; min-height: 450px;
            background: linear-gradient(160deg, #0d0d0d 0%, #111 100%);
            border-radius: 20px; overflow: hidden;
            display: flex; align-items: center; justify-content: center;
          }
          .hg-video {
            width: 100%; height: 100%; object-fit: cover; border-radius: 20px;
            background: #111;
          }
          .hg-loading {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 1.25rem; padding: 2rem; width: 100%; height: 100%;
          }
          .hg-avatar-silhouette {
            width: 140px; height: auto; opacity: 0.7;
            animation: hg-breathe 2.5s ease-in-out infinite;
          }
          .hg-loading-text {
            display: flex; align-items: center; gap: 10px;
            color: #ff7a00; font-size: 0.85rem; font-weight: 600;
          }
          .hg-spinner {
            width: 18px; height: 18px; border: 2.5px solid #2a1200;
            border-top-color: #ff7a00; border-radius: 50%;
            animation: hg-spin 0.8s linear infinite; flex-shrink: 0;
          }
          .hg-dot-pulse {
            display: inline-block; width: 10px; height: 10px;
            border-radius: 50%; background: #ff7a00;
            animation: hg-pulse 1.4s ease-in-out infinite; flex-shrink: 0;
          }
          .hg-status-bar {
            position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
            display: flex; align-items: center; gap: 7px;
            background: rgba(0,0,0,0.65); padding: 5px 14px; border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
            white-space: nowrap;
          }
          .hg-status-dot {
            width: 7px; height: 7px; border-radius: 50%;
            animation: hg-pulse 1.5s ease-in-out infinite; flex-shrink: 0;
          }
          .hg-status-label {
            font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          }
          @keyframes hg-spin    { to { transform: rotate(360deg); } }
          @keyframes hg-breathe {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50%       { transform: scale(1.05); opacity: 0.9; }
          }
          @keyframes hg-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.5; transform: scale(1.25); }
          }
        `}</style>
      </div>
    )
  }
)

HeyGenAvatar.displayName = 'HeyGenAvatar'
export default HeyGenAvatar

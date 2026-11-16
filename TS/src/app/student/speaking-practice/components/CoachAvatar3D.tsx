import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/* Realistic 3D speaking coach (TalkingHead + three.js, all in the browser — no per-minute service).
   The page keeps playing the ElevenLabs clip through its own <audio> element; this avatar receives the
   same clip silently (speech gain 0) and lip-syncs to it, so pause / typewriter / turn logic stay untouched.
   Avatar: MPFB (MakeHuman) model from the TalkingHead repo, licensed CC0 — free for commercial use. */

/* Coach avatars (Blender + MPFB builds, CC0 assets): matched to the coach's voice, in the outfit the student picks */
export const COACH_OUTFITS = { tshirt: 'Black T-shirt', blazer: 'Blazer' } as const
export type CoachOutfit = keyof typeof COACH_OUTFITS
const AVATAR_URL: Record<'female' | 'male', Record<CoachOutfit, string>> = {
  female: { blazer: '/avatars/coach-bun.glb', tshirt: '/avatars/coach-female-tshirt.glb' },
  male: { blazer: '/avatars/coach-male.glb', tshirt: '/avatars/coach-male-tshirt.glb' },
}

export type CoachState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type CoachClip = { buffer: AudioBuffer; words: string[]; wtimes: number[]; wdurations: number[] }
export interface CoachAvatarHandle {
  /** Decode the clip and work out word timings — call before the <audio> starts so the mouth starts with it. */
  prepare: (audioUrl: string, text?: string) => Promise<CoachClip | null>
  /** Start lip-syncing a prepared clip (call when the page's audio starts playing). */
  start: (clip: CoachClip) => void
  stop: () => void
  gesture: (name: 'thumbup' | 'ok' | 'index' | 'handup' | 'namaste' | 'shrug') => void
  isReady: () => boolean
  /** Session result reaction: 'cheer' (scored well) or 'sad' (below the pass mark) */
  react: (kind: 'cheer' | 'sad') => void
}

/* The lip-sync only reads Latin text. Words in other scripts (native-language notes) become
   babble of a similar length, so the mouth still moves naturally for them. */
const toLipsyncWord = (w: string) => (/[a-z0-9]/i.test(w) ? w : 'mama'.slice(0, 2 + (Math.max(1, Math.round([...w].length / 2)) % 3)).repeat(Math.max(1, Math.round([...w].length / 3))))

/* ElevenLabs clips come without timestamps — spread the words over the clip by length,
   leaving a short breath after punctuation. Close enough for natural-looking speech. */
const estimateTimings = (text: string, durMs: number) => {
  const raw = text.split(/\s+/).filter(Boolean)
  if (!raw.length || durMs <= 0) return { words: [], wtimes: [], wdurations: [] }
  const weights = raw.map(w => [...w.replace(/[^\p{L}\p{N}]/gu, '')].length + 1 + (/[.!?]$/.test(w) ? 4 : /[,;:]$/.test(w) ? 2 : 0))
  const total = weights.reduce((s, v) => s + v, 0)
  const lead = 60
  const usable = Math.max(200, durMs * 0.95 - lead)
  const words: string[] = [], wtimes: number[] = [], wdurations: number[] = []
  let t = lead
  raw.forEach((w, i) => {
    const slot = (usable * weights[i]) / total
    const pause = /[.!?]$/.test(w) ? 0.35 : /[,;:]$/.test(w) ? 0.2 : 0.08
    words.push(toLipsyncWord(w)); wtimes.push(Math.round(t)); wdurations.push(Math.round(slot * (1 - pause)))
    t += slot
  })
  return { words, wtimes, wdurations }
}

const CoachAvatar3D = forwardRef<CoachAvatarHandle, { state: CoachState; gender?: 'female' | 'male'; outfit?: CoachOutfit; onError?: () => void }>(({ state, gender = 'female', outfit = 'tshirt', onError }, ref) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<any>(null)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const reactTimers = useRef<number[]>([])

  useEffect(() => {
    let disposed = false
    ;(async () => {
      try {
        const [{ TalkingHead }, { LipsyncEn }] = await Promise.all([
          import('@met4citizen/talkinghead'),
          import('@met4citizen/talkinghead/modules/lipsync-en.mjs'),
        ])
        if (disposed || !nodeRef.current) return
        const head = new TalkingHead(nodeRef.current, {
          ttsEndpoint: null,
          lipsyncModules: [], // loaded by hand below — the library's own dynamic import can't be followed by Vite
          lipsyncLang: 'en',
          cameraView: 'upper',
          cameraRotateEnable: false,
          mixerGainSpeech: 0, // the page plays the audio; the avatar only moves to it
          // Look at the student nearly all the time, with only small natural head movement
          avatarIdleEyeContact: 0.9,
          avatarSpeakingEyeContact: 0.95,
          avatarIdleHeadMove: 0.2,
          avatarSpeakingHeadMove: 0.25,
          modelPixelRatio: Math.min(2, window.devicePixelRatio || 1),
          lightAmbientIntensity: 2.2,
          lightDirectIntensity: 28,
        })
        head.lipsync.en = new LipsyncEn()
        // Stand like a presenter: the library's idle moods wander through casual poses (weight on one
        // hip, leaning, turned) that read as slouching for a coach — point them all at the upright pose.
        const upright = head.poseTemplates.straight
        if (upright) {
          for (const k of ['side', 'hip', 'turn', 'bend', 'back', 'wide']) head.poseTemplates[k] = upright
          head.poseName = 'straight'
        }
        // A soft, friendly face during the conversation: a gentle closed-lip smile (no lip raise or eye
        // squint — those read as a smirk), and a lighter one at rest.
        const moods = head.animMoods
        if (moods?.happy?.baseline) Object.assign(moods.happy.baseline, { mouthSmile: 0.3, mouthDimpleLeft: 0.08, mouthDimpleRight: 0.08, cheekSquintLeft: 0.06, cheekSquintRight: 0.06 })
        // The happy mood also animates the smile at random between 0 and 0.2, which overrides the resting
        // smile above — keep that natural movement, but around a real smile.
        moods?.happy?.anims?.forEach((an: any) => { if (an?.vs?.mouthSmile) an.vs.mouthSmile = [[0.22, 0.38, 2]] })
        if (moods?.neutral?.baseline) Object.assign(moods.neutral.baseline, { mouthSmile: 0.18 })
        headRef.current = head
        await head.showAvatar(
          { url: AVATAR_URL[gender][outfit], body: gender === 'male' ? 'M' : 'F', avatarMood: 'happy', lipsyncLang: 'en' },
          (ev: ProgressEvent) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)) },
        )
        if (disposed) { head.dispose?.(); return }
        if (upright) head.setPoseFromTemplate?.(upright, 0)
        setReady(true)
      } catch (err) {
        console.error('Coach avatar failed to load', err)
        if (!disposed) onError?.()
      }
    })()
    return () => {
      disposed = true
      reactTimers.current.forEach(clearTimeout)
      try { headRef.current?.stop(); headRef.current?.dispose?.() } catch { /* already gone */ }
      headRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Expressions follow the conversation: warm while listening, thoughtful while the reply is prepared.
  useEffect(() => {
    const head = headRef.current
    if (!head || !ready) return
    try {
      if (state === 'thinking') { head.setMood('neutral'); head.lookAhead(1200) }
      else if (state === 'listening') { head.setMood('happy'); head.lookAtCamera(600); head.makeEyeContact(6000) }
      else if (state === 'speaking') { head.setMood('happy'); head.lookAtCamera(800) }
      else head.setMood('neutral')
    } catch { /* mood changes are cosmetic */ }
  }, [state, ready])

  // Body language: while the student talks the coach visibly listens (small nods, an encouraging
  // smile, steady eye contact); while the coach talks her hands move naturally, like a real speaker.
  useEffect(() => {
    const head = headRef.current
    if (!head || !ready || (state !== 'listening' && state !== 'speaking')) return
    let timer = 0
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const tick = () => {
      try {
        if (state === 'listening') {
          const r = Math.random()
          if (r < 0.5) head.speakEmoji('yes')            // gentle nod
          else if (r < 0.75) head.speakEmoji('🙂')       // encouraging smile
          // always come back to the student's eyes after a nod or smile
          window.setTimeout(() => { try { head.lookAtCamera(500); head.makeEyeContact(5000) } catch { /* cosmetic */ } }, 1300)
        } else {
          head.speakWithHands(0, 0.9)                    // a new natural hand movement
        }
      } catch { /* body language is cosmetic */ }
      timer = window.setTimeout(tick, state === 'listening' ? rand(2600, 4800) : rand(2000, 3400))
    }
    timer = window.setTimeout(tick, state === 'listening' ? rand(1200, 2200) : rand(400, 900))
    return () => clearTimeout(timer)
  }, [state, ready])

  useImperativeHandle(ref, () => ({
    isReady: () => !!headRef.current && ready,
    prepare: async (audioUrl, text) => {
      const head = headRef.current
      if (!head || !ready) return null
      try {
        if (head.audioCtx.state === 'suspended') await head.audioCtx.resume().catch(() => { })
        const data = await (await fetch(audioUrl)).arrayBuffer()
        const buffer: AudioBuffer = await head.audioCtx.decodeAudioData(data)
        return { buffer, ...estimateTimings(text || '', buffer.duration * 1000) }
      } catch (err) {
        console.warn('Coach avatar could not prepare clip', err)
        return null
      }
    },
    start: (clip) => {
      const head = headRef.current
      if (!head) return
      try {
        head.stopSpeaking()
        head.speakAudio(clip.words.length ? { audio: clip.buffer, words: clip.words, wtimes: clip.wtimes, wdurations: clip.wdurations } : { audio: clip.buffer }, { lipsyncLang: 'en' })
      } catch (err) { console.warn('Coach avatar lip-sync failed', err) }
    },
    stop: () => { try { headRef.current?.stopSpeaking() } catch { /* nothing playing */ } },
    gesture: (name) => { try { headRef.current?.playGesture(name, 2.5) } catch { /* gesture is cosmetic */ } },
    // Like a batter after a boundary vs. a wicket: big delight for a good score,
    // a short, gentle disappointment for a low one (then back to an encouraging face).
    react: (kind) => {
      const head = headRef.current
      if (!head) return
      const later = (ms: number, fn: () => void) => reactTimers.current.push(window.setTimeout(() => { try { fn() } catch { /* cosmetic */ } }, ms))
      reactTimers.current.forEach(clearTimeout); reactTimers.current = []
      try {
        head.stopSpeaking()
        if (kind === 'cheer') {
          head.setMood('happy')
          head.lookAtCamera(4000)
          head.speakEmoji('🤩')
          head.playGesture('handup', 2.2)
          later(2400, () => { head.playGesture('thumbup', 2.8); head.speakEmoji('😄') })
          later(5600, () => head.speakEmoji('😊'))
        } else {
          // crying face, then stays disappointed (sad mood is kept until the next session)
          head.setMood('sad')
          head.speakEmoji('😭')
          later(2000, () => { head.speakEmoji('😭'); head.speakEmoji('no') })
          later(4000, () => head.speakEmoji('😔'))
        }
      } catch { /* reactions are cosmetic */ }
    },
  }), [ready])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={nodeRef} style={{ position: 'absolute', inset: 0 }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#475569', fontSize: 12, fontWeight: 700 }}>
          <div style={{ width: 140, height: 6, borderRadius: 99, background: 'rgba(15,23,42,0.12)', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#ff7a00', transition: 'width .2s' }} />
          </div>
          Loading your coach… {progress ? `${progress}%` : ''}
        </div>
      )}
    </div>
  )
})

CoachAvatar3D.displayName = 'CoachAvatar3D'
export default CoachAvatar3D

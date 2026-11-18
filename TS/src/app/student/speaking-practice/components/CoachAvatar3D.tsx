import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { SEATED_ARMS } from './seatedPose'

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
  /** Friendly wave with the right hand (e.g. when the student says hi) */
  wave: () => void
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

/* Seated at a desk: the arm pose comes from Blender (seatedPose.ts); the desk is placed once the pose
   has settled, measured from where her hands actually are, so its surface sits right under the palms. */
/* True eye contact: every frame, aim both eyes at the actual camera from where her head really is.
   (The library's own eye contact assumes its default camera height — with our seated framing it pointed
   her eyes down — and its "look at" helper turns the whole body.) Tiny, rare glances keep it natural. */
const EYE_RANGE = 0.45 // radians of eye turn that map to a full eye-look blend shape
const makeEyeAim = (THREE: any, head: any) => {
  const eyes = new THREE.Vector3(), cam = new THREE.Vector3(), q = new THREE.Quaternion(), v = new THREE.Vector3()
  let glance = { x: 0, y: 0, until: 0 }, next = performance.now() + 4000
  return () => {
    const hd = head.objectHead, le = head.objectLeftEye, re = head.objectRightEye
    if (!hd || !le || !re || !head.camera) return
    le.getWorldPosition(eyes); re.getWorldPosition(v); eyes.add(v).multiplyScalar(0.5)
    head.camera.getWorldPosition(cam)
    hd.getWorldQuaternion(q)
    v.subVectors(cam, eyes).applyQuaternion(q.invert())           // camera direction in head space
    let down = Math.atan2(-v.y, v.z), left = Math.atan2(v.x, v.z)
    const now = performance.now()
    if (now > next) {                                             // a brief natural glance now and then
      glance = { x: (Math.random() - 0.5) * 0.12, y: (Math.random() - 0.5) * 0.2, until: now + 350 }
      next = now + 4500 + Math.random() * 5000
    }
    if (now < glance.until) { down += glance.x; left += glance.y }
    const c = (a: number) => Math.max(-1, Math.min(1, a / EYE_RANGE))
    const x = c(down), y = c(left), m = head.mtAvatar
    // "realtime" is applied every frame without easing, so the eyes stay locked on instead of trailing
    const set = (k: string, val: number) => { if (m?.[k]) { m[k].realtime = val; m[k].needsUpdate = true } }
    set('eyesLookDown', x > 0 ? x : 0); set('eyesLookUp', x < 0 ? -x : 0)
    set('eyeLookOutLeft', y > 0 ? y : 0); set('eyeLookInLeft', y < 0 ? -y : 0)
    set('eyeLookOutRight', y < 0 ? -y : 0); set('eyeLookInRight', y > 0 ? y : 0)
  }
}

const ARM_KEY = /^(Left|Right)(Shoulder|Arm|ForeArm|Hand)/
/* Seated, the body stays square to the desk: every idle / speaking / emoji movement that would twist or
   lean the spine (bodyRotate*) is redirected to the head alone. */
// scale an animation value list ([x], [[min, max, ...]], ...) — only the value / range numbers
const scaleAnim = (vals: any, k: number): any =>
  Array.isArray(vals) ? vals.map(v => (Array.isArray(v) ? v.map((n, i) => (i < 2 && typeof n === 'number' ? n * k : n)) : typeof v === 'number' ? v * k : v)) : vals
const headOnlyMovement = (head: any) => {
  const seen = new Set<any>()
  const walk = (o: any) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return
    seen.add(o)
    if (o.vs && typeof o.vs === 'object') {
      for (const ax of ['X', 'Y', 'Z']) {
        const b = 'bodyRotate' + ax, h = 'headRotate' + ax
        // the body sway becomes a calmer head movement (40%) so she stays facing the student
        if (b in o.vs) { if (!(h in o.vs)) o.vs[h] = scaleAnim(o.vs[b], 0.4); delete o.vs[b] }
      }
    }
    if (o.baseline && 'bodyRotateX' in o.baseline) delete o.baseline.bodyRotateX
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v)
  }
  walk(head.animMoods); walk(head.animEmojis)
}

/* Turn each resting hand outward around its palm normal, so the fingers point forward on the desk
   instead of at each other. */
const HAND_TURN = 0.55
const turnHand = (q: { x: number; y: number; z: number; w: number }, a: number) => {
  const s = Math.sin(a / 2), c = Math.cos(a / 2)            // q * rotation about local Z (palm normal)
  return { x: q.x * c + q.y * s, y: q.y * c - q.x * s, z: q.z * c + q.w * s, w: q.w * c - q.z * s }
}

const seatCoach = (head: any, base: any, gender: 'female' | 'male') => {
  const props: Record<string, any> = {}
  for (const [k, v] of Object.entries(base.props)) if (!ARM_KEY.test(k)) props[k] = v
  Object.assign(props, SEATED_ARMS[gender])
  const turn = HAND_TURN
  if (props['LeftHand.quaternion']) props['LeftHand.quaternion'] = turnHand(props['LeftHand.quaternion'], turn)
  if (props['RightHand.quaternion']) props['RightHand.quaternion'] = turnHand(props['RightHand.quaternion'], -turn)
  // fingers relaxed and almost straight, lying on the desk (the posed data keeps the hanging-hand curl)
  for (const k of Object.keys(props)) {
    if (/Hand(Index|Middle|Ring|Pinky)[123]\.quaternion$/.test(k)) props[k] = { x: 0.05, y: 0, z: 0, w: 0.9987 }
  }
  const seated = { ...base, props }
  for (const k of ['straight', 'side', 'hip', 'turn', 'bend', 'back', 'wide']) head.poseTemplates[k] = seated
  head.setPoseFromTemplate(seated, 0)
}
/* Wood grain drawn on a canvas, so the desk reads as a real table rather than a flat coloured block. */
const woodTexture = (THREE: any) => {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#7a5134'; g.fillRect(0, 0, c.width, c.height)
  for (let i = 0; i < 140; i++) {
    const y = Math.random() * c.height, a = 0.04 + Math.random() * 0.09
    g.strokeStyle = Math.random() < 0.5 ? `rgba(40,22,10,${a})` : `rgba(190,140,95,${a})`
    g.lineWidth = 0.6 + Math.random() * 2.4
    g.beginPath(); g.moveTo(0, y)
    for (let x = 0; x <= c.width; x += 64) g.lineTo(x, y + Math.sin(x / 140 + i) * 3 + (Math.random() - 0.5) * 2)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 1)
  return t
}

const addDesk = (THREE: any, head: any) => {
  const arm = head.armature
  const P = (n: string) => arm?.getObjectByName(n)?.getWorldPosition(new THREE.Vector3())
  const lh = P('LeftHand'), rh = P('RightHand'), ls = P('LeftArm'), rs = P('RightArm')
  if (!lh || !rh || !ls || !rs) return
  const cx = (ls.x + rs.x) / 2
  const top = Math.min(lh.y, rh.y) - 0.03                  // palms rest on the surface
  const back = (ls.z + rs.z) / 2 - 0.02                    // the table runs under her forearms, hands well onto it
  const D = 1.2, T = 0.045
  const wood = woodTexture(THREE)
  const topMat = new THREE.MeshStandardMaterial({ map: wood, color: 0xffffff, roughness: 0.45, metalness: 0 })
  const edgeMat = new THREE.MeshStandardMaterial({ map: wood, color: 0x9a8070, roughness: 0.6, metalness: 0 })
  // tabletop: lit top face, slightly darker edges so its thickness reads
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2.4, T, D), [edgeMat, edgeMat, topMat, edgeMat, edgeMat, edgeMat])
  slab.position.set(cx, top - T / 2, back + D / 2)
  // front panel below the top, in shadow, so nothing under the table shows
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.04), new THREE.MeshStandardMaterial({ color: 0x3b281b, roughness: 0.8 }))
  panel.position.set(cx, top - T - 0.6, back + D - 0.06)
  // office-chair backrest behind her shoulders: the clearest cue that she is sitting
  const sz = (ls.z + rs.z) / 2, sy = (ls.y + rs.y) / 2, sw = ls.distanceTo(rs)
  const chairH = sy + 0.06 - top
  const chair = new THREE.Mesh(
    new THREE.BoxGeometry(sw * 1.75, chairH, 0.07, 1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x1f2329, roughness: 0.7, metalness: 0.05 }),
  )
  chair.position.set(cx, top + chairH / 2, sz - 0.2)
  const desk = new THREE.Group(); desk.name = 'coachDesk'; desk.add(slab, panel, chair)
  head.scene.add(desk)
}

const CoachAvatar3D = forwardRef<CoachAvatarHandle, { state: CoachState; gender?: 'female' | 'male'; outfit?: CoachOutfit; onError?: () => void }>(({ state, gender = 'female', outfit = 'tshirt', onError }, ref) => {
  const nodeRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<any>(null)
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const reactTimers = useRef<number[]>([])
  const eyeAimRef = useRef<null | (() => void)>(null)
  const seatedRef = useRef(false) // seated at the desk: standing arm gestures would break the pose

  useEffect(() => {
    let disposed = false
    ;(async () => {
      try {
        const [{ TalkingHead }, { LipsyncEn }, THREE] = await Promise.all([
          import('@met4citizen/talkinghead'),
          import('@met4citizen/talkinghead/modules/lipsync-en.mjs'),
          import('three'),
        ])
        if (disposed || !nodeRef.current) return
        const head = new TalkingHead(nodeRef.current, {
          ttsEndpoint: null,
          lipsyncModules: [], // loaded by hand below — the library's own dynamic import can't be followed by Vite
          lipsyncLang: 'en',
          cameraView: 'upper',
          update: () => { try { eyeAimRef.current?.() } catch { /* cosmetic */ } },
          cameraDistance: 1.35, // head to just below the hands resting on the desk
          cameraY: 0.72,
          cameraRotateX: -0.1, // close to her eye level, tilted just enough to show the desk top
          cameraRotateEnable: false,
          mixerGainSpeech: 0, // the page plays the audio; the avatar only moves to it
          // Look at the student nearly all the time, with only small natural head movement
          avatarIdleEyeContact: 1,
          avatarSpeakingEyeContact: 1,
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
        // eyes open and level (the moods look slightly down by default, which reads as half-closed lids)
        for (const m of ['neutral', 'happy']) if (moods?.[m]?.baseline) Object.assign(moods[m].baseline, { eyesLookDown: 0, eyeWideLeft: 0.12, eyeWideRight: 0.12 })
        headRef.current = head
        await head.showAvatar(
          { url: AVATAR_URL[gender][outfit], body: gender === 'male' ? 'M' : 'F', avatarMood: 'happy', lipsyncLang: 'en' },
          (ev: ProgressEvent) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)) },
        )
        if (disposed) { head.dispose?.(); return }
        if (upright) head.setPoseFromTemplate?.(upright, 0)
        // the eyes are aimed every frame (above); the library's look-at helpers would turn her whole body
        head.lookAt = () => { }
        head.lookAtCamera = () => { }
        head.lookAhead = () => { }
        eyeAimRef.current = makeEyeAim(THREE, head)
        // keep speech mouth shapes natural: the wide ones (E, I, S, CH...) are capped, and so is the smile
        const mt = head.mtAvatar || {}
        for (const k of ['viseme_E', 'viseme_I', 'viseme_SS', 'viseme_CH', 'viseme_DD', 'viseme_nn', 'viseme_kk', 'viseme_TH', 'viseme_RR'])
          if (mt[k]) mt[k].max = 0.6
        for (const k of ['mouthSmile', 'mouthSmileLeft', 'mouthSmileRight', 'mouthStretchLeft', 'mouthStretchRight'])
          if (mt[k]) mt[k].max = 0.45
        if (upright && SEATED_ARMS[gender]) {
          try {
            seatCoach(head, upright, gender)
            headOnlyMovement(head)
            seatedRef.current = true
            window.setTimeout(() => { try { if (!disposed) addDesk(THREE, head) } catch (e) { console.warn('Desk skipped', e) } }, 700)
          } catch (e) { console.warn('Seated pose skipped', e) }
        }
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
      if (state === 'thinking') head.setMood('neutral')            // eye contact is kept by the per-frame eye aim
      else if (state === 'listening') head.setMood('happy')
      else if (state === 'speaking') head.setMood('neutral')       // light smile while talking: smile + lip-sync together over-widen the mouth
      else head.setMood('neutral')
    } catch { /* mood changes are cosmetic */ }
  }, [state, ready])

  // Body language: while the student talks the coach visibly listens (small nods, an encouraging
  // smile, steady eye contact); while the coach talks her hands move naturally, like a real speaker.
  useEffect(() => {
    const head = headRef.current
    if (!head || !ready) return
    if (state !== 'listening' && state !== 'speaking') return
    let timer = 0
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const tick = () => {
      try {
        if (state === 'listening') {
          const r = Math.random()
          if (r < 0.5) head.speakEmoji('yes')            // gentle nod
          else if (r < 0.75) head.speakEmoji('🙂')       // encouraging smile
        } else {
          if (!seatedRef.current) head.speakWithHands(0, 0.9) // a new natural hand movement (standing only)
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
    wave: () => {
      const head = headRef.current
      if (!head) return
      const later = (ms: number, fn: () => void) => reactTimers.current.push(window.setTimeout(() => { try { fn() } catch { /* cosmetic */ } }, ms))
      try {
        // two copies of the raised-hand gesture, the hand tilted left / right, alternated = a wave
        const base = head.gestureTemplates?.handup
        if (!base) return
        if (!head.gestureTemplates.waveA) {
          const tilt = (dz: number) => ({ ...base, 'LeftHand.rotation': { ...base['LeftHand.rotation'], z: base['LeftHand.rotation'].z + dz } })
          head.gestureTemplates.waveA = tilt(0.45)
          head.gestureTemplates.waveB = tilt(-0.45)
        }
        head.speakEmoji('😊')
        head.playGesture('waveA', 0, true, 700)                     // raise the right hand (mirrored left)
        ;[1000, 1350, 1700, 2050].forEach((t, i) => later(t, () => head.playGesture(i % 2 ? 'waveA' : 'waveB', 0, true, 330)))
        later(2500, () => head.stopGesture(900))                    // back to resting on the desk
      } catch { /* the wave is cosmetic */ }
    },
    gesture: (name) => { try { if (!seatedRef.current) headRef.current?.playGesture(name, 2.5) } catch { /* gesture is cosmetic */ } },
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
          head.speakEmoji('🤩')
          if (!seatedRef.current) head.playGesture('handup', 2.2)
          later(2400, () => { if (!seatedRef.current) head.playGesture('thumbup', 2.8); head.speakEmoji('😄') })
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

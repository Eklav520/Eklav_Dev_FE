import React, { useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

type Section =
  | 'reading_comprehension'
  | 'verbal_ability'
  | 'sentence_correction'
  | 'error_detection'
  | 'para_jumbles'
  | 'email_writing'
  | 'essay_writing'

const SECTION_META: Record<Section, { label: string; emoji: string; color: string; isMCQ: boolean }> = {
  reading_comprehension: { label: 'Reading Comprehension', emoji: '📖', color: '#3b82f6', isMCQ: true },
  verbal_ability:        { label: 'Verbal Ability',        emoji: '🔤', color: '#8b5cf6', isMCQ: true },
  sentence_correction:   { label: 'Sentence Correction',   emoji: '✅', color: '#22c55e', isMCQ: true },
  error_detection:       { label: 'Error Detection',       emoji: '🔍', color: '#f59e0b', isMCQ: true },
  para_jumbles:          { label: 'Para Jumbles',          emoji: '🔀', color: '#ef4444', isMCQ: true },
  email_writing:         { label: 'Email Writing',         emoji: '✉️', color: '#06b6d4', isMCQ: false },
  essay_writing:         { label: 'Essay Writing',         emoji: '✍️', color: '#ec4899', isMCQ: false },
}

interface Question {
  _id: string
  section: Section
  passage?: string
  question: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctOptionKey?: string
  prompt?: string
  evaluationCriteria?: string[]
  maxWords?: number
  marks: number
}

interface Props {
  examId: string
  duration: number
  onSubmit: () => void
  forceSubmitRef?: React.MutableRefObject<() => void>
  disarmProctor?: () => void
  armProctor?: () => void
}

export default function StudentEnglishRound({ examId, duration, onSubmit, forceSubmitRef, disarmProctor, armProctor }: Props) {
  const { user } = useAuthContext()
  const token = user?.token

  const [loading, setLoading]       = useState(true)
  const [questions, setQuestions]   = useState<Question[]>([])
  const [activeSection, setActiveSection] = useState<Section>('reading_comprehension')
  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft]     = useState(duration)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  // Camera recording
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null)
  const recordedChunks    = useRef<Blob[]>([])
  const cameraStreamRef   = useRef<MediaStream | null>(null)
  const videoRef          = useRef<HTMLVideoElement | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const submittingRef = useRef(false)
  const answersRef    = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    // Disarm proctor before requesting permission — browser permission dialog
    // causes a window blur event which the proctor would count as a violation.
    disarmProctor?.()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: true,
      })
      cameraStreamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.current.push(e.data) }
      recorder.start(1000)
      setIsRecording(true)
    } catch { /* camera denied — proceed silently */ }
    // Re-arm proctor after permission dialog is resolved (success or denied)
    // Small delay to let any residual focus-lost events clear before re-arming.
    setTimeout(() => armProctor?.(), 500)
  }

  const stopCamera = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    cameraStreamRef.current?.getTracks().forEach(t => t.stop())
    setIsRecording(false)
  }

  // ── Fetch questions ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/assessment/admin/exam/${examId}/english-questions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) setQuestions(data.questions || [])
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
    startCamera()
    return () => { stopCamera(); clearInterval(timerRef.current!) }
  }, [examId, token])

  // Pick first available section after questions load
  useEffect(() => {
    if (!questions.length) return
    const first = (Object.keys(SECTION_META) as Section[]).find(s => questions.some(q => q.section === s))
    if (first) setActiveSection(first)
  }, [questions])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); doSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  // ── Submit ────────────────────────────────────────────────────────────────
  const doSubmit = async () => {
    if (submittingRef.current || submitted) return
    submittingRef.current = true
    setSubmitting(true)
    clearInterval(timerRef.current!)
    stopCamera()

    let sessionMediaUrl = ''

    // Upload recording to S3
    if (recordedChunks.current.length > 0) {
      try {
        const blob     = new Blob(recordedChunks.current, { type: 'video/webm' })
        const fileName = `english_${Date.now()}.webm`
        const presignRes = await fetch(`${API_BASE}/api/assessment/presign/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileName, fileType: 'video/webm' }),
        })
        const presignData = await presignRes.json()
        if (presignData?.uploadUrl && presignData?.fileUrl) {
          await fetch(presignData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'video/webm' }, body: blob })
          sessionMediaUrl = presignData.fileUrl
        }
      } catch { /* upload failure is non-fatal */ }
    }

    const payload = questions.map(q => ({
      qid:    q._id,
      type:   SECTION_META[q.section].isMCQ ? 'mcq' : 'writing',
      answer: answersRef.current[q._id] || '',
    }))

    try {
      await fetch(`${API_BASE}/api/assessment/complete-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ examId, roundType: 'english', answers: payload, sessionMediaUrl }),
      })
    } catch { /* ignore */ }

    setSubmitted(true)
    submittingRef.current = false
    setSubmitting(false)
    setTimeout(() => onSubmit(), 1500)
  }

  if (forceSubmitRef) forceSubmitRef.current = doSubmit

  // ── Derived state ─────────────────────────────────────────────────────────
  const sections         = (Object.keys(SECTION_META) as Section[]).filter(s => questions.some(q => q.section === s))
  const sectionQuestions = questions.filter(q => q.section === activeSection)
  const totalAnswered    = questions.filter(q => answersRef.current[q._id]?.trim()).length
  const timerPct         = (timeLeft / duration) * 100
  const timerColor       = timerPct > 40 ? '#22c55e' : timerPct > 15 ? '#f59e0b' : '#ef4444'
  const activeMeta       = SECTION_META[activeSection]
  const activeIdx        = sections.indexOf(activeSection)
  const prevSection      = sections[activeIdx - 1]
  const nextSection      = sections[activeIdx + 1]

  // ── Loading / submitted screens ───────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#000', color:'#fff', gap:12 }}>
      <Spinner animation="border" style={{ color:'#a855f7' }} /> <span>Loading English Assessment…</span>
    </div>
  )

  if (submitted) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#000', gap:16 }}>
      <div style={{ fontSize:'3rem' }}>✅</div>
      <div style={{ color:'#22c55e', fontSize:'1.4rem', fontWeight:800 }}>Submitted!</div>
      <div style={{ color:'#666', fontSize:'0.9rem' }}>Returning to assessment…</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#000', color:'#f0f0f0', overflow:'hidden', fontFamily:'inherit' }}>

      {/* ── Top bar ── */}
      <div style={{ flexShrink:0, background:'#0a0a0a', borderBottom:'1px solid #1f1f1f', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'1.3rem' }}>🇬🇧</span>
          <div>
            <div style={{ fontWeight:800, fontSize:'1rem' }}>English Assessment</div>
            <div style={{ fontSize:'0.72rem', color:'#555' }}>{totalAnswered} / {questions.length} answered</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ flex:1, maxWidth:300, background:'#1a1a1a', height:6, borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', background:'#a855f7', width:`${questions.length ? (totalAnswered/questions.length)*100 : 0}%`, transition:'width 0.3s' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* Camera indicator */}
          {isRecording && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.7rem', color:'#ef4444', fontWeight:700 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', display:'inline-block', animation:'blink 1s infinite' }} />
              REC
            </div>
          )}

          {/* Timer */}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'1.3rem', fontWeight:800, fontVariantNumeric:'tabular-nums', color:timerColor }}>{formatTime(timeLeft)}</div>
            <div style={{ fontSize:'0.65rem', color:'#444', letterSpacing:'0.05em', textTransform:'uppercase' }}>remaining</div>
          </div>

          <button
            onClick={doSubmit}
            disabled={submitting}
            style={{ padding:'8px 18px', background:'#a855f7', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:'0.83rem', cursor:'pointer', minWidth:80 }}
          >
            {submitting ? <Spinner size="sm" animation="border" /> : 'Submit'}
          </button>
        </div>
      </div>

      {/* Timer strip */}
      <div style={{ height:3, background:'#111', flexShrink:0 }}>
        <div style={{ height:'100%', background:timerColor, width:`${timerPct}%`, transition:'width 1s linear, background 0.5s' }} />
      </div>

      {/* ── Body: sidebar + content ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Left: Section nav ── */}
        <div style={{ width:210, flexShrink:0, background:'#080808', borderRight:'1px solid #141414', overflowY:'auto', padding:'12px 8px', display:'flex', flexDirection:'column', gap:0 }}>
          {sections.map(s => {
            const meta     = SECTION_META[s]
            const qs       = questions.filter(q => q.section === s)
            const answered = qs.filter(q => answers[q._id]?.trim()).length
            const isActive = activeSection === s
            return (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                style={{
                  display:'flex', flexDirection:'column', width:'100%', textAlign:'left',
                  padding:'10px 12px', marginBottom:4, borderRadius:10, cursor:'pointer',
                  background: isActive ? `${meta.color}15` : 'transparent',
                  border:`1px solid ${isActive ? meta.color+'50' : 'transparent'}`,
                  transition:'all 0.15s',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                  <span style={{ fontSize:'1rem' }}>{meta.emoji}</span>
                  <span style={{ fontSize:'0.78rem', fontWeight:700, color: isActive ? meta.color : '#888', lineHeight:1.3 }}>{meta.label}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ flex:1, height:3, background:'#1a1a1a', borderRadius:2 }}>
                    <div style={{ height:'100%', background: answered === qs.length && qs.length > 0 ? '#22c55e' : meta.color, borderRadius:2, width:`${qs.length ? (answered/qs.length)*100 : 0}%`, transition:'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize:'0.65rem', color:'#555', whiteSpace:'nowrap' }}>{answered}/{qs.length}</span>
                </div>
              </button>
            )
          })}

          {/* Hidden camera preview */}
          <video ref={videoRef} muted style={{ display:'none' }} />
        </div>

        {/* ── Right: scrollable content + sticky bottom nav ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Scrollable question area */}
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 8px' }}>
            {sectionQuestions.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', color:'#444', gap:8 }}>
                <span style={{ fontSize:'2rem' }}>{activeMeta.emoji}</span>
                <span style={{ fontSize:'0.9rem' }}>No questions in this section</span>
              </div>
            ) : (
              <MCQOrWritingSection
                section={activeSection}
                questions={sectionQuestions}
                answers={answers}
                onAnswer={(qid, val) => setAnswers(prev => ({ ...prev, [qid]: val }))}
              />
            )}
          </div>

          {/* ── Sticky bottom navigation ── */}
          <div style={{ flexShrink:0, borderTop:'1px solid #1a1a1a', background:'#050505', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button
              onClick={() => prevSection && setActiveSection(prevSection)}
              disabled={!prevSection}
              style={{
                padding:'9px 20px', borderRadius:8, fontSize:'0.83rem', fontWeight:700, cursor: prevSection ? 'pointer' : 'default',
                background: prevSection ? '#1a1a1a' : 'transparent',
                border:`1px solid ${prevSection ? '#2a2a2a' : 'transparent'}`,
                color: prevSection ? '#ccc' : 'transparent',
                display:'flex', alignItems:'center', gap:6,
              }}
            >
              {prevSection && <>← {SECTION_META[prevSection].label}</>}
            </button>

            {/* Section dots */}
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {sections.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSection(s)}
                  title={SECTION_META[s].label}
                  style={{
                    width: s === activeSection ? 22 : 8,
                    height:8, borderRadius:4, border:'none', cursor:'pointer',
                    background: s === activeSection ? activeMeta.color :
                      questions.filter(q => q.section === s).every(q => answers[q._id]?.trim()) && questions.some(q => q.section === s) ? '#22c55e' : '#2a2a2a',
                    transition:'all 0.2s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => nextSection ? setActiveSection(nextSection) : doSubmit()}
              disabled={submitting}
              style={{
                padding:'9px 20px', borderRadius:8, fontSize:'0.83rem', fontWeight:700, cursor:'pointer',
                background: nextSection ? '#1a1a1a' : '#a855f7',
                border:`1px solid ${nextSection ? '#2a2a2a' : '#a855f7'}`,
                color: nextSection ? '#ccc' : '#fff',
                display:'flex', alignItems:'center', gap:6,
              }}
            >
              {submitting ? <Spinner size="sm" animation="border" /> : nextSection ? <>{SECTION_META[nextSection].label} →</> : 'Submit All →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}

// ── MCQ / Writing section renderer ───────────────────────────────────────────

interface SectionProps {
  section: Section
  questions: Question[]
  answers: Record<string, string>
  onAnswer: (qid: string, val: string) => void
}

function MCQOrWritingSection({ section, questions, answers, onAnswer }: SectionProps) {
  const meta = SECTION_META[section]

  if (meta.isMCQ) {
    // Group by passage
    const groups: { passage: string; qs: Question[] }[] = []
    for (const q of questions) {
      const passage = q.passage || ''
      const last = groups[groups.length - 1]
      if (last && last.passage === passage) last.qs.push(q)
      else groups.push({ passage, qs: [q] })
    }

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:'1.5rem' }}>{meta.emoji}</span>
          <div>
            <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{meta.label}</div>
            <div style={{ fontSize:'0.75rem', color:'#555' }}>{questions.length} questions</div>
          </div>
        </div>
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.passage && (
              <div style={{ background:'#0d0d0d', border:'1px solid #1f1f1f', borderLeft:`3px solid ${meta.color}`, borderRadius:10, padding:'14px 18px', marginBottom:16, fontSize:'0.88rem', lineHeight:1.8, color:'#ccc' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:meta.color, marginBottom:8 }}>Passage</div>
                {group.passage}
              </div>
            )}
            {group.qs.map(q => (
              <MCQCard
                key={q._id}
                question={q}
                number={questions.indexOf(q) + 1}
                selected={answers[q._id] || ''}
                color={meta.color}
                onSelect={val => onAnswer(q._id, val)}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
        <span style={{ fontSize:'1.5rem' }}>{meta.emoji}</span>
        <div>
          <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{meta.label}</div>
          <div style={{ fontSize:'0.75rem', color:'#555' }}>{questions.length} prompt{questions.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      {questions.map((q, i) => (
        <WritingCard
          key={q._id}
          question={q}
          number={i + 1}
          value={answers[q._id] || ''}
          color={meta.color}
          onChange={val => onAnswer(q._id, val)}
        />
      ))}
    </div>
  )
}

// ── MCQ card ──────────────────────────────────────────────────────────────────

const OPTIONS: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']

function MCQCard({ question, number, selected, color, onSelect }: {
  question: Question; number: number; selected: string; color: string; onSelect: (v: string) => void
}) {
  return (
    <div style={{ background:'#0d0d0d', border:`1px solid ${selected ? color+'40' : '#1f1f1f'}`, borderRadius:12, padding:'16px 18px', marginBottom:12 }}>
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <span style={{ flexShrink:0, width:26, height:26, borderRadius:'50%', background: selected ? color : '#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:800, color: selected ? '#fff' : '#555', border:`1px solid ${selected ? color : '#2a2a2a'}` }}>{number}</span>
        <p style={{ margin:0, fontSize:'0.9rem', lineHeight:1.65, color:'#e0e0e0', fontWeight:500 }}>{question.question}</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {OPTIONS.map(opt => {
          const text = question[`option${opt}` as keyof Question] as string
          if (!text) return null
          const isSel = selected === opt
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, cursor:'pointer', textAlign:'left', background: isSel ? `${color}18` : '#111', border:`1.5px solid ${isSel ? color : '#1f1f1f'}`, transition:'all 0.12s' }}
            >
              <span style={{ flexShrink:0, width:24, height:24, borderRadius:'50%', background: isSel ? color : '#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:800, color: isSel ? '#fff' : '#555', border:`1px solid ${isSel ? color : '#252525'}` }}>{opt}</span>
              <span style={{ fontSize:'0.85rem', color: isSel ? '#f0f0f0' : '#aaa', lineHeight:1.4 }}>{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Writing card ──────────────────────────────────────────────────────────────

function WritingCard({ question, number, value, color, onChange }: {
  question: Question; number: number; value: string; color: string; onChange: (v: string) => void
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const maxWords  = question.maxWords || 300
  const over      = wordCount > maxWords

  return (
    <div style={{ background:'#0d0d0d', border:`1px solid ${value.trim() ? color+'40' : '#1f1f1f'}`, borderRadius:12, padding:'18px 20px' }}>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:14 }}>
        <span style={{ flexShrink:0, width:28, height:28, borderRadius:'50%', background: value.trim() ? color : '#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:800, color: value.trim() ? '#fff' : '#555', border:`1px solid ${value.trim() ? color : '#2a2a2a'}` }}>{number}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color, marginBottom:6 }}>{question.question}</div>
          {question.prompt && (
            <div style={{ background:'#141414', border:`1px solid ${color}25`, borderRadius:8, padding:'12px 14px', fontSize:'0.85rem', lineHeight:1.65, color:'#ccc', marginBottom:10 }}>{question.prompt}</div>
          )}
          {question.evaluationCriteria && question.evaluationCriteria.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {question.evaluationCriteria.map(c => (
                <span key={c} style={{ background:`${color}15`, color, border:`1px solid ${color}30`, borderRadius:5, fontSize:'0.68rem', fontWeight:600, padding:'2px 8px' }}>{c}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Write your answer here… (max ${maxWords} words)`}
        rows={8}
        style={{ width:'100%', background:'#111', border:`1px solid ${over ? '#ef4444' : value.trim() ? color+'40' : '#1f1f1f'}`, borderRadius:8, padding:'12px 14px', color:'#f0f0f0', fontSize:'0.88rem', lineHeight:1.7, resize:'vertical', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s' }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
        <span style={{ fontSize:'0.7rem', color:'#444' }}>{question.marks} marks</span>
        <span style={{ fontSize:'0.7rem', color: over ? '#ef4444' : '#555' }}>{wordCount} / {maxWords} words</span>
      </div>
    </div>
  )
}

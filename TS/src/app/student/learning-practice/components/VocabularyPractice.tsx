import React, { useState, useEffect } from "react"
import { Button, Spinner, Modal } from "react-bootstrap"
import {
  FaBookReader, FaPlay, FaCheckCircle, FaCalendarCheck,
  FaBrain, FaBook, FaQuestionCircle, FaChartLine, FaVolumeUp,
  FaBriefcase, FaGraduationCap, FaLaptopCode, FaFlask, FaLeaf, FaHeartbeat,
  FaPlane, FaSmile, FaUsers, FaUtensils, FaCity, FaThLarge,
  FaStar, FaClock, FaChevronDown, FaChevronUp, FaChevronRight,
  FaBookmark, FaRegBookmark, FaTimes, FaCalendarAlt, FaAngleLeft, FaAngleRight,
  FaClone, FaMicrophone, FaPencilAlt,
} from "react-icons/fa"
import { useAuthContext } from "@/context/useAuthContext"
import bookImg from "@/assets/images/vacabularybook.png"

interface WordProgress {
  status: 'new' | 'learned' | 'review' | 'difficult'
  seenCount: number
  correctCount: number
  bookmarked: boolean
  lastSeenAt: string | null
}

interface Word {
  _id: string
  word: string
  meaning: string
  example?: string
  quizOptions: string[]
  correctAnswer: string
  synonyms?: string[]
  antonyms?: string[]
  partOfSpeech?: string
  usageTip?: string
  progress?: WordProgress
}

interface VocabStats {
  totalWordsLearned: number
  learnedThisWeek: number
  wordsMastered: number
  masteredPercentOfLearned: number
  wordsToReview: number
  currentLevel: string
  nextLevel: string | null
}

type PracticeTileKey = 'flashcard' | 'quiz' | 'fill' | 'pronounce'

const PRACTICE_TILES: { key: PracticeTileKey; label: string; sub: string; Icon: typeof FaClone; color: string }[] = [
  { key: 'flashcard', label: 'Flashcard', sub: 'Review with a flashcard', Icon: FaClone, color: '#6366f1' },
  { key: 'quiz', label: 'Quiz', sub: 'Test your knowledge', Icon: FaQuestionCircle, color: '#ef4444' },
  { key: 'fill', label: 'Fill in the Blanks', sub: 'Practice using the word', Icon: FaPencilAlt, color: '#22c55e' },
  { key: 'pronounce', label: 'Pronunciation', sub: 'Listen & repeat', Icon: FaMicrophone, color: '#3b82f6' },
]

// "Quick Practice" tile buttons — display-only, selection is controlled by
// the parent so the active tile's content can be rendered somewhere else
// (e.g. into the otherwise-empty "Word Usage" box next to it) instead of
// always appearing directly underneath the tiles.
const QuickPracticeTiles: React.FC<{
  activeTile: PracticeTileKey | null
  onSelect: (tile: PracticeTileKey | null) => void
  variant?: 'grid' | 'list'
}> = ({ activeTile, onSelect, variant = 'grid' }) => (
  <div style={{ display: variant === 'grid' ? 'grid' : 'flex', gridTemplateColumns: variant === 'grid' ? 'repeat(2,1fr)' : undefined, flexDirection: variant === 'list' ? 'column' as const : undefined, gap: 8 }}>
    {PRACTICE_TILES.map((t) => (
      <button
        key={t.key}
        onClick={() => onSelect(activeTile === t.key ? null : t.key)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: `1px solid ${activeTile === t.key ? t.color : '#e2e8f0'}`, background: activeTile === t.key ? `${t.color}12` : '#fff', cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${t.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <t.Icon style={{ color: t.color, fontSize: 12 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>{t.label}</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.sub}</div>
        </div>
        {variant === 'list' && <FaChevronRight style={{ color: '#cbd5e1', fontSize: 10, flexShrink: 0 }} />}
      </button>
    ))}
  </div>
)

// The active tile's actual mini-interaction (flip a flashcard, answer a
// quiz, fill a blank, listen/repeat) — kept separate from the tile buttons
// above so it can be placed wherever makes sense in the layout.
const QuickPracticeContent: React.FC<{
  word: Word
  tile: PracticeTileKey
  onSpeak: (text: string) => void
  onResult: (correct: boolean) => void
}> = ({ word, tile, onSpeak, onResult }) => {
  const [flipped, setFlipped] = useState(false)
  const [quizSelected, setQuizSelected] = useState<string | null>(null)
  const [fillAnswer, setFillAnswer] = useState('')
  const [fillChecked, setFillChecked] = useState<'correct' | 'incorrect' | null>(null)
  const [pronounceResult, setPronounceResult] = useState<string | null>(null)
  const [listening, setListening] = useState(false)

  // Reset per-tile state whenever the active tile or word changes.
  useEffect(() => {
    setFlipped(false); setQuizSelected(null); setFillAnswer(''); setFillChecked(null); setPronounceResult(null)
  }, [tile, word._id])

  const startRecognition = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setPronounceResult('Speech recognition not supported in this browser.'); return }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript as string
      setPronounceResult(said)
      onResult(said.trim().toLowerCase() === word.word.trim().toLowerCase())
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    setListening(true)
    setPronounceResult(null)
    rec.start()
  }

  if (tile === 'flashcard') {
    return (
      <div onClick={() => setFlipped((f) => !f)} style={{ minHeight: 90, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center' as const, padding: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{flipped ? word.meaning : word.word}</div>
          <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 6 }}>Tap to flip</div>
        </div>
      </div>
    )
  }

  if (tile === 'quiz') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
        {word.quizOptions.map((opt) => {
          const isSelected = quizSelected === opt
          const isCorrectOpt = opt === word.correctAnswer
          const showState = quizSelected !== null
          return (
            <button
              key={opt}
              disabled={quizSelected !== null}
              onClick={() => { setQuizSelected(opt); onResult(opt === word.correctAnswer) }}
              style={{
                textAlign: 'left' as const, padding: '7px 10px', borderRadius: 8, fontSize: 12,
                border: `1px solid ${showState && isCorrectOpt ? '#16a34a' : showState && isSelected ? '#dc2626' : '#e2e8f0'}`,
                background: showState && isCorrectOpt ? '#f0fdf4' : showState && isSelected ? '#fef2f2' : '#fff',
                color: '#0f172a', cursor: quizSelected === null ? 'pointer' : 'default',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (tile === 'fill') {
    return word.example ? (
      <div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, fontStyle: 'italic' as const }}>
          "{word.example.replace(new RegExp(word.word, 'ig'), '_____')}"
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={fillAnswer}
            onChange={(e) => setFillAnswer(e.target.value)}
            placeholder="Type the missing word"
            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, minWidth: 0, background: '#fff', color: '#0f172a' }}
          />
          <button
            onClick={() => {
              const correct = fillAnswer.trim().toLowerCase() === word.word.trim().toLowerCase()
              setFillChecked(correct ? 'correct' : 'incorrect')
              onResult(correct)
            }}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
          >
            Check
          </button>
        </div>
        {fillChecked && (
          <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: fillChecked === 'correct' ? '#16a34a' : '#dc2626' }}>
            {fillChecked === 'correct' ? '✓ Correct!' : `✗ Not quite — the word was "${word.word}"`}
          </div>
        )}
      </div>
    ) : (
      <div style={{ fontSize: 11.5, color: '#94a3b8' }}>No example sentence available for this word.</div>
    )
  }

  // tile === 'pronounce'
  return (
    <div style={{ textAlign: 'center' as const }}>
      <button onClick={() => onSpeak(word.word)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: '1px solid #3b82f6', background: '#eff6ff', color: '#3b82f6', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginRight: 8 }}>
        <FaVolumeUp /> Listen
      </button>
      <button onClick={startRecognition} disabled={listening} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: '1px solid #22c55e', background: listening ? '#dcfce7' : '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: listening ? 'default' : 'pointer' }}>
        <FaMicrophone /> {listening ? 'Listening…' : 'Repeat it'}
      </button>
      {pronounceResult && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: '#475569' }}>
          You said: <strong>{pronounceResult}</strong>
        </div>
      )}
    </div>
  )
}

// Self-contained composition of tiles + content stacked vertically — used
// in the side detail panel, where there's no separate box to redirect the
// active tile's content into.
const QuickPracticeWidget: React.FC<{
  word: Word
  onSpeak: (text: string) => void
  onResult: (correct: boolean) => void
  variant?: 'grid' | 'list'
}> = ({ word, onSpeak, onResult, variant = 'grid' }) => {
  const [tile, setTile] = useState<PracticeTileKey | null>(null)
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 8 }}>Quick Practice</div>
      <QuickPracticeTiles activeTile={tile} onSelect={setTile} variant={variant} />
      {tile && (
        <div style={{ marginTop: 10 }}>
          <QuickPracticeContent word={word} tile={tile} onSpeak={onSpeak} onResult={onResult} />
        </div>
      )}
    </div>
  )
}

const VocabularyPractice: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  // Vocabulary is bundled under the same "learningPractice" module as
  // Listening + Reading (purchased on the English Practice hub page) — no
  // free trial, fully locked until unlocked. Server-enforced in
  // learningRoutes.js's POST /vocab/quiz/submit.
  const [hasModuleAccess, setHasModuleAccess] = useState<boolean | null>(null)
  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setHasModuleAccess(!!data.fullAccess || !!data.modules?.learningPractice?.active) })
      .catch(() => {})
  }, [token, baseURL])
  const hasAccess = hasModuleAccess ?? (user?.status?.toLowerCase() === 'approved')

  const [started, setStarted] = useState(false)
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)
  const [wordOfDay, setWordOfDay] = useState<Word | null>(null)
  const [wordOfDayLoading, setWordOfDayLoading] = useState(true)
  const [addingToMyWords, setAddingToMyWords] = useState(false)
  const [activeTopic, setActiveTopic] = useState('Daily Use')
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)

  // Vocabulary Practice table state (post-"Start" screen)
  const [stats, setStats] = useState<VocabStats | null>(null)
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null)
  const [detailWord, setDetailWord] = useState<Word | null>(null)
  // Which Quick Practice tile is active for the currently-expanded row — its
  // content renders into the "Word Usage" box when set, since that box is
  // otherwise empty for words with no AI usage tip.
  const [expandedPracticeTile, setExpandedPracticeTile] = useState<PracticeTileKey | null>(null)

  // pagination states — 5 per page to match the table design
  const [currentPage, setCurrentPage] = useState(0)
  const wordsPerPage = 5

  const startIndex = currentPage * wordsPerPage
  const currentWords = words.slice(startIndex, startIndex + wordsPerPage)
  const totalPages = Math.max(1, Math.ceil(words.length / wordsPerPage))

  const todayLabel = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })

  // Fetch Word of the Day
  useEffect(() => {
    const fetchWordOfDay = async () => {
      if (!token || !baseURL) { setWordOfDayLoading(false); return }
      try {
        const res = await fetch(`${baseURL}/learning/vocab/word-of-day`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setWordOfDay(data)
      } catch (err) {
        console.error('Error fetching word of the day', err)
      } finally {
        setWordOfDayLoading(false)
      }
    }
    fetchWordOfDay()
  }, [token, baseURL])

  // Also fetch stats on mount (not only after "Start Vocabulary Practice")
  // so the hero stats row shows real numbers right away.
  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, baseURL])

  const fetchStats = async () => {
    if (!token || !baseURL) return
    try {
      const res = await fetch(`${baseURL}/learning/vocab/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching vocab stats', err)
    }
  }

  const startVocabulary = async (topic?: string) => {
    if (!hasAccess) return
    const useTopic = topic ?? activeTopic
    setStarted(true)
    setLoading(true)
    setCurrentPage(0)
    setExpandedWordId(null)
    setDetailWord(null)
    setWords([])

    try {
      const params = new URLSearchParams({ topic: useTopic })
      const res = await fetch(`${baseURL}/learning/vocab/daily?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setWords(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error fetching vocabulary:", err)
    } finally {
      setLoading(false)
    }
    fetchStats()
  }

  const selectCategory = (topic: string) => {
    setActiveTopic(topic)
    setCategoryMenuOpen(false)
    startVocabulary(topic)
  }

  const speak = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-US'
    window.speechSynthesis.speak(utter)
  }

  const updateWordProgress = (word: string, progress: WordProgress) => {
    const wl = word.trim().toLowerCase()
    setWords((prev) => prev.map((w) => (w.word.trim().toLowerCase() === wl ? { ...w, progress } : w)))
    setDetailWord((prev) => (prev && prev.word.trim().toLowerCase() === wl ? { ...prev, progress } : prev))
  }

  const recordSeen = async (word: Word) => {
    if (!token || !baseURL) return
    try {
      const res = await fetch(`${baseURL}/learning/vocab/word/seen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ word: word.word }),
      })
      const data = await res.json()
      if (data.progress) updateWordProgress(word.word, data.progress)
    } catch (err) { console.error('Error recording word view', err) }
  }

  const markStatus = async (word: Word, status: WordProgress['status']) => {
    if (!token || !baseURL) return
    try {
      const res = await fetch(`${baseURL}/learning/vocab/word/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ word: word.word, status }),
      })
      const data = await res.json()
      if (data.progress) updateWordProgress(word.word, data.progress)
      fetchStats()
    } catch (err) { console.error('Error updating word status', err) }
  }

  const toggleBookmark = async (word: Word) => {
    if (!token || !baseURL) return
    try {
      const res = await fetch(`${baseURL}/learning/vocab/word/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ word: word.word }),
      })
      const data = await res.json()
      if (data.progress) updateWordProgress(word.word, data.progress)
    } catch (err) { console.error('Error updating bookmark', err) }
  }

  // "Add to My Words" on the Word of the Day card — bookmarks it via the
  // same endpoint the practice table's bookmark toggle uses, so it shows up
  // wherever bookmarked words are surfaced.
  const addToMyWords = async () => {
    if (!token || !baseURL || !wordOfDay || addingToMyWords || wordOfDay.progress?.bookmarked) return
    setAddingToMyWords(true)
    try {
      const res = await fetch(`${baseURL}/learning/vocab/word/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ word: wordOfDay.word }),
      })
      const data = await res.json()
      if (data.progress) setWordOfDay((prev) => (prev ? { ...prev, progress: data.progress } : prev))
    } catch (err) {
      console.error('Error adding word to My Words', err)
    } finally {
      setAddingToMyWords(false)
    }
  }

  const recordPracticeResult = async (word: Word, correct: boolean) => {
    if (!token || !baseURL) return
    try {
      const res = await fetch(`${baseURL}/learning/vocab/word/practice-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ word: word.word, correct }),
      })
      const data = await res.json()
      if (data.progress) updateWordProgress(word.word, data.progress)
    } catch (err) { console.error('Error recording practice result', err) }
  }

  const toggleExpand = (word: Word) => {
    setExpandedPracticeTile(null)
    if (expandedWordId === word._id) { setExpandedWordId(null); return }
    setExpandedWordId(word._id)
    recordSeen(word)
  }

  const openDetail = (word: Word) => {
    setDetailWord(word)
    recordSeen(word)
  }

  const PURPLE = '#8b5cf6'

  const FEATURES_HERO = [
    { Icon: FaBook,          label: 'Contextual Learning', sub: 'Learn with real\nlife examples'   },
    { Icon: FaBrain,         label: 'Daily Words',         sub: '10 new words\nevery day'          },
    { Icon: FaQuestionCircle,label: 'Smart Quizzes',       sub: 'Test and improve\nyour knowledge' },
    { Icon: FaChartLine,     label: 'Track Progress',      sub: 'Monitor your\ngrowth'             },
  ]

  const TOPICS = [
    { label: 'Daily Use',      Icon: FaCalendarCheck, active: true  },
    { label: 'Business',       Icon: FaBriefcase,     active: false },
    { label: 'Education',      Icon: FaGraduationCap, active: false },
    { label: 'Technology',     Icon: FaLaptopCode,    active: false },
    { label: 'Science',        Icon: FaFlask,         active: false },
    { label: 'Environment',    Icon: FaLeaf,          active: false },
    { label: 'Health',         Icon: FaHeartbeat,     active: false },
    { label: 'Travel',         Icon: FaPlane,         active: false },
    { label: 'Literature',     Icon: FaBook,          active: false },
    { label: 'Emotions',       Icon: FaSmile,         active: false },
    { label: 'Relationships',  Icon: FaUsers,         active: false },
    { label: 'Food',           Icon: FaUtensils,      active: false },
    { label: 'Society',        Icon: FaUsers,         active: false },
    { label: 'Economics',      Icon: FaChartLine,     active: false },
    { label: 'Workplace',      Icon: FaCity,          active: false },
  ]

  return (
    <>
      {/* ── Start Screen ── */}
      <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: '#fff' }}>

        {/* ── Hero ── */}
        <div style={{
          display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
          background: 'linear-gradient(120deg, #f5f3ff 0%, #ede9fe 55%, #ddd6fe 100%)',
          borderBottom: '1px solid #e9d5ff', minHeight: 220,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.10, backgroundImage: 'radial-gradient(circle, #7c3aed 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

          {/* Left: title + features */}
          <div style={{ padding: '28px 28px 20px', zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>Vocabulary Practice</h1>
            <div style={{ width: 48, height: 3, background: PURPLE, borderRadius: 4, marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: '#4c1d95', margin: '0 0 20px', lineHeight: 1.6 }}>
              Learn new words in context, strengthen your vocabulary,<br />and test your knowledge with smart quizzes.
            </p>
            <div style={{ display: 'flex', gap: 22 }}>
              {FEATURES_HERO.map(({ Icon: FIcon, label, sub }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${PURPLE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FIcon style={{ color: PURPLE, fontSize: 15 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#7c3aed', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: book illustration + floating letters */}
          <div style={{ position: 'relative', width: 260, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 0, zIndex: 2 }}>
            <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 42, fontWeight: 900, color: `${PURPLE}30`, fontFamily: 'serif' }}>A</div>
            <div style={{ position: 'absolute', top: 60, right: 16, fontSize: 34, fontWeight: 900, color: `${PURPLE}20`, fontFamily: 'serif' }}>C</div>
            <img src={bookImg} alt="Vocabulary" style={{ height: 200, width: 'auto', objectFit: 'contain' }} />
          </div>
        </div>

        {/* ── Word of the Day + Choose a Topic ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid #f1f5f9' }}>

          {/* Word of the Day */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PURPLE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaCalendarCheck style={{ color: PURPLE, fontSize: 13 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Word of the Day</div>
            </div>
            <div style={{ background: '#faf5ff', borderRadius: 14, border: '1px solid #e9d5ff', padding: '16px 18px', minHeight: 120 }}>
              {wordOfDayLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 13 }}>
                  <Spinner animation="border" size="sm" style={{ color: PURPLE }} />
                  Loading word of the day...
                </div>
              ) : wordOfDay ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: PURPLE }}>{wordOfDay.word}</span>
                    <div
                      onClick={() => speak(wordOfDay.word)}
                      role="button"
                      title="Listen"
                      style={{ width: 28, height: 28, borderRadius: '50%', background: `${PURPLE}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <FaVolumeUp style={{ color: PURPLE, fontSize: 12 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontStyle: 'italic' }}>(word)</div>
                  <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{wordOfDay.meaning}</div>
                  {wordOfDay.example && (
                    <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginBottom: 12 }}>
                      Example: <span style={{ color: PURPLE, fontWeight: 600 }}>{wordOfDay.example}</span>
                    </div>
                  )}
                  <button
                    onClick={addToMyWords}
                    disabled={addingToMyWords || !!wordOfDay.progress?.bookmarked}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20,
                      border: `1.5px solid ${PURPLE}`,
                      background: wordOfDay.progress?.bookmarked ? PURPLE : '#fff',
                      color: wordOfDay.progress?.bookmarked ? '#fff' : PURPLE,
                      fontSize: 12, fontWeight: 700,
                      cursor: wordOfDay.progress?.bookmarked ? 'default' : 'pointer',
                      opacity: addingToMyWords ? 0.7 : 1,
                    }}
                  >
                    {wordOfDay.progress?.bookmarked
                      ? <><FaCheckCircle style={{ fontSize: 11 }} /> Added to My Words</>
                      : <><FaBook style={{ fontSize: 11 }} /> {addingToMyWords ? 'Adding...' : 'Add to My Words'}</>}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingTop: 16 }}>
                  Word of the day unavailable
                </div>
              )}
            </div>
          </div>

          {/* Choose a Topic */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PURPLE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaThLarge style={{ color: PURPLE, fontSize: 12 }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Choose a Topic</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {TOPICS.map(({ label, Icon: TIcon }) => {
                const isActive = activeTopic === label
                return (
                  <button
                    key={label}
                    onClick={() => setActiveTopic(label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: isActive ? `${PURPLE}18` : '#f8fafc',
                      color: isActive ? PURPLE : '#374151',
                      border: `1.5px solid ${isActive ? PURPLE : '#e2e8f0'}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <TIcon style={{ fontSize: 11, flexShrink: 0 }} />
                    {label}
                  </button>
                )
              })}
              <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: '#f8fafc', color: '#374151', border: '1.5px solid #e2e8f0' }}>
                <FaThLarge style={{ fontSize: 11 }} /> View All
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats Row — real per-student progress, same figures shown
             inside the practice screen (Total/Mastered/ToReview/Level) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #f1f5f9' }}>
          {[
            { label: 'Total Words Learned', value: stats ? stats.totalWordsLearned.toLocaleString() : '—', sub: stats && stats.learnedThisWeek > 0 ? `+${stats.learnedThisWeek} this week` : undefined, color: PURPLE, Icon: FaBook },
            { label: 'Words Mastered', value: stats ? stats.wordsMastered.toLocaleString() : '—', sub: stats ? `${stats.masteredPercentOfLearned}% of total` : undefined, color: '#22c55e', Icon: FaCheckCircle },
            { label: 'Words to Review', value: stats ? stats.wordsToReview.toLocaleString() : '—', sub: 'Due for revision', color: '#f59e0b', Icon: FaClock },
            { label: 'Current Level', value: stats ? stats.currentLevel : '—', sub: stats?.nextLevel ? `Next: ${stats.nextLevel}` : undefined, color: '#ec4899', Icon: FaStar },
          ].map(({ label, value, sub, color, Icon: SIcon }, i) => (
            <div key={label} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SIcon style={{ color, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
                {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Start Button ── */}
        <div style={{ padding: '20px 28px 28px' }}>
          {!hasAccess && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#9a3412', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <FaBookReader style={{ flexShrink: 0 }} />
              Unlock Learning Practice, or subscribe to a full plan, to start.
            </div>
          )}
          <button
            onClick={() => startVocabulary()}
            disabled={!hasAccess}
            style={{
              width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
              background: !hasAccess ? '#cbd5e1' : `linear-gradient(90deg, ${PURPLE} 0%, #7c3aed 100%)`,
              color: '#fff', fontWeight: 800, fontSize: 16,
              cursor: !hasAccess ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: !hasAccess ? 'none' : `0 6px 20px ${PURPLE}40`,
            }}
          >
            <FaPlay style={{ fontSize: 14 }} />
            {!hasAccess ? 'Locked — Unlock to Start' : 'Start Vocabulary Practice'}
          </button>
        </div>

      </div>

      <Modal show={started} fullscreen onHide={() => setStarted(false)} className="practice-fullscreen-modal">
        <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%)', color: '#fff', borderBottom: 'none' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <FaBookReader style={{ marginRight: 8 }} /> Vocabulary Practice
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#f8fafc', overflowY: 'auto', padding: 0, position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
              <Spinner animation="border" variant="primary" />
              <p style={{ color: '#64748b', fontSize: 13 }}>Generating daily words...</p>
            </div>
          ) : words.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 14 }}>
              <p style={{ color: '#64748b' }}>No words available. Please try again.</p>
              <Button variant="outline-primary" onClick={() => startVocabulary()}>Retry</Button>
            </div>
          ) : (
            <div style={{ padding: '20px 28px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

              {/* ── Stat cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                {[
                  { label: 'Total Words Learned', value: stats ? stats.totalWordsLearned.toLocaleString() : '—', sub: stats && stats.learnedThisWeek > 0 ? `+${stats.learnedThisWeek} this week` : undefined, subColor: '#16a34a', color: PURPLE, bg: `${PURPLE}15`, Icon: FaBook },
                  { label: 'Words Mastered', value: stats ? stats.wordsMastered.toLocaleString() : '—', sub: stats ? `${stats.masteredPercentOfLearned}% of total` : undefined, subColor: '#64748b', color: '#16a34a', bg: '#16a34a15', Icon: FaCheckCircle },
                  { label: 'Words to Review', value: stats ? stats.wordsToReview.toLocaleString() : '—', sub: 'Due for revision', subColor: '#64748b', color: '#f59e0b', bg: '#f59e0b15', Icon: FaClock },
                  { label: 'Current Level', value: stats ? stats.currentLevel : '—', sub: stats?.nextLevel ? `Next: ${stats.nextLevel}` : undefined, subColor: '#64748b', color: '#ec4899', bg: '#ec489915', Icon: FaStar },
                ].map((c) => (
                  <div key={c.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <c.Icon style={{ color: c.color, fontSize: 16 }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.value}</div>
                      {c.sub && <div style={{ fontSize: 10.5, color: c.subColor, marginTop: 1 }}>{c.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Daily Words header ── */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap' as const, gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Daily Words</span>
                    <span style={{ background: '#fff7ed', color: '#ff6a00', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px' }}>{words.length} New Words</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>New words for today. Learn, practice and master them!</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 10, padding: '6px 10px', background: '#fff' }}>
                    <button disabled title="Only today's words are available right now" style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'not-allowed', display: 'flex' }}><FaAngleLeft /></button>
                    <FaCalendarAlt style={{ color: '#94a3b8', fontSize: 12 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' as const }}>{todayLabel}</span>
                    <button disabled title="Only today's words are available right now" style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'not-allowed', display: 'flex' }}><FaAngleRight /></button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setCategoryMenuOpen((v) => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', background: '#fff', fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                    >
                      {activeTopic} {categoryMenuOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                    </button>
                    {categoryMenuOpen && (
                      <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 30, maxHeight: 280, overflowY: 'auto' as const, minWidth: 190 }}>
                        {TOPICS.map((t) => (
                          <button
                            key={t.label}
                            onClick={() => selectCategory(t.label)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left' as const, padding: '9px 14px', border: 'none', background: activeTopic === t.label ? `${PURPLE}12` : '#fff', color: activeTopic === t.label ? PURPLE : '#334155', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <t.Icon style={{ fontSize: 11 }} /> {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Table ── */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.8fr 2.6fr 1.3fr', padding: '10px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                  {['Word', 'Meaning', 'Example', 'Action'].map((h, i) => (
                    <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', textAlign: i === 3 ? 'right' as const : 'left' as const }}>{h}</div>
                  ))}
                </div>

                {currentWords.map((word) => {
                  const isExpanded = expandedWordId === word._id
                  const status = word.progress?.status || 'new'
                  return (
                    <React.Fragment key={word._id}>
                      <div
                        onClick={() => toggleExpand(word)}
                        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.8fr 2.6fr 1.3fr', padding: '14px 20px', borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9', cursor: 'pointer', alignItems: 'center', background: isExpanded ? '#faf5ff' : '#fff' }}
                      >
                        <div onClick={(e) => { e.stopPropagation(); openDetail(word) }} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <button onClick={(e) => { e.stopPropagation(); speak(word.word) }} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: '#fff7ed', color: '#ff6a00', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <FaVolumeUp size={11} />
                          </button>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{word.word}</div>
                            {word.partOfSpeech && <span style={{ fontSize: 10, color: PURPLE, background: `${PURPLE}15`, borderRadius: 6, padding: '1px 6px' }}>{word.partOfSpeech}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#475569', paddingRight: 10 }}>{word.meaning}</div>
                        <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 6, paddingRight: 10 }}>
                          {word.example && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); speak(word.example!) }} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
                                <FaVolumeUp size={11} />
                              </button>
                              <span style={{ fontStyle: 'italic' as const }}>"{word.example}"</span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18 }}>
                          {status === 'learned' ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 999, padding: '5px 14px', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap' as const, width: 108, boxSizing: 'border-box' as const }}>
                              <FaCheckCircle size={10} /> Learned
                            </span>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); markStatus(word, 'learned') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed', color: '#ff6a00', border: '1px solid #fed7aa', borderRadius: 999, padding: '5px 14px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, width: 108, boxSizing: 'border-box' as const }}>
                              Learn Word
                            </button>
                          )}
                          {isExpanded ? <FaChevronUp size={12} color="#94a3b8" /> : <FaChevronDown size={12} color="#94a3b8" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '16px 20px 20px', borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 14 }}>
                            <div style={{ background: '#fff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 8 }}>More Details</div>
                              {word.synonyms && word.synonyms.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>Synonyms</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                                    {word.synonyms.map((s) => <span key={s} style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11, borderRadius: 6, padding: '2px 8px' }}>{s}</span>)}
                                  </div>
                                </div>
                              )}
                              {word.antonyms && word.antonyms.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Antonyms</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                                    {word.antonyms.map((s) => <span key={s} style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11, borderRadius: 6, padding: '2px 8px' }}>{s}</span>)}
                                  </div>
                                </div>
                              )}
                              <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>{word.meaning}</div>
                            </div>

                            <div style={{ background: '#fff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <FaBrain style={{ color: PURPLE, fontSize: 11 }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: PURPLE, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>
                                  {expandedPracticeTile ? PRACTICE_TILES.find((t) => t.key === expandedPracticeTile)?.label : 'Word Usage (AI Tip)'}
                                </span>
                              </div>
                              {expandedPracticeTile ? (
                                <QuickPracticeContent word={word} tile={expandedPracticeTile} onSpeak={speak} onResult={(correct) => recordPracticeResult(word, correct)} />
                              ) : (
                                <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>
                                  {word.usageTip || 'No usage tip available for this word yet — try a Quick Practice exercise instead.'}
                                </div>
                              )}
                            </div>

                            <div style={{ background: '#fff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 8 }}>Quick Practice</div>
                              <QuickPracticeTiles activeTile={expandedPracticeTile} onSelect={setExpandedPracticeTile} variant="grid" />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600, marginRight: 2 }}>Mark as:</span>
                              {([
                                { key: 'learned', label: 'Learned', color: '#16a34a', bg: '#f0fdf4' },
                                { key: 'review', label: 'Need Review', color: '#f59e0b', bg: '#fffbeb' },
                                { key: 'difficult', label: 'Difficult', color: '#dc2626', bg: '#fef2f2' },
                              ] as const).map((s) => (
                                <button
                                  key={s.key}
                                  onClick={() => markStatus(word, s.key)}
                                  style={{ border: `1px solid ${status === s.key ? s.color : '#e2e8f0'}`, background: status === s.key ? s.bg : '#fff', color: status === s.key ? s.color : '#64748b', borderRadius: 20, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {s.label}
                                </button>
                              ))}
                              <button onClick={() => toggleBookmark(word)} style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #e2e8f0', background: '#fff', color: word.progress?.bookmarked ? '#f59e0b' : '#64748b', borderRadius: 20, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                                {word.progress?.bookmarked ? <FaBookmark size={11} /> : <FaRegBookmark size={11} />} Bookmark
                              </button>
                            </div>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              {word.progress?.lastSeenAt ? `Seen on ${new Date(word.progress.lastSeenAt).toLocaleDateString()}` : 'Not seen yet'}
                            </span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              {/* ── Pagination ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap' as const, gap: 10 }}>
                <span style={{ fontSize: 12.5, color: '#64748b' }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + wordsPerPage, words.length)} of {words.length} words
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: currentPage === 0 ? '#cbd5e1' : '#334155', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaAngleLeft size={12} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${currentPage === i ? '#ff6a00' : '#e2e8f0'}`, background: currentPage === i ? '#ff6a00' : '#fff', color: currentPage === i ? '#fff' : '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: currentPage >= totalPages - 1 ? '#cbd5e1' : '#334155', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaAngleRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Right-side word detail panel ── */}
          {detailWord && (
            <div onClick={() => setDetailWord(null)} style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(15,23,42,0.25)' }}>
              <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 360, maxWidth: '92vw', background: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', padding: '20px 22px', overflowY: 'auto' as const }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {detailWord.word}
                      <button onClick={() => speak(detailWord.word)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: '#fff7ed', color: '#ff6a00', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <FaVolumeUp size={11} />
                      </button>
                    </div>
                    {detailWord.partOfSpeech && <span style={{ fontSize: 10.5, color: PURPLE, background: `${PURPLE}15`, borderRadius: 6, padding: '1px 6px' }}>{detailWord.partOfSpeech}</span>}
                  </div>
                  <button onClick={() => setDetailWord(null)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <FaTimes size={11} color="#64748b" />
                  </button>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 4 }}>Meaning</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{detailWord.meaning}</div>
                </div>

                {detailWord.example && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 4 }}>Example Sentence</div>
                    <div style={{ fontSize: 12.5, color: '#475569', fontStyle: 'italic' as const, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      "{detailWord.example}"
                      <button onClick={() => speak(detailWord.example!)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}>
                        <FaVolumeUp size={11} />
                      </button>
                    </div>
                  </div>
                )}

                {detailWord.synonyms && detailWord.synonyms.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 6 }}>Synonyms</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {detailWord.synonyms.map((s) => <span key={s} style={{ background: '#eff6ff', color: '#2563eb', fontSize: 11.5, borderRadius: 6, padding: '3px 9px' }}>{s}</span>)}
                    </div>
                  </div>
                )}

                {detailWord.antonyms && detailWord.antonyms.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 6 }}>Antonyms</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {detailWord.antonyms.map((s) => <span key={s} style={{ background: '#fef2f2', color: '#dc2626', fontSize: 11.5, borderRadius: 6, padding: '3px 9px' }}>{s}</span>)}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 14, background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <FaBrain style={{ color: PURPLE, fontSize: 11 }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: PURPLE, textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>Word Usage (AI Tip)</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>{detailWord.usageTip || 'No usage tip available for this word yet.'}</div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <QuickPracticeWidget word={detailWord} onSpeak={speak} onResult={(correct) => recordPracticeResult(detailWord, correct)} variant="list" />
                </div>

                <div style={{ marginTop: 18, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: 8 }}>Your Progress</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' as const }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{detailWord.progress?.seenCount ?? 0}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Seen</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{detailWord.progress?.correctCount ?? 0}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Correct</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{detailWord.progress?.lastSeenAt ? new Date(detailWord.progress.lastSeenAt).toLocaleDateString() : '—'}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Last Seen</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => markStatus(detailWord, 'learned')}
                  disabled={detailWord.progress?.status === 'learned'}
                  style={{ width: '100%', marginTop: 18, padding: '11px 0', borderRadius: 10, border: 'none', background: detailWord.progress?.status === 'learned' ? '#dcfce7' : '#16a34a', color: detailWord.progress?.status === 'learned' ? '#16a34a' : '#fff', fontWeight: 700, fontSize: 13, cursor: detailWord.progress?.status === 'learned' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <FaCheckCircle size={12} /> {detailWord.progress?.status === 'learned' ? 'Learned' : 'Mark as Learned'}
                </button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .practice-fullscreen-modal .modal-header .btn-close {
          filter: invert(1) brightness(2);
          opacity: 0.9;
        }
        .practice-fullscreen-modal .modal-header .btn-close:hover {
          opacity: 1;
        }

        .vocabulary-practice-container {
          padding: 2rem;
          min-height: 80vh;
        }

        /* Start Screen */
        .start-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
        }

        .start-card {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .icon-wrapper {
          margin-bottom: 2rem;
        }

        .main-icon {
          font-size: 4rem;
          color: #667eea;
        }

        .start-card h2 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .description {
          color: #4a5568;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .start-button {
          padding: 1rem 2.5rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        /* Practice Layout */
        .practice-layout {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Vocabulary Section */
        .vocabulary-section {
          width: 100%;
        }

        .vocabulary-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          background: #ffffff;
        }

        .vocabulary-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 1.3rem;
          font-weight: 600;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: none;
        }

        .progress-indicator {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }

        .vocabulary-body {
          padding: 2.5rem;
          background: #ffffff;
        }

        /* Words Grid */
        .words-grid {
          display: grid;
          gap: 2rem;
          margin-bottom: 2.5rem;
        }

        .word-card {
          background: #f8fafc;
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .word-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .word-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .word-text {
          color: #2d3748;
          font-weight: 700;
          font-size: 1.5rem;
          margin: 0;
          background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .word-number {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
        }

        .word-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .meaning-section, .example-section, .quiz-section {
          background: white;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .meaning-section h6, .example-section h6, .quiz-section h6 {
          color: #2d3748;
          font-weight: 600;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }

        .meaning-section p, .example-section p {
          margin: 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .example-text {
          font-style: italic;
          color: #718096;
        }

        .options-grid {
          display: grid;
          gap: 0.75rem;
        }

        .option-item {
          background: #f7fafc;
          padding: 1rem 1.25rem;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .option-item:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .custom-radio :global(.form-check-input) {
          width: 1.2em;
          height: 1.2em;
          margin-right: 0.75rem;
          border: 2px solid #cbd5e0;
        }

        .custom-radio :global(.form-check-input:checked) {
          background-color: #667eea;
          border-color: #667eea;
        }

        .custom-radio :global(.form-check-label) {
          font-size: 1rem;
          font-weight: 500;
          color: #2d3748;
          cursor: pointer;
          line-height: 1.4;
        }

        /* Navigation */
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
        }

        .nav-button, .submit-button {
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          min-width: 150px;
          border: none;
          transition: all 0.3s ease;
        }

        .nav-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .nav-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .submit-button {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
        }

        .nav-button:disabled, .submit-button:disabled {
          opacity: 0.6;
          transform: none;
          box-shadow: none;
        }

        /* Loading States */
        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #667eea;
        }

        .loading-state :global(.spinner-border) {
          width: 3rem;
          height: 3rem;
          margin-bottom: 1rem;
        }

        /* Feedback Section */
        .feedback-section {
          width: 100%;
        }

        .feedback-card {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          background: #ffffff;
        }

        .feedback-header {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          font-size: 1.3rem;
          font-weight: 600;
          padding: 1.5rem 2rem;
          border-bottom: none;
        }

        .feedback-body {
          padding: 2.5rem;
          background: #ffffff;
        }

        .score-display {
          text-align: center;
          margin-bottom: 2rem;
        }

        .score-display h3 {
          color: #2d3748;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .score-circle {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .score-number {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .score-percentage {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .score-bar {
          height: 8px;
          border-radius: 4px;
          max-width: 300px;
          margin: 0 auto;
        }

        .feedback-content {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .feedback-item {
          padding: 1.5rem;
          border-radius: 12px;
        }

        .feedback-item h6 {
          font-weight: 600;
          margin-bottom: 1rem;
          color: #2d3748;
        }

        .results {
          background: #f7fafc;
          border-left: 4px solid #4299e1;
        }

        .encouragement {
          background: #fffaf0;
          border-left: 4px solid #ed8936;
        }

        .encouragement-text {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
          color: #4a5568;
          text-align: center;
        }

        .results-grid {
          display: grid;
          gap: 1rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .word-info {
          flex: 1;
        }

        .word {
          display: block;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .answers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .answer {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .answer .label {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .status-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1rem;
          margin-left: 1rem;
        }

        .status-indicator.correct {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-indicator.incorrect {
          background: #fed7d7;
          color: #742a2a;
        }

        .action-buttons {
          text-align: center;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .vocabulary-card,
          .feedback-card {
            background: #2d3748;
          }

          .vocabulary-body,
          .feedback-body {
            background: #2d3748;
          }

          .word-text {
            color: #ffffff;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .custom-radio :global(.form-check-label) {
            color: #e2e8f0;
          }

          .word-card {
            background: #4a5568;
            border-color: #718096;
          }

          .meaning-section, .example-section, .quiz-section {
            background: #4a5568;
            border-color: #718096;
          }

          .meaning-section h6, .example-section h6, .quiz-section h6 {
            color: #e2e8f0;
          }

          .meaning-section p, .example-section p {
            color: #cbd5e0;
          }

          .option-item {
            background: #5a6778;
            border-color: #718096;
          }

          .option-item:hover {
            background: #6b7888;
            border-color: #667eea;
          }

          .feedback-item h6 {
            color: #e2e8f0;
          }

          .encouragement-text {
            color: #cbd5e0;
          }

          .result-item {
            background: #4a5568;
            border-color: #718096;
          }

          .word {
            color: #e2e8f0;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .vocabulary-practice-container {
            padding: 1rem;
          }

          .start-card {
            padding: 2rem 1.5rem;
          }

          .vocabulary-body {
            padding: 1.5rem;
          }

          .words-grid {
            gap: 1.5rem;
          }

          .word-card {
            padding: 1.5rem;
          }

          .word-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .word-text {
            font-size: 1.3rem;
          }

          .options-grid {
            grid-template-columns: 1fr;
          }

          .score-circle {
            width: 100px;
            height: 100px;
          }

          .navigation-buttons {
            flex-direction: column;
            gap: 1rem;
          }

          .nav-button, .submit-button {
            min-width: 100%;
            padding: 1rem 1.5rem;
          }

          .answers {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .status-indicator {
            align-self: flex-end;
          }
        }

        .done-score-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 auto 1rem;
          width: 100px; height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(34,197,94,0.35);
        }
        .done-score { font-size: 1.5rem; font-weight: 800; line-height: 1; }
        .done-pct   { font-size: 0.8rem; opacity: 0.9; }

        .start-button {
        background: linear-gradient(135deg, #ff6a00 0%, #ff9a3c 100%) !important;
        border: none !important;
        color: white !important;
        padding: 1rem 2.5rem;
        border-radius: 14px;
        font-size: 1.1rem;
        font-weight: 600;
        transition: all 0.25s ease;
      }

      .start-button:hover {
        background: linear-gradient(135deg, #e55f00 0%, #ff8c1a 100%) !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 122, 0, 0.35);
      }

      .start-button:active {
        transform: translateY(0);
        box-shadow: none;
      }

      `}</style>
    </>
  )
}

export default VocabularyPractice
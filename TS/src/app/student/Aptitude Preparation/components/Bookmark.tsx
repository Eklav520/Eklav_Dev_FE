import React, { useEffect, useState } from 'react'
import { Spinner, Alert, Modal, Button, Form, Badge, Accordion } from 'react-bootstrap'
import { FiHash, FiCpu, FiBookOpen, FiBarChart2, FiGrid, FiGlobe, FiBriefcase, FiCode, FiMoreHorizontal, FiChevronDown, FiChevronRight, FiArrowRight } from 'react-icons/fi'

type QA = {
  _id?: string
  questionType?: 'text' | 'image'
  question: string
  questionImageUrl?: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOptionKey: string
  explanation?: string
}

type TopicItem = {
  _id: string
  topic: string
  questions: QA[]
}

type Category = {
  _id: string
  title: string
  items: TopicItem[]
}

type Props = {
  onStatsUpdate?: (total: number) => void
}

const COUNT = 20

function shuffle<T>(arr: T[]) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const normalize = (s: any) => (s ?? '').toString().trim().toLowerCase()

const formatExplanation = (text: string) => {
  const sentences = text.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0)
  if (sentences.length <= 1) return <span>{text}</span>
  return (
    <div style={{ margin: 0 }}>
      {sentences.map((sentence, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px', lineHeight: '1.6' }}>
          <span style={{ color: '#ff7a00', marginRight: '8px', marginTop: '1px', flexShrink: 0 }}>›</span>
          <span>{sentence.endsWith('.') ? sentence : `${sentence}.`}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Card themes (index-based, cycles for any number of categories) ───────────

type CardTheme = { icon: React.ReactNode; iconBg: string; watermark: string }

const CARD_THEMES: CardTheme[] = [
  { icon: <FiHash size={18} color="#818cf8" />,         iconBg: 'rgba(99,102,241,0.22)',   watermark: '∑'   },
  { icon: <FiCpu size={18} color="#38bdf8" />,          iconBg: 'rgba(14,165,233,0.22)',   watermark: '⚡'  },
  { icon: <FiBookOpen size={18} color="#4ade80" />,     iconBg: 'rgba(34,197,94,0.22)',    watermark: 'Aa'  },
  { icon: <FiBarChart2 size={18} color="#fb923c" />,    iconBg: 'rgba(249,115,22,0.22)',   watermark: '📊'  },
  { icon: <FiGrid size={18} color="#f472b6" />,         iconBg: 'rgba(236,72,153,0.22)',   watermark: '🎯'  },
  { icon: <FiGlobe size={18} color="#2dd4bf" />,        iconBg: 'rgba(20,184,166,0.22)',   watermark: '🌍'  },
  { icon: <FiBriefcase size={18} color="#a78bfa" />,    iconBg: 'rgba(167,139,250,0.22)',  watermark: '₹'   },
  { icon: <FiCode size={18} color="#c084fc" />,         iconBg: 'rgba(192,132,252,0.22)',  watermark: '</>' },
  { icon: <FiMoreHorizontal size={18} color="#94a3b8" />, iconBg: 'rgba(148,163,184,0.22)', watermark: '⭐' },
]

// Keyword-based description fallback
function getDescription(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('quant'))      return 'Numbers, calculations, ratios, percentages, profit & loss and more.'
  if (t.includes('logical') || t.includes('reasoning')) return 'Syllogisms, analogies, blood relations, coding-decoding and more.'
  if (t.includes('verbal'))     return 'Reading comprehension, vocabulary, grammar and more.'
  if (t.includes('data'))       return 'Tables, charts, graphs, data sufficiency and more.'
  if (t.includes('puzzle'))     return 'Number series, missing terms, seating arrangements and more.'
  if (t.includes('general') || t.includes('knowledge')) return 'Current affairs, history, geography, science and more.'
  if (t.includes('bank') || t.includes('finance')) return 'Banking awareness, financial terms, economics and more.'
  if (t.includes('cod'))        return 'Basic logic, flowcharts, pseudocode and pattern recognition.'
  if (t.includes('program'))    return 'Core programming concepts, algorithms and problem solving.'
  if (t.includes('web'))        return 'HTML, CSS, JavaScript, frameworks and web technologies.'
  if (t.includes('struct'))     return 'Arrays, linked lists, trees, graphs and algorithms.'
  return 'Practice questions to improve your aptitude skills.'
}

const DIFF_BADGES = [
  { label: 'Easy',   bg: 'rgba(22,163,74,0.15)',   color: '#4ade80' },
  { label: 'Medium', bg: 'rgba(234,179,8,0.15)',    color: '#fbbf24' },
  { label: 'Hard',   bg: 'rgba(239,68,68,0.15)',    color: '#f87171' },
]

// ─── Category Card ────────────────────────────────────────────────────────────

const CategoryCard = ({
  category,
  index,
  isSelected,
  onSelect,
  onStartQuiz,
  onOpenTopic,
}: {
  category: Category
  index: number
  isSelected: boolean
  onSelect: (c: Category) => void
  onStartQuiz: (c: Category) => void
  onOpenTopic: (t: TopicItem) => void
}) => {
  const theme = CARD_THEMES[index % CARD_THEMES.length]
  const totalQ = category.items.reduce((s, i) => s + (i.questions?.length ?? 0), 0)

  return (
    <div
      onClick={() => onSelect(category)}
      style={{
        background: 'linear-gradient(145deg, #1e2d40 0%, #16253a 100%)',
        border: isSelected ? '2px solid #ff7a00' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: isSelected ? '17px 17px 15px' : '18px 18px 16px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 0 0 3px rgba(255,122,0,0.15)' : 'none',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.35)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Top row: icon + button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: theme.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {theme.icon}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onStartQuiz(category) }}
          style={{
            background: '#ff7a00', border: 'none', borderRadius: 7,
            color: '#fff', fontWeight: 700, fontSize: '0.72rem',
            padding: '6px 14px', cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(255,122,0,0.3)',
          }}
        >
          Start Quiz
        </button>
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem', marginBottom: 5, lineHeight: 1.3 }}>
        {category.title}
      </div>

      {/* Description */}
      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 14, lineHeight: 1.55 }}>
        {getDescription(category.title)}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>{totalQ}</div>
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: 2 }}>Questions</div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>
            {category.items.length}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: 2 }}>Quizzes</div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.1 }}>0%</div>
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: 2 }}>Avg. Score</div>
        </div>
      </div>

      {/* Difficulty badges */}
      <div style={{ display: 'flex', gap: 6 }}>
        {DIFF_BADGES.map(d => (
          <span key={d.label} style={{
            padding: '2px 9px', borderRadius: 20,
            fontSize: '0.6rem', fontWeight: 600,
            background: d.bg, color: d.color,
          }}>
            {d.label}
          </span>
        ))}
      </div>

      {/* Watermark */}
      <div style={{
        position: 'absolute', right: 14, bottom: 12,
        fontSize: 52, opacity: 0.06, color: '#fff',
        lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
        fontWeight: 900,
      }}>
        {theme.watermark}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TOPIC_COLORS = [
  { bg: 'rgba(99,102,241,0.18)', color: '#818cf8' },
  { bg: 'rgba(249,115,22,0.18)', color: '#fb923c' },
  { bg: 'rgba(236,72,153,0.18)', color: '#f472b6' },
  { bg: 'rgba(14,165,233,0.18)', color: '#38bdf8' },
  { bg: 'rgba(34,197,94,0.18)', color: '#4ade80' },
  { bg: 'rgba(167,139,250,0.18)', color: '#a78bfa' },
  { bg: 'rgba(249,115,22,0.18)', color: '#fb923c' },
  { bg: 'rgba(20,184,166,0.18)', color: '#2dd4bf' },
  { bg: 'rgba(234,179,8,0.18)', color: '#fbbf24' },
  { bg: 'rgba(239,68,68,0.18)', color: '#f87171' },
  { bg: 'rgba(99,102,241,0.18)', color: '#818cf8' },
  { bg: 'rgba(192,132,252,0.18)', color: '#c084fc' },
]

const CategoryGrid: React.FC<Props> = ({ onStatsUpdate }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [diffFilter, setDiffFilter] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Topic preview modal
  const [topicPreviewOpen, setTopicPreviewOpen] = useState(false)
  const [previewTopic, setPreviewTopic] = useState<TopicItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const QUESTIONS_PER_PAGE = 50

  // Quiz modal
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizTitle, setQuizTitle] = useState<string>('')
  const [quizQuestions, setQuizQuestions] = useState<QA[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<{ correct: boolean; correctAnswer: string }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${baseURL}/apptitudeQuestions`)
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        const cats: Category[] = data.data || []
        setCategories(cats)
        if (cats.length > 0) setSelectedCategory(cats[0])
        const total = cats.reduce((s, c) => s + c.items.reduce((si, i) => si + (i.questions?.length ?? 0), 0), 0)
        onStatsUpdate?.(total)
      } catch (err) {
        console.error(err)
        setError('Failed to load categories.')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [baseURL])

  const openTopicPreview = (topicItem: TopicItem) => {
    setPreviewTopic(topicItem)
    setCurrentPage(1)
    setTopicPreviewOpen(true)
  }

  const openQuizForCategory = (category: Category) => {
    const all: QA[] = []
    category.items.forEach((it) => all.push(...(it.questions || [])))
    const chosen = shuffle(all).slice(0, COUNT)
    setQuizTitle(`${category.title} — Practice Quiz`)
    setQuizQuestions(chosen)
    setUserAnswers(Array(chosen.length).fill(''))
    setCurrentIndex(0)
    setSubmitted(false)
    setResults([])
    setQuizOpen(true)
  }

  const closeQuiz = () => {
    setQuizOpen(false)
    setQuizQuestions([])
    setUserAnswers([])
    setSubmitted(false)
    setResults([])
    setQuizTitle('')
  }

  const handleAnswerChange = (idx: number, val: string) => {
    setUserAnswers((prev) => { const next = prev.slice(); next[idx] = val; return next })
  }

  const goto = (i: number) => {
    if (i < 0 || i >= quizQuestions.length) return
    setCurrentIndex(i)
  }

  const handleSubmitQuiz = () => {
    const computed = quizQuestions.map((q, idx) => {
      const user = normalize(userAnswers[idx])
      const correctKey = normalize(q.correctOptionKey)
      return {
        correct: user === correctKey,
        correctAnswer: `Option ${q.correctOptionKey}: ${q[`option${q.correctOptionKey}` as keyof QA]}`,
      }
    })
    setResults(computed)
    setSubmitted(true)
  }

  const retake = () => {
    setQuizQuestions(shuffle(quizQuestions).slice(0, COUNT))
    setUserAnswers(Array(Math.min(COUNT, quizQuestions.length)).fill(''))
    setCurrentIndex(0)
    setSubmitted(false)
    setResults([])
  }

  const score = results.filter((r) => r.correct).length
  const answeredCount = userAnswers.filter((a) => (a ?? '').toString().trim().length > 0).length
  const progress = Math.round((answeredCount / Math.max(1, quizQuestions.length)) * 100)

  const selectedTotalQ = selectedCategory?.items.reduce((s, i) => s + (i.questions?.length ?? 0), 0) ?? 0

  return (
    <div>
      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h5 style={{ fontWeight: 800, color: '#0f172a', margin: '0 0 4px', fontSize: '1.05rem' }}>
            Practice Quiz Topics
          </h5>
          <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>
            Choose a topic to practice and improve your aptitude skills.
          </p>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <select
            value={diffFilter}
            onChange={e => setDiffFilter(e.target.value)}
            style={{
              appearance: 'none',
              background: '#fff', border: '1.5px solid #e2e8f0',
              borderRadius: 9, padding: '7px 32px 7px 12px',
              fontSize: '0.78rem', color: '#475569', fontWeight: 600,
              cursor: 'pointer', outline: 'none',
            }}
          >
            {['All', 'Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d === 'All' ? 'Filter by Difficulty' : d}</option>)}
          </select>
          <FiChevronDown size={14} color="#94a3b8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Main layout: grid + right panel ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Grid ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <Spinner animation="border" style={{ color: '#ff7a00', width: '2.5rem', height: '2.5rem' }} />
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {categories.map((category, idx) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  index={idx}
                  isSelected={selectedCategory?._id === category._id}
                  onSelect={c => setSelectedCategory(c)}
                  onStartQuiz={openQuizForCategory}
                  onOpenTopic={openTopicPreview}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Topics Panel ── */}
        {selectedCategory && (
          <div style={{
            width: 272, flexShrink: 0,
            background: '#fff',
            border: '1px solid #e8edf4',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(15,23,42,0.07)',
          }}>
            {/* Panel header */}
            <div style={{ padding: '18px 20px 14px', background: 'linear-gradient(135deg, #fafbfc 0%, #fff 100%)' }}>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', letterSpacing: '-0.01em', marginBottom: 4 }}>
                Topics in {selectedCategory.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff7a00', flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: '#ff7a00', fontWeight: 700 }}>
                  {selectedTotalQ.toLocaleString()} Questions
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)' }} />

            {/* Topic list */}
            <div style={{ maxHeight: 430, overflowY: 'auto', padding: '8px 0' }}>
              {selectedCategory.items.map((item, idx) => {
                const tc = TOPIC_COLORS[idx % TOPIC_COLORS.length]
                const words = item.topic.trim().split(/\s+/)
                const initials = words.length >= 2
                  ? (words[0][0] + words[1][0]).toUpperCase()
                  : words[0].slice(0, 2).toUpperCase()
                return (
                  <div
                    key={item._id}
                    onClick={() => openTopicPreview(item)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 20px', cursor: 'pointer',
                      transition: 'background 0.12s',
                      borderRadius: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: tc.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.62rem', fontWeight: 800, color: tc.color,
                      letterSpacing: '0.02em',
                      boxShadow: `0 2px 6px ${tc.bg}`,
                    }}>
                      {initials}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, color: '#1e293b', fontSize: '0.8rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.3, marginBottom: 2,
                      }}>
                        {item.topic}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
                        {(item.questions?.length ?? 0).toLocaleString()} Questions
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiChevronRight size={12} color="#94a3b8" />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ height: 1, background: '#f1f5f9' }} />

            {/* View all button */}
            <div style={{ padding: '14px 20px' }}>
              <button
                onClick={() => openQuizForCategory(selectedCategory)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  color: '#ff7a00', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 8,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                View All Topics <FiArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Banner ── */}
      <div style={{
        marginTop: 20,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,122,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Not sure where to start?</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Take a short assessment and get personalized topic recommendations.</div>
          </div>
        </div>
        <button style={{
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 9,
          color: '#0f172a', fontWeight: 700, fontSize: '0.78rem',
          padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          Take Assessment <FiArrowRight size={13} />
        </button>
      </div>

      {/* ── Topic Preview Modal ── */}
      <Modal
        show={topicPreviewOpen}
        onHide={() => setTopicPreviewOpen(false)}
        fullscreen
        backdrop="static"
        className="text-white"
        contentClassName="bg-dark"
      >
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <Modal.Title className="fw-bold text-white">{previewTopic?.topic} — Preparation</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 bg-dark text-white">
          {previewTopic?.questions?.length ? (
            (() => {
              const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
              const endIndex = startIndex + QUESTIONS_PER_PAGE
              const currentQuestions = previewTopic.questions.slice(startIndex, endIndex)
              const totalPages = Math.ceil(previewTopic.questions.length / QUESTIONS_PER_PAGE)
              return (
                <div className="row">
                  <div className="col-md-3">
                    <div className="card bg-black text-white border-secondary h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="text-white mb-0">Questions</h6>
                          <span className="badge" style={{ background: '#ff7a00' }}>{previewTopic.questions.length}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: '60vh', overflowY: 'auto', padding: 4 }}>
                          {previewTopic.questions.map((_, i) => {
                            const inPage = i >= startIndex && i < endIndex
                            return (
                              <div key={i} onClick={() => setCurrentPage(Math.floor(i / QUESTIONS_PER_PAGE) + 1)}
                                style={{ cursor: 'pointer', border: inPage ? 'none' : '1px solid #333', aspectRatio: '1/1', fontSize: '0.9rem', fontWeight: inPage ? 600 : 400, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: inPage ? '#ff7a00' : '#1a1a1a', color: inPage ? '#fff' : '#9ca3af', transition: 'all 0.2s' }}>
                                {i + 1}
                              </div>
                            )
                          })}
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <Button size="sm" variant="outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="text-white border-secondary">← Prev</Button>
                          <span className="small text-secondary">Page {currentPage} / {totalPages}</span>
                          <Button size="sm" variant="outline-secondary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="text-white border-secondary">Next →</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-9">
                    <div className="card bg-black text-white border-secondary h-100">
                      <div className="card-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                        {currentQuestions.map((qa, i) => (
                          <div key={qa._id ?? i} className="mb-4 pb-3 border-bottom border-secondary">
                            <h6 className="fw-semibold text-white">Q{startIndex + i + 1}:{qa.question ? ` ${qa.question}` : ''}</h6>
                            {qa.questionType === 'image' && qa.questionImageUrl && (
                              <div className="my-3 text-center">
                                <img src={qa.questionImageUrl} alt={`Q${startIndex + i + 1}`} style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid #333' }} />
                              </div>
                            )}
                            <ul className="mb-2 mt-2" style={{ listStyle: 'none', paddingLeft: 0 }}>
                              {['A', 'B', 'C', 'D'].map(k => {
                                const opt = qa[`option${k}` as keyof QA]
                                if (!opt) return null
                                return <li key={k} className="text-white mb-1"><span style={{ color: '#ff7a00' }} className="me-2">{k}.</span>{opt}</li>
                              })}
                            </ul>
                            <Accordion>
                              <Accordion.Item eventKey="0" className="bg-black border-secondary">
                                <Accordion.Header className="bg-black text-white">Show Answer & Explanation</Accordion.Header>
                                <Accordion.Body className="bg-black text-secondary">
                                  <div className="mb-3 p-2 rounded" style={{ background: 'rgba(255,122,0,0.07)', borderLeft: '3px solid #ff7a00' }}>
                                    <strong className="text-white">Correct Answer:</strong>{' '}
                                    <span style={{ color: '#ff7a00' }}>Option {qa.correctOptionKey}</span>{' '}
                                    — {qa[`option${qa.correctOptionKey}` as keyof QA]}
                                  </div>
                                  {qa.explanation && (
                                    <div className="text-secondary">
                                      <strong className="text-white d-block mb-2">Explanation:</strong>
                                      {formatExplanation(qa.explanation)}
                                    </div>
                                  )}
                                </Accordion.Body>
                              </Accordion.Item>
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()
          ) : (
            <p className="text-secondary">No questions available.</p>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setTopicPreviewOpen(false)}>Close</Button>
          {previewTopic?.questions?.length ? (
            <Button style={{ background: '#ff7a00', border: 'none' }} onClick={() => {
              setTopicPreviewOpen(false)
              const chosen = shuffle(previewTopic.questions).slice(0, COUNT)
              setQuizTitle(`${previewTopic.topic} — Practice Quiz`)
              setQuizQuestions(chosen)
              setUserAnswers(Array(chosen.length).fill(''))
              setCurrentIndex(0)
              setSubmitted(false)
              setResults([])
              setQuizOpen(true)
            }}>
              Take Quiz (This Topic)
            </Button>
          ) : null}
        </Modal.Footer>
      </Modal>

      {/* ── Quiz Modal ── */}
      <Modal show={quizOpen} onHide={closeQuiz} fullscreen backdrop="static" className="text-white" contentClassName="bg-dark">
        <Modal.Header closeButton className="bg-dark text-white border-secondary">
          <div className="w-100">
            <Modal.Title className="text-white">{quizTitle}</Modal.Title>
            <div className="mt-2" style={{ height: 8, borderRadius: 20, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#ff7a00', borderRadius: 20 }} />
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 10, color: '#fff', fontWeight: 700, lineHeight: 1 }}>{progress}%</span>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="px-4 bg-dark text-white">
          <div className="row">
            <div className="col-md-3">
              <div className="card bg-black text-white border-secondary h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="text-white mb-0">Questions</h6>
                    <span className="badge" style={{ background: '#ff7a00' }}>{quizQuestions.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: '60vh', overflowY: 'auto', padding: 4 }}>
                    {quizQuestions.map((_, i) => {
                      const answered = !!userAnswers[i]
                      return (
                        <div key={i} onClick={() => goto(i)}
                          style={{ cursor: 'pointer', aspectRatio: '1/1', fontSize: '0.9rem', fontWeight: i === currentIndex ? 600 : 400, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === currentIndex ? '#ff7a00' : answered ? '#16a34a' : '#1a1a1a', color: '#fff', border: i === currentIndex || answered ? 'none' : '1px solid #333', transition: 'all 0.2s' }}>
                          {i + 1}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className="d-flex align-items-center">
                        <div style={{ width: 16, height: 16, background: '#ff7a00', borderRadius: 3, marginRight: 6 }} />
                        <span className="small text-secondary">Current</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <div style={{ width: 16, height: 16, background: '#16a34a', borderRadius: 3, marginRight: 6 }} />
                        <span className="small text-secondary">Answered</span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <div style={{ width: 16, height: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, marginRight: 6 }} />
                      <span className="small text-secondary">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-black text-white border-secondary h-100">
                <div className="card-body">
                  {quizQuestions.length === 0 ? (
                    <div className="text-secondary text-center">No questions.</div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-white mb-0">Question {currentIndex + 1} of {quizQuestions.length}</h5>
                        <Badge bg={userAnswers[currentIndex] ? 'success' : 'secondary'}>{userAnswers[currentIndex] ? 'Answered' : 'Pending'}</Badge>
                      </div>
                      {quizQuestions[currentIndex]?.question && <h6 className="text-white mb-3">{quizQuestions[currentIndex].question}</h6>}
                      {quizQuestions[currentIndex]?.questionType === 'image' && quizQuestions[currentIndex]?.questionImageUrl && (
                        <div className="text-center mb-4">
                          <img src={quizQuestions[currentIndex].questionImageUrl} alt={`Q${currentIndex + 1}`} style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #333' }} />
                        </div>
                      )}
                      {!submitted ? (
                        <Form>
                          {['A', 'B', 'C', 'D'].map(key => {
                            const label = quizQuestions[currentIndex][`option${key}` as keyof QA]
                            return (
                              <Form.Check key={key} type="radio" name={`q${currentIndex}`} id={`option-${key}`}
                                label={<span className="text-white"><span style={{ color: '#ff7a00' }} className="me-2">{key}.</span>{label}</span>}
                                value={key} checked={userAnswers[currentIndex] === key}
                                onChange={e => handleAnswerChange(currentIndex, e.target.value)} className="mb-3" />
                            )
                          })}
                          <div className="d-flex justify-content-between mt-4">
                            <Button variant="outline-secondary" onClick={() => goto(currentIndex - 1)} disabled={currentIndex === 0} className="text-white border-secondary">← Previous</Button>
                            <Button variant="outline-secondary" onClick={() => goto(currentIndex + 1)} disabled={currentIndex === quizQuestions.length - 1} className="text-white border-secondary">Next →</Button>
                          </div>
                        </Form>
                      ) : (
                        <div>
                          <Badge bg={results[currentIndex]?.correct ? 'success' : 'danger'} className="mb-3">{results[currentIndex]?.correct ? '✓ Correct' : '✗ Incorrect'}</Badge>
                          <div className="bg-dark p-3 rounded border border-secondary mb-3">
                            <div className="text-white mb-2"><strong>Your answer:</strong> {userAnswers[currentIndex] || 'No answer selected'}</div>
                            <div className="text-white"><strong>Correct answer:</strong> {results[currentIndex]?.correctAnswer}</div>
                          </div>
                          {quizQuestions[currentIndex]?.explanation && (
                            <div className="mt-3 p-3 bg-black rounded" style={{ borderLeft: '3px solid #ff7a00' }}>
                              <strong className="text-white d-block mb-2">Explanation:</strong>
                              <div className="text-secondary">{formatExplanation(quizQuestions[currentIndex].explanation!)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-black text-white border-secondary h-100">
                <div className="card-body">
                  {!submitted ? (
                    <>
                      <h6 className="text-white mb-3">Progress Summary</h6>
                      <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small text-secondary">Answered</span>
                          <span className="text-white fw-bold">{answeredCount}/{quizQuestions.length}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 20, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(answeredCount / Math.max(1, quizQuestions.length)) * 100}%`, background: '#ff7a00', borderRadius: 20 }} />
                        </div>
                      </div>
                      <Button style={{ background: '#ff7a00', border: 'none', width: '100%' }} onClick={handleSubmitQuiz} disabled={quizQuestions.length === 0 || answeredCount < quizQuestions.length}>
                        {answeredCount === quizQuestions.length ? 'Submit Quiz' : `Answer all (${quizQuestions.length - answeredCount} left)`}
                      </Button>
                    </>
                  ) : (
                    <>
                      <h6 className="text-white mb-3">Final Results</h6>
                      <div className="text-center mb-4">
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ff7a00', marginBottom: 8 }}>{Math.round((score / results.length) * 100)}%</div>
                        <div className="text-secondary">{score} correct out of {results.length}</div>
                      </div>
                      <div className="d-grid gap-2">
                        <Button style={{ background: '#ff7a00', border: 'none' }} onClick={retake}>Retake Quiz</Button>
                        <Button variant="secondary" onClick={closeQuiz}>Close</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {submitted && (
            <div className="row mt-4">
              <div className="col">
                <div className="card bg-black text-white border-secondary">
                  <div className="card-body">
                    <h6 className="text-white mb-3">Detailed Answers Review</h6>
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {quizQuestions.map((q, idx) => {
                        const r = results[idx]
                        const your = userAnswers[idx] || 'No Answer'
                        return (
                          <div key={idx} className="mb-3 pb-3 border-bottom border-secondary">
                            <div className="d-flex justify-content-between mb-2">
                              <strong className="text-white">Q{idx + 1}</strong>
                              <Badge bg={r.correct ? 'success' : 'danger'}>{r.correct ? 'Correct' : 'Incorrect'}</Badge>
                            </div>
                            {q.question && <div className="text-white mb-2">{q.question}</div>}
                            {q.questionType === 'image' && q.questionImageUrl && (
                              <img src={q.questionImageUrl} alt={`Q${idx + 1}`} style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 6, border: '1px solid #333', marginBottom: 8 }} />
                            )}
                            <div className="small text-secondary mb-1">Your answer: {your}</div>
                            <div className="small text-secondary mb-2">Correct: Option {q.correctOptionKey} ({q[`option${q.correctOptionKey}` as keyof QA]})</div>
                            {q.explanation && (
                              <div className="mt-2 p-2 rounded" style={{ background: 'rgba(255,122,0,0.05)', borderLeft: '3px solid #ff7a00' }}>
                                <span className="text-white d-block mb-1" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Explanation:</span>
                                <div className="text-secondary small">{formatExplanation(q.explanation)}</div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .bg-black { background-color: #1a1a1a !important; }
        .bg-dark { background-color: #1a1a1a !important; }
        .border-secondary { border-color: #333333 !important; }
        .text-secondary { color: #9ca3af !important; }
        .btn-close { filter: brightness(0) invert(1); }
        .accordion-button { background-color: #1a1a1a !important; color: #ffffff !important; }
        .accordion-button:not(.collapsed) { background-color: #1a1a1a !important; color: #ff7a00 !important; }
        .accordion-button:focus { box-shadow: 0 0 0 0.2rem rgba(255,122,0,0.25) !important; }
        .accordion-body { background-color: #1a1a1a !important; color: #9ca3af !important; }
        .accordion-button::after { filter: brightness(0) invert(1); }
        .modal-content { background-color: #1a1a1a !important; }
        .form-check-input:checked { background-color: #ff7a00 !important; border-color: #ff7a00 !important; }
        .form-check-input:focus { box-shadow: 0 0 0 0.2rem rgba(255,122,0,0.25) !important; }
      `}</style>
    </div>
  )
}

export default CategoryGrid

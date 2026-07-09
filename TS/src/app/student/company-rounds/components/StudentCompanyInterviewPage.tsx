import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Spinner, Modal } from 'react-bootstrap'
import { Clock, Code2, Trophy, Lock } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useAuthContext } from '@/context/useAuthContext'
import CodingChallenge from './CodingChallenge'
import MCQQuiz from './MCQQuiz'
import HRInterviewPractice from './HRInterviewPractice'
import TRInterviewPractice from './TRInterviewPractice'
import { FiSearch, FiChevronRight, FiBookmark, FiTool, FiTarget, FiTrendingUp, FiClock, FiAward } from 'react-icons/fi'

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Question = {
  _id: string
  question?: string
  expectedAnswer?: string
  options?: (string | number)[]
  correctAnswer?: string | number
  explanation?: string
  title?: string
  description?: string
  input?: string
  output?: string | number
  order: number
}

type Round = {
  _id: string
  roundName: string
  roundType: 'MCQ' | 'CODING' | 'HR' | 'TR'
  duration: number
  questionCount: number
  order: number
  questions: Question[]
}

type Company = {
  _id: string
  companyName: string
  role: string
  package: string
  location: string
  description: string
  roundsCount: number
  rounds: Round[]
  createdAt: string
  updatedAt: string
}

type CompaniesResponse = {
  success: boolean
  data: Company[]
  pagination?: { total: number; page: number; limit: number; pages: number }
}

type CompanyDetailResponse = { success: boolean; data: Company }

type PerQuestionFeedback = {
  qid?: string
  questionText: string
  textAnswer: string
  expectedAnswer?: string
  rating: number
  feedback: string
}

type RoundResult = {
  score: number
  totalQuestions: number
  correctAnswers: number
  avgRating: number
  aiFeedback: string
  perQuestionFeedback: PerQuestionFeedback[]
  roundType: string
}

type RecentAttempt = { score: number; roundType: string; attemptedAt: string }

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────────────────
const QUIZ_QUESTION_LIMIT = 30
const COMPANY_PAGE_LIMIT = 10

const AVATAR_COLORS: [string, string][] = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]

const avatarColor = (name: string): [string, string] =>
  AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length]

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

const getDifficulty = (company: Company) => {
  const n = company.rounds?.length ?? company.roundsCount ?? 0
  if (n >= 4) return { label: 'Hard',   color: '#dc2626', bg: 'rgba(220,38,38,0.08)'  }
  if (n >= 3) return { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' }
  return              { label: 'Easy',  color: '#16a34a', bg: 'rgba(22,163,74,0.08)'  }
}

const ROUND_ICONS: Record<string, string> = { MCQ: '📝', CODING: '💻', HR: '👔', TR: '🔧' }
const ROUND_COLORS = ['#ff7a00', '#0891b2', '#d97706', '#7c3aed']

const getSanitizedHtml = (html?: string) => DOMPurify.sanitize(html || '')

const getPlainText = (html?: string) => {
  const s = getSanitizedHtml(html)
  if (!s) return ''
  if (typeof window === 'undefined') return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const el = new DOMParser().parseFromString(s, 'text/html')
  return (el.body.textContent || '').replace(/\s+/g, ' ').trim()
}

const getRandomQuestions = (questions: Question[], limit: number) => {
  const s = [...questions]
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]]
  }
  return s.slice(0, Math.min(limit, s.length))
}

const getVisiblePages = (cur: number, total: number, max = 5) => {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1)
  const half = Math.floor(max / 2)
  let start = Math.max(1, cur - half)
  let end = Math.min(total, start + max - 1)
  if (end - start + 1 < max) start = Math.max(1, end - max + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// ─── TINY SUB-COMPONENTS ─────────────────────────────────────────────────────
const InfoBox = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 120 }}>
    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
    <div>
      <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600, marginTop: 1 }}>{value}</div>
    </div>
  </div>
)

const StatRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,122,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 700, lineHeight: 1 }}>{value}</div>
    </div>
  </div>
)

// ─── UNDER CONSTRUCTION ───────────────────────────────────────────────────────
const UnderConstruction = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '80px 24px' }}>
    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,122,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
      <FiTool size={34} color="#ff7a00" />
    </div>
    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem', marginBottom: 6 }}>Under Construction</div>
    <div style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
      This section is currently being built. Check back soon!
    </div>
    <div style={{ marginTop: 20, background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)', borderRadius: 10, padding: '8px 20px' }}>
      <span style={{ fontSize: '0.75rem', color: '#ff7a00', fontWeight: 600 }}>Coming Soon</span>
    </div>
  </div>
)

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const StudentCompanyInterviewPage = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const isPending = user?.status?.toLowerCase() === 'pending'
  const freeCompanyIdRef = useRef<string | null>(null)

  // Data
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingCompanyId, setLoadingCompanyId] = useState<string | null>(null)

  // Tabs
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'myInterviews' | 'bookmarked' | 'recommended'>('all')
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'rounds' | 'previousAttempts'>('overview')

  // Round modal
  const [showRoundModal, setShowRoundModal] = useState(false)
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [activeMode, setActiveMode] = useState<'preview' | 'quiz' | 'coding' | 'interview' | 'result'>('preview')
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({})
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState<string | null>(null)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recentAttempts, setRecentAttempts] = useState<Record<string, RecentAttempt>>({})

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setCurrentPage(1) }, [searchQuery])

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!token) return
      try {
        hasLoadedOnce ? setIsFetching(true) : setLoading(true)
        setError(null)
        const q = new URLSearchParams({ page: String(currentPage), limit: String(COMPANY_PAGE_LIMIT) })
        if (searchQuery.trim()) q.append('search', searchQuery.trim())
        const res = await fetch(`${baseURL}/api/company-interview?${q}`, { headers: { Authorization: `Bearer ${token}` } })
        const data: CompaniesResponse = await res.json()
        if (!res.ok || !data.success) throw new Error('Failed to fetch companies')
        const fetched = data.data || []
        setCompanies(fetched)
        if (!freeCompanyIdRef.current && fetched.length > 0) freeCompanyIdRef.current = fetched[0]._id
        setTotalPages(Math.max(1, data.pagination?.pages || 1))
        setTotalCompanies(data.pagination?.total ?? fetched.length)
      } catch (err: any) {
        setError(err.message || 'Failed to load companies')
      } finally {
        setLoading(false)
        setIsFetching(false)
        setHasLoadedOnce(true)
      }
    }
    fetchCompanies()
  }, [token, baseURL, currentPage, searchQuery])

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return companies
    return companies.filter(c =>
      [c.companyName, c.role, c.location, getPlainText(c.description)]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [companies, searchQuery])

  const fetchRecentAttempts = async (companyId: string) => {
    if (!token) return
    try {
      const res = await fetch(`${baseURL}/api/company-interview-attempt/student?companyInterviewId=${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const map: Record<string, RecentAttempt> = {}
        data.data.forEach((a: any) => { map[String(a.roundId)] = { score: a.score, roundType: a.roundType, attemptedAt: a.attemptedAt } })
        setRecentAttempts(map)
      }
    } catch { /* non-critical */ }
  }

  const fetchCompanyDetails = async (companyId: string) => {
    if (loadingCompanyId) return
    setLoadingCompanyId(companyId)
    setRecentAttempts({})
    setActiveDetailTab('overview')
    try {
      const res = await fetch(`${baseURL}/api/company-interview/${companyId}`, { headers: { Authorization: `Bearer ${token}` } })
      const data: CompanyDetailResponse = await res.json()
      if (!res.ok || !data.success) throw new Error('Failed to fetch company details')
      setSelectedCompany(data.data)
      fetchRecentAttempts(companyId)
    } catch (err: any) {
      setError(err.message || 'Failed to load company details')
    } finally {
      setLoadingCompanyId(null)
    }
  }

  const handleCloseRoundModal = () => {
    setShowRoundModal(false)
    setActiveMode('preview')
    setQuizQuestions([])
    setRoundResult(null)
    setIsAnalyzing(false)
    setSelectedCodingQuestionId(null)
    try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
  }

  const handleStartRound = (round: Round) => {
    setSelectedRound(round)
    setActiveMode('preview')
    setExpandedAnswers({})
    setQuizQuestions([])
    setShowRoundModal(true)
  }

  const handleTakeQuiz = () => {
    if (!selectedRound) return
    if (selectedRound.roundType === 'MCQ') {
      setQuizQuestions(getRandomQuestions(selectedRound.questions || [], QUIZ_QUESTION_LIMIT))
      setActiveMode('quiz')
    } else if (selectedRound.roundType === 'CODING') {
      setActiveMode('coding')
    } else {
      setActiveMode('interview')
    }
  }

  const handleAttemptComplete = async (answers: any) => {
    if (!selectedRound || !selectedCompany) return
    setActiveMode('result')
    setIsAnalyzing(true)
    setRoundResult(null)
    try {
      const res = await fetch(`${baseURL}/api/company-interview-attempt/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyInterviewId: selectedCompany._id,
          roundId: selectedRound._id,
          roundType: selectedRound.roundType,
          answers: selectedRound.roundType === 'MCQ' ? answers.answers : answers,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save attempt')
      setRoundResult(data.data)
      setRecentAttempts(prev => ({
        ...prev,
        [selectedRound._id]: { score: data.data.score, roundType: selectedRound.roundType, attemptedAt: new Date().toISOString() },
      }))
    } catch {
      if (selectedRound.roundType === 'MCQ' && answers.score != null) {
        setRoundResult({ score: answers.score, totalQuestions: answers.totalQuestions || 0, correctAnswers: answers.correctAnswers || 0, avgRating: 0, aiFeedback: answers.score >= 70 ? 'Good job!' : 'Keep practicing.', perQuestionFeedback: [], roundType: 'MCQ' })
      } else {
        setRoundResult({ score: 0, totalQuestions: 0, correctAnswers: 0, avgRating: 0, aiFeedback: 'Could not analyze. Try again.', perQuestionFeedback: [], roundType: selectedRound.roundType })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReattempt = () => { setRoundResult(null); setIsAnalyzing(false); setSelectedCodingQuestionId(null); handleTakeQuiz() }
  const toggleAnswer = (id: string) => setExpandedAnswers(prev => ({ ...prev, [id]: !prev[id] }))
  const formatExplanation = (text?: string) => (text || 'Explanation not available.').replace(/\.\s+/g, '.\n').replace(/\s-\s+/g, '\n- ')

  const downloadResultPDF = () => {
    if (!roundResult || !selectedRound || !selectedCompany) return
    const isPassed = roundResult.score >= 60
    const scoreColor = isPassed ? '#22c55e' : '#ef4444'
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    const questionsHTML = roundResult.perQuestionFeedback.map((item, idx) => {
      const isMCQCorrect = roundResult.roundType === 'MCQ' && item.rating === 5
      const isMCQWrong = roundResult.roundType === 'MCQ' && item.rating === 0
      const answerColor = isMCQCorrect ? '#22c55e' : isMCQWrong ? '#ef4444' : '#d1d5db'
      const stars = '★'.repeat(item.rating) + '☆'.repeat(Math.max(0, 5 - item.rating))
      return `<div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:14px;">
        <div style="font-weight:600;margin-bottom:8px;">Q${idx + 1}. ${item.questionText}</div>
        <div style="background:#f9fafb;border-radius:6px;padding:10px;margin-bottom:8px;">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Your Answer</div>
          <div style="color:${answerColor};font-size:13px;">${item.textAnswer || 'Not answered'}</div>
        </div>
        ${item.expectedAnswer ? `<div style="background:#f5f3ff;border:1px solid #d8b4fe;border-radius:6px;padding:10px;margin-bottom:8px;"><div style="font-size:11px;color:#7c3aed;margin-bottom:4px;">Expected</div><div style="color:#5b21b6;font-size:13px;">${item.expectedAnswer}</div></div>` : ''}
        ${roundResult.roundType !== 'MCQ' ? `<div style="color:#f59e0b;font-size:16px;">${stars} <span style="font-size:11px;color:#6b7280;">${item.rating}/5</span></div>` : ''}
        <div style="font-size:12px;color:#374151;margin-top:4px;"><strong>Feedback:</strong> ${item.feedback}</div>
      </div>`
    }).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Result</title><style>body{font-family:Arial,sans-serif;color:#111;margin:auto;padding:32px;max-width:760px;}</style></head><body>
      <div style="border-bottom:3px solid #ff6b35;padding-bottom:16px;margin-bottom:24px;"><h1 style="color:#ff6b35;margin:0;">Interview Practice Report</h1><div style="color:#6b7280;font-size:13px;">${date}</div></div>
      <table style="width:100%;margin-bottom:20px;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#6b7280;width:120px;">Company</td><td style="font-weight:600;">${selectedCompany.companyName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Round</td><td>${selectedRound.roundName}</td></tr>
      </table>
      <div style="display:flex;gap:24px;background:#f9fafb;border-radius:12px;padding:18px;margin-bottom:24px;">
        <div style="text-align:center;min-width:90px;"><div style="font-size:40px;font-weight:800;color:${scoreColor};">${roundResult.score}%</div><div style="font-size:12px;color:#6b7280;">Score</div></div>
        <div><div style="font-weight:700;color:${scoreColor};">${isPassed ? '✓ Good Performance' : '✗ Needs More Practice'}</div><div style="font-size:13px;color:#374151;margin-top:6px;">${roundResult.aiFeedback}</div></div>
      </div>
      ${questionsHTML}
    </body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => win.print()
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f5f9', gap: 12 }}>
      <Spinner animation="border" style={{ color: '#ff7a00' }} />
      <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>Loading companies…</p>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f5f9', gap: 12 }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 24px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>
    </div>
  )

  // ── PROGRESS helpers ──
  const totalRounds = selectedCompany?.rounds?.length ?? 0
  const attemptedRounds = Object.keys(recentAttempts).length
  const overallProgress = totalRounds > 0 ? Math.round((attemptedRounds / totalRounds) * 100) : 0
  const avgScore = Object.values(recentAttempts).length > 0
    ? Math.round(Object.values(recentAttempts).reduce((s, a) => s + a.score, 0) / Object.values(recentAttempts).length)
    : 0
  const bestEntry = Object.entries(recentAttempts).sort(([, a], [, b]) => b.score - a.score)[0]
  const bestRoundName = bestEntry ? selectedCompany?.rounds?.find(r => r._id === bestEntry[0])?.roundName : null
  const lastAttempt = Object.values(recentAttempts).sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())[0]

  const ringRadius = 40
  const ringCirc = 2 * Math.PI * ringRadius
  const ringOffset = ringCirc - (overallProgress / 100) * ringCirc

  // ── RENDER ──
  return (
    <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflow: 'hidden' }}>

        {/* ── Page Header ── */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '14px 24px', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 20, flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', lineHeight: 1 }}>
              Company Mock Interviews
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
              Practice company-specific interview rounds and improve your selection chances.
            </div>
          </div>
          <div style={{
            background: 'rgba(255,122,0,0.05)', border: '1px solid rgba(255,122,0,0.18)',
            borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
            maxWidth: 300, flexShrink: 0,
          }}>
            <span style={{ fontSize: '1.1rem' }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>Level Up Your Interview Skills 🚀</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2, lineHeight: 1.5 }}>
                Practice company based mock interviews and track your performance.
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Tabs (hidden — under construction) ── */}
        {/* <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', display: 'flex', flexShrink: 0 }}>
          {(['all', 'myInterviews', 'bookmarked', 'recommended'] as const).map(key => {
            const LABELS = { all: 'All Companies', myInterviews: 'My Interviews', bookmarked: 'Bookmarked', recommended: 'Recommended' }
            const active = activeMainTab === key
            return (
              <button key={key} onClick={() => setActiveMainTab(key)} style={{ background: 'none', border: 'none', borderBottom: `2.5px solid ${active ? '#ff7a00' : 'transparent'}`, color: active ? '#ff7a00' : '#64748b', fontWeight: active ? 700 : 500, fontSize: '0.82rem', padding: '12px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {LABELS[key]}
              </button>
            )
          })}
        </div> */}

        {activeMainTab !== 'all' ? <UnderConstruction /> : (

          /* ── 3-Column Layout ── */
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* ── LEFT: Company Sidebar ── */}
            <div style={{ width: 310, flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Sidebar header */}
              <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: 10 }}>All Companies</div>
                <div style={{ position: 'relative' }}>
                  <FiSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    placeholder="Search company"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    style={{ width: '100%', height: 32, paddingLeft: 28, paddingRight: 10, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.75rem', color: '#0f172a', outline: 'none', background: '#f8fafc' }}
                  />
                </div>
              </div>

              {/* Company list */}
              <div className="ci-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                {isFetching && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                    <Spinner animation="border" size="sm" style={{ color: '#ff7a00' }} />
                  </div>
                )}
                {isPending && (
                  <div style={{ background: 'rgba(255,122,0,0.06)', borderBottom: '1px solid rgba(255,122,0,0.15)', padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.68rem', color: '#64748b' }}>
                    <Lock size={11} color="#ff7a00" />
                    <span><strong style={{ color: '#ff7a00' }}>Trial:</strong> 1 company free</span>
                  </div>
                )}
                {filteredCompanies.map(company => {
                  const isSelected = selectedCompany?._id === company._id
                  const isLocked = isPending && company._id !== freeCompanyIdRef.current
                  const isLoading = loadingCompanyId === company._id
                  const diff = getDifficulty(company)
                  const [fg, bg] = avatarColor(company.companyName)
                  const count = company.rounds?.length ?? company.roundsCount ?? 0
                  return (
                    <div
                      key={company._id}
                      onClick={() => !isLocked && !isLoading && fetchCompanyDetails(company._id)}
                      style={{
                        padding: '11px 14px', borderBottom: '1px solid #f8fafc',
                        background: isSelected ? 'rgba(255,122,0,0.04)' : '#fff',
                        borderLeft: `3px solid ${isSelected ? '#ff7a00' : 'transparent'}`,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                        opacity: isLocked ? 0.45 : 1,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                      onMouseEnter={e => { if (!isLocked && !isSelected) e.currentTarget.style.background = '#fafafa' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff' }}
                    >
                      {/* Avatar */}
                      <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: fg }}>
                        {isLoading ? <Spinner animation="border" size="sm" style={{ color: fg, width: 14, height: 14 }} /> : initials(company.companyName)}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {company.companyName}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 1 }}>{count} Interviews</div>
                      </div>
                      {/* Difficulty + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {isLocked
                          ? <Lock size={11} color="#94a3b8" />
                          : <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: diff.bg, color: diff.color }}>{diff.label}</span>
                        }
                        <FiChevronRight size={12} color="#cbd5e1" />
                      </div>
                    </div>
                  )
                })}
                {filteredCompanies.length === 0 && !isFetching && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '0.78rem' }}>No companies found</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ background: currentPage === 1 ? '#f1f5f9' : '#ff7a00', border: 'none', borderRadius: 6, padding: '3px 10px', color: currentPage === 1 ? '#cbd5e1' : '#fff', cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>‹</button>
                  <span style={{ fontSize: '0.65rem', color: '#ff7a00', fontWeight: 600 }}>{currentPage} / {totalPages} • {totalCompanies} total</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ background: currentPage === totalPages ? '#f1f5f9' : '#ff7a00', border: 'none', borderRadius: 6, padding: '3px 10px', color: currentPage === totalPages ? '#cbd5e1' : '#fff', cursor: currentPage === totalPages ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>›</button>
                </div>
              )}
            </div>

            {/* ── CENTER: Company Detail ── */}
            <div className="ci-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
              {!selectedCompany ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '2rem' }}>🏢</div>
                  <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>Select a company</div>
                  <div style={{ fontSize: '0.78rem', marginTop: 4, color: '#94a3b8' }}>Choose from the left panel to view details</div>
                </div>
              ) : (
                <div style={{ padding: '20px 24px' }}>
                  {/* Company Header Card */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      {/* Logo */}
                      {(() => {
                        const [fg, bg] = avatarColor(selectedCompany.companyName)
                        return (
                          <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: fg }}>
                            {initials(selectedCompany.companyName)}
                          </div>
                        )
                      })()}
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                          {selectedCompany.companyName} Mock Interview
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                          Practice {selectedCompany.companyName} interview rounds based on latest pattern and syllabus
                        </div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '0.68rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                          <span>{selectedCompany.rounds?.length ?? 0} Interviews</span>
                          <span>•</span>
                          <span>45k+ Students Practiced</span>
                          <span>•</span>
                          <span>Updated {timeAgo(selectedCompany.updatedAt)}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                        <button style={{ width: 36, height: 36, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiBookmark size={15} color="#94a3b8" />
                        </button>
                        <button
                          onClick={() => selectedCompany.rounds?.[0] && handleStartRound(selectedCompany.rounds[0])}
                          style={{ background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', padding: '9px 18px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Start Interview
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detail Tabs */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
                    {/* Tab bar */}
                    <div style={{ borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex' }}>
                      {[
                        { key: 'overview', label: 'Overview' },
                        { key: 'rounds', label: `Rounds (${selectedCompany.rounds?.length ?? 0})` },
                        { key: 'previousAttempts', label: 'Previous Attempts' },
                      ].map(t => {
                        const active = activeDetailTab === t.key
                        return (
                          <button key={t.key} onClick={() => setActiveDetailTab(t.key as any)} style={{
                            background: 'none', border: 'none',
                            borderBottom: `2px solid ${active ? '#ff7a00' : 'transparent'}`,
                            color: active ? '#ff7a00' : '#64748b',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.8rem', padding: '12px 16px',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>{t.label}</button>
                        )
                      })}
                    </div>

                    {/* Tab content */}
                    <div style={{ padding: '20px', overflowX: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }}>

                      {/* ── Overview ── */}
                      {activeDetailTab === 'overview' && (
                        <>
                          {/* About */}
                          <div style={{ marginBottom: 22 }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: 10 }}>
                              About {selectedCompany.companyName} Interview
                            </div>
                            <div
                              className="ci-rich-content"
                              style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.7, wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
                              dangerouslySetInnerHTML={{ __html: getSanitizedHtml(selectedCompany.description) }}
                            />
                          </div>

                          {/* Info row */}
                          <div style={{ display: 'flex', gap: 24, marginBottom: 22, flexWrap: 'wrap', padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            <InfoBox icon="🎓" label="Eligibility" value={selectedCompany.role || 'All'} />
                            <InfoBox icon="💼" label="Experience" value="Fresher" />
                            <InfoBox icon="💻" label="Interview Type" value="Online" />
                            <InfoBox icon="⏱" label="Duration" value={`${selectedCompany.rounds?.reduce((s, r) => s + r.duration, 0) ?? 0} mins`} />
                          </div>

                          {/* Rounds Included */}
                          <div style={{ marginBottom: 22 }}>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: 12 }}>Rounds Included</div>
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {selectedCompany.rounds?.map((round, idx) => {
                                const color = ROUND_COLORS[idx % ROUND_COLORS.length]
                                return (
                                  <div key={round._id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', background: '#fff', minWidth: 130, flex: '1 1 130px', maxWidth: 180 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color, fontSize: '0.8rem', marginBottom: 8 }}>
                                      {idx + 1}
                                    </div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', marginBottom: 4 }}>{round.roundName}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{round.questionCount} {round.roundType === 'CODING' ? 'Problems' : 'Questions'}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                      <Clock size={10} /> {round.duration} min
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Preparation Resources */}
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem', marginBottom: 12 }}>Preparation Resources</div>
                            {[
                              { title: `${selectedCompany.companyName} Interview Experience`, desc: 'Read experiences from selected students', count: '120+' },
                              { title: `${selectedCompany.companyName} Previous Year Questions`, desc: 'Download and practice PYQs', count: '80+' },
                              { title: `${selectedCompany.companyName} Syllabus & Pattern`, desc: 'Detailed syllabus and interview pattern', count: null },
                            ].map((res, idx, arr) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: idx < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,122,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>📄</div>
                                  <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{res.title}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>{res.desc}</div>
                                  </div>
                                </div>
                                {res.count && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{res.count} ›</span>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* ── Rounds tab ── */}
                      {activeDetailTab === 'rounds' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {selectedCompany.rounds?.map((round, idx) => {
                            const attempt = recentAttempts[round._id]
                            return (
                              <div key={round._id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, background: '#fff' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${ROUND_COLORS[idx % ROUND_COLORS.length]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                  {ROUND_ICONS[round.roundType] || '📋'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{round.roundName}</div>
                                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{round.questionCount} Questions • {round.duration} mins</div>
                                </div>
                                {attempt && (
                                  <span style={{ background: attempt.score >= 60 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: attempt.score >= 60 ? '#16a34a' : '#dc2626', borderRadius: 20, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    Last: {attempt.score}%
                                  </span>
                                )}
                                <button onClick={() => handleStartRound(round)} style={{ background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', padding: '7px 14px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {attempt ? 'Reattempt' : 'Start'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* ── Previous Attempts ── */}
                      {activeDetailTab === 'previousAttempts' && (
                        Object.keys(recentAttempts).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                            <Trophy size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
                            <div style={{ fontSize: '0.82rem' }}>No attempts yet. Start practicing!</div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {Object.entries(recentAttempts).map(([roundId, attempt]) => {
                              const round = selectedCompany.rounds?.find(r => r._id === roundId)
                              return (
                                <div key={roundId} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>{round?.roundName || 'Round'}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>{new Date(attempt.attemptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                  </div>
                                  <span style={{ background: attempt.score >= 60 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: attempt.score >= 60 ? '#16a34a' : '#dc2626', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 700 }}>
                                    {attempt.score}%
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Progress Panel ── */}
            <div className="ci-scroll" style={{ width: 270, flexShrink: 0, borderLeft: '1px solid #e2e8f0', background: '#fff', overflowY: 'auto', padding: '18px 16px' }}>
              {!selectedCompany ? (
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center', paddingTop: 40 }}>
                  Select a company to view progress
                </div>
              ) : (
                <>
                  {/* Your Progress */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: 14 }}>Your Progress</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                      {/* Circular progress */}
                      <svg width="90" height="90" style={{ flexShrink: 0 }}>
                        <circle cx="45" cy="45" r={ringRadius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
                        <circle cx="45" cy="45" r={ringRadius} fill="none" stroke="#ff7a00" strokeWidth="7"
                          strokeDasharray={ringCirc} strokeDashoffset={ringOffset}
                          strokeLinecap="round" transform="rotate(-90 45 45)" />
                        <text x="45" y="41" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">{overallProgress}%</text>
                        <text x="45" y="54" textAnchor="middle" fontSize="7" fill="#94a3b8">Progress</text>
                      </svg>
                      {/* Stats */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <StatRow icon={<FiTarget size={13} color="#ff7a00" />} label="Interviews Attempted" value={`${attemptedRounds} / ${totalRounds}`} />
                        <StatRow icon={<FiTrendingUp size={13} color="#ff7a00" />} label="Avg. Score" value={`${avgScore}%`} />
                        {bestRoundName && <StatRow icon={<FiAward size={13} color="#ff7a00" />} label="Best Round" value={bestRoundName} />}
                        {lastAttempt && <StatRow icon={<FiClock size={13} color="#ff7a00" />} label="Last Attempt" value={timeAgo(lastAttempt.attemptedAt)} />}
                      </div>
                    </div>
                    <button style={{ width: '100%', background: 'rgba(255,122,0,0.05)', border: '1px solid rgba(255,122,0,0.2)', borderRadius: 8, color: '#ff7a00', padding: '8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                      View Detailed Report
                    </button>
                  </div>

                  {/* Prepare by Round */}
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: 12 }}>Prepare by Round</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {selectedCompany.rounds?.map((round, idx) => (
                        <div key={round._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: `${ROUND_COLORS[idx % ROUND_COLORS.length]}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                            {ROUND_ICONS[round.roundType] || '📋'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{round.roundName}</div>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 1 }}>{round.questionCount} {round.roundType === 'CODING' ? 'Problems' : 'Questions'} • {round.duration} min</div>
                          </div>
                          <button
                            onClick={() => handleStartRound(round)}
                            style={{ background: '#ff7a00', border: 'none', borderRadius: 6, color: '#fff', padding: '5px 10px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Start Practice
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Round Modal (fullscreen — quiz / coding / HR / TR / result) ── */}
      <Modal show={showRoundModal} onHide={handleCloseRoundModal} fullscreen className="round-modal" backdrop="static" keyboard={false}>
        {activeMode === 'preview' && (
          <>
            <Modal.Header className="round-modal-header" closeButton>
              <div className="round-modal-title">
                <div>
                  <h4>{selectedRound?.roundName} Round</h4>
                  <p>{selectedCompany?.companyName} • {selectedCompany?.role}</p>
                </div>
              </div>
              <div className="round-modal-actions">
                {selectedRound?.roundType !== 'CODING' && (
                  <button className="header-quiz-btn" onClick={handleTakeQuiz}>
                    {selectedRound?.roundType === 'HR' || selectedRound?.roundType === 'TR' ? 'Start Practice' : 'Take Quiz'}
                  </button>
                )}
              </div>
            </Modal.Header>
            <Modal.Body className="round-modal-body">
              <div className="preview-container">
                <div className="questions-container">
                  {selectedRound?.roundType === 'MCQ' && selectedRound.questions.map((q, idx) => (
                    <div key={q._id} className="mcq-question">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <span className="question-type">MCQ</span>
                      </div>
                      <h5 className="question-text">{q.question}</h5>
                      <div className="options-list">
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} className="option-item static">
                            <span className="option-label">{String.fromCharCode(65 + oi)}.</span>
                            <span className="option-text">{String(opt)}</span>
                          </div>
                        ))}
                      </div>
                      <button className="show-answer-btn" onClick={() => toggleAnswer(q._id)}>
                        {expandedAnswers[q._id] ? 'Hide Answer & Explanation' : 'Show Answer & Explanation'}
                      </button>
                      {expandedAnswers[q._id] && (
                        <div className="answer-panel">
                          <p><strong>Answer:</strong> {q.correctAnswer ?? 'Not provided'}</p>
                          <p><strong>Explanation:</strong></p>
                          <div className="answer-text multi-line-text">{formatExplanation(q.explanation)}</div>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedRound?.roundType === 'CODING' && selectedRound.questions.map((q, idx) => (
                    <div key={q._id} className="coding-question">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <span className="question-type coding">CODING</span>
                      </div>
                      <h5 className="question-title">{q.title}</h5>
                      <p className="question-description">{q.description}</p>
                      <div className="sample-io">
                        <div className="sample-input"><span className="label">Sample Input:</span><code>{q.input || 'N/A'}</code></div>
                        <div className="sample-output"><span className="label">Expected Output:</span><code>{q.output ?? 'N/A'}</code></div>
                      </div>
                      <div className="coding-question-footer">
                        {recentAttempts[selectedRound._id] && (
                          <span className={`recent-score-badge ${recentAttempts[selectedRound._id].score >= 60 ? 'pass' : 'fail'}`}>
                            <Trophy size={10} /> Last: {recentAttempts[selectedRound._id].score}%
                          </span>
                        )}
                        <button className="coding-start-btn" onClick={() => { setSelectedCodingQuestionId(q._id); setActiveMode('coding') }}>
                          <Code2 size={14} /> Start Challenge
                        </button>
                      </div>
                    </div>
                  ))}

                  {(selectedRound?.roundType === 'HR' || selectedRound?.roundType === 'TR') && selectedRound.questions.map((q, idx) => (
                    <div key={q._id} className="mcq-question">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <span className={`question-type ${selectedRound.roundType.toLowerCase()}`}>{selectedRound.roundType}</span>
                      </div>
                      <h5 className="question-text">{q.question || q.title || 'Interview Question'}</h5>
                      <button className="show-answer-btn" onClick={() => toggleAnswer(q._id)}>
                        {expandedAnswers[q._id] ? 'Hide Suggested Answer' : 'Show Suggested Answer'}
                      </button>
                      {expandedAnswers[q._id] && (
                        <div className="answer-panel">
                          <p><strong>Suggested:</strong> {q.expectedAnswer || q.explanation || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Modal.Body>
          </>
        )}

        {activeMode === 'quiz' && selectedRound && (
          <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <MCQQuiz round={selectedRound} companyName={selectedCompany?.companyName || ''} role={selectedCompany?.role || ''} quizQuestions={quizQuestions} onClose={handleCloseRoundModal} onAttemptComplete={handleAttemptComplete} />
          </Modal.Body>
        )}

        {activeMode === 'coding' && selectedRound && (
          <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <CodingChallenge round={selectedRound} companyName={selectedCompany?.companyName || ''} role={selectedCompany?.role || ''} onClose={handleCloseRoundModal} onAttemptComplete={handleAttemptComplete} selectedQuestionId={selectedCodingQuestionId ?? undefined} />
          </Modal.Body>
        )}

        {activeMode === 'interview' && selectedRound && (
          <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {selectedRound.roundType === 'HR' ? (
              <HRInterviewPractice round={selectedRound} companyName={selectedCompany?.companyName || ''} role={selectedCompany?.role || ''} onClose={handleCloseRoundModal} onAttemptComplete={handleAttemptComplete} />
            ) : (
              <TRInterviewPractice round={selectedRound} companyName={selectedCompany?.companyName || ''} role={selectedCompany?.role || ''} onClose={handleCloseRoundModal} onAttemptComplete={handleAttemptComplete} />
            )}
          </Modal.Body>
        )}

        {activeMode === 'result' && (
          <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', overflowY: 'auto' }}>
            <div className="round-result-screen">
              {isAnalyzing ? (
                <div className="result-analyzing">
                  <Spinner animation="border" style={{ color: '#ff6b35', width: '3rem', height: '3rem' }} />
                  <p className="result-analyzing-text">Analyzing your performance with AI…</p>
                  <small className="result-analyzing-sub">This may take a few seconds</small>
                </div>
              ) : roundResult ? (
                <>
                  <div className="result-header">
                    <Trophy size={22} color="#ff6b35" />
                    <h4>{selectedRound?.roundName} — Result</h4>
                    <p>{selectedCompany?.companyName} • {selectedCompany?.role}</p>
                  </div>
                  <div className={`result-score-ring ${roundResult.score >= 60 ? 'pass' : 'fail'}`}>
                    <span className="result-score-num">{roundResult.score}%</span>
                    <span className="result-score-label">
                      {roundResult.roundType === 'MCQ' ? `${roundResult.correctAnswers}/${roundResult.totalQuestions} correct` : roundResult.avgRating > 0 ? `Avg Rating ${roundResult.avgRating.toFixed(1)}/5` : 'Score'}
                    </span>
                  </div>
                  <div className={`result-status-badge ${roundResult.score >= 60 ? 'pass' : 'fail'}`}>
                    {roundResult.score >= 60 ? '✓ Good Performance' : '✗ Needs More Practice'}
                  </div>
                  <div className="result-feedback-card">
                    <h6>AI Feedback</h6>
                    <p>{roundResult.aiFeedback}</p>
                  </div>
                  {roundResult.perQuestionFeedback.length > 0 && (
                    <div className="result-breakdown">
                      <h6>Question Breakdown</h6>
                      {roundResult.perQuestionFeedback.map((item, idx) => {
                        const isMCQ = roundResult.roundType === 'MCQ'
                        const isCorrect = isMCQ && item.rating === 5
                        const isWrong = isMCQ && item.rating === 0
                        return (
                          <div key={idx} className="result-q-item">
                            <div className="result-q-title">Q{idx + 1}. {item.questionText}</div>
                            <div className={`result-q-answer ${isCorrect ? 'correct' : isWrong ? 'wrong' : ''}`}>
                              <span className="result-q-answer-label">Your Answer</span>
                              <span className="result-q-answer-text">{item.textAnswer || 'Not answered'}</span>
                            </div>
                            {item.expectedAnswer && (
                              <div className="result-q-expected">
                                <span className="result-q-answer-label">{roundResult.roundType === 'MCQ' ? 'Correct Answer' : 'Suggested Answer'}</span>
                                <span className="result-q-expected-text">{item.expectedAnswer}</span>
                              </div>
                            )}
                            {!isMCQ && (
                              <div className="result-q-stars">
                                {'★'.repeat(item.rating)}{'☆'.repeat(Math.max(0, 5 - item.rating))}
                                <span className="result-q-rating-num">{item.rating}/5</span>
                              </div>
                            )}
                            <div className="result-q-feedback">{item.feedback}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="result-actions">
                    <button className="result-reattempt-btn" onClick={handleReattempt}>Reattempt</button>
                    <button className="result-reattempt-btn" onClick={downloadResultPDF}>Download PDF</button>
                    <button className="header-quiz-btn" onClick={handleCloseRoundModal}>Done</button>
                  </div>
                </>
              ) : null}
            </div>
          </Modal.Body>
        )}
      </Modal>

      <style>{`
        /* Constrain rich HTML content from overflowing */
        .ci-rich-content * { max-width: 100% !important; word-break: break-word; overflow-wrap: break-word; box-sizing: border-box; }
        .ci-rich-content img, .ci-rich-content table { max-width: 100% !important; }
        .ci-rich-content pre, .ci-rich-content code { white-space: pre-wrap; word-break: break-all; }

        /* Thin scrollbars on all scrollable panels */
        .ci-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .ci-scroll::-webkit-scrollbar { width: 3px; }
        .ci-scroll::-webkit-scrollbar-track { background: transparent; }
        .ci-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .ci-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

        .round-modal .modal-content { background: #0a0a0a; border-radius: 0; height: 100vh; }
        .round-modal-header { background: #0a0a0a; border-bottom: 2px solid #ff6b35; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; padding-right: 4.5rem; position: relative; }
        .round-modal-header .btn-close { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); filter: invert(1); }
        .round-modal-title { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
        .round-modal-title h4 { margin: 0; color: #ff6b35; font-size: 1.05rem; }
        .round-modal-title p { margin: 0; font-size: 0.75rem; color: #888; }
        .round-modal-actions { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; flex: 0 0 auto; }
        .header-quiz-btn { background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%); border: none; padding: 0.45rem 0.95rem; font-size: 0.82rem; font-weight: 600; border-radius: 8px; color: #fff; cursor: pointer; }
        .round-modal-body { padding: 1.5rem; flex: 1 1 auto; min-height: 0; overflow-y: auto; color: #eee; }
        .round-modal-body::-webkit-scrollbar { width: 4px; } .round-modal-body::-webkit-scrollbar-thumb { background: #ff6b35; border-radius: 4px; }
        .questions-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .mcq-question, .coding-question { background: #0d0d0d; border: 1px solid #222; border-radius: 14px; padding: 1.25rem; }
        .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .question-number { font-size: 0.8rem; color: #ff6b35; font-weight: 600; }
        .question-type { background: rgba(255,107,53,0.15); color: #ff6b35; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
        .question-text { font-size: 1rem; color: #fff; margin-bottom: 1rem; }
        .question-title { font-size: 1rem; color: #ff6b35; margin-bottom: 0.5rem; }
        .question-description { font-size: 0.85rem; color: #b0b0b0; margin-bottom: 1rem; }
        .options-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .option-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: #0a0a0a; border: 1px solid #333; border-radius: 10px; }
        .option-item.static { cursor: default; }
        .option-label { min-width: 20px; color: #ff6b35; font-weight: 700; }
        .option-text { color: #e0e0e0; font-size: 0.9rem; }
        .sample-io { display: flex; gap: 1rem; margin: 1rem 0; padding: 0.75rem; background: #0a0a0a; border-radius: 10px; }
        .sample-input, .sample-output { flex: 1; }
        .sample-io .label { display: block; font-size: 0.7rem; color: #888; margin-bottom: 0.25rem; }
        .sample-io code { display: block; background: #050505; padding: 0.5rem; border-radius: 6px; font-size: 0.8rem; color: #fbbf24; }
        .coding-question-footer { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid #1e1e1e; }
        .coding-start-btn { display: flex; align-items: center; gap: 0.4rem; background: #ff6b35; border: none; border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 600; padding: 0.45rem 1.1rem; cursor: pointer; }
        .show-answer-btn { margin-top: 0.75rem; width: 100%; text-align: left; background: transparent; border: 1px solid #2e2e2e; color: #e0e0e0; padding: 0.65rem 0.8rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
        .answer-panel { margin-top: 0.75rem; padding: 0.85rem; border: 1px solid #2e2e2e; border-radius: 10px; background: #090909; }
        .answer-panel p { margin: 0.25rem 0; color: #ccc; font-size: 0.85rem; }
        .answer-text { white-space: pre-line; color: #ccc; font-size: 0.85rem; margin-top: 0.35rem; line-height: 1.6; }
        .recent-score-badge { display: flex; align-items: center; gap: 3px; font-size: 0.72rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 20px; }
        .recent-score-badge.pass { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
        .recent-score-badge.fail { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
        .round-result-screen { display: flex; flex-direction: column; align-items: center; padding: 2rem 1.5rem; gap: 1.2rem; max-width: 680px; margin: 0 auto; width: 100%; }
        .result-analyzing { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; min-height: 60vh; text-align: center; }
        .result-analyzing-text { color: #f3f3f3; font-size: 1rem; margin: 0; }
        .result-analyzing-sub { color: #888; font-size: 0.82rem; }
        .result-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
        .result-header h4 { color: #ff6b35; margin: 0; font-size: 1.15rem; }
        .result-header p { color: #888; font-size: 0.83rem; margin: 0; }
        .result-score-ring { width: 130px; height: 130px; border-radius: 50%; border: 5px solid; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem; }
        .result-score-ring.pass { border-color: #22c55e; } .result-score-ring.fail { border-color: #ef4444; }
        .result-score-num { font-size: 2.2rem; font-weight: 800; color: #f3f3f3; line-height: 1; }
        .result-score-label { font-size: 0.72rem; color: #9ca3af; text-align: center; padding: 0 0.5rem; }
        .result-status-badge { font-size: 0.88rem; font-weight: 700; padding: 0.4rem 1.2rem; border-radius: 20px; }
        .result-status-badge.pass { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
        .result-status-badge.fail { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
        .result-feedback-card { background: #0d0d0d; border: 1px solid #232323; border-radius: 14px; padding: 1rem 1.2rem; width: 100%; }
        .result-feedback-card h6 { color: #ff6b35; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; }
        .result-feedback-card p { color: #d1d5db; font-size: 0.9rem; margin: 0; line-height: 1.55; }
        .result-breakdown { background: #0d0d0d; border: 1px solid #232323; border-radius: 14px; padding: 1rem 1.2rem; width: 100%; }
        .result-breakdown h6 { color: #ff6b35; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.8rem; }
        .result-q-item { border-top: 1px solid #1e1e1e; padding: 0.7rem 0; }
        .result-q-item:first-of-type { border-top: none; padding-top: 0; }
        .result-q-title { font-size: 0.85rem; color: #e5e7eb; margin-bottom: 0.3rem; font-weight: 500; }
        .result-q-answer { background: #111; border: 1px solid #2a2a2a; border-radius: 8px; padding: 0.55rem 0.8rem; margin: 0.35rem 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .result-q-answer.correct { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.06); }
        .result-q-answer.wrong { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.06); }
        .result-q-answer-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; font-weight: 600; }
        .result-q-answer-text { font-size: 0.85rem; color: #e5e7eb; white-space: pre-wrap; line-height: 1.45; }
        .result-q-expected { background: #111; border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; padding: 0.55rem 0.8rem; margin: 0.35rem 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .result-q-expected-text { font-size: 0.85rem; color: #c084fc; white-space: pre-wrap; line-height: 1.45; }
        .result-q-stars { color: #f59e0b; font-size: 1rem; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem; }
        .result-q-rating-num { font-size: 0.72rem; color: #9ca3af; }
        .result-q-feedback { font-size: 0.8rem; color: #9ca3af; line-height: 1.45; }
        .result-actions { display: flex; gap: 0.8rem; width: 100%; justify-content: center; padding-top: 0.5rem; }
        .result-reattempt-btn { border: 1px solid #444; background: #141414; color: #d8d8d8; border-radius: 8px; font-size: 0.88rem; padding: 0.5rem 1.4rem; cursor: pointer; }
        .result-reattempt-btn:hover { border-color: #ff6b35; color: #ff6b35; }
      `}</style>
    </>
  )
}

export default StudentCompanyInterviewPage

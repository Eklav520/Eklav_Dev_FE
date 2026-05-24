import React, { useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Alert, Badge, Card, Row, Col, Modal } from 'react-bootstrap'
import {
  Building2, FileText, Code2, DollarSign, MapPin, ClipboardList,
  BookOpen, Target, Clock, Pencil, Play, Trophy, LayoutList, UserCheck
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { useAuthContext } from '@/context/useAuthContext'
import CodingChallenge from './CodingChallenge'
import MCQQuiz from './MCQQuiz'
import HRInterviewPractice from './HRInterviewPractice'
import TRInterviewPractice from './TRInterviewPractice'

// ================= TYPES =================
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
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

type CompanyDetailResponse = {
  success: boolean
  data: Company
}

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

type RecentAttempt = {
  score: number
  roundType: string
  attemptedAt: string
}

// ================= CONSTANTS =================
// All rounds now use orange color
const ROUND_TYPE_COLORS = {
  MCQ: { bg: 'rgba(255, 107, 53, 0.15)', color: '#ff6b35', border: '#ff6b35' },
  CODING: { bg: 'rgba(255, 107, 53, 0.15)', color: '#ff6b35', border: '#ff6b35' },
  HR: { bg: 'rgba(255, 107, 53, 0.15)', color: '#ff6b35', border: '#ff6b35' },
  TR: { bg: 'rgba(255, 107, 53, 0.15)', color: '#ff6b35', border: '#ff6b35' }
}

const QUIZ_QUESTION_LIMIT = 30
const COMPANY_PAGE_LIMIT = 10

const getVisiblePages = (currentPage: number, totalPages: number, maxVisible = 5) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const getRoundVisuals = (roundType?: string) => {
  // All round types use orange color consistently
  const icon = <FileText size={13} />

  return {
    icon,
    colors: ROUND_TYPE_COLORS.MCQ,
  }
}

const getRandomQuestions = (questions: Question[], limit: number) => {
  const shuffled = [...questions]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled.slice(0, Math.min(limit, shuffled.length))
}

const getSanitizedHtml = (html?: string) => DOMPurify.sanitize(html || '')

const getPlainTextFromHtml = (html?: string) => {
  const sanitized = getSanitizedHtml(html)

  if (!sanitized) {
    return ''
  }

  if (typeof window === 'undefined') {
    return sanitized.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const parsed = new DOMParser().parseFromString(sanitized, 'text/html')
  return (parsed.body.textContent || '').replace(/\s+/g, ' ').trim()
}

// ================= COMPONENTS =================
const CompanyCard: React.FC<{ company: Company; onClick: () => void; isLoading?: boolean }> = ({ company, onClick, isLoading }) => (
  <Card className={`company-card ${isLoading ? 'company-card--loading' : ''}`}>
    <Card.Body>
      <div className="company-header">
        <div className="company-icon">
          <span className="icon">{(company.companyName || '?').charAt(0)}</span>
        </div>
        <div className="company-info">
          <h4 className="company-name">{company.companyName || 'Unknown Company'}</h4>
          <div className="company-meta">
            <span className="meta-badge role">{company.role || 'N/A'}</span>
            <span className="meta-badge package"><DollarSign size={11} /> {company.package || 'N/A'}</span>
            <span className="meta-badge location"><MapPin size={11} /> {company.location || 'N/A'}</span>
          </div>
        </div>
      </div>
      <p className="company-description">
        {(() => {
          const plainDescription = getPlainTextFromHtml(company.description)

          if (!plainDescription) {
            return 'No description available'
          }

          return plainDescription.length > 120
            ? `${plainDescription.substring(0, 120)}...`
            : plainDescription
        })()}
      </p>
      <div className="company-footer">
        <div className="rounds-info">
          <span className="rounds-count"><ClipboardList size={12} /> {company.roundsCount ?? company.rounds?.length ?? 0} Rounds</span>
          <div className="round-types">
            {(company.rounds || []).map((round, idx) => {
              const visuals = getRoundVisuals(round?.roundType)
              return (
              <Badge key={idx} className="round-type-badge" style={{ background: visuals.colors.bg, color: visuals.colors.color }}>
                {visuals.icon} {round?.roundName || 'Round'}
              </Badge>
              )
            })}
          </div>
        </div>
        <Button className="view-details-btn" onClick={onClick} disabled={isLoading}>
          {isLoading ? (
            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" /> Loading...</>
          ) : (
            'View Details →'
          )}
        </Button>
      </div>
    </Card.Body>
  </Card>
)

// ================= MAIN COMPONENT =================
const StudentCompanyInterviewPage = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // State
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
  const [companyFilter, setCompanyFilter] = useState('')
  
  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showRoundModal, setShowRoundModal] = useState(false)
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [activeMode, setActiveMode] = useState<'preview' | 'quiz' | 'coding' | 'interview' | 'result'>('preview')
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({})
  
  // MCQ state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, any>>({})
  const [mcqSubmitted, setMcqSubmitted] = useState(false)
  const [mcqScore, setMcqScore] = useState(0)
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  
  // Coding state
  const [codingCodes, setCodingCodes] = useState<Record<string, string>>({})
  const [codingResults, setCodingResults] = useState<Record<string, any>>({})
  const [isRunning, setIsRunning] = useState(false)
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [roundActive, setRoundActive] = useState(false)

  // Attempt / score state
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recentAttempts, setRecentAttempts] = useState<Record<string, RecentAttempt>>({})

  // Coding — which specific problem the student chose to practice
  const [selectedCodingQuestionId, setSelectedCodingQuestionId] = useState<string | null>(null)

  // Which company card is currently loading details
  const [loadingCompanyId, setLoadingCompanyId] = useState<string | null>(null)

  const companyFilterOptions = useMemo(() => {
    const names = companies
      .map((company) => (company.companyName || '').trim())
      .filter(Boolean)

    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
  }, [companies])

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const selectedCompanyName = companyFilter.trim().toLowerCase()

    return companies.filter((company) => {
      const matchesCompany = !selectedCompanyName || (company.companyName || '').toLowerCase() === selectedCompanyName

      if (!matchesCompany) {
        return false
      }

      if (!query) {
        return true
      }

      const haystack = [
        company.companyName,
        company.role,
        company.location,
        getPlainTextFromHtml(company.description),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [companies, searchQuery, companyFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 350)

    return () => clearTimeout(debounceTimer)
  }, [searchInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, companyFilter])

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!token) return
      try {
        if (hasLoadedOnce) {
          setIsFetching(true)
        } else {
          setLoading(true)
        }
        setError(null)

        const query = new URLSearchParams({
          page: String(currentPage),
          limit: String(COMPANY_PAGE_LIMIT),
        })

        if (searchQuery.trim()) {
          query.append('search', searchQuery.trim())
        }

        if (companyFilter.trim()) {
          query.append('companyName', companyFilter.trim())
        }

        const res = await fetch(`${baseURL}/api/company-interview?${query.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data: CompaniesResponse = await res.json()
        if (!res.ok || !data.success) {
          throw new Error('Failed to fetch companies')
        }

        setCompanies(data.data || [])
        setTotalPages(Math.max(1, data.pagination?.pages || 1))
        setTotalCompanies(data.pagination?.total ?? (data.data || []).length)

        if (data.pagination?.page && data.pagination.page !== currentPage) {
          setCurrentPage(data.pagination.page)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load companies')
      } finally {
        setLoading(false)
        setIsFetching(false)
        setHasLoadedOnce(true)
      }
    }
    
    fetchCompanies()
  }, [token, baseURL, currentPage, searchQuery, companyFilter])

  const fetchRecentAttempts = async (companyId: string) => {
    if (!token) return
    try {
      const res = await fetch(
        `${baseURL}/api/company-interview-attempt/student?companyInterviewId=${companyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const map: Record<string, RecentAttempt> = {}
        data.data.forEach((attempt: any) => {
          map[String(attempt.roundId)] = {
            score: attempt.score,
            roundType: attempt.roundType,
            attemptedAt: attempt.attemptedAt,
          }
        })
        setRecentAttempts(map)
      }
    } catch {
      // non-critical — ignore
    }
  }

  // Fetch company details
  const fetchCompanyDetails = async (companyId: string) => {
    if (loadingCompanyId) return
    setLoadingCompanyId(companyId)
    try {
      const res = await fetch(`${baseURL}/api/company-interview/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data: CompanyDetailResponse = await res.json()
      if (!res.ok || !data.success) {
        throw new Error('Failed to fetch company details')
      }

      setSelectedCompany(data.data)
      setShowCompanyModal(true)
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
    setTimeLeft(null)
    setRoundActive(false)
    setQuizQuestions([])
    setRoundResult(null)
    setIsAnalyzing(false)
    setSelectedCodingQuestionId(null)
    try {
      window.speechSynthesis?.cancel()
    } catch {
      // ignore speech synthesis cleanup failures
    }
  }

  const downloadResultPDF = () => {
    if (!roundResult || !selectedRound || !selectedCompany) return

    const passColor = '#22c55e'
    const failColor = '#ef4444'
    const isPassed = roundResult.score >= 60
    const scoreColor = isPassed ? passColor : failColor
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

    const questionsHTML = roundResult.perQuestionFeedback.map((item, idx) => {
      const isMCQCorrect = roundResult.roundType === 'MCQ' && item.rating === 5
      const isMCQWrong = roundResult.roundType === 'MCQ' && item.rating === 0
      const answerColor = isMCQCorrect ? passColor : isMCQWrong ? failColor : '#d1d5db'
      const stars = '★'.repeat(item.rating) + '☆'.repeat(Math.max(0, 5 - item.rating))

      const expectedLabel = roundResult.roundType === 'MCQ' ? 'Correct Answer' : roundResult.roundType === 'CODING' ? 'Problem Description' : 'Suggested Answer'
      return `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:14px;page-break-inside:avoid;">
          <div style="font-weight:600;color:#111;margin-bottom:8px;">Q${idx + 1}. ${item.questionText}</div>
          <div style="background:#f9fafb;border-radius:6px;padding:10px;margin-bottom:8px;">
            <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Your Answer</div>
            <div style="color:${answerColor};font-size:13px;white-space:pre-wrap;">${item.textAnswer || 'Not answered'}</div>
          </div>
          ${item.expectedAnswer ? `
          <div style="background:#f5f3ff;border:1px solid #d8b4fe;border-radius:6px;padding:10px;margin-bottom:8px;">
            <div style="font-size:11px;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">${expectedLabel}</div>
            <div style="color:#5b21b6;font-size:13px;white-space:pre-wrap;">${item.expectedAnswer}</div>
          </div>` : ''}
          ${roundResult.roundType !== 'MCQ' ? `<div style="color:#f59e0b;font-size:16px;margin-bottom:4px;">${stars} <span style="font-size:11px;color:#6b7280;">${item.rating}/5</span></div>` : ''}
          <div style="font-size:12px;color:#374151;margin-top:4px;"><strong>Feedback:</strong> ${item.feedback}</div>
        </div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${selectedCompany.companyName} - ${selectedRound.roundName} Result</title>
      <style>
        body{font-family:Arial,sans-serif;color:#111;margin:0;padding:32px;max-width:760px;margin:auto;}
        @media print{body{padding:16px;}}
      </style>
    </head><body>
      <div style="border-bottom:3px solid #ff6b35;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="color:#ff6b35;margin:0;font-size:22px;">Interview Practice Report</h1>
        <div style="color:#6b7280;font-size:13px;margin-top:4px;">${date}</div>
      </div>
      <table style="width:100%;margin-bottom:20px;border-collapse:collapse;">
        <tr><td style="padding:4px 0;color:#6b7280;width:120px;">Company</td><td style="font-weight:600;">${selectedCompany.companyName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Role</td><td>${selectedCompany.role || '—'}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Round</td><td>${selectedRound.roundName} (${roundResult.roundType})</td></tr>
      </table>
      <div style="display:flex;align-items:center;gap:24px;background:#f9fafb;border-radius:12px;padding:18px;margin-bottom:24px;">
        <div style="text-align:center;min-width:90px;">
          <div style="font-size:40px;font-weight:800;color:${scoreColor};">${roundResult.score}%</div>
          <div style="font-size:12px;color:#6b7280;">Score</div>
        </div>
        <div>
          <div style="font-weight:700;color:${scoreColor};margin-bottom:4px;">${isPassed ? '✓ Good Performance' : '✗ Needs More Practice'}</div>
          ${roundResult.roundType === 'MCQ' ? `<div style="font-size:13px;color:#374151;">${roundResult.correctAnswers}/${roundResult.totalQuestions} correct</div>` : ''}
          ${roundResult.avgRating > 0 ? `<div style="font-size:13px;color:#374151;">Avg Rating: ${roundResult.avgRating.toFixed(1)}/5</div>` : ''}
          <div style="font-size:13px;color:#374151;margin-top:6px;">${roundResult.aiFeedback}</div>
        </div>
      </div>
      ${roundResult.perQuestionFeedback.length > 0 ? `<h3 style="color:#111;margin-bottom:14px;">Question-wise Breakdown</h3>${questionsHTML}` : ''}
    </body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => win.print()
  }

  const handleReattempt = () => {
    setRoundResult(null)
    setIsAnalyzing(false)
    setSelectedCodingQuestionId(null)
    handleTakeQuiz()
  }

  const handleStartCodingQuestion = (questionId: string) => {
    setSelectedCodingQuestionId(questionId)
    setActiveMode('coding')
  }

  const handleAttemptComplete = async (answers: any) => {
    if (!selectedRound || !selectedCompany) return

    setActiveMode('result')
    setIsAnalyzing(true)
    setRoundResult(null)

    let payload: any = {
      companyInterviewId: selectedCompany._id,
      roundId: selectedRound._id,
      roundType: selectedRound.roundType,
      answers: selectedRound.roundType === 'MCQ' ? answers.answers : answers,
    }

    try {
      const res = await fetch(`${baseURL}/api/company-interview-attempt/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save attempt')

      setRoundResult(data.data)
      // Refresh recent attempts badge
      setRecentAttempts(prev => ({
        ...prev,
        [selectedRound._id]: {
          score: data.data.score,
          roundType: selectedRound.roundType,
          attemptedAt: new Date().toISOString(),
        },
      }))
    } catch {
      // Fallback: show client-side score for MCQ if server fails
      if (selectedRound.roundType === 'MCQ' && answers.score != null) {
        setRoundResult({
          score: answers.score,
          totalQuestions: answers.totalQuestions || 0,
          correctAnswers: answers.correctAnswers || 0,
          avgRating: 0,
          aiFeedback: answers.score >= 70 ? 'Good job! You passed.' : 'Keep practicing and try again.',
          perQuestionFeedback: [],
          roundType: 'MCQ',
        })
      } else {
        setRoundResult({
          score: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          avgRating: 0,
          aiFeedback: 'Could not analyze performance. Please try again.',
          perQuestionFeedback: [],
          roundType: selectedRound.roundType,
        })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStartRound = (round: Round) => {
    setSelectedRound(round)
    setActiveMode('preview')
    setRoundActive(false)
    setTimeLeft(null)
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
    } else if (selectedRound.roundType === 'HR' || selectedRound.roundType === 'TR') {
      setActiveMode('interview')
    } else {
      setActiveMode('preview')
    }
  }

  const toggleAnswer = (questionId: string) => {
    setExpandedAnswers(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  const formatExplanation = (text?: string) => {
    if (!text) return 'Explanation not available.'
    return text
      .replace(/\.\s+/g, '.\n')
      .replace(/\s-\s+/g, '\n- ')
  }

  if (loading) {
    return (
      <div
        className="loading-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.65rem',
          minHeight: '100vh',
          width: '100%',
          background: '#000000',
          textAlign: 'center',
        }}
      >
        <Spinner animation="border" variant="warning" />
        <p>Loading companies...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="error-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.65rem',
          minHeight: '100vh',
          width: '100%',
          background: '#000000',
          textAlign: 'center',
        }}
      >
        <Alert variant="danger">{error}</Alert>
      </div>
    )
  }

  return (
    <div className="company-interview-container">
      <div className="container-fluid px-4 py-4">
        {/* Header */}
        <div className="header-section mb-4">
          <h1 className="page-title">
            <span className="title-icon"><Building2 size={28} /></span>
            Company Interviews
          </h1>
          <p className="page-subtitle">
            Explore top companies, practice interview rounds, and crack your dream job
          </p>
        </div>

        <div className="list-filters mb-4">
          <div className="filter-control-group">
            <label className="filter-label" htmlFor="company-filter">Company</label>
            <select
              id="company-filter"
              className="filter-select"
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
            >
              <option value="">All Companies</option>
              {companyFilterOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="filter-control-group search-group">
            <label className="filter-label" htmlFor="company-search">Search</label>
            <input
              id="company-search"
              className="filter-input"
              type="text"
              placeholder="Search company, role, location..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          {(searchQuery || companyFilter) && (
            <Button className="clear-filter-btn" onClick={() => {
              setSearchInput('')
              setSearchQuery('')
              setCompanyFilter('')
            }}>
              Clear
            </Button>
          )}

          {isFetching && (
            <div className="filter-loading-indicator">
              <Spinner animation="border" size="sm" variant="warning" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Building2 size={48} /></div>
            <p>{companies.length === 0 ? 'No companies available' : 'No matching companies found'}</p>
            <small>{companies.length === 0 ? 'Check back later for new opportunities' : 'Try changing your search or filter'}</small>
          </div>
        ) : (
          <div className="companies-grid">
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company._id}
                company={company}
                onClick={() => fetchCompanyDetails(company._id)}
                isLoading={loadingCompanyId === company._id}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-wrapper">
            <div className="pagination-info">
              Page {currentPage} of {totalPages} • Total {totalCompanies} companies
            </div>
            <div className="pagination-controls">
              <Button
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isFetching}
              >
                Previous
              </Button>

              {getVisiblePages(currentPage, totalPages).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  className={`pagination-btn page-number-btn ${pageNumber === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  disabled={isFetching}
                >
                  {pageNumber}
                </Button>
              ))}

              <Button
                className="pagination-btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Company Details Modal */}
      <Modal show={showCompanyModal} onHide={() => setShowCompanyModal(false)} fullscreen className="company-modal">
        <Modal.Header closeButton className="modal-header-custom">
          <div className="modal-title-wrapper">
            <div className="company-icon-large">
              <span>{selectedCompany?.companyName.charAt(0)}</span>
            </div>
            <div>
              <Modal.Title>{selectedCompany?.companyName}</Modal.Title>
              <div className="company-subtitle">
                <span>{selectedCompany?.role}</span>
                <span>•</span>
                <span><DollarSign size={12} /> {selectedCompany?.package}</span>
                <span>•</span>
                <span><MapPin size={12} /> {selectedCompany?.location}</span>
              </div>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <div className="split-layout">
            {/* Left Side - Company Details */}
            <div className="split-left">
              <div className="content-section">
                <h6 className="section-title">
                  <span className="title-icon"><BookOpen size={15} /></span>
                  About Company
                </h6>
                <div
                  className="section-content rich-text-content"
                  dangerouslySetInnerHTML={{
                    __html: getSanitizedHtml(selectedCompany?.description || '<p>No description available</p>'),
                  }}
                />
              </div>

              <div className="content-section">
                <h6 className="section-title">
                  <span className="title-icon"><LayoutList size={15} /></span>
                  Interview Rounds ({selectedCompany?.roundsCount})
                </h6>
                <div className="rounds-table-wrapper">
                  <table className="rounds-table">
                    <thead>
                      <tr>
                        <th>Round</th>
                        <th>Type</th>
                        <th>Name</th>
                        <th>Duration</th>
                        <th>Questions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompany?.rounds.map((round, idx) => {
                        const visuals = getRoundVisuals(round?.roundType)
                        return (
                          <tr key={round._id}>
                            <td>{`Round ${idx + 1}`}</td>
                            <td>
                              <span className="round-type-pill" style={{ background: visuals.colors.bg, color: visuals.colors.color, border: `1px solid ${visuals.colors.border}` }}>
                                <span className="pill-icon">{visuals.icon}</span>
                                <span className="pill-text">{round.roundType}</span>
                              </span>
                            </td>
                            <td>{round.roundName}</td>
                            <td>{round.duration} mins</td>
                            <td>{round.questionCount}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side - Available Rounds */}
            <div className="split-right">
              <h6 className="section-title">
                <span className="title-icon"><Target size={15} /></span>
                Available Rounds
              </h6>
              <div className="rounds-list">
                {selectedCompany?.rounds.map((round) => {
                  const visuals = getRoundVisuals(round?.roundType)
                  return (
                  <Card key={round._id} className="round-card">
                    <Card.Body>
                      <div className="round-card-header">
                        <div className="round-icon" style={{ background: visuals.colors.bg }}>
                          <span>{visuals.icon}</span>
                        </div>
                        <div className="round-info">
                          <h5 className="round-name">{round.roundName}</h5>
                          <div className="round-stats">
                            <span><Clock size={11} /> {round.duration} mins</span>
                            <span><FileText size={11} /> {round.questionCount} questions</span>
                          </div>
                        </div>
                        {recentAttempts[round._id] && (
                          <div className={`recent-score-badge ${recentAttempts[round._id].score >= 60 ? 'pass' : 'fail'}`}>
                            <Trophy size={10} />
                            {recentAttempts[round._id].score}%
                          </div>
                        )}
                      </div>
                      <Button
                        className="start-round-btn"
                        style={{ background: visuals.colors.color }}
                        onClick={() => handleStartRound(round)}
                      >
                        {recentAttempts[round._id] ? 'Reattempt →' : 'View Round →'}
                      </Button>
                    </Card.Body>
                  </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Round Modal */}
      <Modal show={showRoundModal} onHide={handleCloseRoundModal} fullscreen className="round-modal" backdrop="static" keyboard={false}>
        {activeMode === 'preview' && (
          <>
            <Modal.Header className="round-modal-header" closeButton>
              <div className="round-modal-title">
                <span className="round-icon">{selectedRound && getRoundVisuals(selectedRound.roundType).icon}</span>
                <div>
                  <h4>{selectedRound?.roundName} Round</h4>
                  <p>{selectedCompany?.companyName} • {selectedCompany?.role}</p>
                </div>
              </div>
              <div className="round-modal-actions">
                {selectedRound?.roundType !== 'CODING' && (
                  <Button className="header-quiz-btn" onClick={handleTakeQuiz}>
                    {selectedRound?.roundType === 'HR' || selectedRound?.roundType === 'TR'
                      ? 'Start Practice'
                      : 'Take Quiz'}
                  </Button>
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
                        <Badge className="question-type">MCQ</Badge>
                      </div>
                      <h5 className="question-text">{q.question}</h5>
                      <div className="options-list">
                        {(q.options || []).map((option, optIdx) => (
                          <div key={optIdx} className="option-item static">
                            <span className="option-label">{String.fromCharCode(65 + optIdx)}.</span>
                            <span className="option-text">{String(option)}</span>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline-secondary" className="show-answer-btn" onClick={() => toggleAnswer(q._id)}>
                        {expandedAnswers[q._id] ? 'Hide Answer & Explanation' : 'Show Answer & Explanation'}
                      </Button>
                      {expandedAnswers[q._id] && (
                        <div className="answer-panel">
                          <p><strong>Answer:</strong> {q.correctAnswer ?? 'Not provided'}</p>
                          <p><strong>Explanation:</strong></p>
                          <div className="answer-text multi-line-text">
                            {formatExplanation(q.explanation)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedRound?.roundType === 'CODING' && selectedRound.questions.map((q, idx) => (
                    <div key={q._id} className="coding-question">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <Badge className="question-type coding">CODING</Badge>
                      </div>
                      <h5 className="question-title">{q.title}</h5>
                      <p className="question-description">{q.description}</p>
                      <div className="sample-io">
                        <div className="sample-input">
                          <span className="label">Sample Input:</span>
                          <code>{q.input || 'N/A'}</code>
                        </div>
                        <div className="sample-output">
                          <span className="label">Expected Output:</span>
                          <code>{q.output ?? 'N/A'}</code>
                        </div>
                      </div>
                      <div className="coding-question-footer">
                        {recentAttempts[selectedRound._id] && (
                          <span className={`recent-score-badge ${recentAttempts[selectedRound._id].score >= 60 ? 'pass' : 'fail'}`}>
                            <Trophy size={10} /> Last: {recentAttempts[selectedRound._id].score}%
                          </span>
                        )}
                        <Button
                          className="coding-start-btn"
                          onClick={() => handleStartCodingQuestion(q._id)}
                        >
                          <Code2 size={14} /> Start Challenge
                        </Button>
                      </div>
                    </div>
                  ))}

                  {selectedRound?.roundType === 'HR' && selectedRound.questions.map((q, idx) => (
                    <div key={q._id} className="mcq-question">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <Badge className="question-type hr">HR</Badge>
                      </div>
                      <h5 className="question-text">{q.question}</h5>
                      <Button variant="outline-secondary" className="show-answer-btn" onClick={() => toggleAnswer(q._id)}>
                        {expandedAnswers[q._id] ? 'Hide Suggested Answer' : 'Show Suggested Answer'}
                      </Button>
                      {expandedAnswers[q._id] && (
                        <div className="answer-panel">
                          <p><strong>Suggested Answer:</strong> {q.expectedAnswer || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedRound?.roundType === 'TR' && selectedRound.questions.map((q, idx) => (
                    <div key={q._id} className="mcq-question">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <Badge className="question-type tr">TR</Badge>
                      </div>
                      <h5 className="question-text">{q.question || q.title || 'Technical Interview Question'}</h5>
                      {(q.description || q.input || q.output) && (
                        <div className="answer-panel" style={{ marginTop: '0.5rem' }}>
                          {q.description && <p><strong>Context:</strong> {q.description}</p>}
                          {q.input && <p><strong>Input:</strong> {q.input}</p>}
                          {q.output != null && <p><strong>Expected:</strong> {String(q.output)}</p>}
                        </div>
                      )}
                      <Button variant="outline-secondary" className="show-answer-btn" onClick={() => toggleAnswer(q._id)}>
                        {expandedAnswers[q._id] ? 'Hide Suggested Direction' : 'Show Suggested Direction'}
                      </Button>
                      {expandedAnswers[q._id] && (
                        <div className="answer-panel">
                          <p><strong>Suggested Direction:</strong> {q.expectedAnswer || q.explanation || 'Not provided'}</p>
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
            <MCQQuiz
              round={selectedRound}
              companyName={selectedCompany?.companyName || ''}
              role={selectedCompany?.role || ''}
              quizQuestions={quizQuestions}
              onClose={handleCloseRoundModal}
              onAttemptComplete={handleAttemptComplete}
            />
          </Modal.Body>
        )}

        {activeMode === 'coding' && selectedRound && (
          <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <CodingChallenge
              round={selectedRound}
              companyName={selectedCompany?.companyName || ''}
              role={selectedCompany?.role || ''}
              onClose={handleCloseRoundModal}
              onAttemptComplete={handleAttemptComplete}
              selectedQuestionId={selectedCodingQuestionId ?? undefined}
            />
          </Modal.Body>
        )}

        {activeMode === 'interview' && selectedRound && (
          <Modal.Body style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {selectedRound.roundType === 'HR' ? (
              <HRInterviewPractice
                round={selectedRound}
                companyName={selectedCompany?.companyName || ''}
                role={selectedCompany?.role || ''}
                onClose={handleCloseRoundModal}
                onAttemptComplete={handleAttemptComplete}
              />
            ) : (
              <TRInterviewPractice
                round={selectedRound}
                companyName={selectedCompany?.companyName || ''}
                role={selectedCompany?.role || ''}
                onClose={handleCloseRoundModal}
                onAttemptComplete={handleAttemptComplete}
              />
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
                      {roundResult.roundType === 'MCQ'
                        ? `${roundResult.correctAnswers}/${roundResult.totalQuestions} correct`
                        : roundResult.avgRating > 0
                          ? `Avg Rating ${roundResult.avgRating.toFixed(1)}/5`
                          : 'Score'}
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
                                <span className="result-q-answer-label">
                                  {roundResult.roundType === 'MCQ' ? 'Correct Answer' : roundResult.roundType === 'CODING' ? 'Problem Description' : 'Suggested Answer'}
                                </span>
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
                    <Button variant="secondary" className="result-reattempt-btn" onClick={handleReattempt}>
                      Reattempt
                    </Button>
                    <Button variant="secondary" className="result-reattempt-btn" onClick={downloadResultPDF}>
                      Download PDF
                    </Button>
                    <Button className="header-quiz-btn" onClick={handleCloseRoundModal}>
                      Done
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </Modal.Body>
        )}
      </Modal>

      <style>{`
      /* remove margin */
        .main-content-wrapper {
          margin-top: 0 !important;
        }

        /* 🔥 TARGET INLINE STYLE PARENT */
        div[style*="padding: 24px"] {
          padding: 0 !important;
        }
        .company-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .company-card .card-body {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .assessment-modal .modal-content {
          background: #000;
          border-radius: 0;
          height: 100vh;
        }
        .company-interview-container {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }

        /* Header */
        .header-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .page-subtitle {
          color: #888888;
          font-size: 0.9rem;
        }

        /* Loading & Empty States */
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 0.65rem;
          min-height: 100vh;
          width: 100%;
          background: #000000;
          text-align: center;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        /* Companies Grid */
        .companies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
        }

        .list-filters {
          display: flex;
          align-items: flex-end;
          gap: 0.85rem;
          flex-wrap: wrap;
          padding: 0.85rem;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          background: #0b0b0b;
        }

        .filter-control-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 180px;
        }

        .filter-control-group.search-group {
          flex: 1;
          min-width: 240px;
        }

        .filter-label {
          font-size: 0.7rem;
          color: #a0a0a0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 700;
        }

        .filter-select,
        .filter-input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid #333333;
          background: #101010;
          color: #efefef;
          padding: 0.46rem 0.7rem;
          font-size: 0.82rem;
        }

        .filter-select:focus,
        .filter-input:focus {
          outline: none;
          border-color: #ff6b35;
          box-shadow: 0 0 0 1px rgba(255, 107, 53, 0.28);
        }

        .clear-filter-btn {
          border: 1px solid #444;
          background: #141414;
          color: #d8d8d8;
          border-radius: 8px;
          font-size: 0.8rem;
          padding: 0.42rem 0.8rem;
        }

        .clear-filter-btn:hover {
          border-color: #ff6b35;
          color: #ff6b35;
          background: #1a1a1a;
        }

        .filter-loading-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #ffbe9f;
          font-size: 0.75rem;
          margin-left: auto;
          padding: 0.35rem 0.5rem;
        }

        .pagination-wrapper {
          margin-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .pagination-info {
          color: #9a9a9a;
          font-size: 0.82rem;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-wrap: wrap;
        }

        .pagination-btn {
          background: #111111;
          border: 1px solid #2d2d2d;
          color: #e2e2e2;
          border-radius: 8px;
          padding: 0.38rem 0.75rem;
          font-size: 0.78rem;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #ff6b35;
          color: #ff6b35;
          background: #151515;
        }

        .pagination-btn.page-number-btn.active {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #ffffff;
        }

        .pagination-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .company-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .company-card:hover {
          transform: translateY(-4px);
          border-color: #ff6b35;
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
        }

        .company-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .company-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-icon .icon {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
        }

        .company-info {
          flex: 1;
        }

        .company-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .company-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .meta-badge {
          font-size: 0.7rem;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          line-height: 1;
          white-space: nowrap;
        }

        .meta-badge svg {
          width: 11px;
          height: 11px;
          flex-shrink: 0;
        }

        .meta-badge.role {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .meta-badge.package {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .meta-badge.location {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .company-description {
          color: #b0b0b0;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .company-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #222222;
          margin-top: auto; 
        }

        .rounds-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .rounds-count {
          font-size: 0.75rem;
          color: #888888;
        }

        .round-types {
          display: flex;
          gap: 0.5rem;
        }

        .round-type-badge {
          background: #ff6b35 !important;
          color: #ffffff !important;
          font-size: 0.7rem;
          padding: 0.25rem 0.6rem;
          border: none !important;
        }

        .view-details-btn {
          background: transparent;
          border: 1px solid #ff6b35;
          color: #ff6b35;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .view-details-btn:hover {
          background: #ff6b35;
          color: #ffffff;
        }

        /* Modal Styles */
        .company-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 20px;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-bottom: 2px solid #ff6b35;
          padding: 1rem 1.25rem;
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .company-icon-large {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .company-icon-large span {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }

        .company-subtitle {
          display: flex;
          gap: 0.5rem;
          color: #888888;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .modal-body-custom {
          padding: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Split Layout in Modal */
        .split-layout {
          display: flex;
          min-height: 500px;
          align-items: flex-start;
        }

      .split-layout {
          display: flex;
          gap: 16px;
          height: calc(100vh - 120px); /* 🔥 important */
        }

        /* LEFT SIDE */
        .split-left {
          width: 60%;
          overflow-y: auto;
          padding: 1.5rem;
          border-right: 1px solid #333333;
        }

        /* RIGHT SIDE */
        .split-right {
          width: 40%;
          min-width: 380px; /* 🔥 CRITICAL FIX */
          overflow-y: auto;
          padding: 1.5rem;
          background: #050505;

          position: sticky;
          top: 0;
        }
        .content-section {
          margin-bottom: 1.5rem;
        }

        .round-card {
          display: flex;
          flex-direction: column;
        }

        .round-card .card-body {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .start-round-btn {
          margin-top: auto; /* 🔥 keeps button always visible */
        }

        .split-right {
          flex-shrink: 0;  /* 🔥 THIS FIXES YOUR ISSUE */
        }
        
        .split-left {
          width: 60%;
          overflow-y: auto;
          overflow-x: hidden;   /* 🔥 FIX horizontal scroll */
          padding: 1.5rem;
          border-right: 1px solid #333333;

          word-wrap: break-word;     /* 🔥 force text wrap */
          overflow-wrap: break-word; /* 🔥 modern support */
        }

        .section-title {
          color: #ff6b35;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-content {
          color: #d0d0d0;
          font-size: 0.85rem;
          line-height: 1.6;
        }

        .rich-text-content p,
        .rich-text-content ul,
        .rich-text-content ol,
        .rich-text-content h1,
        .rich-text-content h2,
        .rich-text-content h3,
        .rich-text-content h4,
        .rich-text-content h5,
        .rich-text-content h6 {
          margin: 0 0 0.75rem;
        }

        .rich-text-content ul,
        .rich-text-content ol {
          padding-left: 1.25rem;
        }

        .rich-text-content li {
          margin-bottom: 0.35rem;
        }

        .rich-text-content a {
          color: #ff9a5c;
          text-decoration: underline;
        }

        .rich-text-content strong {
          color: #ffffff;
        }

        /* Rounds Table */
        .rounds-table-wrapper {
          border: 1px solid #222222;
          border-radius: 14px;
           width: 100%;
          overflow-x: auto;
          background: #090909;
        }

        .rounds-table {
          width: 100%;
          table-layout: fixed; 
          border-collapse: collapse;
        }

        .rounds-table th {
          background: #111111;
          color: #ff6b35;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-align: left;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #222222;
        }

        .rounds-table td {
          color: #d6d6d6;
          font-size: 0.84rem;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #1d1d1d;
          vertical-align: middle;
        }

        .rounds-table tbody tr:last-child td {
          border-bottom: none;
        }

        .rounds-table tbody tr:hover {
          background: rgba(255, 107, 53, 0.04);
        }

        .round-type-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .pill-icon {
          font-size: 0.85rem;
          line-height: 1;
        }

        .pill-text {
          line-height: 1;
        }

        /* Rounds List */
        .rounds-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .round-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .round-card:hover {
          border-color: #ff6b35;
        }

        .round-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .round-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .round-info {
          flex: 1;
        }

        .round-name {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .round-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.7rem;
          color: #888888;
        }

        .start-round-btn {
          width: 100%;
          border: none;
          padding: 0.6rem;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .start-round-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        /* Recent score badge on round card */
        .recent-score-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          white-space: nowrap;
        }

        .recent-score-badge.pass {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .recent-score-badge.fail {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        /* Result screen */
        .round-result-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          gap: 1.2rem;
          max-width: 680px;
          margin: 0 auto;
          width: 100%;
        }

        .result-analyzing {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          min-height: 60vh;
          text-align: center;
        }

        .result-analyzing-text {
          color: #f3f3f3;
          font-size: 1rem;
          margin: 0;
        }

        .result-analyzing-sub {
          color: #888;
          font-size: 0.82rem;
        }

        .result-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }

        .result-header h4 {
          color: #ff6b35;
          margin: 0;
          font-size: 1.15rem;
        }

        .result-header p {
          color: #888;
          font-size: 0.83rem;
          margin: 0;
        }

        .result-score-ring {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 5px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.15rem;
        }

        .result-score-ring.pass { border-color: #22c55e; }
        .result-score-ring.fail { border-color: #ef4444; }

        .result-score-num {
          font-size: 2.2rem;
          font-weight: 800;
          color: #f3f3f3;
          line-height: 1;
        }

        .result-score-label {
          font-size: 0.72rem;
          color: #9ca3af;
          text-align: center;
          padding: 0 0.5rem;
        }

        .result-status-badge {
          font-size: 0.88rem;
          font-weight: 700;
          padding: 0.4rem 1.2rem;
          border-radius: 20px;
        }

        .result-status-badge.pass {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .result-status-badge.fail {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }

        .result-feedback-card {
          background: #0d0d0d;
          border: 1px solid #232323;
          border-radius: 14px;
          padding: 1rem 1.2rem;
          width: 100%;
        }

        .result-feedback-card h6 {
          color: #ff6b35;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.5rem;
        }

        .result-feedback-card p {
          color: #d1d5db;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.55;
        }

        .result-breakdown {
          background: #0d0d0d;
          border: 1px solid #232323;
          border-radius: 14px;
          padding: 1rem 1.2rem;
          width: 100%;
        }

        .result-breakdown h6 {
          color: #ff6b35;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.8rem;
        }

        .result-q-item {
          border-top: 1px solid #1e1e1e;
          padding: 0.7rem 0;
        }

        .result-q-item:first-of-type { border-top: none; padding-top: 0; }

        .result-q-title {
          font-size: 0.85rem;
          color: #e5e7eb;
          margin-bottom: 0.3rem;
          font-weight: 500;
        }

        .result-q-stars {
          color: #f59e0b;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.25rem;
        }

        .result-q-rating-num {
          font-size: 0.72rem;
          color: #9ca3af;
        }

        .result-q-answer {
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 0.55rem 0.8rem;
          margin: 0.35rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .result-q-answer.correct { border-color: rgba(34,197,94,0.4); background: rgba(34,197,94,0.06); }
        .result-q-answer.wrong   { border-color: rgba(239,68,68,0.4);  background: rgba(239,68,68,0.06); }

        .result-q-answer-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: #6b7280;
          font-weight: 600;
        }

        .result-q-answer-text {
          font-size: 0.85rem;
          color: #e5e7eb;
          white-space: pre-wrap;
          line-height: 1.45;
        }

        .result-q-expected {
          background: #111;
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 8px;
          padding: 0.55rem 0.8rem;
          margin: 0.35rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .result-q-expected-text {
          font-size: 0.85rem;
          color: #c084fc;
          white-space: pre-wrap;
          line-height: 1.45;
        }

        .result-q-feedback {
          font-size: 0.8rem;
          color: #9ca3af;
          line-height: 1.45;
        }

        .result-actions {
          display: flex;
          gap: 0.8rem;
          width: 100%;
          justify-content: center;
          padding-top: 0.5rem;
        }

        .result-reattempt-btn {
          border: 1px solid #444;
          background: #141414;
          color: #d8d8d8;
          border-radius: 8px;
          font-size: 0.88rem;
          padding: 0.5rem 1.4rem;
        }

        .result-reattempt-btn:hover {
          border-color: #ff6b35;
          color: #ff6b35;
          background: #1a1a1a;
        }

        /* Round Modal */
        .round-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 20px;
          height: 100vh;
        }

        .round-modal-header {
          position: relative;
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-bottom: 2px solid #ff6b35;
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 0 0 auto;
          padding-right: 4.5rem;
        }

        .round-modal-header .btn-close {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          margin: 0;
          width: 2rem;
          height: 2rem;
          opacity: 0.85;
          filter: invert(1);
        }

        .round-modal-header .btn-close:hover {
          opacity: 1;
        }

        .round-modal-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .round-modal-title .round-icon {
          font-size: 2rem;
        }

        .round-modal-title h4 {
          margin: 0;
          color: #ff6b35;
          font-size: 1.1rem;
        }

        .round-modal-title p {
          margin: 0;
          font-size: 0.75rem;
          color: #888888;
        }

        .round-modal-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
          flex: 0 0 auto;
        }

        .header-quiz-btn {
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border: none;
          padding: 0.45rem 0.95rem;
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          color: #ffffff;
        }

        .header-quiz-btn:hover {
          opacity: 0.9;
        }

        .round-modal-body {
          padding: 1.5rem;
          flex: 1 1 auto;
          min-height: 0;
          max-height: none;
          overflow-y: auto;
        }

        /* MCQ Styles */
        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .mcq-question, .coding-question {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 16px;
          padding: 1.25rem;
        }

        .coding-question-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
          padding-top: 0.9rem;
          border-top: 1px solid #1e1e1e;
        }

        .coding-start-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #ff6b35;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.45rem 1.1rem;
          transition: filter 0.18s;
        }

        .coding-start-btn:hover {
          filter: brightness(1.12);
          background: #ff6b35;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .question-number {
          font-size: 0.8rem;
          color: #ff6b35;
          font-weight: 600;
        }

        .question-type {
          background: rgba(255, 107, 53, 0.15) !important;
          color: #ff6b35 !important;
          padding: 0.25rem 0.75rem !important;
        }

        .question-type.coding {
          background: rgba(255, 107, 53, 0.15) !important;
          color: #ff6b35 !important;
        }

        .question-type.hr {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .question-type.tr {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .question-text {
          font-size: 1rem;
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .question-title {
          font-size: 1rem;
          color: #ff6b35;
          margin-bottom: 0.5rem;
        }

        .question-description {
          font-size: 0.85rem;
          color: #b0b0b0;
          margin-bottom: 1rem;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 1rem;
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .option-item:hover {
          border-color: #ff6b35;
        }

        .option-item.selected {
          border-color: #ff6b35;
          background: rgba(255, 107, 53, 0.05);
        }

        .option-item.static {
          cursor: default;
        }

        .option-item.static:hover {
          border-color: #333333;
        }

        .option-label {
          min-width: 20px;
          color: #ff6b35;
          font-weight: 700;
        }

        .option-text {
          color: #e0e0e0;
          font-size: 0.9rem;
        }

        /* Sample IO */
        .sample-io {
          display: flex;
          gap: 1rem;
          margin: 1rem 0;
          padding: 0.75rem;
          background: #0a0a0a;
          border-radius: 10px;
        }

        .sample-input, .sample-output {
          flex: 1;
        }

        .sample-io .label {
          display: block;
          font-size: 0.7rem;
          color: #888888;
          margin-bottom: 0.25rem;
        }

        .sample-io code {
          display: block;
          background: #050505;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #fbbf24;
        }

        .show-answer-btn {
          margin-top: 0.75rem;
          width: 100%;
          text-align: left;
          background: transparent !important;
          border: 1px solid #2e2e2e !important;
          color: #e0e0e0 !important;
          padding: 0.65rem 0.8rem;
          border-radius: 8px;
        }

        .show-answer-btn:hover {
          border-color: #ff6b35;
          color: #ffffff;
        }

        .answer-panel {
          margin-top: 0.75rem;
          padding: 0.85rem;
          border: 1px solid #2e2e2e;
          border-radius: 10px;
          background: #090909;
        }

        .answer-panel p {
          margin: 0.25rem 0;
          color: #cccccc;
          font-size: 0.85rem;
        }

        .answer-text {
          white-space: pre-line;
          color: #cccccc;
          font-size: 0.85rem;
          margin-top: 0.35rem;
          line-height: 1.6;
        }

        /* Scrollbar */
        .round-modal-body::-webkit-scrollbar {
          width: 6px;
        }

        .round-modal-body::-webkit-scrollbar-track {
          background: #1a1a25;
        }

        .round-modal-body::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 3px;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .split-layout {
            flex-direction: column;
          }
          
          .split-left {
            border-right: none;
            border-bottom: 1px solid #333333;
          }

          .split-right {
            position: static;
            max-height: none;
          }
          
          .companies-grid {
            grid-template-columns: 1fr;
          }

          .filter-control-group,
          .filter-control-group.search-group {
            min-width: 100%;
            flex: 1 1 100%;
          }

          .filter-loading-indicator {
            margin-left: 0;
          }
        }

        @media (max-width: 768px) {
          .round-modal-header {
            flex-direction: column;
            gap: 1rem;
          }

          .round-modal-actions {
            margin-right: 0;
            width: 100%;
            justify-content: space-between;
          }
          
          .sample-io {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default StudentCompanyInterviewPage
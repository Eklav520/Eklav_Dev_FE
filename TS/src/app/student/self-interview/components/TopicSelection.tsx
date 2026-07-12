import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useState, useRef } from 'react'
import { Form, Button } from 'react-bootstrap'
import { FaRocket } from 'react-icons/fa'

interface TopicSelectionProps {
  onStart: (
    interviewId: string,
    questions: string[],
    totalQuestions: number,
    role: string
  ) => void
  limits: any
}

interface TopicLimit {
  remaining: number
  earliestAttempt: string | null
}

interface Limits {
  [topic: string]: TopicLimit
}

const MAX_ATTEMPTS = 5
const TRIAL_MAX_ATTEMPTS = 2
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const formatTime = (ms: number) => {
  if (ms <= 0) return '0d 0h 0m'
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${days}d ${hours}h ${minutes}m`
}

const TopicSelection: React.FC<TopicSelectionProps> = ({ onStart, limits }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const status = user?.status?.toLowerCase()

  const [topics, setTopics] = useState<string[]>([])
  const [topic, setTopic] = useState<string>('')
  //const [limits, setLimits] = useState<Limits>({})
  const [countdowns, setCountdowns] = useState<Record<string, number>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const maxAllowed =
    status === 'pending' ? TRIAL_MAX_ATTEMPTS : MAX_ATTEMPTS
  const selectStyle: React.CSSProperties = {
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    boxShadow: 'none',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    minHeight: '46px',
    padding: '0.6rem 1rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.85rem',
    borderRadius: '999px',
    background: 'linear-gradient(135deg, #fff1d6 0%, #ffd6a2 100%)',
    color: '#8a5200',
    fontWeight: 600,
    fontSize: '0.92rem',
  };
  // Convert backend remaining (always based on 5) into correct remaining
  const getRemaining = (backendRemaining: number) => {
    if (status !== 'pending') return backendRemaining

    const usedFromBackend = MAX_ATTEMPTS - backendRemaining
    const trialRemaining = Math.max(TRIAL_MAX_ATTEMPTS - usedFromBackend, 0)
    return trialRemaining
  }

  useEffect(() => {
    if (!token) return

    const fetchTopicsAndLimits = async () => {
      try {
        const topicsResponse = await fetch(`${baseURL}/topics`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const topicsData = await topicsResponse.json()
        const loadedTopics = Array.isArray(topicsData?.topics) ? topicsData.topics : []
        setTopics(loadedTopics)
        if (loadedTopics.length > 0) setTopic(loadedTopics[0])

        /*    const limitsResponse = await fetch(`${baseURL}/interview/limits`, {
             headers: { Authorization: `Bearer ${token}` },
           })
           const limitsData = await limitsResponse.json()
           setLimits(limitsData.limits || {}) */
      } catch (error) {
        console.error('Failed to fetch topics or limits', error)
      }
    }

    fetchTopicsAndLimits()
  }, [token])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    const updateCountdowns = () => {
      const now = Date.now()
      const newCountdowns: Record<string, number> = {}

      Object.entries(limits as Limits).forEach(([topic, value]) => {
        const remaining = value.remaining
        const earliestAttempt = value.earliestAttempt
        if (remaining === 0 && earliestAttempt) {
          const resetTime =
            new Date(earliestAttempt).getTime() + THIRTY_DAYS_MS
          newCountdowns[topic] = Math.max(resetTime - now, 0)
        } else {
          newCountdowns[topic] = 0
        }
      })

      setCountdowns(newCountdowns)
    }

    updateCountdowns()
    intervalRef.current = setInterval(updateCountdowns, 60 * 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [limits])

  const startInterview = async () => {
    if (!topic) return alert('Please select a topic')

    const backendRemaining = limits[topic]?.remaining ?? MAX_ATTEMPTS
    const remaining = getRemaining(backendRemaining)

    if (remaining <= 0) {
      return alert(
        status === 'pending'
          ? 'You have used your 2 free trial attempts. Please upgrade to continue.'
          : `You have reached the max attempts for ${topic}. Please wait until cooldown expires.`
      )
    }

    const response = await fetch(`${baseURL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic }),
    })

    const data = await response.json()
    if (!response.ok) return alert(data.message || 'Failed to start interview')

    onStart(data.interviewId, data.questions, data.totalQuestions, topic)
  }

  return (
    <Form style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="mt-2" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2">
            Choose Topic
          </Form.Label>

          <Form.Select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
              style={selectStyle}
            >
              {topics.length === 0 ? (
                <option>Loading topics...</option>
              ) : (
                topics.map((t) => {
                  const backendRemaining =
                    limits[t]?.remaining ?? MAX_ATTEMPTS

                  const remaining = getRemaining(backendRemaining)
                  const used = maxAllowed - remaining

                  const countdownMs = countdowns[t] || 0
                  const isDisabled =
                    remaining <= 0 && countdownMs > 0

                  return (
                    <option
                      key={t}
                      value={t}
                      disabled={isDisabled}
                      style={{
                        backgroundColor: isDisabled ? '#f1f5f9' : '#fff',
                        color: isDisabled ? '#94a3b8' : '#0f172a',
                      }}
                    >
                      {t} — Used {used}/{maxAllowed}
                      {isDisabled
                        ? ` (Retry in ${formatTime(countdownMs)})`
                        : ''}
                    </option>
                  )
                })
              )}
            </Form.Select>
            {topic && (
              <div style={{ marginTop: '0.9rem' }}>
                <span style={badgeStyle}>Selected topic: {topic}</span>
              </div>
            )}
            <Form.Text style={{ display: 'block', marginTop: '0.9rem', fontSize: '0.85rem', color: '#475569' }}>
              {status === 'pending'
                ? 'Trial users can attempt only 2 interviews per topic.'
                : 'Max 5 attempts per topic in 30 days. Attempts reset 30 days after your first attempt.'}
            </Form.Text>
          </Form.Group>

          <div className="d-grid" style={{ marginTop: 'auto', paddingTop: 12 }}>
          <Button
            size="lg"
            onClick={startInterview}
            disabled={
              !topic ||
              getRemaining(limits[topic]?.remaining ?? MAX_ATTEMPTS) <= 0
            }
            style={{
              backgroundColor: '#ff7a00',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              opacity:
                getRemaining(limits[topic]?.remaining ?? MAX_ATTEMPTS) <= 0
                  ? 0.6
                  : 1,
            }}
          >
            <FaRocket size={14} style={{ marginRight: 8 }} /> Start Interview
          </Button>
        </div>

      </div>
    </Form>
  )
}

export default TopicSelection
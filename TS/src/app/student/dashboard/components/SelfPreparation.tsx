import { Badge, Card, Form, ProgressBar } from 'react-bootstrap'
import { FaRobot } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

/* ---------------------------------------
   Types
--------------------------------------- */
type LinePoint = {
  label: string
  count: number
}

type LanguageStats = Record<string, number>

type TopicAverage = {
  topic: string
  avgScore: number
}

/* ---------------------------------------
   Component
--------------------------------------- */
const SelfPreparation = () => {
  const [aiMode, setAiMode] = useState<'Today' | 'Weekly'>('Weekly')

  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [submissionTrend, setSubmissionTrend] = useState<LinePoint[]>([])
  const [languageStats, setLanguageStats] = useState<LanguageStats>({})
  const [topicAverages, setTopicAverages] = useState<TopicAverage[]>([])

  /* ---------------------------------------
     PROGRAM SUBMISSIONS
  --------------------------------------- */
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const res = await fetch(`${baseURL}/api/ai/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        const result = await res.json()
        const submissions = result.data ?? []

        /* ---- Language counts ---- */
        const langMap: LanguageStats = {}

        submissions.forEach((s: any) => {
          const lang = s.language?.toLowerCase() || 'unknown'
          langMap[lang] = (langMap[lang] || 0) + 1
        })

        setLanguageStats(langMap)

        /* ---- Submission trend ---- */
        const now = new Date()

        if (aiMode === 'Today') {
          const hours: LinePoint[] = Array.from({ length: 24 }, (_, h) => ({
            label: `${h}:00`,
            count: 0,
          }))

          submissions.forEach((s: any) => {
            const d = new Date(s.createdAt)
            if (d.toDateString() === now.toDateString()) {
              hours[d.getHours()].count++
            }
          })

          setSubmissionTrend(hours.filter((h) => h.count > 0))
        } else {
          const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date()
            d.setDate(now.getDate() - (6 - i))
            return {
              date: d,
              label: d.toLocaleDateString('en-US', { weekday: 'short' }),
              count: 0,
            }
          })

          submissions.forEach((s: any) => {
            const sd = new Date(s.createdAt)
            days.forEach((d) => {
              if (sd.toDateString() === d.date.toDateString()) {
                d.count++
              }
            })
          })

          setSubmissionTrend(days.map(({ label, count }) => ({ label, count })))
        }
      } catch (err) {
        console.error('Failed to load submissions', err)
      }
    }

    if (token) loadSubmissions()
  }, [token, aiMode])

  /* ---------------------------------------
     AI INTERVIEW AVERAGES (✅ CORRECT API)
  --------------------------------------- */
  useEffect(() => {
    const loadInterviewAverages = async () => {
      try {
        const res = await fetch(`${baseURL}/interview-results`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const result = await res.json()
        setTopicAverages(result.data ?? [])
      } catch (err) {
        console.error('Failed to load interview averages', err)
      }
    }

    if (token) loadInterviewAverages()
  }, [token])

  /* ---------------------------------------
     LINE GRAPH
  --------------------------------------- */
  const renderLineGraph = (data: LinePoint[]) => {
    if (!data.length) {
      return <div className="text-muted small text-center">No submissions</div>
    }

    const max = Math.max(...data.map((d) => d.count), 1)

    return (
      <svg width="100%" height="120" viewBox="0 0 100 100">
        <polyline
          fill="none"
          stroke="#4e54c8"
          strokeWidth="2"
          points={data
            .map((d, i) => {
              const x = (i / (data.length - 1 || 1)) * 100
              const y = 100 - (d.count / max) * 80
              return `${x},${y}`
            })
            .join(' ')}
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100
          const y = 100 - (d.count / max) * 80
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#4e54c8" />
        })}
      </svg>
    )
  }

  const totalSubmissions = Object.values(languageStats).reduce(
    (a, b) => a + b,
    0
  )

  /* ---------------------------------------
     UI
  --------------------------------------- */
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header
        className="text-white"
        style={{ background: 'linear-gradient(135deg,#f46b45,#eea849)' }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">
            <FaRobot className="me-2" />
            Self Preparation
          </h5>
          <Form.Select
            size="sm"
            value={aiMode}
            style={{ width: 110 }}
            onChange={(e) =>
              setAiMode(e.target.value as 'Today' | 'Weekly')
            }
          >
            <option value="Today">Today</option>
            <option value="Weekly">Weekly</option>
          </Form.Select>
        </div>
      </Card.Header>

      <Card.Body>
        {/* AI Interview */}
        <h6 className="fw-bold mb-3">🤖 AI Interview Performance</h6>
        {topicAverages.length === 0 ? (
          <div className="text-muted small">No interviews yet</div>
        ) : (
          topicAverages.map((t) => (
            <div key={t.topic} className="mb-2">
              <div className="d-flex justify-content-between">
                <span>{t.topic}</span>
                <span>{t.avgScore}%</span>
              </div>
              <ProgressBar now={t.avgScore} style={{ height: 8 }} />
            </div>
          ))
        )}

        {/* Program Submissions */}
        <hr />
        <h6 className="fw-bold mb-3">💻 Program Submissions</h6>
        <div className="d-flex justify-content-around text-center">
          {['javascript', 'java', 'python', 'c', 'c++'].map((l) => (
            <div key={l}>
              <div className="fw-bold fs-4">{languageStats[l] ?? 0}</div>
              <small className="text-muted text-uppercase">{l}</small>
            </div>
          ))}
        </div>

        <div className="text-center small text-muted mt-2">
          Total Submitted: <strong>{totalSubmissions}</strong>
        </div>

        {/* Trend */}
        <hr />
        <h6 className="fw-bold mb-2">📈 Submissions ({aiMode})</h6>
        {renderLineGraph(submissionTrend)}
      </Card.Body>
    </Card>
  )
}

export default SelfPreparation

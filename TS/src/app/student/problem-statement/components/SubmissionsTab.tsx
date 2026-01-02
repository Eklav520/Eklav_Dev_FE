import { useEffect, useState } from 'react'
import { Badge, Card, Spinner, ProgressBar } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FiStar } from 'react-icons/fi'

type Submission = {
  _id: string
  problemTitle: string
  language: string
  verdict: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED'
  summary: {
    passPercentage: number
  }
  attemptNumber: number
  isBestSubmission: boolean
  createdAt: string
}

/* ---------------- Helpers ---------------- */

const verdictVariant = (verdict: string) => {
  if (verdict === 'ACCEPTED') return 'success'
  if (verdict === 'PARTIALLY_ACCEPTED') return 'warning'
  return 'danger'
}

const languageColor = (lang: string) => {
  const map: Record<string, string> = {
    javascript: 'warning',
    python: 'primary',
    python3: 'primary',
    java: 'danger',
    cpp: 'info',
    c: 'secondary',
    go: 'success',
    rust: 'dark',
    php: 'secondary',
  }
  return map[lang] || 'light'
}

/* ⭐ Percentage → Stars (0–5) */
const getStarCount = (percentage: number) => {
  if (percentage >= 90) return 5
  if (percentage >= 75) return 4
  if (percentage >= 60) return 3
  if (percentage >= 40) return 2
  if (percentage > 0) return 1
  return 0
}

/* ---------------- Component ---------------- */

const SubmissionsTab = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`${baseURL}/api/ai/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        setData(json.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="p-4 text-center text-muted bg-dark border-secondary">
        No submissions yet 🚀
      </Card>
    )
  }

  return (
    <div className="d-flex flex-column gap-2">
      {data.map((s) => {
        const stars = getStarCount(s.summary.passPercentage)

        return (
          <Card
            key={s._id}
            className="bg-transparent shadow-sm"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <Card.Body className="px-3 py-3">
              {/* TOP ROW */}
              <div className="d-flex justify-content-between align-items-start">
                {/* LEFT */}
                <div>
                  {/* Title */}
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-semibold fs-6">
                      {s.problemTitle}
                    </span>

                    {/* ⭐ Star Rating */}
                    <div className="d-flex align-items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FiStar
                          key={i}
                          size={14}
                          color={i < stars ? '#facc15' : '#4b5563'}
                          title={`${stars} / 5`}
                        />
                      ))}

                      {/* BEST badge */}
                      {s.isBestSubmission && (
                        <span className="ms-2 small text-warning fw-semibold">
                          BEST
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta line */}
                  <div className="small text-muted d-flex flex-wrap align-items-center gap-2">
                    <span className="fw-semibold">LANG</span>
                    <Badge bg={languageColor(s.language)} className="text-uppercase">
                      {s.language}
                    </Badge>

                    <span>•</span>

                    <span className="fw-semibold">VERDICT</span>
                    <Badge bg={verdictVariant(s.verdict)}>
                      {s.verdict}
                    </Badge>

                    <span>•</span>

                    <span className="fw-semibold">SCORE</span>
                    <span
                      className={
                        s.summary.passPercentage === 100
                          ? 'text-success fw-semibold'
                          : s.summary.passPercentage >= 50
                          ? 'text-warning fw-semibold'
                          : 'text-danger fw-semibold'
                      }
                    >
                      {s.summary.passPercentage}%
                    </span>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-end small text-muted">
                  <div className="fw-semibold">
                    Attempt #{s.attemptNumber}
                  </div>
                  <div>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-secondary">Rank —</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-2">
                <ProgressBar
                  now={s.summary.passPercentage}
                  variant={
                    s.summary.passPercentage === 100
                      ? 'success'
                      : s.summary.passPercentage >= 50
                      ? 'warning'
                      : 'danger'
                  }
                  style={{ height: 5 }}
                />
              </div>
            </Card.Body>
          </Card>
        )
      })}
    </div>
  )
}

export default SubmissionsTab

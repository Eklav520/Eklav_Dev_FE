import { Badge, Card, Form } from 'react-bootstrap'
import { FaRobot } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

type LanguageStats = Record<string, number>

type TopicAverage = {
  topic: string
  avgScore: number
}

const SelfPreparation = () => {
  const [aiMode, setAiMode] = useState<'Today' | 'Weekly'>('Weekly')

  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [languageStats, setLanguageStats] = useState<LanguageStats>({})
  const [topicAverages, setTopicAverages] = useState<TopicAverage[]>([])

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const res = await fetch(`${baseURL}/api/ai/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })

        const result = await res.json()
        const submissions = result.data ?? []

        const langMap: LanguageStats = {}

        submissions.forEach((s: any) => {
          const lang = s.language?.toLowerCase() || 'unknown'
          langMap[lang] = (langMap[lang] || 0) + 1
        })

        setLanguageStats(langMap)
      } catch (err) {
        console.error('Failed to load submissions', err)
      }
    }

    if (token) loadSubmissions()
  }, [token, aiMode])

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

  const totalSubmissions = Object.values(languageStats).reduce((a, b) => a + b, 0)

  return (
    <Card className="border-0 h-100" style={{ background: '#f97316', borderRadius: '12px' }}>
      <Card.Header className="text-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <FaRobot className="me-2" />
            Self Preparation
          </h6>
          <Form.Select
            size="sm"
            value={aiMode}
            style={{ 
              width: 100, 
              background: '#ea580c',
              color: 'white',
              border: 'none',
              fontSize: '0.85rem'
            }}
            onChange={(e) => setAiMode(e.target.value as 'Today' | 'Weekly')}
          >
            <option value="Weekly">Weekly</option>
          </Form.Select>
        </div>
      </Card.Header>

      <Card.Body style={{ background: '#1e293b' }}>
        {/* AI Interview */}
        <div className="mb-3">
          <h6 className="fw-bold mb-2 text-white" style={{ fontSize: '0.9rem' }}>
            🤖 AI Interview Performance
          </h6>
          {topicAverages.length === 0 ? (
            <div className="text-white" style={{ opacity: 0.7, fontSize: '0.85rem' }}>
              No interviews yet
            </div>
          ) : (
            <div className="text-white" style={{ fontSize: '0.85rem' }}>
              {topicAverages.slice(0, 3).map((t) => (
                <div key={t.topic} className="mb-1">
                  {t.topic}: {t.avgScore}%
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Program Submissions */}
        <div className="border-top border-secondary pt-3">
          <h6 className="fw-bold mb-3 text-white" style={{ fontSize: '0.9rem' }}>
            💻 Program Submissions
          </h6>
          <div className="d-flex justify-content-around text-center">
            {['javascript', 'java', 'python', 'c', 'c++'].map((l) => (
              <div key={l}>
                <div className="fw-bold text-white" style={{ fontSize: '1.25rem' }}>
                  {languageStats[l] ?? 0}
                </div>
                <small className="text-white text-uppercase" style={{ opacity: 0.7, fontSize: '0.7rem' }}>
                  {l === 'javascript' ? 'JS' : l === 'c++' ? 'C++' : l.toUpperCase()}
                </small>
              </div>
            ))}
          </div>

          <div className="text-center text-white mt-3" style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            Total Submitted: <strong>{totalSubmissions}</strong>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default SelfPreparation

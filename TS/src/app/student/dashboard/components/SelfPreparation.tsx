import { Card } from 'react-bootstrap'
import { FaRobot, FaCode, FaChartBar } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'

type LanguageStats = Record<string, number>

type TopicAverage = {
  topic: string
  avgScore: number
}

const SelfPreparation = () => {
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
  }, [token])

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
  
  // Calculate average AI interview score
  const avgInterviewScore = topicAverages.length > 0 
    ? Math.round(topicAverages.reduce((sum, t) => sum + t.avgScore, 0) / topicAverages.length)
    : 0

  return (
    <Card className="border-0 shadow-lg overflow-hidden" style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      height: '600px', // Increased height
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER - Fixed height */}
      <div style={{ flexShrink: 0 }}>
        <Card.Header className="border-0 text-white px-4 py-4" style={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          {/* Title Section */}
          <div className="d-flex align-items-start mb-3">
            <div className="p-2 rounded-circle me-3" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
              <FaRobot className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{ 
                fontSize: '1.75rem', 
                lineHeight: '1.2'
              }}>
                <span className="d-block">Self Preparation</span>
              </h1>
              <small className="opacity-75 mt-1 d-block">Track your coding practice & AI interviews</small>
            </div>
          </div>

          {/* Score Cards - Rectangle Layout */}
          <div className="d-flex justify-content-start gap-3">
            {/* AI Interview Score - Rectangle */}
            <div className="d-flex align-items-center p-3 rounded-3" style={{
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              minWidth: '150px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
            }}>
              <div className="rounded-circle p-2 flex-shrink-0 me-3" style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaChartBar className="text-white" size={18} />
              </div>
              <div className="text-start">
                <div className="text-white-75 small mb-1" style={{ fontSize: '0.75rem' }}>AI Interview</div>
                <div className="fw-bold text-white" style={{
                  fontSize: '1.5rem',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  lineHeight: '1'
                }}>
                  {avgInterviewScore}%
                </div>
              </div>
            </div>

            {/* Program Submissions - Rectangle */}
            <div className="d-flex align-items-center p-3 rounded-3" style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              minWidth: '150px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
            }}>
              <div className="rounded-circle p-2 flex-shrink-0 me-3" style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaCode className="text-white" size={18} />
              </div>
              <div className="text-start">
                <div className="text-white-75 small mb-1" style={{ fontSize: '0.75rem' }}>Submissions</div>
                <div className="fw-bold text-white" style={{
                  fontSize: '1.5rem',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  lineHeight: '1'
                }}>
                  {totalSubmissions}
                </div>
              </div>
            </div>
          </div>
        </Card.Header>
      </div>

      {/* BODY - Scrollable */}
      <Card.Body className="p-4" style={{ 
        background: '#1e293b',
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1)'
      }}>
        {/* Custom scrollbar styling for WebKit browsers */}
        <style>
          {`
            .scrollable-body::-webkit-scrollbar {
              width: 6px;
            }
            .scrollable-body::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
            }
            .scrollable-body::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 3px;
            }
            .scrollable-body::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.4);
            }
          `}
        </style>

        {/* Section Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white fw-bold mb-0" style={{ fontSize: '1.25rem' }}>
            Performance Breakdown
          </h2>
          <div className="text-white-50 small">
            Weekly Statistics
          </div>
        </div>

        {/* AI Interview Performance */}
        <div className="mb-4 pb-3" style={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1rem'
        }}>
          <h6 className="fw-bold mb-3 text-white" style={{ fontSize: '1rem' }}>
            <FaRobot className="me-2" />
            AI Interview Performance
          </h6>
          
          {topicAverages.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-white-50 mb-2">No interview data available</div>
              <small className="text-white-50" style={{ fontSize: '0.8rem' }}>
                Complete an AI interview to see your performance
              </small>
            </div>
          ) : (
            <div className="row">
              {topicAverages.slice(0, 6).map((t) => (
                <div key={t.topic} className="col-6 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-white" style={{ fontSize: '0.9rem' }}>
                      {t.topic}
                    </div>
                    <div className="fw-bold text-white" style={{ fontSize: '0.9rem' }}>
                      {t.avgScore}%
                    </div>
                  </div>
                  <div className="progress mt-1" style={{
                    height: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px'
                  }}>
                    <div 
                      className="progress-bar" 
                      style={{
                        backgroundColor: '#3B82F6',
                        width: `${t.avgScore}%`,
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Program Submissions */}
        <div>
          <h6 className="fw-bold mb-3 text-white" style={{ fontSize: '1rem' }}>
            <FaCode className="me-2" />
            Program Submissions by Language
          </h6>
          
          <div className="d-flex justify-content-around text-center mb-4">
            {['javascript', 'java', 'python', 'c', 'c++'].map((l) => (
              <div key={l} className="text-center">
                <div className="rounded-circle p-3 mb-2" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  width: '60px',
                  height: '60px',
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div className="fw-bold text-white" style={{ fontSize: '1.25rem' }}>
                    {languageStats[l] ?? 0}
                  </div>
                </div>
                <small className="text-white text-uppercase d-block" style={{ 
                  opacity: 0.9, 
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {l === 'javascript' ? 'JS' : l === 'c++' ? 'C++' : l.toUpperCase()}
                </small>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="text-center p-3 rounded-3" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="text-white-50 small mb-1">Total Submissions</div>
            <div className="fw-bold text-white" style={{ fontSize: '1.5rem' }}>
              {totalSubmissions}
            </div>
            <small className="text-white-50" style={{ fontSize: '0.8rem' }}>
              Across all programming languages
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default SelfPreparation
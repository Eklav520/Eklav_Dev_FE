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
    <Card className="border-0 shadow-lg overflow-hidden h-100 w-100"
      style={{
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #ff7a00 0%, #2a2a2a 60%, #121212 100%)',
        minHeight: '600px',
        height: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <Card.Header
          className="border-0 text-white px-3 px-md-4 py-4"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            minHeight: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Title */}
          <div className="d-flex align-items-start mb-3">
            <div
              className="p-2 rounded-circle me-3 flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <FaRobot className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.4rem, 5vw, 1.75rem)' }}>
                Self Preparation
              </h1>
              <small className="opacity-75 mt-1 d-block" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                Track coding practice & AI interviews
              </small>
            </div>
          </div>

          {/* Stat Cards - Stack vertically on mobile */}
          <div className="d-flex flex-column flex-sm-row justify-content-start gap-2 gap-sm-3">

            {/* AI Interview */}
            <div
              className="d-flex align-items-center p-3 rounded-3 w-100 w-sm-auto"
              style={{
                background: 'rgba(255,122,0,0.15)',
                border: '1px solid rgba(255,122,0,0.4)',
                minWidth: 'auto',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              <div
                className="rounded-circle p-2 flex-shrink-0 me-3"
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaChartBar className="text-white" size={18} />
              </div>
              <div>
                <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                  AI Interview
                </div>
                <div className="fw-bold text-white" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.5rem)' }}>
                  {avgInterviewScore}%
                </div>
              </div>
            </div>

            {/* Submissions */}
            <div
              className="d-flex align-items-center p-3 rounded-3 w-100 w-sm-auto"
              style={{
                background: 'rgba(255,122,0,0.15)',
                border: '1px solid rgba(255,122,0,0.4)',
                minWidth: 'auto',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              <div
                className="rounded-circle p-2 flex-shrink-0 me-3"
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaCode className="text-white" size={18} />
              </div>
              <div>
                <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                  Submissions
                </div>
                <div className="fw-bold text-white" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.5rem)' }}>
                  {totalSubmissions}
                </div>
              </div>
            </div>
          </div>
        </Card.Header>
      </div>

      {/* BODY - Scrollable */}
      <Card.Body className="p-3 p-md-4" style={{
        background: '#1e293b',
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Section Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mb-md-4">
          <h2 className="text-white fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)' }}>
            Performance Breakdown
          </h2>
          <div className="text-white-50 small" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
            Monthly Stats
          </div>
        </div>

        {/* AI Interview Performance */}
        <div className="mb-3 mb-md-4 pb-2 pb-md-3" style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h6 className="fw-bold mb-3 text-white d-flex align-items-center" style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1rem)' }}>
            <FaRobot className="me-2 flex-shrink-0" />
            <span>AI Interview Performance</span>
          </h6>

          {topicAverages.length === 0 ? (
            <div className="text-center py-3 py-md-4">
              <div className="text-white-50 mb-2 small">No interview data available</div>
              <small className="text-white-50" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)' }}>
                Complete an AI interview to see your performance
              </small>
            </div>
          ) : (
            <div className="row g-2 g-md-3">
              {topicAverages.slice(0, 6).map((t) => (
                <div key={t.topic} className="col-6 mb-2 mb-md-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-white" style={{ 
                      fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '70px'
                    }}>
                      {t.topic}
                    </div>
                    <div className="fw-bold text-white" style={{ fontSize: 'clamp(0.8rem, 3vw, 0.9rem)' }}>
                      {t.avgScore}%
                    </div>
                  </div>
                  <div className="progress mt-1" style={{
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px'
                  }}>
                    <div
                      className="progress-bar"
                      style={{
                        backgroundColor: '#ff7a00',
                        width: `${t.avgScore}%`,
                        borderRadius: '2px'
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
          <h6 className="fw-bold mb-3 text-white d-flex align-items-center" style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1rem)' }}>
            <FaCode className="me-2 flex-shrink-0" />
            <span>Submissions by Language</span>
          </h6>

          {/* Language circles - Wrap on mobile */}
          <div className="d-flex flex-wrap justify-content-center justify-content-sm-around gap-3 gap-sm-2 mb-3 mb-md-4">
            {['javascript', 'java', 'python', 'c', 'c++'].map((l) => (
              <div key={l} className="text-center" style={{ minWidth: '70px' }}>
                <div className="rounded-circle p-2 p-md-3 mb-2 mx-auto" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  width: 'clamp(50px, 15vw, 60px)',
                  height: 'clamp(50px, 15vw, 60px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div className="fw-bold text-white" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>
                    {languageStats[l] ?? 0}
                  </div>
                </div>
                <small className="text-white text-uppercase d-block" style={{
                  opacity: 0.9,
                  fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)',
                  fontWeight: '500'
                }}>
                  {l === 'javascript' ? 'JS' : l === 'c++' ? 'C++' : l.toUpperCase()}
                </small>
              </div>
            ))}
          </div>

          {/* Total Summary */}
          <div className="text-center p-2 p-md-3 rounded-3" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="text-white-50 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
              Total Submissions
            </div>
            <div className="fw-bold text-white" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.5rem)' }}>
              {totalSubmissions}
            </div>
            <small className="text-white-50" style={{ fontSize: 'clamp(0.65rem, 2.3vw, 0.8rem)' }}>
              Across all programming languages
            </small>
          </div>
        </div>
      </Card.Body>

      <style>{`
        /* Custom scrollbar styling */
        .card-body::-webkit-scrollbar {
          width: 4px;
        }
        .card-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .card-body::-webkit-scrollbar-thumb {
          background: rgba(255, 122, 0, 0.5);
          border-radius: 2px;
        }
        .card-body::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 122, 0, 0.7);
        }
        
        /* Custom responsive utilities */
        @media (min-width: 576px) {
          .w-sm-auto {
            width: auto !important;
            max-width: 180px !important;
          }
        }
        
        /* Ensure proper spacing on very small screens */
        @media (max-width: 360px) {
          .rounded-circle {
            width: 45px !important;
            height: 45px !important;
          }
          
          .gap-3 {
            gap: 0.5rem !important;
          }
        }
        
        /* Touch-friendly scrolling */
        .card-body {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Smooth transitions */
        .progress-bar {
          transition: width 0.3s ease;
        }
        
        /* Language circle container */
        .d-flex.flex-wrap {
          margin: 0 -0.5rem;
        }
        
        /* Topic text truncation */
        .text-truncate-custom {
          max-width: 70px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </Card>
  )
}

export default SelfPreparation
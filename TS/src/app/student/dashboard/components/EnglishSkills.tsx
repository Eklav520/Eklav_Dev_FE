import { Card, ProgressBar, Spinner } from 'react-bootstrap'
import { FaMicrophone, FaTrophy, FaChartLine } from 'react-icons/fa'
import { useEnglishDashboardHistory } from '../components/hooks/useEnglishDashboardHistory'
import { EnglishSection } from '../components/hooks/useEnglishDashboardHistory'

const skills: {
  key: EnglishSection
  label: string
  icon: string
  color: string
}[] = [
    { key: 'SPEAKING', label: 'Speaking', icon: '🎤', color: '#3B82F6' },
    { key: 'WRITING', label: 'Writing', icon: '✍️', color: '#10B981' },
    { key: 'READING', label: 'Reading', icon: '📖', color: '#8B5CF6' },
    { key: 'LISTENING', label: 'Listening', icon: '👂', color: '#F59E0B' },
    { key: 'JUST_A_MINUTE', label: 'Speaking Practice', icon: '📝', color: '#EF4444' },
  ]

const EnglishSkills = () => {
  const { data, loading } = useEnglishDashboardHistory()

  if (loading) {
    return (
      <Card className="h-100 d-flex justify-content-center align-items-center border-0 shadow-lg" style={{
        borderRadius: '16px',
        minHeight: '600px'
      }}>
        <div className="text-center p-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-white-50">Loading skills data...</p>
        </div>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="h-100 d-flex justify-content-center align-items-center border-0 shadow-lg p-4"
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #ff7a00 0%, #2a2a2a 60%, #121212 100%)',
          height: '100%', // 🔥 KEY FIX
          display: 'flex',
          flexDirection: 'column'
        }}>
        <div className="text-center text-white-50">
          <FaChartLine className="mb-3" size={48} />
          <h6 className="fw-bold text-white">Unable to Load Data</h6>
          <p className="text-white-50 small mb-0">Please try refreshing the page</p>
        </div>
      </Card>
    )
  }

  const overallScore = Math.round(
    skills.reduce((sum, s) => sum + (data[s.key]?.summary?.bestScore ?? 0), 0) / skills.length
  ) || 0

  return (
    <Card style={{
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #ff7a00 0%, #2a2a2a 60%, #121212 100%)',
  height: '100%', // 🔥 THIS FIXES EVERYTHING
  display: 'flex',
  flexDirection: 'column'
}}>
      {/* HEADER SECTION */}
      <div style={{ flexShrink: 0 }}>
        <Card.Header className="border-0 text-white px-3 px-md-4 py-4"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            minHeight: 'auto',
            flexDirection: 'column',
          }}>
          {/* Title Section */}
          <div className="d-flex align-items-start mb-3">
            <div className="p-2 rounded-circle me-3 flex-shrink-0" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
              <FaMicrophone className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{
                fontSize: 'clamp(1.4rem, 5vw, 1.75rem)'
              }}>
                <span className="d-block">English Skills</span>
              </h1>
              <small className="opacity-75 mt-1 d-block" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                Track your language mastery
              </small>
            </div>
          </div>

          {/* Score Cards - Stack vertically on mobile */}
          <div className="d-flex gap-3" style={{ width: '100%' }}>
            {/* Overall Score Card */}
            <div className="d-flex align-items-center p-3 rounded-3" style={{
              flex: 1, // 🔥 KEY FIX (equal width)
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255,122,0,0.15)',
              border: '1px solid rgba(255,122,0,0.4)',
            }}>
              <div className="rounded-circle p-2 flex-shrink-0 me-3" style={{
                background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaChartLine className="text-white" size={18} />
              </div>
              <div className="text-start">
                <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)' }}>
                  Overall
                </div>
                <div className="fw-bold text-white" style={{
                  fontSize: 'clamp(1.3rem, 5vw, 1.5rem)',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  lineHeight: '1'
                }}>
                  {overallScore}%
                </div>
              </div>
            </div>

            {/* Rank Card */}
            <div className="d-flex align-items-center p-3 rounded-3" style={{
              flex: 1, // 🔥 KEY FIX (equal width)
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              borderRadius: '12px',
              background: 'rgba(255,122,0,0.15)',
              border: '1px solid rgba(255,122,0,0.4)',
            }}>
              <div className="rounded-circle p-2 flex-shrink-0 me-3" style={{
                background: 'linear-gradient(135deg, #ff7a00 0%, #e96d00 100%)',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaTrophy className="text-white" size={18} />
              </div>
              <div className="text-start">
                <div className="text-white-75 small mb-1" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)' }}>
                  Rank
                </div>
                <div className="fw-bold text-white" style={{
                  fontSize: 'clamp(1.3rem, 5vw, 1.5rem)',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  lineHeight: '1'
                }}>
                  —
                </div>
              </div>
            </div>
          </div>
        </Card.Header>
      </div>

      {/* BODY - SKILL PROGRESS - Scrollable */}
      <Card.Body className="p-3 p-md-4" style={{
        background: '#1e293b',
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Section Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mb-md-4">
          <h2 className="text-white fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)' }}>
            Skill Breakdown
          </h2>
          <div className="text-white-50 small" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
            Monthly limit progress
          </div>
        </div>

        {/* SKILLS LIST */}
        <div className="mb-1">
          {skills.map((skill) => {
            const section = data[skill.key]
            const bestScore = section?.summary?.bestScore ?? 0
            const progress = section.monthlyLimit > 0
              ? Math.round((section.attemptsUsed / section.monthlyLimit) * 100)
              : 0

            return (
              <div key={skill.key} className="mb-3 mb-md-4 pb-2 pb-md-3" style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                {/* Skill Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-start mb-2 mb-md-3">
                  <div className="d-flex align-items-center mb-2 mb-sm-0">
                    <div className="me-2 me-md-3 fs-4" style={{ width: '36px', textAlign: 'center' }}>
                      {skill.icon}
                    </div>
                    <div>
                      <div className="fw-bold text-white mb-1" style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.1rem)' }}>
                        {skill.label}
                      </div>
                      <div className="text-white-50 small d-flex align-items-center" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                        Best: <span className="fw-bold text-white ms-1">{bestScore}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end ms-auto ms-sm-0">
                    <div className="fw-bold text-white mb-1" style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.1rem)' }}>
                      {progress}%
                    </div>
                    <div className="text-white-50 small" style={{ fontSize: 'clamp(0.65rem, 2.3vw, 0.875rem)' }}>
                      Progress
                    </div>
                  </div>
                </div>

                {/* Progress Info */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                  <div className="text-white-50 small" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                    Monthly limit: <span className="fw-bold text-white">{section.attemptsUsed}/{section.monthlyLimit}</span>
                  </div>
                  <div className="text-white-50 small" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                    Progress: <span className="fw-bold text-white">{progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  now={progress}
                  className="mb-0"
                  style={{
                    height: '6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      backgroundColor: '#ff7a00',
                      height: '100%',
                      transition: 'width 0.6s ease',
                      borderRadius: '4px'
                    }}
                  />
                </ProgressBar>
              </div>
            )
          })}
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center mt-3 mt-md-4 pt-3 pt-md-4 border-top border-secondary" style={{
          flexShrink: 0,
          borderTopColor: 'rgba(255,255,255,0.1) !important'
        }}>
          <small className="text-white-50" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
            Monthly progress resets on the 1st
          </small>
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
          .fs-4 {
            font-size: 1.3rem !important;
          }
          .rounded-circle {
            width: 36px !important;
            height: 36px !important;
          }
        }
        
        /* Touch-friendly scrolling */
        .card-body {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Smooth transitions */
        .progress-bar div {
          transition: width 0.3s ease;
        }
      `}</style>
    </Card>
  )
}

export default EnglishSkills
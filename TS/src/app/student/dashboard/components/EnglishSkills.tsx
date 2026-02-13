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
    { key: 'JUST_A_MINUTE', label: 'Just a Minute', icon: '📝', color: '#EF4444' },
  ]

const EnglishSkills = () => {
  const { data, loading } = useEnglishDashboardHistory()

  if (loading) {
    return (
      <Card className="h-100 d-flex justify-content-center align-items-center border-0 shadow-lg" style={{
        borderRadius: '16px',
        minHeight: '600px' // Increased height
      }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading skills data...</p>
        </div>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="h-100 d-flex justify-content-center align-items-center border-0 shadow-lg p-4" style={{
        borderRadius: '16px',
        minHeight: '600px' // Increased height
      }}>
        <div className="text-center text-danger">
          <FaChartLine className="mb-3" size={48} />
          <h6 className="fw-bold">Unable to Load Data</h6>
          <p className="text-muted small mb-0">Please try refreshing the page</p>
        </div>
      </Card>
    )
  }

  const overallScore = Math.round(
    skills.reduce((sum, s) => sum + (data[s.key]?.summary?.bestScore ?? 0), 0) / skills.length
  ) || 0

  return (
    <Card className="border-0 shadow-lg overflow-hidden" style={{
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
      height: '600px', // Increased from 500px to 600px
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* HEADER SECTION - Fixed height */}
      <div style={{ flexShrink: 0 }}>
        <Card.Header className="border-0 text-white px-4 py-4" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          {/* Title Section */}
          <div className="d-flex align-items-start mb-3">
            <div className="p-2 rounded-circle me-3 mt-1" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
              <FaMicrophone className="fs-5" />
            </div>
            <div>
              <h1 className="mb-0 fw-bold" style={{
                fontSize: '1.75rem',
                lineHeight: '1.2'
              }}>
                <span className="d-block">English Skills Progress</span>
              </h1>
              <small className="opacity-75 mt-1 d-block">Track your language mastery journey</small>
            </div>
          </div>
          {/* Score Cards - Larger Rectangle Horizontal Layout */}
          <div className="d-flex justify-content-start gap-3">
            {/* Overall Score Card - Larger Rectangle */}
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
                <FaChartLine className="text-white" size={18} />
              </div>
              <div className="text-start">
                <div className="text-white-75 small mb-1" style={{ fontSize: '0.75rem' }}>Overall</div>
                <div className="fw-bold text-white" style={{
                  fontSize: '1.5rem',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                  lineHeight: '1'
                }}>
                  {overallScore}%
                </div>
              </div>
            </div>

            {/* Rank Card - Larger Rectangle */}
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
                <FaTrophy className="text-white" size={18} />
              </div>
              <div className="text-start">
                <div className="text-white-75 small mb-1" style={{ fontSize: '0.75rem' }}>Rank</div>
                <div className="fw-bold text-white" style={{
                  fontSize: '1.5rem',
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
      <Card.Body className="p-4" style={{
        background: '#0F172A',
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
            Skill Breakdown
          </h2>
          <div className="text-white-50 small">
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
              <div key={skill.key} className="mb-4 pb-3" style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '1rem'
              }}>
                {/* Skill Header */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3 fs-4" style={{ width: '40px', textAlign: 'center' }}>
                      {skill.icon}
                    </div>
                    <div>
                      <div className="fw-bold text-white mb-1" style={{ fontSize: '1.1rem' }}>
                        {skill.label}
                      </div>
                      <div className="text-white-50 small">
                        Best: <span className="fw-bold text-white ms-1">{bestScore}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-white mb-1" style={{ fontSize: '1.1rem' }}>
                      {progress}%
                    </div>
                    <div className="text-white-50 small">
                      Progress
                    </div>
                  </div>
                </div>

                {/* Progress Info */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="text-white-50 small">
                    Monthly limit: <span className="fw-bold text-white">{section.attemptsUsed}/{section.monthlyLimit}</span>
                  </div>
                  <div className="text-white-50 small">
                    Progress: <span className="fw-bold text-white">{progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  now={progress}
                  className="mb-0"
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden'
                  }}
                  variant="info"
                >
                  <ProgressBar
                    style={{
                      backgroundColor: skill.color,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }}
                  />
                </ProgressBar>
              </div>
            )
          })}
        </div>

        {/* FOOTER NOTE */}
        <div className="text-center mt-4 pt-3 border-top border-secondary" style={{ flexShrink: 0 }}>
          <small className="text-white-50">
            Monthly progress resets on the 1st of each month
          </small>
        </div>
      </Card.Body>
    </Card>
  )
}

export default EnglishSkills
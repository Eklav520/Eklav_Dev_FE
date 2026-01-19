import { useState } from 'react'
import { Card, Col, Row, Button } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AnalyticsFilters from './components/AnalyticsFilters'

// Attendance Charts
import JAMAttendanceChart from './components/attendance/JAMAttendanceChart'
import SelfInterviewChart from './components/attendance/SelfInterviewChart'
import SpeakingAttendanceChart from './components/attendance/SpeakingAttendanceChart'
import ReadingAttendanceChart from './components/attendance/ReadingAttendanceChart'
import WritingAttendanceChart from './components/attendance/WritingAttendanceChart'
import EnglishPracticeAttendanceChart from './components/attendance/EnglishPracticeAttendanceChart'
import ListeningAttendanceChart from './components/attendance/ListeningAttendanceChart'
import WritingHistory from './components/attendance/WritingHistory'

// Progress Components
import SectionProgressDashboard from './components/progress/SectionProgressDashboard'
import ReadingSectionProgressDashboard from './components/progress/ReadingSectionProgressDashboard'
import ListeningSectionProgressDashboard from './components/progress/ListeningSectionProgressDashboard'
import JustAMinuteSectionProgressDashboard from './components/progress/JustAMinuteSectionProgressDashboard'
import EnglishPracticeSectionProgressDashboard from './components/progress/EnglishPracticeSectionProgressDashboard'
import AdminSelfInterviewProgressTable from './components/progress/AdminSelfInterviewProgressTable'

type SectionKey = 'justAMinute' | 'selfInterview' | 'speaking' | 'reading' | 'listening' | 'writing' | 'englishPractice' | null

const sections = [
  { key: 'justAMinute' as const, title: 'Just A Minute', icon: '🎤' },
  { key: 'selfInterview' as const, title: 'Self Interview', icon: '💼' },
  { key: 'speaking' as const, title: 'Speaking', icon: '🗣️' },
  { key: 'reading' as const, title: 'Reading', icon: '📖' },
  { key: 'listening' as const, title: 'Listening', icon: '👂' },
  { key: 'writing' as const, title: 'Writing', icon: '✍️' },
  { key: 'englishPractice' as const, title: 'English Practice', icon: '📚' },
]

const StudentAnalyticsPage = () => {
  const [selectedSection, setSelectedSection] = useState<SectionKey>(null)

  const renderSectionCards = () => (
    <Row className="g-4">
      {sections.map(section => (
        <Col key={section.key} md={6} lg={4}>
          <Card
            className="h-100 shadow-sm"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => setSelectedSection(section.key)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Card.Body className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {section.icon}
              </div>
              <h5 className="mb-0">{section.title}</h5>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )

  const renderSelectedSection = () => {
    if (!selectedSection) return null

    const section = sections.find(s => s.key === selectedSection)
    if (!section) return null

    return (
      <>
        <div className="mb-4">
          <Button
            variant="outline-secondary"
            onClick={() => setSelectedSection(null)}
            className="mb-3"
          >
            ← Back to Sections
          </Button>
          <h3 className="mb-4">{section.title} Analytics</h3>
        </div>

        <section className="mb-5">
          <h4 className="mb-4">Attendance Analysis</h4>
          {selectedSection === 'justAMinute' && <JAMAttendanceChart />}
          {selectedSection === 'selfInterview' && <SelfInterviewChart />}
          {selectedSection === 'speaking' && <SpeakingAttendanceChart />}
          {selectedSection === 'reading' && <ReadingAttendanceChart />}
          {selectedSection === 'listening' && <ListeningAttendanceChart />}
          {selectedSection === 'writing' && (
            <>
              <WritingAttendanceChart />
              <WritingHistory />
            </>
          )}
          {selectedSection === 'englishPractice' && <EnglishPracticeAttendanceChart />}
        </section>

        <section className="mb-5">
          <h4 className="mb-4">Progress Analysis</h4>
          {selectedSection === 'justAMinute' && (
            <div className="mt-4">
              <JustAMinuteSectionProgressDashboard />
            </div>
          )}
          {selectedSection === 'selfInterview' && (
            <div className="mt-4">
              <AdminSelfInterviewProgressTable />
            </div>
          )}
          {selectedSection === 'speaking' && (
            <div className="mt-4">
              <SectionProgressDashboard />
            </div>
          )}
          {selectedSection === 'reading' && (
            <div className="mt-4">
              <ReadingSectionProgressDashboard />
            </div>
          )}
          {selectedSection === 'listening' && (
            <div className="mt-4">
              <ListeningSectionProgressDashboard />
            </div>
          )}
          {selectedSection === 'writing' && null}
          {selectedSection === 'englishPractice' && (
            <div className="mt-4">
              <EnglishPracticeSectionProgressDashboard />
            </div>
          )}
        </section>
      </>
    )
  }

  return (
    <>
      <PageMetaData title="Student Analytics" />

      <div className="container-fluid">
        <h2 className="mb-4">Student Analytics</h2>

        <AnalyticsFilters />

        {selectedSection === null ? (
          <>
            <h3 className="mb-4">Select a Section</h3>
            {renderSectionCards()}
          </>
        ) : (
          renderSelectedSection()
        )}
      </div>
    </>
  )
}

export default StudentAnalyticsPage

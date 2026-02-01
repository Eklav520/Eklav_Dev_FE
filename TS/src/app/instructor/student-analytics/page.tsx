import { useEffect, useMemo, useState, useRef } from 'react'
import { Card, Col, Row, Button, Nav } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import ProgressAnalyticsFilters from './components/filters/ProgressAnalyticsFilters'
import type { IconType } from 'react-icons'
import { BsStopwatch, BsMic, BsPencilSquare } from 'react-icons/bs'
import { FaBriefcase, FaBookOpen, FaHeadphones } from 'react-icons/fa'

// Attendance Charts
import JAMAttendanceChart from './components/attendance/JAMAttendanceChart'
import SelfInterviewChart from './components/attendance/SelfInterviewChart'
import SpeakingAttendanceChart from './components/attendance/SpeakingAttendanceChart'
import ReadingAttendanceChart from './components/attendance/ReadingAttendanceChart'
import WritingAttendanceChart from './components/attendance/WritingAttendanceChart'
import ListeningAttendanceChart from './components/attendance/ListeningAttendanceChart'

// Progress Components
import SectionProgressDashboard from './components/progress/SectionProgressDashboard'
import ReadingSectionProgressDashboard from './components/progress/ReadingSectionProgressDashboard'
import ListeningSectionProgressDashboard from './components/progress/ListeningSectionProgressDashboard'
import JustAMinuteSectionProgressDashboard from './components/progress/JustAMinuteSectionProgressDashboard'
import EnglishPracticeSectionProgressDashboard from './components/progress/EnglishPracticeSectionProgressDashboard'
import AdminSelfInterviewProgressTable from './components/progress/AdminSelfInterviewProgressTable'

// Leaderboard Components
import JustAMinuteLeaderboardDashboard from './components/leaderboard/JustAMinuteLeaderboardDashboard'
import EnglishPracticeLeaderboardDashboard from './components/leaderboard/EnglishPracticeLeaderboardDashboard'
import ListeningLeaderboardDashboard from './components/leaderboard/ListeningLeaderboardDashboard'
import ReadingLeaderboardDashboard from './components/leaderboard/ReadingLeaderboardDashboard'
import WritingLeaderboardDashboard from './components/leaderboard/WritingLeaderboardDashboard'
import SelfInterviewLeaderboardDashboard from './components/leaderboard/SelfInterviewLeaderboardDashboard'

type SectionKey =
  | 'justAMinute'
  | 'selfInterview'
  | 'speaking'
  | 'reading'
  | 'listening'
  | 'writing'
  | null

type SectionIconProps = {
  key: SectionKey
  title: string
  icon: IconType
  iconColor: string
  iconHoverColor: string
  base: string
}

const sections: SectionIconProps[] = [
  { key: 'justAMinute', title: 'Just A Minute', icon: BsStopwatch, iconColor: '#4f46e5', iconHoverColor: '#4338ca', base: '#eef2ff' },
  { key: 'selfInterview', title: 'Self Interview', icon: FaBriefcase, iconColor: '#0ea5e9', iconHoverColor: '#0284c7', base: '#e0f2fe' },
  { key: 'speaking', title: 'Speaking', icon: BsMic, iconColor: '#22c55e', iconHoverColor: '#16a34a', base: '#ecfdf5' },
  { key: 'reading', title: 'Reading', icon: FaBookOpen, iconColor: '#eab308', iconHoverColor: '#ca8a04', base: '#fef3c7' },
  { key: 'listening', title: 'Listening', icon: FaHeadphones, iconColor: '#f97316', iconHoverColor: '#ea580c', base: '#fff7ed' },
  { key: 'writing', title: 'Writing', icon: BsPencilSquare, iconColor: '#ec4899', iconHoverColor: '#db2777', base: '#fdf2f8' },
]

const StudentAnalyticsPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const [selectedSection, setSelectedSection] = useState<SectionKey>(null)
  const [activeTab, setActiveTab] =
    useState<'attendance' | 'progress' | 'leaderboard'>('attendance')

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [allWeeks, setAllWeeks] = useState<string[]>([])

  const downloadHandlerRef = useRef<(() => void) | null>(null)
  const [downloadEnabled, setDownloadEnabled] = useState(false)

  const [college, setCollege] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)


  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}/api/adminDashboardHistoryTable/admin/weeks`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(res => res.json())
      .then(setAllWeeks)
      .catch(() => setAllWeeks([]))
  }, [baseURL, user?.token])

  useEffect(() => {
  if (!user?.token) return

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${baseURL}/profile`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })

      const data = await res.json()

      setCollege(data.college || null)
      setRole(data.role || null)
    } catch (err) {
      console.error('Failed to load profile', err)
    }
  }

  fetchProfile()
}, [user?.token, baseURL])


  const weekOptions = useMemo(() => allWeeks, [allWeeks])

  const registerDownloadHandler = (fn: () => void) => {
    downloadHandlerRef.current = fn
    setDownloadEnabled(true)
  }

  /* ---------------- SECTION-WISE CARD LAYOUT ---------------- */

  const renderGroupedCards = () => {
    const englishKeys = ['justAMinute', 'speaking', 'reading', 'listening', 'writing']
    const englishSections = sections.filter(s => englishKeys.includes(s.key!))
    const aiInterview = sections.filter(s => s.key === 'selfInterview')

    const renderCards = (items: SectionIconProps[]) => (
      <Row className="g-4 mb-4">
        {items.map(section => {
          const Icon = section.icon
          return (
            <Col key={section.key} md={6} lg={4}>
              <Card
                className="h-100 shadow-sm"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedSection(section.key)}
              >
                <Card.Body className="text-center py-5">
                  <Icon size={48} style={{ color: section.iconColor }} />
                  <h5 className="mt-3">{section.title}</h5>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>
    )

    return (
      <>
        <h4 className="mb-3">English Section</h4>
        {renderCards(englishSections)}

        <h4 className="mb-3 mt-4">AI Interview Section</h4>
        {renderCards(aiInterview)}

        <h4 className="mb-2 mt-4 text-muted">Code Challenge</h4>
        <p className="text-muted">Coming soon</p>

        <h4 className="mb-2 mt-4 text-muted">Final Assessment</h4>
        <p className="text-muted">Coming soon</p>
      </>
    )
  }

  /* ---------------- ANALYTICS VIEW (UNCHANGED) ---------------- */

  const renderSelectedSection = () => {
    if (!selectedSection) return null
    const section = sections.find(s => s.key === selectedSection)
    if (!section) return null

    return (
      <>
        <Button variant="outline-secondary" className="mb-3" onClick={() => setSelectedSection(null)}>
          ← Back
        </Button>

        <Nav variant="tabs" activeKey={activeTab} onSelect={k => setActiveTab(k as any)}>
          <Nav.Item><Nav.Link eventKey="attendance">Attendance</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="progress">Progress</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="leaderboard">Leaderboard</Nav.Link></Nav.Item>
        </Nav>

        {activeTab === 'attendance' && (
          <>
            {selectedSection === 'justAMinute' && <JAMAttendanceChart college={college} role={role} />}
            {selectedSection === 'selfInterview' && <SelfInterviewChart college={college} />}
            {selectedSection === 'speaking' && <SpeakingAttendanceChart college={college} />}
            {selectedSection === 'reading' && <ReadingAttendanceChart college={college}/>}
            {selectedSection === 'listening' && <ListeningAttendanceChart college={college}/>}
            {selectedSection === 'writing' && <WritingAttendanceChart college={college}/>}
          </>
        )}

        {activeTab === 'progress' && (
          <>
            <ProgressAnalyticsFilters
              year={selectedYear}
              month={selectedMonth}
              week={selectedWeek}
              yearOptions={yearOptions}
              monthOptions={monthOptions}
              weekOptions={weekOptions}
              onYearChange={setSelectedYear}
              onMonthChange={setSelectedMonth}
              onWeekChange={setSelectedWeek}
              onDownload={() => downloadHandlerRef.current?.()}
              downloadDisabled={!downloadEnabled}
            />

            {selectedSection === 'justAMinute' && (
              <JustAMinuteSectionProgressDashboard
                year={selectedYear}
                college={college}
                month={selectedMonth}
                week={selectedWeek}
                registerDownload={registerDownloadHandler}
              />
            )}
            {selectedSection === 'selfInterview' && (
              <AdminSelfInterviewProgressTable
                year={selectedYear}
                college={college}
                month={selectedMonth}
                week={selectedWeek}
                registerDownload={registerDownloadHandler}
              />
            )}
            {selectedSection === 'speaking' && (
              <EnglishPracticeSectionProgressDashboard
                year={selectedYear}
                college={college}
                month={selectedMonth}
                week={selectedWeek}
                registerDownload={registerDownloadHandler}
              />
            )}
            {selectedSection === 'reading' && (
              <ReadingSectionProgressDashboard
                year={selectedYear}
                college={college}
                month={selectedMonth}
                week={selectedWeek}
                registerDownload={registerDownloadHandler}
              />
            )}
            {selectedSection === 'listening' && (
              <ListeningSectionProgressDashboard
                year={selectedYear}
                college={college}
                month={selectedMonth}
                week={selectedWeek}
                registerDownload={registerDownloadHandler}
              />
            )}
            {selectedSection === 'writing' && (
              <SectionProgressDashboard
                year={selectedYear}
                college={college}
                month={selectedMonth}
                week={selectedWeek}
                registerDownload={registerDownloadHandler}
              />
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <>
            {selectedSection === 'justAMinute' && <JustAMinuteLeaderboardDashboard year={selectedYear} month={selectedMonth} week={selectedWeek} college={college} />}
            {selectedSection === 'speaking' && <EnglishPracticeLeaderboardDashboard year={selectedYear} month={selectedMonth} week={selectedWeek} college={college} />}
            {selectedSection === 'reading' && <ReadingLeaderboardDashboard year={selectedYear} month={selectedMonth} week={selectedWeek} college={college}/>}
            {selectedSection === 'listening' && <ListeningLeaderboardDashboard year={selectedYear} month={selectedMonth} week={selectedWeek} college={college}/>}
            {selectedSection === 'writing' && <WritingLeaderboardDashboard year={selectedYear} month={selectedMonth} week={selectedWeek} college={college}/>}
            {selectedSection === 'selfInterview' && <SelfInterviewLeaderboardDashboard year={selectedYear} month={selectedMonth} week={selectedWeek} college={college}/>}
          </>
        )}
      </>
    )
  }

  return (
    <>
      <PageMetaData title="Student Analytics" />
      <div className="container-fluid">
        {!selectedSection ? renderGroupedCards() : renderSelectedSection()}
      </div>
    </>
  )
}

export default StudentAnalyticsPage

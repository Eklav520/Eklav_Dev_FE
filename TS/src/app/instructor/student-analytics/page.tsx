import { useEffect, useMemo, useState,useRef } from 'react'
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

type SectionKey = 'justAMinute' | 'selfInterview' | 'speaking' | 'reading' | 'listening' | 'writing' | null

type SectionIconProps = {
  key: SectionKey
  title: string
  icon: IconType
  iconColor: string
  iconHoverColor: string
  base: string
}

const sections: SectionIconProps[] = [
  {
    key: 'justAMinute',
    title: 'Just A Minute',
    icon: BsStopwatch,
    iconColor: '#4f46e5',
    iconHoverColor: '#4338ca',
    base: '#eef2ff',
  },
  {
    key: 'selfInterview',
    title: 'Self Interview',
    icon: FaBriefcase,
    iconColor: '#0ea5e9',
    iconHoverColor: '#0284c7',
    base: '#e0f2fe',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    icon: BsMic,
    iconColor: '#22c55e',
    iconHoverColor: '#16a34a',
    base: '#ecfdf5',
  },
  {
    key: 'reading',
    title: 'Reading',
    icon: FaBookOpen,
    iconColor: '#eab308',
    iconHoverColor: '#ca8a04',
    base: '#fef3c7',
  },
  {
    key: 'listening',
    title: 'Listening',
    icon: FaHeadphones,
    iconColor: '#f97316',
    iconHoverColor: '#ea580c',
    base: '#fff7ed',
  },
  {
    key: 'writing',
    title: 'Writing',
    icon: BsPencilSquare,
    iconColor: '#ec4899',
    iconHoverColor: '#db2777',
    base: '#fdf2f8',
  },
]

const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.replace('#', '').trim()
  const bigint = Number.parseInt(cleanHex, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const getIconFilter = (color: string) =>
  `drop-shadow(0 0 6px ${hexToRgba(color, 0.4)}) saturate(1.15)`

const getWeekStartDate = (weekKey: string): Date | null => {
  const [yearPart, weekPart] = weekKey.split('-W')
  const year = Number(yearPart)
  const weekNumber = Number(weekPart)
  if (!Number.isFinite(year) || !Number.isFinite(weekNumber)) return null

  const date = new Date(Date.UTC(year, 0, 1 + (weekNumber - 1) * 7))
  const dayOfWeek = date.getUTCDay()
  const offset = (dayOfWeek + 6) % 7
  date.setUTCDate(date.getUTCDate() - offset)
  return date
}

const StudentAnalyticsPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [allWeeks, setAllWeeks] = useState<string[]>([])
  const [selectedSection, setSelectedSection] = useState<SectionKey>(null)
  const [activeTab, setActiveTab] = useState<'attendance' | 'progress' | 'leaderboard'>('attendance')
  const downloadHandlerRef = useRef<(() => void) | null>(null)
  const [downloadEnabled, setDownloadEnabled] = useState(false)

  const yearOptions = Array.from({ length: 5 }, (_, idx) => currentYear - idx)
  const monthOptions = Array.from({ length: 12 }, (_, idx) => idx + 1)

  useEffect(() => {
    if (!user?.token) {
      setAllWeeks([])
      return
    }

    const fetchWeeks = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/adminDashboardHistoryTable/admin/weeks`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        )

        if (!res.ok) {
          throw new Error('Failed to fetch week list')
        }

        const data = await res.json()
        setAllWeeks(data || [])
      } catch (err) {
        console.error('Failed to load week options', err)
        setAllWeeks([])
      }
    }

    fetchWeeks()
  }, [baseURL, user?.token])

  const weekOptions = useMemo(() => {
    if (!selectedYear || !selectedMonth || allWeeks.length === 0) return []

    return allWeeks
      .map(week => ({
        week,
        startDate: getWeekStartDate(week),
      }))
      .filter(
        item =>
          item.startDate &&
          item.startDate.getUTCFullYear() === selectedYear &&
          item.startDate.getUTCMonth() + 1 === selectedMonth
      )
      .sort((a, b) => (a.startDate!.getTime() - b.startDate!.getTime()))
      .map(item => item.week)
  }, [allWeeks, selectedYear, selectedMonth])

  useEffect(() => {
    setSelectedWeek(current => {
      if (weekOptions.length === 0) {
        return null
      }

      if (current && weekOptions.includes(current)) {
        return current
      }

      return weekOptions[weekOptions.length - 1]
    })
  }, [weekOptions])

  useEffect(() => {
    downloadHandlerRef.current = null
    setDownloadEnabled(false)
    // Reset to attendance tab only when section changes (not when filters change)
    setActiveTab('attendance')
  }, [selectedSection])

  const registerDownloadHandler = (fn: () => void) => {
    downloadHandlerRef.current = fn
    setDownloadEnabled(true)
  }

  const renderSectionCards = () => (
    <Row className="g-4">
      {sections.map(section => {
        const IconComponent = section.icon
        return (
          <Col key={section.key} md={6} lg={4}>
              <Card
                className="h-100 shadow-sm"
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => setSelectedSection(section.key)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                  const iconElement = e.currentTarget.querySelector('svg')
                  if (iconElement) {
                    iconElement.style.color = section.iconHoverColor
                    iconElement.style.filter = getIconFilter(section.iconHoverColor)
                    iconElement.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = ''
                  const iconElement = e.currentTarget.querySelector('svg')
                  if (iconElement) {
                    iconElement.style.color = section.iconColor
                    iconElement.style.filter = getIconFilter(section.iconColor)
                    iconElement.style.transform = 'scale(1)'
                  }
                }}
              >
              <Card.Body className="text-center py-5">
                <div 
                  style={{ 
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <IconComponent 
                    size={48} 
                    style={{ 
                      transition: 'color 0.2s, transform 0.2s, filter 0.2s',
                      color: section.iconColor,
                      filter: getIconFilter(section.iconColor),
                      opacity: 0.95,
                    }}
                  />
                </div>
                <h5 className="mb-0">{section.title}</h5>
              </Card.Body>
            </Card>
          </Col>
        )
      })}
    </Row>
  )

  const renderSelectedSection = () => {
    if (!selectedSection) return null

    const section = sections.find(s => s.key === selectedSection)
    if (!section) return null

    // All sections now have leaderboard support
    const hasLeaderboard = true

    return (
      <>
        <header className="d-flex align-items-center mb-4 position-relative">
          <Button
            variant="outline-secondary"
            onClick={() => setSelectedSection(null)}
            className="me-3"
          >
            ← Back to Sections
          </Button>

          <h3 className="position-absolute start-50 translate-middle-x mb-0">
            {section.title} Analytics
          </h3>
        </header>

        {/* Tab Navigation */}
        <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(k) => setActiveTab(k as typeof activeTab)}>
          <Nav.Item>
            <Nav.Link eventKey="attendance">Attendance</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="progress">Progress</Nav.Link>
          </Nav.Item>
          {hasLeaderboard && (
            <Nav.Item>
              <Nav.Link eventKey="leaderboard">Leaderboard</Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        {/* Tab Content */}
        {activeTab === 'attendance' && (
          <section className="mb-3">
            <h4 className="mb-2">Attendance Analysis</h4>
            {selectedSection === 'justAMinute' && <JAMAttendanceChart />}
            {selectedSection === 'selfInterview' && <SelfInterviewChart />}
            {selectedSection === 'speaking' && <SpeakingAttendanceChart />}
            {selectedSection === 'reading' && <ReadingAttendanceChart />}
            {selectedSection === 'listening' && <ListeningAttendanceChart />}
            {selectedSection === 'writing' && <WritingAttendanceChart />}
          </section>
        )}

        {activeTab === 'progress' && (
          <section className="mb-3">
            <h4 className="mb-2">Progress Analysis</h4>
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
              <div className="mt-2">
                <JustAMinuteSectionProgressDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                  registerDownload={registerDownloadHandler}
                />
              </div>
            )}
            {selectedSection === 'selfInterview' && (
              <div className="mt-2">
                <AdminSelfInterviewProgressTable
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                  registerDownload={registerDownloadHandler}
                />
              </div>
            )}
            {selectedSection === 'speaking' && (
              <div className="mt-2">
                <EnglishPracticeSectionProgressDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                  registerDownload={registerDownloadHandler}
                />
              </div>
            )}
            {selectedSection === 'reading' && (
              <div className="mt-2">
                <ReadingSectionProgressDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                  registerDownload={registerDownloadHandler}
                />
              </div>
            )}
            {selectedSection === 'listening' && (
              <div className="mt-2">
                <ListeningSectionProgressDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                  registerDownload={registerDownloadHandler}
                />
              </div>
            )}
            {selectedSection === 'writing' && (
              <div className="mt-2">
                <SectionProgressDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                  registerDownload={registerDownloadHandler}
                />
              </div>
            )}
          </section>
        )}

        {activeTab === 'leaderboard' && hasLeaderboard && (
          <section className="mb-3">
            <h4 className="mb-2">Leaderboard</h4>
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
            />
            {selectedSection === 'justAMinute' && (
              <div className="mt-2">
                <JustAMinuteLeaderboardDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                />
              </div>
            )}
            {selectedSection === 'speaking' && (
              <div className="mt-2">
                <EnglishPracticeLeaderboardDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                />
              </div>
            )}
            {selectedSection === 'listening' && (
              <div className="mt-2">
                <ListeningLeaderboardDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                />
              </div>
            )}
            {selectedSection === 'reading' && (
              <div className="mt-2">
                <ReadingLeaderboardDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                />
              </div>
            )}
            {selectedSection === 'writing' && (
              <div className="mt-2">
                <WritingLeaderboardDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                />
              </div>
            )}
            {selectedSection === 'selfInterview' && (
              <div className="mt-2">
                <SelfInterviewLeaderboardDashboard
                  year={selectedYear}
                  month={selectedMonth}
                  week={selectedWeek}
                />
              </div>
            )}
          </section>
        )}
      </>
    )
  }

  return (
    <>
      <PageMetaData title="Student Analytics" />

      <div className="container-fluid">

        {selectedSection === null ? renderSectionCards() : renderSelectedSection()}
      </div>
    </>
  )
}

export default StudentAnalyticsPage

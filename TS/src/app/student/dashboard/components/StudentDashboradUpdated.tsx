import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { useProfile } from '../components/hooks/useProfile'

import {
  quickStats,
  courses,
  grammarData,
  grammarRankByMode,
  grammarSkillRanks,
  grammarTrendData,
  selfPrep,
  weeklyProgressData,
  adminUpdates,
  attendanceByMonth,
} from './data/dashboard.data'

import HeroSection from './HeroSection'
import KPISection from './KPISection'
import QuickStats from './QuickStats'
import CourseProgress from './CourseProgress'
import EnglishSkills from './EnglishSkills'
import SelfPreparation from './SelfPreparation'
import WeeklyAnalytics from './WeeklyAnalytics'
import UpdatesAndStats from './UpdatesAndStats'
import MonthlyReport from './MonthlyReport'
import AttendanceCalendar from './AttendanceCalendar'

import { FaBookOpen, FaBullseye, FaTrophy, FaClock } from 'react-icons/fa'

const StudentDashboardUpdated: React.FC = () => {
  /* ================= HOOKS (NO CONDITIONS EVER) ================= */
  const { user } = useAuthContext()
  const { profile, loading } = useProfile()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedMonth, setSelectedMonth] = useState(2)
  const [dashboardSummary, setDashboardSummary] = useState<any>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)



  /* ================= EFFECT (ALWAYS RUNS) ================= */
  useEffect(() => {
    if (!user?.token) return

    setSummaryLoading(true)

    fetch(`${baseURL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => setDashboardSummary(data))
      .catch(() => setDashboardSummary(null))
      .finally(() => setSummaryLoading(false))
  }, [user?.token, baseURL])

  useEffect(() => {
    if (!user?.token) return

    setCoursesLoading(true)

    fetch(`${baseURL}/courses`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(res => res.json())
      .then(setAllCourses)
      .catch(() => setAllCourses([]))
      .finally(() => setCoursesLoading(false))

  }, [user?.token, baseURL])


  useEffect(() => {
    if (!user?.token) return

    setEnrollmentsLoading(true)

    fetch(`${baseURL}/enrollments/me`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        // Map backend enrollments → CourseProgress format
        const mapped = data.map((enroll: any, index: number) => {
          const progress = Number(enroll.courseProgress || 0)

          return {
            id: enroll.courseId._id,
            name: enroll.courseId.title,
            progress,
            status:
              progress === 0
                ? 'Not Started'
                : progress === 100
                  ? 'Completed'
                  : 'In Progress',
            color: 'linear-gradient(135deg, #ff7a00 0%, #ff9a3c 100%)',
          }
        })

        setEnrolledCourses(mapped)
      })
      .catch(() => setEnrolledCourses([]))
      .finally(() => setEnrollmentsLoading(false))
  }, [user?.token, baseURL])

  // ===== DERIVED: remaining courses =====
  const enrolledCourseIds = new Set(enrolledCourses.map(c => c.id))

  const remainingCourses = allCourses
    .filter(course => !enrolledCourseIds.has(course._id))
    .map(course => ({
      id: course._id,
      name: course.title,
      progress: 0,
      status: 'Not Enrolled',
      color: '#ff7a00',
    }))



  /* ================= RENDER GUARDS (SAFE) ================= */
  if (loading || summaryLoading || enrollmentsLoading) {
    return (
      <div className="text-center py-5">
        <Spinner
          animation="border"
          style={{ color: '#ff7a00' }}
        />
      </div>
    )
  }

  if (!profile || !dashboardSummary) {
    return <Alert
      style={{
        backgroundColor: 'rgba(255,122,0,0.1)',
        border: '1px solid #ff7a00',
        color: '#ff7a00',
      }}
    >
      Failed to load dashboard
    </Alert>
  }

  /* ================= DERIVED DATA ================= */
  const subtitle = [profile.skills?.[0] && `${profile.skills[0]} Developer`, profile.education?.[0], profile.college].filter(Boolean).join(' | ')

  const student = {
    name: profile.fullName || 'Student',
    completion: profile.completion || 0,
    subtitle,
  }

const kpis = [
  {
    label: 'Courses Available',
    value: dashboardSummary?.coursesAvailable?.value || 0,
    icon: FaClock,
    color: '#ff7a00',
    bgColor: 'rgba(255,122,0,0.1)',
    trend: dashboardSummary?.coursesAvailable?.trend || 0,
  },
  {
    label: 'Enrolled Courses',
    value: dashboardSummary?.enrolledCourses?.value || 0,
    icon: FaBookOpen,
    color: '#ff7a00',
    bgColor: 'rgba(255,122,0,0.1)',
    trend: dashboardSummary?.enrolledCourses?.trend || 0,
  },
  {
    label: 'Accuracy',
    value: dashboardSummary?.accuracy?.value || 0,
    icon: FaBullseye,
    color: '#ff7a00',
    bgColor: 'rgba(255,122,0,0.1)',
    trend: dashboardSummary?.accuracy?.trend || 0,
  },
  {
    label: 'Rank',
    value: dashboardSummary?.rank?.value || 0,
    icon: FaTrophy,
    color: '#ff7a00',
    bgColor: 'rgba(255,122,0,0.1)',
    trend: dashboardSummary?.rank?.trend || 0,
  },
]

  /* ================= JSX ================= */
  return (
    <Container
      fluid
      className="p-3 p-md-4"
      style={{
        background: '#ffffff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        minHeight: '100svh',
      }}>
      <HeroSection student={student} />
      <KPISection kpis={kpis} />

      <Row className="g-3 mb-4 align-items-stretch">
        <Col xs={12} lg={4} className="d-flex">
          <div style={{ height: '600px', display: 'flex', width: '100%' }}>
            <CourseProgress
              enrolledCourses={enrolledCourses}
              remainingCourses={remainingCourses}
            />
          </div>
        </Col>

        <Col xs={12} lg={4} className="d-flex">
          <div style={{ height: '600px', width: '100%' }}>
            <EnglishSkills />
          </div>
        </Col>

        <Col xs={12} lg={4} className="d-flex">
          <div style={{ height: '600px', width: '100%' }}>
            <SelfPreparation />
          </div>
        </Col>
      </Row>
      {/*   <MonthlyReport /> */}
    </Container>
  )
}

export default StudentDashboardUpdated

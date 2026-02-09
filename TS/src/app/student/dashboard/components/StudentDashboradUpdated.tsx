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
  fetch(`${baseURL}/courses`)
    .then(res => res.json())
    .then(setAllCourses)
    .catch(() => setAllCourses([]))
    .finally(() => setCoursesLoading(false))
}, [baseURL])


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
            color:
              index % 2 === 0
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
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
    color: '#64748b',
  }))



  /* ================= RENDER GUARDS (SAFE) ================= */
  if (loading || summaryLoading || enrollmentsLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
      </div>
    )
  }

  if (!profile || !dashboardSummary) {
    return <Alert variant="danger">Failed to load dashboard</Alert>
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
      value: dashboardSummary.coursesAvailable.value,
      icon: FaClock,
      color: 'primary',
      bgColor: 'rgba(13,110,253,.1)',
      trend: dashboardSummary.coursesAvailable.trend,
    },
    {
      label: 'Enrolled Courses',
      value: dashboardSummary.enrolledCourses.value,
      icon: FaBookOpen,
      color: 'success',
      bgColor: 'rgba(25,135,84,.1)',
      trend: dashboardSummary.enrolledCourses.trend,
    },
    {
      label: 'Accuracy',
      value: dashboardSummary.accuracy.value,
      icon: FaBullseye,
      color: 'warning',
      bgColor: 'rgba(255,193,7,.1)',
      trend: dashboardSummary.accuracy.trend,
    },
    {
      label: 'Rank',
      value: dashboardSummary.rank.value,
      icon: FaTrophy,
      color: 'info',
      bgColor: 'rgba(13,202,240,.1)',
      trend: dashboardSummary.rank.trend,
    },
  ]

  /* ================= JSX ================= */
  return (
    <Container
      fluid
      className="p-3 p-md-4"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100svh',
      }}>
      <HeroSection student={student} />
      <KPISection kpis={kpis} />
      <QuickStats />

      <Row className="g-3 mb-4">
        <Col xs={12} lg={4}>
         <CourseProgress
  enrolledCourses={enrolledCourses}
  remainingCourses={remainingCourses}
/>



        </Col>
        <Col xs={12} lg={4}>
          <EnglishSkills />
        </Col>
        <Col xs={12} lg={4}>
          <SelfPreparation />
        </Col>
      </Row>

      {/*  <Row className="g-3 mb-4">
        <Col xs={12} lg={8}>
          <WeeklyAnalytics data={weeklyProgressData} />
        </Col>
        <Col xs={12} lg={4}>
          <UpdatesAndStats updates={adminUpdates} />
        </Col>
      </Row>

      <Row className="g-3 mt-3">
        <Col xs={12} lg={8}>
          <MonthlyReport />
        </Col>
        <Col xs={12} lg={4}>
          <AttendanceCalendar
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
            attendanceByMonth={attendanceByMonth}
          />
        </Col>
      </Row> */}
    </Container>
  )
}

export default StudentDashboardUpdated

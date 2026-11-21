import { useEffect, useState } from 'react'
import { FaArrowDown, FaBookOpen, FaFire, FaLayerGroup, FaTrophy, FaUsers } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { EmptyState, Kpi, KpiRow, Loading, ModuleShell, Panel, RankList } from './moduleOverview/ModuleOverview'

type Course = {
  rank: number
  courseId: string
  title: string
  image: string | null
  count: number
}

/* Course Progress tab: which courses students enrol in most and least */
const CourseEnrollmentTrend = ({
  apiBase = '/api/institute',
  onFullDetails,
}: {
  apiBase?: string
  onFullDetails?: () => void
}) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [top, setTop] = useState<Course[]>([])
  const [bottom, setBottom] = useState<Course[]>([])
  const [totalCourses, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/trend/course-enrollment?top=10`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTop(data.topCourses || [])
          setBottom(data.bottomCourses || [])
          setTotal(data.totalCourses || 0)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase])

  const leader = top[0]
  const maxCount = Math.max(1, ...top.map((c) => c.count))
  const topEnrolments = top.reduce((s, c) => s + c.count, 0)
  const unpicked = bottom.filter((c) => c.count === 0).length

  return (
    <ModuleShell
      icon={FaBookOpen}
      color="#3b82f6"
      title="Course Progress"
      subtitle={`Enrolment across ${totalCourses} course${totalCourses !== 1 ? 's' : ''}`}
      onFullDetails={onFullDetails}
    >
      {loading ? <Loading /> : !totalCourses ? (
        <EmptyState text="No courses yet" hint="Published courses and their enrolments appear here." />
      ) : (
        <>
          <KpiRow>
            <Kpi icon={FaLayerGroup} label="Courses" value={totalCourses} hint="available to students" tone="accent" />
            <Kpi icon={FaFire} label="Most enrolled" value={leader?.count ?? 0} hint={leader?.title || '—'} tone="good" />
            <Kpi icon={FaUsers} label="Top 10 enrolments" value={topEnrolments} hint="in the 10 most popular courses" />
            <Kpi icon={FaArrowDown} label="Not picked yet" value={unpicked} hint={unpicked ? 'courses with no enrolment' : 'every course has learners'} tone={unpicked ? 'low' : 'good'} />
          </KpiRow>

          <div className="mo-grid-2">
            <Panel title="Most enrolled" icon={FaTrophy} tone="good" aside="students enrolled">
              <RankList
                tone="good"
                avatar="image"
                items={top.map((c) => ({ key: c.courseId, name: c.title, image: c.image, value: c.count, ratio: c.count / maxCount }))}
              />
            </Panel>
            <Panel title="Least enrolled" icon={FaArrowDown} tone="low" aside="worth promoting">
              <RankList
                tone="low"
                medals={false}
                avatar="image"
                items={bottom.map((c) => ({ key: c.courseId, name: c.title, image: c.image, value: c.count, sub: c.count ? undefined : 'No students yet' }))}
              />
            </Panel>
          </div>
        </>
      )}
    </ModuleShell>
  )
}

export default CourseEnrollmentTrend

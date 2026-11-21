import { useEffect, useState } from 'react'
import { FaArrowDown, FaChartBar, FaClock, FaMedal, FaUserGraduate, FaBolt } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { DayPicker, EmptyState, Kpi, KpiRow, Loading, ModuleShell, Panel, RankList, fmtMinutes, todayISO } from './moduleOverview/ModuleOverview'

type Performer = {
  rank: number
  userId: string
  name: string
  email: string
  minutes: number
  loginAt: string | null
}

/* Daily Engagement tab: time spent on the platform for one day, most and least active students */
const DailyTimePerformers = ({ apiBase = '/api/institute', onFullDetails }: { apiBase?: string; onFullDetails?: () => void }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [date, setDate] = useState(todayISO())
  const [top, setTop] = useState<Performer[]>([])
  const [bottom, setBottom] = useState<Performer[]>([])
  const [totalStudents, setTotal] = useState(0)
  const [totalMinutes, setTotalMin] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/trend/daily-time?date=${date}&top=10`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTop(data.topPerformers || [])
          setBottom(data.bottomPerformers || [])
          setTotal(data.totalStudents || 0)
          setTotalMin(data.totalMinutes ?? 0)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase, date])

  const leader = top[0]
  const maxMin = Math.max(1, ...top.map((p) => p.minutes))
  const avg = totalStudents ? Math.round(totalMinutes / totalStudents) : 0
  const activeInTop = top.filter((p) => p.minutes > 0).length
  const isToday = date === todayISO()

  return (
    <ModuleShell
      icon={FaChartBar}
      color="#f59e0b"
      title="Daily Engagement"
      subtitle={`Time students spent learning ${isToday ? 'today' : 'on this day'} · ${totalStudents} students`}
      controls={<DayPicker value={date} onChange={setDate} />}
      onFullDetails={onFullDetails}
      fullLabel="7-day report"
    >
      {loading ? <Loading /> : (
        <>
          <KpiRow>
            <Kpi icon={FaClock} label="Total time" value={fmtMinutes(totalMinutes)} hint={isToday ? 'across all students today' : 'across all students'} tone="accent" />
            <Kpi icon={FaUserGraduate} label="Students" value={totalStudents} hint="in your institute" />
            <Kpi icon={FaBolt} label="Avg per student" value={fmtMinutes(avg)} hint="total time ÷ students" tone={avg >= 30 ? 'good' : avg > 0 ? 'mid' : 'low'} />
            <Kpi icon={FaMedal} label="Top learner" value={leader && leader.minutes > 0 ? fmtMinutes(leader.minutes) : '—'} hint={leader && leader.minutes > 0 ? leader.name : 'no activity yet'} tone="good" />
          </KpiRow>

          {totalMinutes === 0 ? (
            <EmptyState text={isToday ? 'No learning activity yet today' : 'No learning activity on this day'} hint="Students show up here as soon as they spend time on Eklav." />
          ) : (
            <div className="mo-grid-2">
              <Panel title="Most active" icon={FaMedal} tone="good" aside={`${activeInTop} active`}>
                <RankList
                  tone="good"
                  items={top.map((p) => ({ key: p.userId, name: p.name, sub: p.email, value: fmtMinutes(p.minutes), ratio: p.minutes / maxMin }))}
                />
              </Panel>
              <Panel title="Least active" icon={FaArrowDown} tone="low" aside="needs a nudge">
                <RankList
                  tone="low"
                  medals={false}
                  items={bottom.map((p) => ({ key: p.userId, name: p.name, sub: p.email, value: fmtMinutes(p.minutes) }))}
                />
              </Panel>
            </div>
          )}
        </>
      )}
    </ModuleShell>
  )
}

export default DailyTimePerformers

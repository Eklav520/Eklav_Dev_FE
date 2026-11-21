import { useEffect, useState } from 'react'
import { FaChartLine, FaFileAlt, FaMicrophone, FaRedo, FaRobot, FaStar, FaUserCheck } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { EmptyState, Kpi, KpiRow, Loading, Meter, ModuleShell, MonthPicker, Panel } from './moduleOverview/ModuleOverview'

type TypeStats = { attempts: number; uniqueStudents: number; avgScore: number; utilizationPct: number }
type OverviewData = {
  totalStudents: number
  month: number
  year: number
  topicBased: TypeStats
  resumeBased: TypeStats
}

const TYPES = [
  { key: 'topicBased', label: 'Topic based interview', icon: FaMicrophone, color: '#a855f7', about: 'Practice on chosen subjects' },
  { key: 'resumeBased', label: 'Resume based interview', icon: FaFileAlt, color: '#f59e0b', about: 'Questions from the student’s own resume' },
] as const

/* AI Interview tab: how many students practised mock interviews in a month, by interview type */
const AIInterviewWidget = ({ apiBase = '/api/institute', onFullDetails }: { apiBase?: string; onFullDetails?: () => void }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/ai-interview-overview?month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d.success ? d : null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase, month, year])

  const attempts = data ? data.topicBased.attempts + data.resumeBased.attempts : 0
  // A student can do both types, so the larger of the two is the safe "at least" count
  const active = data ? Math.max(data.topicBased.uniqueStudents, data.resumeBased.uniqueStudents) : 0
  const scored = data ? [data.topicBased, data.resumeBased].filter((t) => t.avgScore > 0) : []
  const avgScore = scored.length ? Math.round(scored.reduce((s, t) => s + t.avgScore, 0) / scored.length) : 0
  const reach = data?.totalStudents ? Math.round((active / data.totalStudents) * 100) : 0
  const topKey = data && attempts ? (data.topicBased.utilizationPct >= data.resumeBased.utilizationPct ? 'topicBased' : 'resumeBased') : null

  return (
    <ModuleShell
      icon={FaRobot}
      color="#a855f7"
      title="AI Based Interview"
      subtitle={data ? `Mock interview practice · ${data.totalStudents} students` : 'Mock interview practice'}
      controls={<MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />}
      onFullDetails={onFullDetails}
    >
      {loading ? <Loading /> : !data ? <EmptyState text="Couldn't load interview data" hint="Try another month or refresh the page." /> : (
        <>
          <KpiRow>
            <Kpi icon={FaUserCheck} label="Students practised" value={active} hint={`${reach}% of ${data.totalStudents} students`} tone={reach >= 50 ? 'good' : reach > 0 ? 'mid' : 'low'} />
            <Kpi icon={FaRedo} label="Interviews taken" value={attempts} hint={active ? `${(attempts / active).toFixed(1)} per active student` : 'none this month'} tone="accent" />
            <Kpi icon={FaStar} label="Average score" value={avgScore ? avgScore : '—'} hint={avgScore ? 'across both interview types' : 'no scored interviews'} />
            <Kpi icon={FaChartLine} label="Not practised" value={Math.max(0, data.totalStudents - active)} hint="students yet to try" tone="low" />
          </KpiRow>

          {!attempts ? (
            <EmptyState text="No mock interviews this month" hint="Encourage students to try a topic or resume based interview." />
          ) : (
            <Panel title="By interview type" icon={FaRobot} tone="accent" aside="share of students who practised">
              <div className="mo-meters">
                {TYPES.map(({ key, label, icon, color, about }) => {
                  const s = data[key]
                  return (
                    <Meter
                      key={key}
                      icon={icon}
                      label={label}
                      color={color}
                      pct={s.utilizationPct}
                      value={`${s.utilizationPct}%`}
                      highlight={topKey === key}
                      detail={<>{about} · <b>{s.uniqueStudents}</b> students · <b>{s.attempts}</b> interviews{s.avgScore > 0 && <> · avg score <b>{s.avgScore}</b></>}</>}
                    />
                  )
                })}
              </div>
            </Panel>
          )}
        </>
      )}
    </ModuleShell>
  )
}

export default AIInterviewWidget

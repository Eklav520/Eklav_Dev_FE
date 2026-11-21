import { useEffect, useState } from 'react'
import { FaBolt, FaBook, FaCheckDouble, FaHeadphones, FaLanguage, FaMicrophone, FaPencilAlt, FaTrophy, FaUserCheck, FaBullseye } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { EmptyState, Kpi, KpiRow, Loading, Meter, ModuleShell, MonthPicker, Panel } from './moduleOverview/ModuleOverview'

type SkillStat = { utilized: number; capacity: number; utilizationPct: number; avgScore: number }
type OverviewData = {
  totalStudents: number
  approvedStudents: number
  monthlyCapacity: number
  monthKey: string | null
  skills: { speaking: SkillStat; writing: SkillStat; reading: SkillStat; listening: SkillStat; jam: SkillStat }
}

const SKILLS = [
  { key: 'speaking', label: 'Speaking', icon: FaMicrophone, color: '#3b82f6' },
  { key: 'writing', label: 'Writing', icon: FaPencilAlt, color: '#f59e0b' },
  { key: 'reading', label: 'Reading', icon: FaBook, color: '#22c55e' },
  { key: 'listening', label: 'Listening', icon: FaHeadphones, color: '#a855f7' },
  { key: 'jam', label: 'Just a Minute', icon: FaBolt, color: '#ef4444' },
] as const

/* English Practice tab: how much of the month's practice allowance each skill used */
const EnglishPracticeWidget = ({ apiBase = '/api/institute', onFullDetails }: { apiBase?: string; onFullDetails?: () => void }) => {
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
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    fetch(`${baseURL}${apiBase}/english-practice-overview?monthKey=${monthKey}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d.success ? d : null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase, month, year])

  const used = data ? SKILLS.reduce((s, k) => s + (data.skills[k.key]?.utilized || 0), 0) : 0
  const capacity = data ? SKILLS.reduce((s, k) => s + (data.skills[k.key]?.capacity || 0), 0) : 0
  const usedPct = capacity ? Math.round((used / capacity) * 100) : 0
  const ranked = data ? [...SKILLS].sort((a, b) => (data.skills[b.key]?.utilizationPct ?? 0) - (data.skills[a.key]?.utilizationPct ?? 0)) : []
  const topSkill = data && used ? ranked[0] : null
  const lowSkill = data && used ? ranked[ranked.length - 1] : null

  return (
    <ModuleShell
      icon={FaLanguage}
      color="#22c55e"
      title="English Practice"
      subtitle="Speaking · Writing · Reading · Listening · Just a Minute"
      controls={<MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y) }} />}
      onFullDetails={onFullDetails}
    >
      {loading ? <Loading /> : !data ? <EmptyState text="Couldn't load English practice data" hint="Try another month or refresh the page." /> : (
        <>
          <KpiRow>
            <Kpi icon={FaUserCheck} label="Students with access" value={data.approvedStudents} hint={`of ${data.totalStudents} students`} tone="accent" />
            <Kpi icon={FaCheckDouble} label="Practice sessions" value={used.toLocaleString()} hint={`of ${capacity.toLocaleString()} available this month`} />
            <Kpi icon={FaBullseye} label="Allowance used" value={`${usedPct}%`} hint="across all five skills" tone={usedPct >= 50 ? 'good' : usedPct > 0 ? 'mid' : 'low'} />
            <Kpi icon={FaTrophy} label="Most practised" value={topSkill ? topSkill.label : '—'} hint={lowSkill && lowSkill !== topSkill ? `least: ${lowSkill.label}` : 'no practice yet'} tone="good" />
          </KpiRow>

          {!data.approvedStudents ? (
            <EmptyState text="No students have English practice access yet" hint="Approve students for the English module to start tracking." />
          ) : (
            <Panel title="Usage by skill" icon={FaLanguage} tone="accent" aside="sessions used of this month’s allowance">
              <div className="mo-meters">
                {ranked.map(({ key, label, icon, color }) => {
                  const s = data.skills[key]
                  return (
                    <Meter
                      key={key}
                      icon={icon}
                      label={label}
                      color={color}
                      pct={s.utilizationPct}
                      value={`${s.utilizationPct}%`}
                      highlight={topSkill?.key === key}
                      detail={<><b>{s.utilized.toLocaleString()}</b> of {s.capacity.toLocaleString()} sessions{s.avgScore > 0 && <> · avg score <b>{s.avgScore}</b></>}</>}
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

export default EnglishPracticeWidget

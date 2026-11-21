import { useEffect, useState } from 'react'
import { FaCheckDouble, FaCode, FaFire, FaLayerGroup, FaPuzzlePiece, FaUserGraduate } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { EmptyState, Kpi, KpiRow, Loading, Meter, ModuleShell, Panel, RankList } from './moduleOverview/ModuleOverview'

type DiffBreakdown = { Easy: number; Medium: number; Hard: number }
type TrendPoint = { date: string; count: number }
type TopProblem = { problemId: string; title: string; count: number; difficulty: string }
type TotalProblems = { Easy: number; Medium: number; Hard: number; total: number }
type OverviewData = {
  totalCompleted: number
  uniqueStudents: number
  uniqueProblems: number
  totalProblems: TotalProblems
  diffBreakdown: DiffBreakdown
  trend: TrendPoint[]
  topProblems: TopProblem[]
}

const DIFF_COLOR: Record<string, string> = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }

/* Code Challenge tab: problems solved, by difficulty, with the recent daily trend */
const CodeChallengeWidget = ({ apiBase = '/api/adminDashboardCharts', onFullDetails }: { apiBase?: string; onFullDetails?: () => void }) => {
  const { user } = useAuthContext() as any
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}${apiBase}/code-challenge-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); else setError(d.message || 'Failed') })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [apiBase, baseURL, user?.token])

  const trend = (data?.trend || []).slice(-14)
  const maxDay = Math.max(1, ...trend.map((t) => t.count))
  const trendTotal = trend.reduce((s, t) => s + t.count, 0)
  const maxTop = Math.max(1, ...(data?.topProblems || []).map((p) => p.count))

  return (
    <ModuleShell
      icon={FaCode}
      color="#6366f1"
      title="Code Challenge"
      subtitle="Coding problems solved · Easy, Medium and Hard"
      onFullDetails={onFullDetails}
    >
      {loading ? <Loading /> : error || !data ? <EmptyState text="Couldn't load code challenge data" hint={error || 'Refresh the page to try again.'} /> : (
        <>
          <KpiRow>
            <Kpi icon={FaLayerGroup} label="Problems available" value={data.totalProblems?.total ?? 0} hint={`${data.totalProblems?.Easy ?? 0} easy · ${data.totalProblems?.Medium ?? 0} medium · ${data.totalProblems?.Hard ?? 0} hard`} tone="accent" />
            <Kpi icon={FaCheckDouble} label="Solutions submitted" value={data.totalCompleted} hint="problems solved by students" tone="good" />
            <Kpi icon={FaUserGraduate} label="Students coding" value={data.uniqueStudents} hint={data.uniqueStudents ? `${(data.totalCompleted / data.uniqueStudents).toFixed(1)} solved each` : 'nobody yet'} />
            <Kpi icon={FaPuzzlePiece} label="Problems attempted" value={data.uniqueProblems} hint={data.totalProblems?.total ? `${Math.round((data.uniqueProblems / data.totalProblems.total) * 100)}% of the problem bank` : '—'} />
          </KpiRow>

          <div className="mo-grid-3-2">
            <Panel title="Last 14 days" icon={FaFire} tone="accent" aside={`${trendTotal} solved`}>
              {trend.length ? (
                <div className="is-pad">
                  <div className="mo-cols">
                    {trend.map((t) => {
                      const d = new Date(t.date)
                      return (
                        <div key={t.date} className={`mo-col${t.count ? '' : ' is-zero'}`} title={`${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${t.count} solved`}>
                          {t.count > 0 && <em>{t.count}</em>}
                          <i style={{ height: `${(t.count / maxDay) * 100}%` }} />
                          <small>{d.getDate()}</small>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : <EmptyState text="No submissions in the last 14 days" compact />}
            </Panel>

            <Panel title="By difficulty" icon={FaLayerGroup} aside="solved of available">
              <div className="mo-meters">
                {(['Easy', 'Medium', 'Hard'] as const).map((d) => {
                  const avail = data.totalProblems?.[d] || 0
                  const solved = data.diffBreakdown[d] || 0
                  const pct = avail ? Math.round((solved / avail) * 100) : 0
                  return <Meter key={d} label={d} color={DIFF_COLOR[d]} pct={pct} value={`${solved}`} detail={<>of <b>{avail}</b> problems · {pct}%</>} />
                })}
              </div>
            </Panel>
          </div>

          {data.topProblems?.length > 0 && (
            <Panel title="Most solved problems" icon={FaCode} tone="accent" aside="times solved">
              <RankList
                tone="accent"
                avatar="none"
                items={data.topProblems.slice(0, 8).map((p) => ({
                  key: p.problemId,
                  name: p.title,
                  value: p.count,
                  ratio: p.count / maxTop,
                  badge: <span className="mo-chip" style={{ ['--mo-c' as string]: DIFF_COLOR[p.difficulty] || '#8a9097' }}>{p.difficulty}</span>,
                }))}
              />
            </Panel>
          )}
        </>
      )}
    </ModuleShell>
  )
}

export default CodeChallengeWidget

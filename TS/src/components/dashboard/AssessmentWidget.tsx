import { useEffect, useState } from 'react'
import { FaArrowDown, FaCheckCircle, FaClipboardList, FaPercentage, FaTimesCircle, FaTrophy, FaUsers } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import { EmptyState, Kpi, KpiRow, Loading, ModuleShell, Panel, RankList } from './moduleOverview/ModuleOverview'

type Scorer = { name: string; email: string; percentage: number; score: number; resultStatus: string }
type AssessmentItem = {
  examId: string; title: string; createdAt: string
  total: number; passed: number; failed: number; avgPercentage: number
  topScorers: Scorer[]; lowScorers: Scorer[]
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/* Assessments tab: results of one exam (latest by default) */
const AssessmentWidget = ({ apiBase = '/api/institute', onFullDetails }: { apiBase?: string; onFullDetails?: () => void }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [data, setData] = useState<AssessmentItem[]>([])
  const [examId, setExamId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.token) return
    fetch(`${baseURL}${apiBase}/assessment-overview`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.assessments || []) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.token, baseURL, apiBase])

  const exam = data.find((a) => a.examId === examId) || data[0] || null
  const pending = exam ? Math.max(0, exam.total - exam.passed - exam.failed) : 0
  const passRate = exam?.total ? Math.round((exam.passed / exam.total) * 100) : 0

  const picker = data.length > 1 && (
    <select className="mo-select" value={exam?.examId || ''} onChange={(e) => setExamId(e.target.value)} aria-label="Choose an assessment">
      {data.map((a, i) => <option key={a.examId} value={a.examId}>{i === 0 ? 'Latest · ' : ''}{a.title}</option>)}
    </select>
  )

  return (
    <ModuleShell
      icon={FaClipboardList}
      color="#06b6d4"
      title="Assessments"
      subtitle={exam ? <>{exam.title} · held {fmtDate(exam.createdAt)}</> : 'Exam results · MCQ, Coding, Technical and HR rounds'}
      controls={picker}
      onFullDetails={onFullDetails}
    >
      {loading ? <Loading /> : !exam ? (
        <EmptyState text="No assessments yet" hint="Results show up here once students take an exam." />
      ) : (
        <>
          <KpiRow>
            <Kpi icon={FaUsers} label="Attended" value={exam.total} hint="students took this exam" tone="accent" />
            <Kpi icon={FaCheckCircle} label="Passed" value={exam.passed} hint={`${passRate}% pass rate`} tone="good" />
            <Kpi icon={FaTimesCircle} label="Failed" value={exam.failed} hint={pending ? `${pending} awaiting result` : 'all results in'} tone="low" />
            <Kpi icon={FaPercentage} label="Average score" value={`${exam.avgPercentage}%`} hint="across all attendees" tone={exam.avgPercentage >= 60 ? 'good' : exam.avgPercentage >= 40 ? 'mid' : 'low'} />
          </KpiRow>

          {exam.total > 0 && (
            <div className="mo-panel"><div className="is-pad">
              <div className="mo-stack">
                <i style={{ width: `${(exam.passed / exam.total) * 100}%`, background: '#22c55e' }} />
                <i style={{ width: `${(exam.failed / exam.total) * 100}%`, background: '#ef4444' }} />
                <i style={{ width: `${(pending / exam.total) * 100}%`, background: '#3a3e43' }} />
              </div>
              <div className="mo-legend">
                <span style={{ ['--c' as string]: '#22c55e' }}>Passed {exam.passed}</span>
                <span style={{ ['--c' as string]: '#ef4444' }}>Failed {exam.failed}</span>
                {pending > 0 && <span style={{ ['--c' as string]: '#3a3e43' }}>Awaiting {pending}</span>}
              </div>
            </div></div>
          )}

          <div className="mo-grid-2">
            <Panel title="Top scorers" icon={FaTrophy} tone="good">
              <RankList
                tone="good"
                empty="No scores yet"
                items={exam.topScorers.map((s, i) => ({ key: `${s.email}-${i}`, name: s.name, sub: s.email, value: `${s.percentage}%`, ratio: s.percentage / 100 }))}
              />
            </Panel>
            <Panel title="Need improvement" icon={FaArrowDown} tone="low">
              <RankList
                tone="low"
                medals={false}
                empty="No scores yet"
                items={exam.lowScorers.map((s, i) => ({ key: `${s.email}-${i}`, name: s.name, sub: s.email, value: `${s.percentage}%`, ratio: s.percentage / 100 }))}
              />
            </Panel>
          </div>
        </>
      )}
    </ModuleShell>
  )
}

export default AssessmentWidget

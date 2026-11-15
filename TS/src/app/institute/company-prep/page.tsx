import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import * as XLSX from 'xlsx'
import {
  FaBuilding, FaCheckCircle, FaClipboardList, FaClock, FaDownload, FaExclamationTriangle, FaEye, FaSpinner, FaTimes,
  FaTrophy, FaUserGraduate, FaUsers, FaChartLine, FaDesktop, FaTimesCircle,
} from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, AdminSelect, EmptyState, PageHeader, SearchInput, StatCards, Tabs, initialsOf } from '@/components/admin-ui'

/* Institute admin → Company Preparation results
   Companies the Eklav admin enabled for this institute → each exam → every student's result. */

type Level = 'Easy' | 'Medium' | 'Hard'
type ExamRow = { _id: string; title: string; level: Level; durationMins: number; questionCount: number; totalMarks: number; students: number; attempts: number; avgBest: number | null; topScore: number | null; passed: number }
type CompanyRow = { _id: string; name: string; logoUrl?: string; isActive: boolean; enabledAt: string | null; exams: ExamRow[]; students: number; attempts: number; avg: number | null }
type Overview = { institute: { name: string }; passPct: number; totals: { companies: number; exams: number; totalStudents: number; studentsAttempted: number; attempts: number; avg: number | null }; companies: CompanyRow[] }
type AttemptLite = { attemptId: string; percentage: number; score: number; totalMarks: number; submittedAt: string; timeTakenSecs: number; tabSwitches: number; autoSubmitted: boolean; correctCount: number; questionCount: number; sectionScores: { section: string; score: number; total: number }[] }
type StudentRow = { studentId: string; name: string; email: string; rollNumber: string; branch: string; attempts: number; inProgress: boolean; best: AttemptLite | null; latest: AttemptLite | null }
type ExamResults = { passPct: number; company: { name: string; logoUrl?: string }; exam: { _id: string; title: string; level: Level; durationMins: number; sections: string[]; questionCount: number; totalMarks: number }; students: StudentRow[]; notAttempted: { studentId: string; name: string; email: string; rollNumber: string; branch: string }[] }
type AttemptDetail = {
  student: { name: string; email?: string; rollNumber?: string; branch?: string }
  exam: { title: string; level: Level; durationMins: number }
  attempt: { score: number; totalMarks: number; percentage: number; correctCount: number; questionCount: number; sectionScores: { section: string; score: number; total: number; correct: number; count: number }[]; submittedAt: string; timeTakenSecs: number; tabSwitches: number; autoSubmitted: boolean }
  answers: { n: number; section: string; type: 'mcq' | 'fill' | 'coding'; marks: number; marksAwarded: number; isCorrect: boolean; question: string; yourAnswer: string; correctAnswer: string; code?: string; language?: string }[]
}

type Show = 'all' | 'passed' | 'failed' | 'violations' | 'clean' | 'retakes' | 'progress'
type Sort = 'top' | 'low' | 'violations' | 'fastest' | 'attempts' | 'recent' | 'name'
const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'top', label: 'Top scores' }, { value: 'low', label: 'Lowest scores' }, { value: 'violations', label: 'Most violations' },
  { value: 'fastest', label: 'Fastest attempt' }, { value: 'attempts', label: 'Most attempts' }, { value: 'recent', label: 'Latest attempt' },
  { value: 'name', label: 'Name (A–Z)' },
]

const LEVEL_BADGE:Record<Level, string> = { Easy: 'aui-badge-green', Medium: 'aui-badge-amber', Hard: 'aui-badge-red' }
const pctBadge = (p: number | null | undefined) => (p == null ? 'aui-badge-muted' : p >= 75 ? 'aui-badge-green' : p >= 50 ? 'aui-badge-amber' : 'aui-badge-red')
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
const fmtDur = (s?: number) => { if (!s) return '—'; const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${s % 60}s` }

const InstituteCompanyPrepPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const get = async <T,>(path: string): Promise<T> => {
    const res = await fetch(`${baseURL}/api/institute/company-prep${path}`, { headers: { Authorization: `Bearer ${user?.token}` } })
    const d = await res.json().catch(() => ({}))
    if (!res.ok || d.success === false) throw new Error(d.message || 'Request failed')
    return d
  }

  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')
  const [examId, setExamId] = useState('')
  const [results, setResults] = useState<ExamResults | null>(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [tab, setTab] = useState<'attempted' | 'pending'>('attempted')
  const [search, setSearch] = useState('')
  const [show, setShow] = useState<Show>('all')
  const [sort, setSort] = useState<Sort>('top')
  const [branch, setBranch] = useState('')
  const [detailId, setDetailId] = useState('')
  const [detail, setDetail] = useState<AttemptDetail | null>(null)

  useEffect(() => {
    if (!user?.token) return
    get<Overview>('/overview').then(setData).catch(e => setError(e.message))
  }, [user?.token]) // eslint-disable-line

  const openExam = async (id: string) => {
    setExamId(id); setResults(null); setTab('attempted'); setSearch(''); setShow('all'); setSort('top'); setBranch(''); setResultsLoading(true)
    try { setResults(await get<ExamResults>(`/exams/${id}/results`)) } catch (e: any) { setError(e.message); setExamId('') } finally { setResultsLoading(false) }
  }
  const openAttempt = async (id: string) => {
    setDetailId(id); setDetail(null)
    try { setDetail(await get<AttemptDetail>(`/attempts/${id}`)) } catch (e: any) { setError(e.message); setDetailId('') }
  }

  const q = search.trim().toLowerCase()
  const match = (s: { name: string; email: string; rollNumber: string; branch: string }) =>
    (!branch || s.branch === branch) && (!q || `${s.name} ${s.email} ${s.rollNumber} ${s.branch}`.toLowerCase().includes(q))
  const attempted = useMemo(() => (results?.students || []).filter(s => s.attempts > 0 || s.inProgress), [results])
  const branches = useMemo(() => {
    const all = [...(results?.students || []), ...(results?.notAttempted || [])].map(s => s.branch).filter(Boolean)
    return [...new Set(all)].sort()
  }, [results])
  const passPct = results?.passPct || 60
  const isShown = (s: StudentRow, v: Show) => {
    const b = s.best
    switch (v) {
      case 'passed': return !!b && b.percentage >= passPct
      case 'failed': return !!b && b.percentage < passPct
      case 'violations': return !!b && b.tabSwitches > 0
      case 'clean': return !!b && !b.tabSwitches
      case 'retakes': return s.attempts > 1
      case 'progress': return s.inProgress
      default: return true
    }
  }
  const rankOf = useMemo(() => new Map(attempted.filter(s => s.best).map((s, i) => [s.studentId, i + 1])), [attempted])
  const sorters: Record<Sort, (a: StudentRow, b: StudentRow) => number> = {
    top: (a, b) => (rankOf.get(a.studentId) ?? 1e9) - (rankOf.get(b.studentId) ?? 1e9),
    low: (a, b) => (a.best?.percentage ?? 1e9) - (b.best?.percentage ?? 1e9),
    violations: (a, b) => (b.best?.tabSwitches ?? -1) - (a.best?.tabSwitches ?? -1),
    fastest: (a, b) => (a.best?.timeTakenSecs || 1e9) - (b.best?.timeTakenSecs || 1e9),
    attempts: (a, b) => b.attempts - a.attempts,
    recent: (a, b) => new Date(b.latest?.submittedAt || 0).getTime() - new Date(a.latest?.submittedAt || 0).getTime(),
    name: (a, b) => a.name.localeCompare(b.name),
  }
  const visibleAttempted = attempted.filter(s => match(s) && isShown(s, show)).sort(sorters[sort])
  const visiblePending = (results?.notAttempted || []).filter(match)
  const filtersOn = show !== 'all' || sort !== 'top' || !!branch || !!q
  const clearFilters = () => { setShow('all'); setSort('top'); setBranch(''); setSearch('') }
  const showCount = (v: Show) => attempted.filter(s => isShown(s, v)).length
  const showOptions = ([
    ['all', 'All students'], ['passed', `Passed (${passPct}%+)`], ['failed', `Below ${passPct}%`], ['violations', 'With violations'],
    ['clean', 'No violations'], ['retakes', 'Retook the paper'], ['progress', 'In progress'],
  ] as [Show, string][]).map(([value, label]) => { const n = showCount(value); return { value, label: `${label} · ${n} student${n === 1 ? '' : 's'}` } })
  const pickKpi = (v: Show, s: Sort = 'top') => { setTab('attempted'); setShow(show === v && sort === s ? 'all' : v); setSort(s) }
  const examStats = useMemo(() => {
    const done = (results?.students || []).filter(s => s.best)
    const vals = done.map(s => s.best!.percentage)
    return {
      attempted: done.length,
      avg: vals.length ? Math.round(vals.reduce((t, v) => t + v, 0) / vals.length) : null,
      top: vals.length ? Math.round(Math.max(...vals)) : null,
      passed: vals.filter(v => v >= (results?.passPct || 60)).length,
    }
  }, [results])

  const exportExcel = () => {
    if (!results) return
    const rows = [
      ...results.students.filter(s => s.best).map((s, i) => ({
        Rank: i + 1, Name: s.name, Email: s.email, 'Roll No': s.rollNumber, Branch: s.branch,
        'Best %': Math.round(s.best!.percentage), 'Best score': `${s.best!.score}/${s.best!.totalMarks}`,
        'Score %': s.latest ? Math.round(s.latest.percentage) : '', Attempts: s.attempts,
        'Attempt Time': fmtDur(s.best!.timeTakenSecs), Violations: s.best!.tabSwitches,
        ...Object.fromEntries((s.best!.sectionScores || []).map(sec => [sec.section, `${sec.score}/${sec.total}`])),
        'Last attempt': fmtDate(s.latest?.submittedAt),
      })),
      ...results.notAttempted.map(s => ({ Rank: '', Name: s.name, Email: s.email, 'Roll No': s.rollNumber, Branch: s.branch, 'Best %': 'Not attempted' })),
    ]
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Results')
    XLSX.writeFile(wb, `${results.company.name} - ${results.exam.title} - results.xlsx`)
  }

  const t = data?.totals
  return (
    <>
      <PageMetaData title="Company Preparation Results" />
      <AdminPage>
        <PageHeader
          icon={FaBuilding}
          title="Company Preparation"
          subtitle={data ? `${data.institute.name} · student results for company practice papers` : 'Student results for company practice papers'}
          stats={<StatCards inline loading={!data} items={[
            { label: 'Companies', value: t?.companies ?? 0, icon: FaBuilding, tone: 'orange' },
            { label: 'Papers', value: t?.exams ?? 0, icon: FaClipboardList, tone: 'blue' },
            { label: 'Students attempted', value: t ? `${t.studentsAttempted}/${t.totalStudents}` : 0, icon: FaUsers, tone: 'purple' },
            { label: 'Average score', value: t?.avg != null ? `${t.avg}%` : '—', icon: FaChartLine, tone: 'green' },
          ]} />}
        />

        {error && <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span><button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={10} /></button></div>}

        {!data ? (
          <div className="aui-card icp-loading"><FaSpinner className="aui-spin" /> Loading…</div>
        ) : data.companies.length === 0 ? (
          <div className="aui-card"><EmptyState icon={FaBuilding} title="No company papers yet" text="Company preparation hasn't been enabled for your institute. Contact Eklav to request companies like TCS or Infosys." /></div>
        ) : (
          data.companies.map(c => (
            <section key={c._id} className="aui-card icp-company">
              <div className="icp-company-head">
                <span className="icp-logo">{c.logoUrl ? <img src={c.logoUrl} alt="" /> : <b>{initialsOf(c.name)}</b>}</span>
                <div className="icp-company-title">
                  <h3>{c.name} {!c.isActive && <span className="aui-badge aui-badge-muted">Hidden by Eklav</span>}</h3>
                  <p>{c.exams.length} paper{c.exams.length === 1 ? '' : 's'} · enabled {fmtDate(c.enabledAt)}</p>
                </div>
                <div className="icp-company-stats">
                  <div><b>{c.students}</b><span>Students</span></div>
                  <div><b>{c.attempts}</b><span>Attempts</span></div>
                  <div><b>{c.avg != null ? `${c.avg}%` : '—'}</b><span>Average</span></div>
                </div>
              </div>
              {c.exams.length === 0 ? <p className="icp-muted">No published papers yet.</p> : (
                <div className="aui-table-scroll">
                  <table className="aui-table">
                    <thead><tr><th>Paper</th><th>Level</th><th>Students attempted</th><th>Attempts</th><th>Avg (best)</th><th>Top score</th><th>Passed ({data.passPct}%+)</th><th className="text-end">Results</th></tr></thead>
                    <tbody>
                      {c.exams.map(e => {
                        const share = t?.totalStudents ? Math.round((e.students / t.totalStudents) * 100) : 0
                        return (
                          <tr key={e._id}>
                            <td><b className="icp-strong">{e.title}</b><small className="icp-muted icp-block">{e.questionCount} questions · {e.totalMarks} marks · {e.durationMins} min</small></td>
                            <td><span className={`aui-badge ${LEVEL_BADGE[e.level]}`}>{e.level}</span></td>
                            <td>
                              <div className="icp-share"><b>{e.students}</b><span className="icp-muted">/ {t?.totalStudents ?? 0}</span></div>
                              <div className="icp-bar"><span style={{ width: `${share}%` }} /></div>
                            </td>
                            <td>{e.attempts}</td>
                            <td>{e.avgBest != null ? <span className={`aui-badge ${pctBadge(e.avgBest)}`}>{e.avgBest}%</span> : '—'}</td>
                            <td>{e.topScore != null ? `${e.topScore}%` : '—'}</td>
                            <td>{e.students ? `${e.passed} / ${e.students}` : '—'}</td>
                            <td className="text-end"><button type="button" className="aui-btn aui-btn-sm" onClick={() => openExam(e._id)}><FaEye size={11} /> View results</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))
        )}
      </AdminPage>

      {/* ── Exam results ── */}
      <Modal show={!!examId} onHide={() => setExamId('')} centered size="xl" dialogClassName="icp-dialog" contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-page icp-results">
          <div className="aui-modal-head">
            <span className="icp-logo icp-logo-sm">{results?.company.logoUrl ? <img src={results.company.logoUrl} alt="" /> : <b>{initialsOf(results?.company.name || '?')}</b>}</span>
            <div>
              <h3>{results ? results.exam.title : 'Loading…'} {results && <span className={`aui-badge ${LEVEL_BADGE[results.exam.level]}`}>{results.exam.level}</span>}</h3>
              <p>{results ? `${results.company.name} · ${results.exam.questionCount} questions · ${results.exam.totalMarks} marks · ${results.exam.durationMins} min` : ''}</p>
            </div>
            {results && !resultsLoading && (
                  <div className="icp-kpis icp-kpis-head">
                    <button type="button" title="Show everyone who attempted" className={tab === 'attempted' && show === 'all' && sort === 'top' ? 'is-on' : ''} onClick={() => { setTab('attempted'); clearFilters() }}><FaUserGraduate /><b>{examStats.attempted}</b><span>Attempted</span></button>
                    <button type="button" title="Show students who haven't attempted" className={tab === 'pending' ? 'is-on' : ''} onClick={() => setTab('pending')}><FaClock /><b>{results.notAttempted.length}</b><span>Not attempted</span></button>
                    <button type="button" title={`Show students below ${passPct}%`} className={tab === 'attempted' && show === 'failed' ? 'is-on' : ''} onClick={() => pickKpi('failed', 'low')}><FaChartLine /><b>{examStats.avg != null ? `${examStats.avg}%` : '—'}</b><span>Average (best)</span></button>
                    <button type="button" title="Sort by top scores" onClick={() => { setTab('attempted'); setShow('all'); setSort('top') }}><FaTrophy /><b>{examStats.top != null ? `${examStats.top}%` : '—'}</b><span>Top score</span></button>
                    <button type="button" title={`Show students who passed (${passPct}%+)`} className={tab === 'attempted' && show === 'passed' ? 'is-on' : ''} onClick={() => pickKpi('passed')}><FaCheckCircle /><b>{examStats.attempted ? `${examStats.passed}/${examStats.attempted}` : '—'}</b><span>Passed ({results.passPct}%+)</span></button>
                  </div>
            )}
            {results && <button type="button" className="aui-btn aui-btn-sm icp-export" onClick={exportExcel}><FaDownload size={10} /> Export Excel</button>}
            <button type="button" className="aui-icon-btn" onClick={() => setExamId('')} aria-label="Close"><FaTimes size={12} /></button>
          </div>
          <div className="aui-modal-body icp-results-body">
            {resultsLoading || !results ? <div className="icp-loading"><FaSpinner className="aui-spin" /> Loading results…</div> : (
              <>
                <div className="aui-toolbar icp-toolbar">
                  <Tabs small value={tab} onChange={setTab} label="Students" items={[
                    { value: 'attempted', label: 'Attempted', icon: FaCheckCircle, count: attempted.length },
                    { value: 'pending', label: 'Not attempted', icon: FaClock, count: results.notAttempted.length },
                  ]} />
                  <div className="aui-toolbar-filters">
                    {tab === 'attempted' && <>
                      <AdminSelect label="Show" prefix="Show:" value={show} options={showOptions} onChange={v => setShow(v as Show)} />
                      <AdminSelect label="Sort by" prefix="Sort:" value={sort} options={SORT_OPTIONS} onChange={v => setSort(v as Sort)} />
                    </>}
                    {branches.length > 1 && <AdminSelect label="Branch" prefix="Branch:" value={branch} options={[{ value: '', label: 'All' }, ...branches.map(b => ({ value: b, label: b }))]} onChange={setBranch} />}
                    {filtersOn && <button type="button" className="aui-btn aui-btn-sm icp-clear" onClick={clearFilters}><FaTimes size={9} /> Clear</button>}
                    <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, roll no or branch…" />
                  </div>
                </div>

                {tab === 'attempted' ? (
                  visibleAttempted.length === 0 ? <EmptyState icon={FaUsers} title={attempted.length ? 'No student matches' : 'No attempts yet'} text={attempted.length ? 'Try another search.' : 'Results will appear here as students submit this paper.'} /> : (
                    <div className="aui-table-scroll">
                      {filtersOn && <p className="icp-showing">Showing {visibleAttempted.length} of {attempted.length} students</p>}
                      <table className="aui-table icp-table">
                        <thead>
                          <tr>
                            <th style={{ width: 50 }}>Rank</th><th>Student</th><th title="Highest score across all attempts (marks scored / total marks)">Best score</th>
                            {results.exam.sections.map(sec => <th key={sec}>{sec}</th>)}
                            <th title="Score of the most recent attempt">Score</th><th>Attempts</th><th>Attempt Time</th><th title="Times the student left the exam window (tab / app switches)">Violations</th><th>Last attempt</th><th className="text-end" />
                          </tr>
                        </thead>
                        <tbody>
                          {visibleAttempted.map(s => {
                            const rank = rankOf.get(s.studentId) ?? null
                            return (
                              <tr key={s.studentId}>
                                <td>{rank ? <span className={`icp-rank${rank <= 3 ? ` r${rank}` : ''}`}>{rank}</span> : '—'}</td>
                                <td>
                                  <div className="icp-student">
                                    <span className="aui-avatar">{initialsOf(s.name)}</span>
                                    <div><b>{s.name}</b><small>{[s.rollNumber, s.branch, s.email].filter(Boolean).join(' · ')}</small></div>
                                  </div>
                                </td>
                                <td>{s.best ? <><span className={`aui-badge ${pctBadge(s.best.percentage)}`} title={`Best of ${s.attempts} attempt${s.attempts === 1 ? '' : 's'}: ${s.best.score} of ${s.best.totalMarks} marks`}>{Math.round(s.best.percentage)}%</span><small className="icp-muted icp-block">{s.best.score} / {s.best.totalMarks} marks</small></> : s.inProgress ? <span className="aui-badge aui-badge-blue">In progress</span> : '—'}</td>
                                {results.exam.sections.map(sec => {
                                  const sc = s.best?.sectionScores?.find(x => x.section === sec)
                                  return <td key={sec} className="icp-sec">{sc ? `${sc.score}/${sc.total}` : '—'}</td>
                                })}
                                <td>{s.latest ? `${Math.round(s.latest.percentage)}%` : '—'}</td>
                                <td>{s.attempts}</td>
                                <td>{fmtDur(s.best?.timeTakenSecs)}</td>
                                <td>{s.best ? (s.best.tabSwitches ? <span className="aui-badge aui-badge-amber"><FaDesktop size={9} /> {s.best.tabSwitches}</span> : <span className="icp-muted">0</span>) : '—'}</td>
                                <td className="icp-muted">{fmtDate(s.latest?.submittedAt)}</td>
                                <td className="text-end">{s.best && <button type="button" className="aui-btn aui-btn-sm" onClick={() => openAttempt(s.best!.attemptId)}><FaEye size={10} /> Answers</button>}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  visiblePending.length === 0 ? <EmptyState icon={FaCheckCircle} title={results.notAttempted.length ? 'No student matches' : 'Everyone has attempted this paper'} /> : (
                    <div className="aui-table-scroll">
                      <table className="aui-table">
                        <thead><tr><th>Student</th><th>Roll No</th><th>Branch</th><th>Email</th></tr></thead>
                        <tbody>
                          {visiblePending.map(s => (
                            <tr key={s.studentId}>
                              <td><div className="icp-student"><span className="aui-avatar">{initialsOf(s.name)}</span><div><b>{s.name}</b></div></div></td>
                              <td>{s.rollNumber || '—'}</td><td>{s.branch || '—'}</td><td className="icp-muted">{s.email || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* ── One student's answers ── */}
      <Modal show={!!detailId} onHide={() => setDetailId('')} centered size="xl" className="icp-top" dialogClassName="icp-dialog" contentClassName="aui-modal" backdropClassName="aui-backdrop icp-top-backdrop">
        <div className="aui-page icp-results">
          <div className="aui-modal-head">
            <span className="aui-avatar icp-avatar-lg">{initialsOf(detail?.student.name || '?')}</span>
            <div>
              <h3>{detail?.student.name || 'Loading…'}</h3>
              <p>{detail ? `${detail.exam.title} · ${fmtDate(detail.attempt.submittedAt)}` : ''}</p>
            </div>
            <button type="button" className="aui-icon-btn" onClick={() => setDetailId('')} aria-label="Close"><FaTimes size={12} /></button>
          </div>
          <div className="aui-modal-body icp-detail">
            {!detail ? <div className="icp-loading"><FaSpinner className="aui-spin" /> Loading…</div> : (
              <div className="icp-detail-grid">
                <div className="icp-detail-side">
                <div className="icp-kpis icp-kpis-sm">
                  <div><b>{Math.round(detail.attempt.percentage)}%</b><span>Score</span></div>
                  <div><b>{detail.attempt.score}/{detail.attempt.totalMarks}</b><span>Marks</span></div>
                  <div><b>{detail.attempt.correctCount}/{detail.attempt.questionCount}</b><span>Correct</span></div>
                  <div><b>{fmtDur(detail.attempt.timeTakenSecs)}</b><span>Attempt Time</span></div>
                  <div><b>{detail.attempt.tabSwitches}</b><span>Violations</span></div>
                </div>
                <div className="icp-secs">
                  {detail.attempt.sectionScores.map(sec => {
                    const p = sec.total ? Math.round((sec.score / sec.total) * 100) : 0
                    return <div key={sec.section}><div className="icp-sec-top"><b>{sec.section}</b><span>{sec.score}/{sec.total} · {p}%</span></div><div className="icp-bar"><span style={{ width: `${p}%` }} /></div></div>
                  })}
                </div>
                </div>
                <ol className="icp-answers">
                  {detail.answers.map(a => (
                    <li key={a.n} className={a.isCorrect ? 'is-right' : a.yourAnswer ? 'is-wrong' : 'is-skip'}>
                      <div className="icp-answer-head">
                        <span>Q{a.n}</span><small>{a.section}</small>
                        <span className={`aui-badge ${a.isCorrect ? 'aui-badge-green' : a.yourAnswer ? 'aui-badge-red' : 'aui-badge-muted'}`}>{a.isCorrect ? <FaCheckCircle size={9} /> : <FaTimesCircle size={9} />} {a.marksAwarded}/{a.marks}</span>
                      </div>
                      <p>{a.question}</p>
                      <div className="icp-answer-io">
                        <div><small>Student's answer</small><b>{a.yourAnswer || 'Not answered'}</b></div>
                        <div><small>Correct answer</small><b>{a.correctAnswer}</b></div>
                      </div>
                      {a.code && <pre className="icp-code">{a.code}</pre>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <style>{`
        .icp-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 200px; color: #9da2a8; }
        .icp-muted { color: #6b7280; }
        .icp-block { display: block; font-size: 0.72rem; }
        .icp-strong { color: #e5e7eb; }
        .icp-company { padding: 1.1rem 1.25rem; }
        .icp-company + .icp-company { margin-top: 1rem; }
        .icp-company-head { display: flex; align-items: center; gap: 14px; margin-bottom: 1rem; flex-wrap: wrap; }
        .icp-logo { display: grid; place-items: center; width: 52px; height: 52px; flex: 0 0 auto; overflow: hidden; border-radius: 12px; background: #fff; color: #ff7a00; font-weight: 800; }
        .icp-logo img { width: 84%; height: 84%; object-fit: contain; }
        .icp-logo-sm { width: 42px; height: 42px; border-radius: 10px; }
        .icp-company-title { flex: 1; min-width: 200px; }
        .icp-company-title h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: #fff; font-size: 1.1rem; font-weight: 750; }
        .icp-company-title p { margin: 3px 0 0; color: #858a90; font-size: 0.8rem; }
        .icp-company-stats { display: flex; gap: 10px; }
        .icp-company-stats div { display: flex; flex-direction: column; align-items: center; min-width: 84px; padding: 0.5rem 0.8rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .icp-company-stats b { color: #fff; font-size: 1.05rem; }
        .icp-company-stats span { color: #6b7280; font-size: 0.7rem; }
        .icp-share { display: flex; align-items: baseline; gap: 4px; }
        .icp-share b { color: #e5e7eb; }
        .icp-bar { height: 5px; margin-top: 5px; overflow: hidden; border-radius: 99px; background: #1d2023; }
        .icp-bar span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #ff7a00, #ffb15e); }
        /* big fixed-size results popup (~90% of the screen) */
        .icp-dialog { width: 92vw; max-width: 1600px; margin-top: 4vh; margin-bottom: 4vh; }
        .icp-results { display: flex; flex-direction: column; height: 88vh; }
        .icp-results-body { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow-y: auto; }
        .icp-results-body > .aui-empty, .icp-results-body > .icp-loading { flex: 1; }
        .icp-export { flex: 0 0 auto; }
        .icp-results .aui-modal-head { flex-wrap: wrap; }
        .icp-results .aui-modal-head > div:nth-child(2) { flex: 1 1 220px; min-width: 0; }
        /* summary boxes in the header, before Export */
        /* the kit gives every header block flex: 1 — the boxes must keep their own width instead */
        .icp-results .aui-modal-head > .icp-kpis-head { display: flex !important; flex: 0 0 auto !important; gap: 8px !important; min-width: auto !important; margin: 0 !important; }
        .icp-results .icp-kpis-head > button { flex: 0 0 auto; display: grid !important; grid-template-columns: 22px auto !important; grid-template-rows: auto auto !important; align-items: center; column-gap: 8px !important; padding: 0.45rem 0.75rem !important; border: 1px solid #25282b; border-radius: 10px !important; background: #111315; color: inherit; }
        .icp-results .icp-kpis-head > button > svg { grid-column: 1; grid-row: 1 / span 2; }
        .icp-results .icp-kpis-head > button > b { grid-column: 2; grid-row: 1; }
        .icp-results .icp-kpis-head > button > span { grid-column: 2; grid-row: 2; }
        .icp-kpis-head svg { font-size: 0.95rem !important; }
        .icp-kpis-head b { font-size: 0.98rem !important; line-height: 1.15; }
        .icp-kpis-head span { font-size: 0.66rem !important; white-space: nowrap; }
        @media (max-width: 1199.98px) { .icp-kpis-head { order: 3; width: 100%; flex-wrap: wrap; } }
        .icp-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; margin-bottom: 1rem; }
        .icp-kpis div { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: center; padding: 0.7rem 0.9rem; border: 1px solid #25282b; border-radius: 12px; background: #111315; }
        .icp-kpis svg { grid-row: 1 / span 2; color: #ff9a3c; font-size: 1.1rem; }
        .icp-kpis b { color: #fff; font-size: 1.15rem; }
        .icp-kpis span { color: #858a90; font-size: 0.72rem; }
        .icp-kpis-sm div { grid-template-columns: 1fr; text-align: center; }
        .icp-toolbar { margin-bottom: 0.75rem; padding: 0 !important; border: 0 !important; background: transparent !important; }
        .icp-toolbar .aui-toolbar-filters { flex-wrap: wrap; gap: 8px; }
        .icp-clear { color: #fca5a5 !important; }
        .icp-showing { margin: 0 0 8px; color: #858a90; font-size: 0.76rem; }
        .icp-kpis-head button { font: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .icp-kpis-head button:hover { border-color: #3a3f45; background: #16181b; }
        .icp-kpis-head button.is-on { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.08); }
        .icp-student { display: flex; align-items: center; gap: 10px; min-width: 220px; }
        .icp-student div { display: flex; flex-direction: column; min-width: 0; }
        .icp-student b { color: #e5e7eb; font-size: 0.86rem; }
        .icp-student small { overflow: hidden; color: #6b7280; font-size: 0.72rem; text-overflow: ellipsis; white-space: nowrap; max-width: 280px; }
        .icp-rank { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; background: #17191c; color: #9da2a8; font-weight: 800; font-size: 0.8rem; }
        .icp-rank.r1 { background: rgba(250,204,21,0.18); color: #facc15; }
        .icp-rank.r2 { background: rgba(203,213,225,0.15); color: #cbd5e1; }
        .icp-rank.r3 { background: rgba(251,146,60,0.18); color: #fb923c; }
        .icp-sec { color: #c4c8ce; white-space: nowrap; }
        .icp-top { z-index: 1070 !important; }
        .icp-top-backdrop { z-index: 1065 !important; }
        .icp-avatar-lg { width: 42px; height: 42px; }
        .icp-detail { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow-y: auto; }
        /* answers popup: summary on the left (stays put), questions on the right */
        .icp-detail-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 1.25rem; align-items: start; }
        .icp-detail-side { position: sticky; top: 0; display: flex; flex-direction: column; gap: 12px; }
        .icp-detail-side .icp-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0; }
        .icp-detail-side .icp-kpis > div:last-child { grid-column: 1 / -1; }
        .icp-detail-side .icp-secs { grid-template-columns: 1fr; margin-bottom: 0; }
        @media (max-width: 991.98px) { .icp-detail-grid { grid-template-columns: 1fr; } .icp-detail-side { position: static; } }
        .icp-secs { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 1rem; }
        .icp-secs > div { padding: 0.7rem 0.85rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .icp-sec-top { display: flex; justify-content: space-between; font-size: 0.82rem; }
        .icp-sec-top b { color: #e5e7eb; }
        .icp-sec-top span { color: #858a90; }
        .icp-answers { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
        .icp-answers li { padding: 0.8rem 0.95rem; border: 1px solid #25282b; border-left: 3px solid #6b7280; border-radius: 10px; background: #0e1012; }
        .icp-answers li.is-right { border-left-color: #31d866; }
        .icp-answers li.is-wrong { border-left-color: #fb5f67; }
        .icp-answer-head { display: flex; align-items: center; gap: 8px; }
        .icp-answer-head > span:first-child { color: #ff9a3c; font-weight: 800; }
        .icp-answer-head small { color: #6b7280; }
        .icp-answer-head .aui-badge { margin-left: auto; }
        .icp-answers p { margin: 6px 0 8px; color: #e5e7eb; font-size: 0.86rem; white-space: pre-wrap; }
        .icp-answer-io { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .icp-answer-io div { display: flex; flex-direction: column; padding: 6px 10px; border-radius: 8px; background: #141618; }
        .icp-answer-io small { color: #6b7280; font-size: 0.7rem; }
        .icp-answer-io b { color: #e5e7eb; font-size: 0.82rem; font-weight: 600; }
        .icp-code { max-height: 200px; margin: 8px 0 0; padding: 10px; overflow: auto; border-radius: 8px; background: #08090a; color: #d1d5db; font-size: 0.76rem; }
        @media (max-width: 991.98px) { .icp-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .icp-answer-io { grid-template-columns: 1fr; } }
      `}</style>
    </>
  )
}

export default InstituteCompanyPrepPage

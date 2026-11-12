import { Fragment, useEffect, useMemo, useState } from 'react'
import { FaBook, FaChartLine, FaCheckCircle, FaChevronDown, FaClipboardList, FaExclamationTriangle, FaHeadphones, FaSpinner, FaUserGraduate, FaUsers } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, AdminSelect, EmptyState, PageHeader, ProgressBar, SearchInput, StatCards, TableFooter, initialsOf, type StatItem } from '@/components/admin-ui'

type Mistake = { expected: string; said: string; type: 'substitution' | 'missing' | 'extra' }
type SubmissionItem = {
  itemId: string
  type: 'reading' | 'listening'
  expectedSentence: string
  transcript: string
  marks: number
  scoreAwarded: number
  accuracyPercent: number
  mistakes: Mistake[]
  timeLimit: number
  recordedSeconds: number
}
type Submission = {
  _id: string
  studentId: { _id: string; name?: string; email?: string; rollNumber?: string } | null
  items: SubmissionItem[]
  totalMarks: number
  totalScoreAwarded: number
  totalQuestions: number
  createdAt: string
}

const PASS_PERCENT = 60
const PAGE_SIZE = 15

const percentOf = (s: Submission) => (s.totalMarks > 0 ? Math.round((s.totalScoreAwarded / s.totalMarks) * 100) : 0)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const MistakeChip = ({ m }: { m: Mistake }) =>
  m.type === 'substitution' ? (
    <span className="lsub-mistake">said <s>{m.said}</s> for <b>{m.expected}</b></span>
  ) : m.type === 'missing' ? (
    <span className="lsub-mistake is-missing">missed <b>{m.expected}</b></span>
  ) : (
    <span className="lsub-mistake is-extra">extra <b>{m.said}</b></span>
  )

const LSRWSubmissionsAdmin = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [scoreFilter, setScoreFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!user?.token) return
    setLoading(true)
    fetch(`${baseURL}/api/eklavadmin/lsrw-submissions`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSubmissions(data.submissions)
        else setError(data.message || 'Could not load student results.')
      })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false))
  }, [user?.token, baseURL])

  useEffect(() => setPage(1), [search, scoreFilter, sort])

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const stats: StatItem[] = useMemo(() => {
    const students = new Set(submissions.map((s) => s.studentId?._id).filter(Boolean)).size
    const avg = submissions.length ? Math.round(submissions.reduce((sum, s) => sum + percentOf(s), 0) / submissions.length) : 0
    const passed = submissions.filter((s) => percentOf(s) >= PASS_PERCENT).length
    return [
      { label: 'Attempts', value: submissions.length, icon: FaClipboardList, tone: 'orange' },
      { label: 'Students', value: students, icon: FaUsers, tone: 'blue' },
      { label: 'Average score', value: `${avg}%`, icon: FaChartLine, tone: 'purple' },
      { label: `Scored ${PASS_PERCENT}%+`, value: passed, icon: FaCheckCircle, tone: 'green' },
    ]
  }, [submissions])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = submissions.filter((s) => {
      const p = percentOf(s)
      if (scoreFilter === 'pass' && p < PASS_PERCENT) return false
      if (scoreFilter === 'below' && p >= PASS_PERCENT) return false
      if (!q) return true
      return [s.studentId?.name, s.studentId?.email, s.studentId?.rollNumber].some((v) => v && v.toLowerCase().includes(q))
    })
    const by: Record<string, (a: Submission, b: Submission) => number> = {
      newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      oldest: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
      high: (a, b) => percentOf(b) - percentOf(a),
      low: (a, b) => percentOf(a) - percentOf(b),
    }
    return [...rows].sort(by[sort])
  }, [submissions, search, scoreFilter, sort])

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AdminPage>
      <PageMetaData title="Listening & Reading — Student Results" />

      <PageHeader
        icon={FaHeadphones}
        title="Listening & Reading Results"
        subtitle="Marks and word-level mistakes, scored automatically from each student's speech"
        stats={<StatCards inline items={stats} loading={loading} />}
      />

      {error && <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span></div>}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3>Student attempts</h3>
            <p>Click a row to see each question, what the student said and the mistakes found</p>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or roll no…" />
            <AdminSelect
              label="Score"
              value={scoreFilter}
              onChange={setScoreFilter}
              options={[{ value: '', label: 'All scores' }, { value: 'pass', label: `${PASS_PERCENT}% and above` }, { value: 'below', label: `Below ${PASS_PERCENT}%` }]}
            />
            <AdminSelect
              label="Sort"
              prefix="Sort:"
              value={sort}
              onChange={setSort}
              options={[{ value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' }, { value: 'high', label: 'Highest score' }, { value: 'low', label: 'Lowest score' }]}
            />
          </div>
        </div>

        {loading ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading student attempts…</p></div>
        ) : submissions.length === 0 ? (
          <EmptyState icon={FaUserGraduate} title="No attempts yet" text="Results appear here once students complete a listening or reading round." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FaUserGraduate} title="No attempts match" text="Try a different search or score filter." action={<button type="button" className="aui-btn" onClick={() => { setSearch(''); setScoreFilter('') }}>Clear filters</button>} />
        ) : (
          <>
            <div className="aui-table-scroll">
              <table className="aui-table lsub-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }} />
                    <th>Student</th>
                    <th>Roll no.</th>
                    <th>Attempted</th>
                    <th className="text-center">Questions</th>
                    <th style={{ width: 230 }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((sub) => {
                    const isOpen = !!expanded[sub._id]
                    const percent = percentOf(sub)
                    const name = sub.studentId?.name || 'Unknown student'
                    return (
                      <Fragment key={sub._id}>
                        <tr className={`lsub-row${isOpen ? ' is-open' : ''}`} onClick={() => toggle(sub._id)} aria-expanded={isOpen}>
                          <td><FaChevronDown className="lsub-caret" size={11} /></td>
                          <td>
                            <div className="aui-person">
                              <span className="aui-avatar">{initialsOf(name)}</span>
                              <div className="aui-stack">
                                <strong>{name}</strong>
                                <small>{sub.studentId?.email || '—'}</small>
                              </div>
                            </div>
                          </td>
                          <td>{sub.studentId?.rollNumber || <span className="lsub-dash">—</span>}</td>
                          <td className="lsub-date">{fmtDate(sub.createdAt)}</td>
                          <td className="text-center">{sub.totalQuestions}</td>
                          <td>
                            <div className="lsub-score">
                              <ProgressBar value={percent} tone={percent >= PASS_PERCENT ? 'green' : 'amber'} label={`${percent}%`} />
                              <span className="lsub-marks">{sub.totalScoreAwarded}/{sub.totalMarks}</span>
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="lsub-detail">
                            <td colSpan={6}>
                              <div className="lsub-items">
                                {sub.items.map((item, idx) => {
                                  const isReading = item.type === 'reading'
                                  return (
                                    <div key={idx} className="lsub-item">
                                      <div className="lsub-item-head">
                                        <span className={`aui-badge ${isReading ? 'aui-badge-orange' : 'aui-badge-blue'}`}>
                                          {isReading ? <FaBook size={9} /> : <FaHeadphones size={9} />} Q{idx + 1} · {isReading ? 'Reading' : 'Listening'}
                                        </span>
                                        <span className="lsub-item-score">
                                          <b>{item.scoreAwarded}</b>/{item.marks} marks
                                          <span className={`aui-badge ${item.accuracyPercent >= 80 ? 'aui-badge-green' : item.accuracyPercent >= 50 ? 'aui-badge-amber' : 'aui-badge-red'}`}>{item.accuracyPercent}% accuracy</span>
                                        </span>
                                      </div>
                                      <div className="lsub-compare">
                                        <div>
                                          <small>Expected</small>
                                          <p>{item.expectedSentence}</p>
                                        </div>
                                        <div>
                                          <small>Student said</small>
                                          <p>{item.transcript || <em>No speech captured</em>}</p>
                                        </div>
                                      </div>
                                      {item.mistakes.length > 0 ? (
                                        <div className="lsub-mistakes">
                                          <small>{item.mistakes.length} mistake{item.mistakes.length === 1 ? '' : 's'}</small>
                                          {item.mistakes.map((m, mi) => <MistakeChip key={mi} m={m} />)}
                                        </div>
                                      ) : item.transcript ? (
                                        <div className="lsub-perfect"><FaCheckCircle size={11} /> No mistakes</div>
                                      ) : null}
                                    </div>
                                  )
                                })}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} noun="attempts" />
          </>
        )}
      </div>

      <style>{`
        .lsub-row { cursor: pointer; }
        .lsub-row.is-open { background: #111315; }
        .lsub-caret { color: #6b7280; transform: rotate(-90deg); transition: transform 0.15s; }
        .lsub-row.is-open .lsub-caret { color: #ff9a3c; transform: none; }
        .lsub-dash { color: #4b5056; }
        .lsub-date { color: #a6abb0; font-size: 0.78rem; white-space: nowrap; }
        .lsub-score { display: flex; align-items: center; gap: 10px; }
        .lsub-score .aui-progress { flex: 1; }
        .lsub-marks { color: #858a90; font-size: 0.72rem; white-space: nowrap; }
        .lsub-detail > td { padding: 0 !important; background: #0b0c0e; }
        .lsub-items { display: flex; flex-direction: column; gap: 10px; padding: 0.9rem 1rem 1rem 3.4rem; }
        .lsub-item { padding: 0.8rem 0.95rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; }
        .lsub-item-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 0.65rem; }
        .lsub-item-score { display: inline-flex; align-items: center; gap: 8px; color: #9da2a8; font-size: 0.76rem; }
        .lsub-item-score b { color: #fff; }
        .lsub-compare { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .lsub-compare > div { padding: 0.55rem 0.75rem; border: 1px solid #202326; border-radius: 8px; background: #0e1012; }
        .lsub-compare small, .lsub-mistakes small { display: block; margin-bottom: 3px; color: #6b7280; font-size: 0.64rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
        .lsub-compare p { margin: 0; color: #e5e7eb; font-size: 0.82rem; line-height: 1.55; white-space: normal; }
        .lsub-compare em { color: #6b7280; }
        .lsub-mistakes { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 0.65rem; }
        .lsub-mistakes small { width: 100%; margin-bottom: 0; }
        .lsub-mistake { padding: 3px 9px; border: 1px solid rgba(251,95,103,0.3); border-radius: 7px; background: rgba(251,95,103,0.08); color: #f8a1a6; font-size: 0.74rem; }
        .lsub-mistake b { color: #fff; font-weight: 650; }
        .lsub-mistake s { color: #fb737a; }
        .lsub-mistake.is-missing { border-color: rgba(244,180,63,0.3); background: rgba(244,180,63,0.08); color: #f4c46b; }
        .lsub-mistake.is-extra { border-color: rgba(96,165,250,0.3); background: rgba(96,165,250,0.08); color: #93c5fd; }
        .lsub-perfect { display: inline-flex; align-items: center; gap: 6px; margin-top: 0.6rem; color: #45dd75; font-size: 0.76rem; font-weight: 650; }
        @media (max-width: 767.98px) {
          .lsub-items { padding-left: 1rem; }
          .lsub-compare { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminPage>
  )
}

export default LSRWSubmissionsAdmin

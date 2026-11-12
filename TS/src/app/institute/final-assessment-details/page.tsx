import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import AdminResults from './components/AdminResults'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaChartBar, FaSpinner, FaClipboardList, FaSearch, FaLayerGroup, FaBroadcastTower,
  FaRegClock, FaCheckCircle, FaPlus, FaArrowRight, FaTimes,
} from 'react-icons/fa'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, EmptyState, Tabs, type StatItem } from '@/components/admin-ui'

const roundColors: Record<string, { bg: string; color: string; border: string }> = {
  mcq:     { bg: 'rgba(255,122,0,0.12)',   color: '#ff9a3c', border: 'rgba(255,122,0,0.3)' },
  coding:  { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  tr:      { bg: 'rgba(34,211,238,0.12)',  color: '#22d3ee', border: 'rgba(34,211,238,0.3)' },
  hr:      { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  english: { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
}
const roundLabels: Record<string, string> = {
  mcq: 'MCQ Quiz', coding: 'Code Challenge', tr: 'Technical Round', hr: 'HR Round', english: 'English',
}

type RoundState = 'live' | 'upcoming' | 'completed' | 'unscheduled'
const ROUND_STATE_LABEL: Record<RoundState, string> = {
  live: 'Live', upcoming: 'Upcoming', completed: 'Completed', unscheduled: 'Not scheduled',
}
const STATE_BADGE: Record<RoundState, string> = {
  live: 'aui-badge-green', upcoming: 'aui-badge-blue', completed: 'aui-badge-muted', unscheduled: 'aui-badge-amber',
}

function roundState(round: any, now: number): RoundState {
  if (!round.startDateTime || !round.endDateTime) return 'unscheduled'
  const start = new Date(round.startDateTime).getTime()
  const end = new Date(round.endDateTime).getTime()
  if (now < start) return 'upcoming'
  if (now > end) return 'completed'
  return 'live'
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export default function FinalAssessmentDetails() {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [examList, setExamList] = useState<any[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<'' | RoundState>('')
  const [viewExamId, setViewExamId] = useState<string | null>(null)
  const [viewRoundType, setViewRoundType] = useState<string | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoadingExams(true)
    fetch(`${baseURL}/api/assessment/admin/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setExamList(d.exams || []))
      .catch(() => {})
      .finally(() => setLoadingExams(false))
  }, [token, baseURL])

  const selectedExam = examList.find(e => e._id === viewExamId)
  const now = Date.now()

  const stats = useMemo(() => {
    const counts: Record<RoundState, number> = { live: 0, upcoming: 0, completed: 0, unscheduled: 0 }
    examList.forEach(exam => (exam.rounds || []).forEach((r: any) => { counts[roundState(r, now)] += 1 }))
    return counts
  }, [examList, now])

  const visibleExams = examList.filter(exam => {
    const q = search.trim().toLowerCase()
    const matchesText = !q || exam.title?.toLowerCase().includes(q) || exam.description?.toLowerCase().includes(q)
    const matchesState = !stateFilter || (exam.rounds || []).some((r: any) => roundState(r, now) === stateFilter)
    return matchesText && matchesState
  })

  const closeResults = () => { setShowResultsModal(false); setViewExamId(null); setViewRoundType(null) }

  const openResults = (examId: string, roundType: string | null) => {
    setViewExamId(examId)
    setViewRoundType(roundType)
    setShowResultsModal(true)
  }

  const statCards: StatItem[] = [
    { label: 'Total Exams', value: examList.length, icon: FaLayerGroup, tone: 'orange' },
    { label: 'Live Rounds', value: stats.live, icon: FaBroadcastTower, tone: 'green' },
    { label: 'Upcoming Rounds', value: stats.upcoming, icon: FaRegClock, tone: 'blue' },
    { label: 'Completed Rounds', value: stats.completed, icon: FaCheckCircle, tone: 'purple' },
  ]

  return (
    <>
      <PageMetaData title="Admin - Assessment Results" />

      <AdminPage>
        <PageHeader
          icon={FaChartBar}
          title="Assessment Results"
          stats={<StatCards inline items={statCards} loading={loadingExams} />}
          actions={<Link to="/institute/final-assessment-upload" className="aui-btn aui-btn-primary"><FaPlus size={11} /> Create Exam</Link>}
        />

        <div className="aui-card">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">
              <h3>Existing Exams</h3>
              <p>Choose a round’s <b style={{ color: '#d1d5db' }}>View Results</b> to see student submissions</p>
            </div>
            <div className="aui-toolbar-filters">
              <SearchInput value={search} onChange={setSearch} placeholder="Search exams…" />
              <AdminSelect
                label="Round status"
                value={stateFilter}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'live', label: `Live (${stats.live})` },
                  { value: 'upcoming', label: `Upcoming (${stats.upcoming})` },
                  { value: 'completed', label: `Completed (${stats.completed})` },
                  { value: 'unscheduled', label: `Not scheduled (${stats.unscheduled})` },
                ]}
                onChange={v => setStateFilter(v as '' | RoundState)}
              />
              <span className="aui-count">{visibleExams.length} of {examList.length} exams</span>
            </div>
          </div>

          {loadingExams ? (
            <div className="aui-empty">
              <FaSpinner className="aui-spin" />
              <span>Loading exams…</span>
            </div>
          ) : examList.length === 0 ? (
            <EmptyState
              icon={FaClipboardList}
              title="No exams created yet"
              text="Create an exam and schedule its rounds — results will appear here once students start submitting."
              action={<Link to="/institute/final-assessment-upload" className="aui-btn aui-btn-primary"><FaPlus size={11} /> Create your first exam</Link>}
            />
          ) : visibleExams.length === 0 ? (
            <EmptyState icon={FaSearch} title="No exams match" text="Try a different title or status." action={<button type="button" className="aui-btn aui-btn-sm" onClick={() => { setSearch(''); setStateFilter('') }}>Clear filters</button>} />
          ) : (
            <div className="aui-table-scroll">
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Exam</th>
                    <th>Target Batch</th>
                    <th>Rounds &amp; Results</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExams.map((exam, idx) => (
                    <tr key={exam._id}>
                      <td className="aui-num" style={{ verticalAlign: 'top' }}>{idx + 1}</td>
                      <td style={{ verticalAlign: 'top', minWidth: 220 }}>
                        <div className="aui-stack">
                          <strong>{exam.title}</strong>
                          {exam.description && (
                            <small style={{ whiteSpace: 'normal' }}>{exam.description.length > 90 ? exam.description.slice(0, 90) + '…' : exam.description}</small>
                          )}
                        </div>
                        <button type="button" className="far-link-btn" onClick={() => openResults(exam._id, null)}>
                          All rounds results <FaArrowRight />
                        </button>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        {((exam.branch?.length > 0) || (exam.joiningYear?.length > 0)) ? (
                          <div className="far-chips">
                            {(exam.branch || []).map((b: string) => <span key={b} className="aui-badge aui-badge-orange">{b}</span>)}
                            {(exam.joiningYear || []).map((y: string) => <span key={y} className="aui-badge aui-badge-muted">{y}</span>)}
                          </div>
                        ) : (
                          <span className="aui-num">All batches</span>
                        )}
                      </td>
                      <td>
                        <div className="far-rounds">
                          {(exam.rounds || []).length === 0 && <span className="aui-num">No rounds configured</span>}
                          {(exam.rounds || []).map((r: any) => {
                            const c = roundColors[r.roundType] || roundColors.mcq
                            const state = roundState(r, now)
                            return (
                              <div key={r.roundType} className="far-round">
                                <div className="far-round-info">
                                  <span className="aui-badge" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                                    {roundLabels[r.roundType] || r.roundType}
                                  </span>
                                  <span className={`aui-badge aui-badge-dot ${STATE_BADGE[state]}`}>{ROUND_STATE_LABEL[state]}</span>
                                  {r.startDateTime && (
                                    <span className="far-round-dates">
                                      {fmtDate(r.startDateTime)} <i>→</i> {fmtDate(r.endDateTime)}
                                    </span>
                                  )}
                                </div>
                                <button type="button" className="aui-btn aui-btn-sm" onClick={() => openResults(exam._id, r.roundType)}>
                                  <FaChartBar style={{ color: '#ff7a00' }} /> View Results
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminPage>

      {/* Results — full screen, switch rounds without closing */}
      <Modal show={showResultsModal} onHide={closeResults} fullscreen className="exam-results-fullmodal">
        <div className="aui-page far-modal-head">
          <span className="aui-heading-icon"><FaChartBar /></span>
          <div className="far-modal-title">
            <h3>{selectedExam?.title || 'Exam'}</h3>
            <p>{viewRoundType ? `${roundLabels[viewRoundType] || viewRoundType.toUpperCase()} results` : 'Results across all rounds'}</p>
          </div>
          {(selectedExam?.rounds || []).length > 1 && (
            <Tabs
              small
              label="Round"
              value={viewRoundType || 'all'}
              onChange={v => setViewRoundType(v === 'all' ? null : v)}
              items={[
                { value: 'all', label: 'All rounds' },
                ...(selectedExam?.rounds || []).map((r: any) => ({ value: r.roundType, label: roundLabels[r.roundType] || r.roundType })),
              ]}
            />
          )}
          <button type="button" className="aui-icon-btn" onClick={closeResults} aria-label="Close"><FaTimes size={12} /></button>
        </div>
        <Modal.Body style={{ background: '#0a0a0a', padding: 0, overflow: 'auto' }}>
          {showResultsModal && viewExamId && (
            <AdminResults
              key={viewRoundType || 'all'}
              defaultExamId={viewExamId}
              hideHeader
              hideExamSelector
              filterRoundType={viewRoundType || ''}
            />
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .far-link-btn { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 0; border: 0; background: none; color: #ff9a3c; font-size: 0.74rem; font-weight: 600; cursor: pointer; }
        .far-link-btn svg { font-size: 0.6rem; transition: transform 0.15s; }
        .far-link-btn:hover svg { transform: translateX(3px); }
        .far-chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .far-rounds { display: flex; flex-direction: column; min-width: 480px; }
        .far-round { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0.45rem 0; border-bottom: 1px dashed #24272b; }
        .far-round:first-child { padding-top: 0; }
        .far-round:last-child { padding-bottom: 0; border-bottom: 0; }

        .far-modal-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 0.85rem 1.5rem; border-bottom: 1px solid #25282b; background: #111315; }
        .far-modal-title { flex: 1; min-width: 200px; }
        .far-modal-title h3 { margin: 0; color: #fff; font-size: 1.05rem; font-weight: 750; }
        .far-modal-title p { margin: 2px 0 0; color: #858a90; font-size: 0.78rem; }
        .far-round-info { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
        .far-round-dates { color: #858a90; font-size: 0.72rem; white-space: nowrap; }
        .far-round-dates i { margin: 0 4px; color: #4b5563; font-style: normal; }

        .exam-results-fullmodal .modal-content { background: #0a0a0a; border: none; }
        .exam-results-fullmodal .btn-close { filter: invert(1); }
      `}</style>
    </>
  )
}

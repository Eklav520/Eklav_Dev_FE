import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Modal } from 'react-bootstrap'
import {
  FaCalculator, FaUsers, FaPercentage, FaTrophy, FaStopwatch, FaChevronLeft, FaChevronRight,
  FaSyncAlt, FaSpinner, FaExclamationTriangle, FaInbox, FaEye, FaTimes, FaCheckCircle, FaTimesCircle,
  FaCalendarAlt, FaLayerGroup, FaChartLine, FaMedal,
} from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import {
  AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, TableFooter, EmptyState, ProgressBar,
  initialsOf, scoreBadgeClass, toOptions,
} from '@/components/admin-ui'

const PAGE_SIZE = 20

function formatSecs(s: number) {
  const m = Math.floor((s || 0) / 60).toString().padStart(2, '0')
  const sec = ((s || 0) % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const CATEGORY_BADGE: Record<string, string> = {
  Aptitude: 'aui-badge-blue', Reasoning: 'aui-badge-purple', Technical: 'aui-badge-green', Puzzle: 'aui-badge-orange',
}
const pctLabel = (p: number) => p >= 70 ? 'Excellent' : p >= 40 ? 'Average' : 'Needs improvement'
const pctColor = (p: number) => p >= 70 ? '#45dd75' : p >= 40 ? '#f4b43f' : '#fb737a'

/* Local YYYY-MM-DD (toISOString would shift the day for IST evenings) */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const shiftDay = (date: string, days: number) => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + days); return ymd(d) }
const longDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const RankBadge = ({ rank }: { rank: number }) => (
  <span className={`apa-rank${rank <= 3 ? ` is-top is-${rank}` : ''}`}>
    {rank <= 3 && <FaMedal size={9} />}#{rank}
  </span>
)

// ── Student detail modal ──────────────────────────────────────────────────────
const StudentModal: React.FC<{ attempt: any; onClose: () => void }> = ({ attempt, onClose }) => {
  const p = attempt?.percentage ?? 0
  const circumference = 2 * Math.PI * 46
  const wrong = Math.max(0, (attempt?.total ?? 0) - (attempt?.score ?? 0))

  return (
    <Modal show={!!attempt} onHide={onClose} centered size="lg" contentClassName="aui-modal" backdropClassName="aui-backdrop">
      {attempt && (
        <div className="aui-page">
          <div className="aui-modal-head">
            <span className="aui-avatar apa-modal-avatar">{initialsOf(attempt.studentName)}</span>
            <div>
              <h3>{attempt.studentName}</h3>
              <p>{attempt.studentEmail}</p>
            </div>
            <RankBadge rank={attempt.rank} />
            <button type="button" className="aui-icon-btn" onClick={onClose} aria-label="Close"><FaTimes size={12} /></button>
          </div>

          <div className="aui-modal-body">
            <div className="apa-summary">
              <div className="apa-ring">
                <svg width="112" height="112" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="46" fill="none" stroke="#23262a" strokeWidth="9" />
                  <circle cx="56" cy="56" r="46" fill="none" stroke={pctColor(p)} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference * (1 - p / 100)} transform="rotate(-90 56 56)" />
                </svg>
                <div><strong style={{ color: pctColor(p) }}>{p}%</strong><small>Score</small></div>
              </div>

              <div className="aui-tiles apa-tiles">
                <div className="aui-tile">
                  <div className="aui-tile-head"><span className="aui-tile-icon apa-tone-green"><FaCheckCircle /></span> Marks</div>
                  <div className="aui-tile-value">{attempt.score}<small>of {attempt.total}</small></div>
                </div>
                <div className="aui-tile">
                  <div className="aui-tile-head"><span className="aui-tile-icon apa-tone-amber"><FaTrophy /></span> Rank</div>
                  <div className="aui-tile-value">#{attempt.rank}<small>today</small></div>
                </div>
                <div className="aui-tile">
                  <div className="aui-tile-head"><span className="aui-tile-icon apa-tone-blue"><FaStopwatch /></span> Time Taken</div>
                  <div className="aui-tile-value apa-mono">{formatSecs(attempt.timeTakenSeconds)}</div>
                </div>
                <div className="aui-tile">
                  <div className="aui-tile-head"><span className="aui-tile-icon apa-tone-orange"><FaChartLine /></span> Performance</div>
                  <div className="aui-tile-value apa-perf" style={{ color: pctColor(p) }}>{pctLabel(p)}</div>
                </div>
              </div>
            </div>

            <div className="aui-section-label">Score breakdown</div>
            <div className="apa-breakdown">
              <div className="apa-split">
                <div className="is-correct" style={{ width: `${attempt.total ? (attempt.score / attempt.total) * 100 : 0}%` }} />
                <div className="is-wrong" style={{ width: `${attempt.total ? (wrong / attempt.total) * 100 : 0}%` }} />
              </div>
              <div className="apa-legend">
                <span><i className="is-correct" /> {attempt.score} correct</span>
                <span><i className="is-wrong" /> {wrong} wrong</span>
                <span className="apa-legend-total">{attempt.total} questions</span>
              </div>
            </div>

            <div className="apa-meta">
              <div>
                <small><FaLayerGroup size={10} /> Category</small>
                <span className={`aui-badge ${CATEGORY_BADGE[attempt.category] || 'aui-badge-muted'}`}>{attempt.category || '—'}</span>
              </div>
              <div>
                <small><FaCalendarAlt size={10} /> Submitted</small>
                <strong>{new Date(attempt.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>
          </div>

          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
const AptitudeAssessments: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const today = ymd(new Date())
  const [date, setDate] = useState(today)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const fetchResults = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${baseURL}/api/institute/daily-aptitude/results?date=${date}&page=${page}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      if (json.success) setData(json)
      else setError(json.message || 'Failed to load results')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [baseURL, token, date, page])

  useEffect(() => { fetchResults() }, [fetchResults])

  const changeDate = (next: string) => {
    if (!next || next > today) return
    setDate(next); setPage(1); setSearch(''); setCategory('')
  }

  const attempts: any[] = data?.attempts ?? []
  const categories = useMemo(() => [...new Set(attempts.map(a => a.category).filter(Boolean))] as string[], [attempts])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return attempts.filter(a =>
      (!q || a.studentName?.toLowerCase().includes(q) || a.studentEmail?.toLowerCase().includes(q)) &&
      (!category || a.category === category))
  }, [attempts, search, category])

  // Score stats come from the loaded page; the hint says so when there is more than one page
  const pageStats = useMemo(() => {
    if (!attempts.length) return null
    const avg = Math.round(attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length)
    const top = Math.max(...attempts.map(a => a.percentage ?? 0))
    const avgTime = Math.round(attempts.reduce((s, a) => s + (a.timeTakenSeconds ?? 0), 0) / attempts.length)
    return { avg, top, avgTime }
  }, [attempts])
  const partial = (data?.pages ?? 1) > 1 ? 'this page' : undefined
  const filtered = !!(search || category)

  return (
    <AdminPage>
      <PageMetaData title="Aptitude Assessments" />

      <PageHeader
        icon={FaCalculator}
        title="Aptitude Assessments"
        stats={
          <StatCards
            inline
            loading={loading && !data}
            items={[
              { label: 'Attempts', value: data?.total ?? 0, icon: FaUsers, tone: 'orange' },
              { label: 'Avg Score', value: pageStats ? `${pageStats.avg}%` : '—', icon: FaPercentage, tone: 'green', hint: partial },
              { label: 'Top Score', value: pageStats ? `${pageStats.top}%` : '—', icon: FaTrophy, tone: 'amber' },
              { label: 'Avg Time', value: pageStats ? formatSecs(pageStats.avgTime) : '—', icon: FaStopwatch, tone: 'blue', hint: partial },
            ]}
          />
        }
      />

      {error && <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span></div>}

      <div className="aui-card">
        <div className="aui-toolbar">
          <div className="apa-datebar">
            <button type="button" className="aui-icon-btn" onClick={() => changeDate(shiftDay(date, -1))} aria-label="Previous day" title="Previous day"><FaChevronLeft size={11} /></button>
            <input type="date" className="aui-date" value={date} max={today} onChange={e => changeDate(e.target.value)} aria-label="Exam date" />
            <button type="button" className="aui-icon-btn" onClick={() => changeDate(shiftDay(date, 1))} disabled={date >= today} aria-label="Next day" title="Next day"><FaChevronRight size={11} /></button>
            <div className="aui-toolbar-title apa-date-title">
              <h3>{date === today ? 'Today' : longDate(date)}</h3>
              <p>{date === today ? longDate(date) : <button type="button" className="apa-link" onClick={() => changeDate(today)}>Jump to today</button>}</p>
            </div>
          </div>
          <div className="aui-toolbar-filters">
            <SearchInput value={search} onChange={setSearch} placeholder="Search student…" />
            {categories.length > 1 && (
              <AdminSelect label="Category" value={category} options={toOptions('All categories', categories)} onChange={setCategory} />
            )}
            <button type="button" className="aui-btn" onClick={fetchResults} disabled={loading}>
              <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading results…</div>
        ) : !data || attempts.length === 0 ? (
          <EmptyState
            icon={FaInbox}
            title="No attempts on this day"
            text={`No students from your institute took the daily aptitude exam on ${longDate(date)}.`}
            action={date !== today ? <button type="button" className="aui-btn aui-btn-sm" onClick={() => changeDate(today)}>Go to today</button> : undefined}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FaInbox}
            title="No students match"
            text="Try a different name or category."
            action={<button type="button" className="aui-btn aui-btn-sm" onClick={() => { setSearch(''); setCategory('') }}>Clear filters</button>}
          />
        ) : (
          <>
            <div className={`aui-table-scroll${loading ? ' apa-busy' : ''}`}>
              <table className="aui-table">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Rank</th>
                    <th>Student</th>
                    <th style={{ width: 130 }}>Category</th>
                    <th style={{ width: 220 }}>Score</th>
                    <th style={{ width: 100 }}>Result</th>
                    <th style={{ width: 90 }}>Time</th>
                    <th style={{ width: 110 }}>Submitted</th>
                    <th style={{ width: 90 }} className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a, i) => {
                    const p = a.percentage ?? 0
                    return (
                      <tr key={`${a.studentEmail}-${i}`} className="apa-row" onClick={() => setSelected(a)}>
                        <td><RankBadge rank={a.rank} /></td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(a.studentName)}</span>
                            <div className="aui-stack">
                              <strong>{a.studentName}</strong>
                              <small>{a.studentEmail}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className={`aui-badge ${CATEGORY_BADGE[a.category] || 'aui-badge-muted'}`}>{a.category || '—'}</span></td>
                        <td><ProgressBar value={p} tone={p >= 70 ? 'green' : p >= 40 ? 'amber' : 'orange'} label={`${a.score}/${a.total}`} /></td>
                        <td><span className={`aui-badge ${scoreBadgeClass(p >= 70 ? 80 : p >= 40 ? 50 : 0)}`}>{p}%</span></td>
                        <td className="apa-mono">{formatSecs(a.timeTakenSeconds)}</td>
                        <td className="aui-num">{new Date(a.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="text-end">
                          <button type="button" className="aui-btn aui-btn-sm" onClick={e => { e.stopPropagation(); setSelected(a) }}>
                            <FaEye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter page={page} pageSize={PAGE_SIZE} total={data.total ?? attempts.length} onPageChange={setPage} noun="attempts" />
          </>
        )}
      </div>

      <StudentModal attempt={selected} onClose={() => setSelected(null)} />

      <style>{`
        .apa-datebar { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .apa-date-title { margin-left: 6px; }
        .apa-date-title h3 { white-space: nowrap; }
        .apa-link { padding: 0; border: 0; background: none; color: #ff9a3c; font-size: 0.78rem; font-weight: 600; }
        .apa-link:hover { color: #ffb15e; text-decoration: underline; }
        .aui-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .apa-row { cursor: pointer; }
        .apa-busy { opacity: 0.55; pointer-events: none; transition: opacity 0.15s; }
        .apa-mono { color: #c3c7ca; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.78rem; }

        .apa-rank { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid #3a3e42; border-radius: 99px; background: #1b1e20; color: #9da2a6; font-size: 0.72rem; font-weight: 800; }
        .apa-rank.is-1 { border-color: rgba(250,204,21,0.45); background: rgba(250,204,21,0.14); color: #facc15; }
        .apa-rank.is-2 { border-color: rgba(203,213,225,0.4); background: rgba(203,213,225,0.1); color: #cbd5e1; }
        .apa-rank.is-3 { border-color: rgba(217,119,6,0.45); background: rgba(217,119,6,0.14); color: #f59e0b; }

        .apa-modal-avatar { width: 42px; height: 42px; flex-basis: 42px; font-size: 0.85rem; }
        .apa-summary { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; }
        .apa-ring { position: relative; width: 112px; height: 112px; flex: 0 0 112px; }
        .apa-ring > div { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .apa-ring strong { font-size: 1.5rem; font-weight: 850; line-height: 1; }
        .apa-ring small { margin-top: 4px; color: #858a90; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .apa-tiles { flex: 1; min-width: 260px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .apa-perf { font-size: 1rem; }
        .aui-tile-value.apa-mono { color: #fff; font-size: 1.25rem; }
        .apa-tone-green { background: rgba(49,216,102,0.13); color: #45dd75; }
        .apa-tone-amber { background: rgba(246,170,36,0.14); color: #f4b43f; }
        .apa-tone-blue { background: rgba(56,189,248,0.12); color: #38bdf8; }
        .apa-tone-orange { background: rgba(255,122,0,0.13); color: #ff9a3c; }

        .apa-breakdown { padding: 0.85rem 0.95rem; border: 1px solid #25282b; border-radius: 12px; background: #111315; }
        .apa-split { display: flex; height: 10px; overflow: hidden; border-radius: 99px; background: #23262a; }
        .apa-split .is-correct { background: #31d866; }
        .apa-split .is-wrong { background: #fb5f67; opacity: 0.85; }
        .apa-legend { display: flex; gap: 1rem; margin-top: 0.6rem; color: #a6abb0; font-size: 0.76rem; }
        .apa-legend i { display: inline-block; width: 8px; height: 8px; margin-right: 5px; border-radius: 50%; }
        .apa-legend i.is-correct { background: #31d866; }
        .apa-legend i.is-wrong { background: #fb5f67; }
        .apa-legend-total { margin-left: auto; color: #858a90; }

        .apa-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 0.85rem; }
        .apa-meta > div { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 0.75rem 0.95rem; border: 1px solid #25282b; border-radius: 12px; background: #111315; }
        .apa-meta small { display: inline-flex; align-items: center; gap: 6px; color: #858a90; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .apa-meta strong { color: #eceef0; font-size: 0.86rem; }

        @media (max-width: 575.98px) {
          .apa-datebar { width: 100%; flex-wrap: wrap; }
          .apa-meta { grid-template-columns: 1fr; }
        }
      `}</style>
    </AdminPage>
  )
}

export default AptitudeAssessments

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FaCalculator, FaFileCsv, FaFileArchive, FaCalendarCheck, FaChevronLeft, FaChevronRight, FaSyncAlt,
  FaSpinner, FaExclamationTriangle, FaInbox, FaMedal,
} from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import CsvUploadForm from './components/BulkUpload'
import PuzzleUploadForm from './components/PuzzleUpload'
import { UPLOAD_CSS } from './components/UploadParts'
import { useAuthContext } from '@/context/useAuthContext'
import {
  AdminPage, PageHeader, Tabs, SearchInput, TableFooter, EmptyState, ProgressBar, initialsOf, scoreBadgeClass,
} from '@/components/admin-ui'

// ── Daily Exam Results ────────────────────────────────────────────────────────

const PAGE_SIZE = 20

function formatSecs(s: number) {
  const m = Math.floor((s || 0) / 60).toString().padStart(2, '0')
  const sec = ((s || 0) % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const CATEGORY_BADGE: Record<string, string> = {
  Aptitude: 'aui-badge-blue', Reasoning: 'aui-badge-purple', Technical: 'aui-badge-green', Puzzle: 'aui-badge-orange',
}

/* Local YYYY-MM-DD (toISOString would shift the day in IST evenings) */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const shiftDay = (date: string, days: number) => { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + days); return ymd(d) }
const longDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const RankBadge = ({ rank }: { rank: number }) => (
  <span className={`aqr-rank${rank <= 3 ? ` is-${rank}` : ''}`}>
    {rank <= 3 && <FaMedal size={9} />}#{rank}
  </span>
)

const DailyExamResults: React.FC = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const today = ymd(new Date())
  const [date, setDate] = useState(today)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchResults = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${baseURL}/api/admin/daily-aptitude/results?date=${date}&page=${page}&limit=${PAGE_SIZE}`,
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
    setDate(next); setPage(1); setSearch('')
  }

  const attempts: any[] = data?.attempts ?? []
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return attempts.filter(a => !q || a.studentName?.toLowerCase().includes(q) || a.studentEmail?.toLowerCase().includes(q))
  }, [attempts, search])

  const avg = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / attempts.length) : null
  const top = attempts.length ? Math.max(...attempts.map(a => a.percentage ?? 0)) : null

  return (
    <div className="aui-card">
      <div className="aui-toolbar">
        <div className="aqr-datebar">
          <button type="button" className="aui-icon-btn" onClick={() => changeDate(shiftDay(date, -1))} aria-label="Previous day" title="Previous day"><FaChevronLeft size={11} /></button>
          <input type="date" className="aui-date" value={date} max={today} onChange={e => changeDate(e.target.value)} aria-label="Exam date" />
          <button type="button" className="aui-icon-btn" onClick={() => changeDate(shiftDay(date, 1))} disabled={date >= today} aria-label="Next day" title="Next day"><FaChevronRight size={11} /></button>
          <div className="aui-toolbar-title aqr-date-title">
            <h3>{date === today ? 'Today' : longDate(date)}</h3>
            <p>
              {data ? `${data.total ?? attempts.length} attempt${(data.total ?? attempts.length) === 1 ? '' : 's'}` : 'Loading…'}
              {avg != null && <> · avg <b>{avg}%</b> · top <b>{top}%</b></>}
              {date !== today && <> · <button type="button" className="aqr-link" onClick={() => changeDate(today)}>Jump to today</button></>}
            </p>
          </div>
        </div>
        <div className="aui-toolbar-filters">
          <SearchInput value={search} onChange={setSearch} placeholder="Search student…" />
          <button type="button" className="aui-btn" onClick={fetchResults} disabled={loading}>
            <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="aui-alert aqr-alert"><FaExclamationTriangle /> <span>{error}</span></div>}

      {loading && !data ? (
        <div className="aui-empty"><FaSpinner className="aui-spin" size={22} /> Loading results…</div>
      ) : !data || attempts.length === 0 ? (
        <EmptyState
          icon={FaInbox}
          title="No attempts on this day"
          text={`No students took the daily aptitude exam on ${longDate(date)}.`}
          action={date !== today ? <button type="button" className="aui-btn aui-btn-sm" onClick={() => changeDate(today)}>Go to today</button> : undefined}
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={FaInbox} title="No students match" text="Try a different name or email." action={<button type="button" className="aui-btn aui-btn-sm" onClick={() => setSearch('')}>Clear search</button>} />
      ) : (
        <>
          <div className={`aui-table-scroll${loading ? ' aqr-busy' : ''}`}>
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
                </tr>
              </thead>
              <tbody>
                {visible.map((a, i) => {
                  const p = a.percentage ?? 0
                  return (
                    <tr key={`${a.studentEmail}-${i}`}>
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
                      <td className="aqr-mono">{formatSecs(a.timeTakenSeconds)}</td>
                      <td className="aui-num">{new Date(a.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
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
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'csv' | 'puzzle' | 'results'

const AptitudeQuestionsUpload = () => {
  const [activeTab, setActiveTab] = useState<Tab>('csv')

  return (
    <AdminPage>
      <PageMetaData title="Aptitude Questions" />

      <PageHeader
        icon={FaCalculator}
        title="Aptitude Questions"
        subtitle="Upload question banks and review daily exam results"
        actions={
          <Tabs<Tab>
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { value: 'csv', label: 'Text Questions', icon: FaFileCsv },
              { value: 'puzzle', label: 'Puzzle Questions', icon: FaFileArchive },
              { value: 'results', label: 'Daily Results', icon: FaCalendarCheck },
            ]}
          />
        }
      />

      {activeTab === 'csv'     && <CsvUploadForm />}
      {activeTab === 'puzzle'  && <PuzzleUploadForm />}
      {activeTab === 'results' && <DailyExamResults />}

      <style>{UPLOAD_CSS + `
        .aqr-datebar { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .aqr-date-title { margin-left: 6px; }
        .aqr-date-title h3 { white-space: nowrap; }
        .aqr-date-title b { color: #e5e7eb; }
        .aqr-link { padding: 0; border: 0; background: none; color: #ff9a3c; font-size: 0.78rem; font-weight: 600; }
        .aqr-link:hover { color: #ffb15e; text-decoration: underline; }
        .aqr-alert { margin: 0.85rem !important; }
        .aqr-busy { opacity: 0.55; pointer-events: none; }
        .aqr-mono { color: #c3c7ca; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.78rem; }
        .aqr-rank { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid #3a3e42; border-radius: 99px; background: #1b1e20; color: #9da2a6; font-size: 0.72rem; font-weight: 800; }
        .aqr-rank.is-1 { border-color: rgba(250,204,21,0.45); background: rgba(250,204,21,0.14); color: #facc15; }
        .aqr-rank.is-2 { border-color: rgba(203,213,225,0.4); background: rgba(203,213,225,0.1); color: #cbd5e1; }
        .aqr-rank.is-3 { border-color: rgba(217,119,6,0.45); background: rgba(217,119,6,0.14); color: #f59e0b; }
        .aui-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        @media (max-width: 575.98px) { .aqr-datebar { width: 100%; flex-wrap: wrap; } }
      `}</style>
    </AdminPage>
  )
}

export default AptitudeQuestionsUpload

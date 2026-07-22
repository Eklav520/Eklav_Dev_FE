import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  FiSearch, FiCalendar, FiBell, FiFilter, FiLink, FiMapPin, FiMoreVertical,
  FiClock, FiCheckCircle, FiXCircle, FiEdit3,
} from 'react-icons/fi'
import { useMyInterviews, type Interview } from '../useMyInterviews'
import MiniCalendar from '../MiniCalendar'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const RED    = '#ef4444'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  'Technical Interview': { bg: '#eef2ff', color: '#4f46e5' },
  'HR Interview':        { bg: '#eff6ff', color: '#2563eb' },
  'Case Study':          { bg: '#fff7ed', color: '#d97706' },
  Screening:             { bg: '#f0fdfa', color: '#0d9488' },
  'Managerial Round':    { bg: '#fdf2f8', color: '#db2777' },
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Scheduled:    { bg: '#eff6ff', color: '#2563eb' },
  'In Progress':{ bg: '#fff7ed', color: '#d97706' },
  Completed:    { bg: '#ecfdf5', color: '#059669' },
  Cancelled:    { bg: '#fef2f2', color: '#dc2626' },
}
const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  return { date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
}
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

type TabKey = 'All' | 'Today' | 'Tomorrow' | 'ThisWeek' | 'Completed' | 'Cancelled' | 'Custom'

const HRSchedulePage = () => {
  const navigate = useNavigate()
  const {
    interviews, permissions, memberName, memberRole, loading, loadError, actionError,
    today, tomorrow, thisWeek, scheduledOnly, completed, cancelled, startInterview,
  } = useMyInterviews()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('All')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openMenu, setOpenMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [detailsRow, setDetailsRow] = useState<Interview | null>(null)
  const [now, setNow] = useState(new Date())
  const [filterPanel, setFilterPanel] = useState<DOMRect | null>(null)
  const [filterRound, setFilterRound] = useState('All')
  const [filterMode, setFilterMode] = useState('All')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { setPage(1) }, [activeTab, search, customFrom, customTo, filterRound, filterMode])

  const tabRows: Record<Exclude<TabKey, 'Custom'>, Interview[]> = {
    All: interviews, Today: today, Tomorrow: tomorrow, ThisWeek: thisWeek, Completed: completed, Cancelled: cancelled,
  }

  const roundOptions = useMemo(() => Array.from(new Set(interviews.map(iv => iv.interviewType).filter(Boolean))), [interviews])
  const activeFilterCount = (filterRound !== 'All' ? 1 : 0) + (filterMode !== 'All' ? 1 : 0)

  const baseRows = useMemo(() => {
    if (activeTab === 'Custom') {
      if (!customFrom || !customTo) return []
      const from = new Date(customFrom).getTime()
      const to = new Date(customTo).getTime() + 24 * 60 * 60 * 1000 - 1
      return interviews.filter(iv => {
        const t = new Date(iv.scheduledAt).getTime()
        return t >= from && t <= to
      })
    }
    return tabRows[activeTab]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, interviews, today, tomorrow, thisWeek, completed, cancelled, customFrom, customTo])

  const filtered = useMemo(() => {
    return baseRows
      .filter(iv => !search || iv.candidateName.toLowerCase().includes(search.toLowerCase()) || (iv.jobTitle || '').toLowerCase().includes(search.toLowerCase()))
      .filter(iv => filterRound === 'All' || iv.interviewType === filterRound)
      .filter(iv => filterMode === 'All' || (filterMode === 'Online' ? !!iv.meetingLink : !iv.meetingLink))
      .sort((a, b) => sortBy === 'name'
        ? a.candidateName.localeCompare(b.candidateName)
        : new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }, [baseRows, search, sortBy, filterRound, filterMode])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const interviewDates = useMemo(() => new Set(interviews.map(iv => new Date(iv.scheduledAt).toDateString())), [interviews])

  const initialsName = initials(memberName || 'Interviewer')
  const [pfg, pbg] = avatarColor(memberName || 'I')

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Scheduled Interviews</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>View and manage all your interviews in one place.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidate, job or interview ID..."
              style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: 240, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light' }}
            />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 40, border: `1px solid ${BORDER}`, background: '#fff' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: pbg, color: pfg, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initialsName}</div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{memberName || 'Interviewer'}</div>
              <div style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>{memberRole || 'Interviewer'}</div>
            </div>
          </div>
        </div>
      </div>

      {loadError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{loadError}</div>}
      {actionError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, minHeight: 0 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Scheduled', value: scheduledOnly.length, sub: 'Awaiting interview', icon: <FiCalendar size={17}/>, ic: PURPLE, bg: '#f5f3ff' },
              { label: 'Today', value: today.length, sub: 'On today\'s calendar', icon: <FiCalendar size={17}/>, ic: GREEN, bg: '#ecfdf5' },
              { label: 'Tomorrow', value: tomorrow.length, sub: 'On tomorrow\'s calendar', icon: <FiClock size={17}/>, ic: ORANGE, bg: '#fff7ed' },
              { label: 'This Week', value: thisWeek.length, sub: 'Next 7 days', icon: <FiCalendar size={17}/>, ic: BLUE, bg: '#eff6ff' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.66rem', color: GRAY, marginTop: 2, whiteSpace: 'nowrap' }}>{s.label}</div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto', overflowY: 'hidden', gap: 0, flexShrink: 0 }}>
              {([
                ['All', `All (${tabRows.All.length})`],
                ['Today', `Today (${tabRows.Today.length})`],
                ['Completed', `Completed (${tabRows.Completed.length})`],
                ['Cancelled', `Cancelled (${tabRows.Cancelled.length})`],
                ['Custom', 'Custom Range'],
              ] as [TabKey, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '13px 12px', fontSize: '0.8rem',
                  fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? BLUE : GRAY,
                  borderBottom: activeTab === key ? `2px solid ${BLUE}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {label}
                </button>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', marginLeft: 'auto', flexShrink: 0 }}>
                <button
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setFilterPanel(prev => prev ? null : rect)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: activeFilterCount ? '#eff6ff' : '#f8fafc', border: `1px solid ${activeFilterCount ? BLUE : BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: activeFilterCount ? BLUE : '#334155', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
                >
                  <FiFilter size={13}/> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ height: 30, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
                  <option value="date">Sort by: Interview Time</option>
                  <option value="name">Sort by: Candidate Name</option>
                </select>
              </div>
            </div>

            {filterPanel && createPortal(
              <>
                <div onClick={() => setFilterPanel(null)} style={{ position: 'fixed', inset: 0, zIndex: 299 }} />
                <div style={{ position: 'fixed', top: filterPanel.bottom + 6, left: filterPanel.left, width: 240, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 300, padding: 14 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: GRAY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Round</div>
                  <select value={filterRound} onChange={e => setFilterRound(e.target.value)} style={{ width: '100%', height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', background: '#fff', color: '#334155', colorScheme: 'light', marginBottom: 12 }}>
                    <option value="All">All Rounds</option>
                    {roundOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: GRAY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mode</div>
                  <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{ width: '100%', height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
                    <option value="All">All Modes</option>
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 14 }}>
                    <button onClick={() => { setFilterRound('All'); setFilterMode('All') }} style={{ flex: 1, height: 30, border: `1px solid ${BORDER}`, borderRadius: 7, background: '#fff', color: '#334155', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>Clear</button>
                    <button onClick={() => setFilterPanel(null)} style={{ flex: 1, height: 30, border: 'none', borderRadius: 7, background: BLUE, color: '#fff', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>Apply</button>
                  </div>
                </div>
              </>,
              document.body
            )}

            {activeTab === 'Custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, background: '#f8fafc', flexShrink: 0 }}>
                <span style={{ fontSize: '0.76rem', color: '#334155', fontWeight: 600 }}>From</span>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }} />
                <span style={{ fontSize: '0.76rem', color: '#334155', fontWeight: 600 }}>To</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }} />
                {(!customFrom || !customTo) && <span style={{ fontSize: '0.72rem', color: GRAY }}>Pick both dates to filter</span>}
              </div>
            )}

            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0 }} onScroll={() => setOpenMenu(null)}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '15%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Interview Time', 'Candidate', 'Job Title', 'Round', 'Mode', 'Duration', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 10px', fontSize: '0.72rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && paged.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>No interviews found.</td></tr>
                  )}
                  {loading && (
                    <tr><td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading…</td></tr>
                  )}
                  {!loading && paged.map(iv => {
                    const [fg, bg] = avatarColor(iv.candidateName)
                    const dt = formatDateTime(iv.scheduledAt)
                    const typeStyle = TYPE_STYLE[iv.interviewType] || TYPE_STYLE['Technical Interview']
                    const statusStyle = STATUS_STYLE[iv.status] || STATUS_STYLE.Scheduled
                    return (
                      <tr key={iv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 10px', fontSize: '0.78rem', overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dt.date}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: GRAY, fontSize: '0.72rem', marginTop: 2, overflow: 'hidden' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: BLUE, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dt.time}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, color: fg, fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials(iv.candidateName)}</div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.candidateName}</div>
                              {iv.candidateEmail && <div style={{ fontSize: '0.66rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.candidateEmail}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.jobTitle || '—'}</td>
                        <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                          <span style={{ background: typeStyle.bg, color: typeStyle.color, fontSize: '0.66rem', fontWeight: 600, padding: '3px 6px', borderRadius: 6, display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{iv.interviewType}</span>
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: '#334155', overflow: 'hidden' }}>
                          {iv.meetingLink ? (
                            <a href={iv.meetingLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: BLUE, textDecoration: 'none', fontWeight: 600, overflow: 'hidden' }}><FiLink size={11} style={{ flexShrink: 0 }}/> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Online</span></a>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}><FiMapPin size={12} color={GRAY} style={{ flexShrink: 0 }}/> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>In-Person</span></span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', fontSize: '0.76rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.durationMinutes || 30}m</td>
                        <td style={{ padding: '12px 10px', overflow: 'hidden' }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.color, fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{iv.status}</span>
                        </td>
                        <td style={{ padding: '12px 10px', overflow: 'visible' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {(() => {
                              const schedTime = new Date(iv.scheduledAt).getTime()
                              const windowEnd = schedTime + (iv.durationMinutes || 30) * 60000
                              const isOverdue = now.getTime() > windowEnd
                              const canStart = iv.status === 'Scheduled' && permissions?.conductInterview && schedTime <= now.getTime()
                              if (canStart && isOverdue) {
                                return (
                                  <button onClick={() => startInterview(iv)} title="Overdue — start late" style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 8px', borderRadius: 7, border: 'none', background: RED, color: '#fff', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    Overdue
                                  </button>
                                )
                              }
                              if (canStart) {
                                return (
                                  <button onClick={() => startInterview(iv)} title="Start Interview" style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28, padding: '0 8px', borderRadius: 7, border: 'none', background: BLUE, color: '#fff', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                    ▶ Start
                                  </button>
                                )
                              }
                              return (
                                <button onClick={() => setDetailsRow(iv)} title="View Details" style={{ height: 28, padding: '0 8px', borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>View Details</button>
                              )
                            })()}
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <button
                                onClick={e => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setOpenMenu(prev => prev?.id === iv._id ? null : { id: iv._id, rect })
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex' }}
                              >
                                <FiMoreVertical size={15}/>
                              </button>
                              {openMenu?.id === iv._id && createPortal(
                                <>
                                  <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                                  <div style={{ position: 'fixed', top: openMenu.rect.bottom + 4, left: openMenu.rect.right - 170, minWidth: 170, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                                    <button onClick={() => { setOpenMenu(null); navigate(`/hr/my-interviews/feedback-form/${iv._id}`) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}>
                                      <FiEdit3 size={12} /> Give Feedback
                                    </button>
                                  </div>
                                </>,
                                document.body
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}`, flexWrap: 'wrap', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: '0.76rem', color: GRAY }}>
                {filtered.length === 0 ? 'Showing 0 interviews' : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, filtered.length)} of ${filtered.length} interviews`}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: GRAY }}>
                  Rows per page:
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ height: 26, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '0 6px', fontSize: '0.74rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 5).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: 26, height: 26, border: p === page ? 'none' : `1px solid ${BORDER}`, borderRadius: 6,
                      background: p === page ? BLUE : '#fff', color: p === page ? '#fff' : GRAY,
                      fontSize: '0.74rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Interview Calendar</div>
            <MiniCalendar interviewDates={interviewDates} />
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>Today's Schedule</span>
              <span style={{ fontSize: '0.68rem', color: GRAY }}>{today.length} Interview{today.length !== 1 ? 's' : ''}</span>
            </div>
            {today.length === 0 ? (
              <div style={{ fontSize: '0.76rem', color: GRAY }}>Nothing scheduled today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {today.slice(0, 3).map(iv => (
                  <div key={iv._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: BLUE, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#0f172a' }}>{timeOf(iv.scheduledAt)} {iv.candidateName}</div>
                      <div style={{ fontSize: '0.66rem', color: GRAY }}>{iv.jobTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Schedule Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total Scheduled', value: scheduledOnly.length, icon: <FiCalendar size={14}/>, ic: PURPLE, bg: '#f5f3ff' },
                { label: 'Completed', value: completed.length, icon: <FiCheckCircle size={14}/>, ic: GREEN, bg: '#ecfdf5' },
                { label: 'Upcoming', value: thisWeek.length, icon: <FiClock size={14}/>, ic: ORANGE, bg: '#fff7ed' },
                { label: 'Cancelled', value: cancelled.length, icon: <FiXCircle size={14}/>, ic: RED, bg: '#fef2f2' },
              ].map(s => (
                <div key={s.label} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: GRAY, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {detailsRow && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setDetailsRow(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 22, width: 400, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{detailsRow.candidateName}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: GRAY }}>{detailsRow.jobTitle || '—'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Round</span><span style={{ fontWeight: 600 }}>{detailsRow.interviewType}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Status</span><span style={{ fontWeight: 600 }}>{detailsRow.status}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Date</span><span style={{ fontWeight: 600 }}>{formatDateTime(detailsRow.scheduledAt).date}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Time</span><span style={{ fontWeight: 600 }}>{formatDateTime(detailsRow.scheduledAt).time}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Duration</span><span style={{ fontWeight: 600 }}>{detailsRow.durationMinutes || 30}m</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Mode</span><span style={{ fontWeight: 600 }}>{detailsRow.meetingLink ? 'Online' : 'In-Person'}</span></div>
              {detailsRow.candidateEmail && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: GRAY }}>Email</span><span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{detailsRow.candidateEmail}</span></div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={() => setDetailsRow(null)} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button onClick={() => { setDetailsRow(null); navigate(`/hr/my-interviews/feedback-form/${detailsRow._id}`) }} style={{ height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Give Feedback</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRSchedulePage

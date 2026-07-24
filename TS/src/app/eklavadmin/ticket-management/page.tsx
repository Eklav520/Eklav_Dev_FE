import { useEffect, useMemo, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaSearch, FaFilter, FaPaperclip, FaPaperPlane, FaChevronLeft, FaChevronRight,
  FaTicketAlt, FaRegClock, FaSyncAlt, FaCheckCircle, FaBoxOpen, FaRegStickyNote,
} from 'react-icons/fa'

const BLUE   = '#60a5fa'
const GREEN  = '#34d399'
const ORANGE = '#fbbf24'
const RED    = '#f87171'
const GRAY   = '#94a3b8'
const TEXT   = '#f1f5f9'
const BORDER = '#232f42'
const CARD_BG = '#12161c'
const INPUT_BG = '#0b0f17'
const ACCENT = '#f2622f'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Open:          { bg: 'rgba(248,113,113,0.14)', color: '#f87171' },
  'In Progress': { bg: 'rgba(96,165,250,0.14)', color: '#60a5fa' },
  Resolved:      { bg: 'rgba(52,211,153,0.14)', color: '#34d399' },
  Closed:        { bg: 'rgba(148,163,184,0.14)', color: '#94a3b8' },
}

const PRIORITY_STYLE: Record<string, string> = {
  High: '#f87171',
  Medium: '#fbbf24',
  Low: '#34d399',
}

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const

interface Reply {
  from: 'student' | 'admin'
  name?: string
  text: string
  createdAt: string
}
interface Note {
  text: string
  createdAt: string
}
interface Ticket {
  _id: string
  ticketNumber?: string
  name: string
  email: string
  subject?: string
  category?: string
  subCategory?: string
  issue: string
  image?: string
  status: string
  priority: string
  assignedTo?: string
  platform?: string
  device?: string
  submittedAt?: string
  createdAt?: string
  updatedAt?: string
  notes?: Note[]
  replies?: Reply[]
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
const formatDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}
const initials = (name: string) => (name || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()

const TicketManagementPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'All' | typeof STATUSES[number]>('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState('Open')
  const [priorityDraft, setPriorityDraft] = useState('Medium')
  const [assignedDraft, setAssignedDraft] = useState('')
  const [updating, setUpdating] = useState(false)

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchTickets = () => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list: Ticket[] = Array.isArray(data?.tickets) ? data.tickets : []
        setTickets(list)
        setSelectedId(prev => prev && list.some(t => t._id === prev) ? prev : (list[0]?._id || null))
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  useEffect(() => { setPage(1) }, [activeTab, search])

  const selectedTicket = useMemo(() => tickets.find(t => t._id === selectedId) || null, [tickets, selectedId])

  useEffect(() => {
    if (selectedTicket) {
      setStatusDraft(selectedTicket.status || 'Open')
      setPriorityDraft(selectedTicket.priority || 'Medium')
      setAssignedDraft(selectedTicket.assignedTo || '')
    }
  }, [selectedTicket?._id])

  const counts = useMemo(() => {
    const c = { total: tickets.length, open: 0, inProgress: 0, resolved: 0, closed: 0 }
    tickets.forEach(t => {
      if (t.status === 'Open') c.open++
      else if (t.status === 'In Progress') c.inProgress++
      else if (t.status === 'Resolved') c.resolved++
      else if (t.status === 'Closed') c.closed++
    })
    return c
  }, [tickets])

  const TABS: { key: 'All' | typeof STATUSES[number]; label: string }[] = [
    { key: 'All', label: `All Tickets (${counts.total})` },
    { key: 'Open', label: `Open (${counts.open})` },
    { key: 'In Progress', label: `In Progress (${counts.inProgress})` },
    { key: 'Resolved', label: `Resolved (${counts.resolved})` },
    { key: 'Closed', label: `Closed (${counts.closed})` },
  ]

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (activeTab !== 'All' && t.status !== activeTab) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(t.ticketNumber || '').toLowerCase().includes(q) &&
            !(t.subject || '').toLowerCase().includes(q) &&
            !(t.name || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tickets, activeTab, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const applyUpdate = async (patch: Partial<Ticket>) => {
    if (!selectedTicket) return
    setUpdating(true)
    setActionError('')
    try {
      const res = await fetch(`${baseURL}/admin/tickets/${selectedTicket._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('Failed to update ticket')
      const data = await res.json()
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? data.ticket : t))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update ticket')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateStatus = () => applyUpdate({ status: statusDraft, priority: priorityDraft, assignedTo: assignedDraft })
  const handleCloseTicket = () => { setStatusDraft('Closed'); applyUpdate({ status: 'Closed' }) }

  const handleSaveNote = async () => {
    if (!selectedTicket || !noteText.trim()) return
    setSavingNote(true)
    setActionError('')
    try {
      const res = await fetch(`${baseURL}/admin/tickets/${selectedTicket._id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: noteText }),
      })
      if (!res.ok) throw new Error('Failed to save note')
      const data = await res.json()
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? data.ticket : t))
      setNoteText('')
    } catch (e: any) {
      setActionError(e?.message || 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    setSendingReply(true)
    setActionError('')
    try {
      const res = await fetch(`${baseURL}/admin/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: replyText }),
      })
      if (!res.ok) throw new Error('Failed to send reply')
      const data = await res.json()
      setTickets(prev => prev.map(t => t._id === selectedTicket._id ? data.ticket : t))
      setReplyText('')
    } catch (e: any) {
      setActionError(e?.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const selStatusStyle = selectedTicket ? (STATUS_STYLE[selectedTicket.status] || STATUS_STYLE.Open) : STATUS_STYLE.Open

  return (
    <div style={{ minHeight: '100%' }}>
      <PageMetaData title="Ticket Management" />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: TEXT }}>Ticket Management</h1>
        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>View, manage and resolve student support tickets.</p>
      </div>

      {actionError && (
        <div style={{ background: 'rgba(248,113,113,0.14)', color: '#f87171', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Tickets', value: counts.total, sub: 'All time', icon: <FaTicketAlt size={17}/>, ic: ACCENT, bg: 'rgba(242,98,47,0.14)' },
          { label: 'Open', value: counts.open, sub: counts.total ? `${Math.round(counts.open / counts.total * 100)}% of total` : '0% of total', icon: <FaRegClock size={17}/>, ic: RED, bg: 'rgba(248,113,113,0.14)' },
          { label: 'In Progress', value: counts.inProgress, sub: counts.total ? `${Math.round(counts.inProgress / counts.total * 100)}% of total` : '0% of total', icon: <FaSyncAlt size={16}/>, ic: BLUE, bg: 'rgba(96,165,250,0.14)' },
          { label: 'Resolved', value: counts.resolved, sub: counts.total ? `${Math.round(counts.resolved / counts.total * 100)}% of total` : '0% of total', icon: <FaCheckCircle size={17}/>, ic: GREEN, bg: 'rgba(52,211,153,0.14)' },
          { label: 'Closed', value: counts.closed, sub: counts.total ? `${Math.round(counts.closed / counts.total * 100)}% of total` : '0% of total', icon: <FaBoxOpen size={16}/>, ic: GRAY, bg: 'rgba(148,163,184,0.14)' },
        ].map(s => (
          <div key={s.label} style={{ background: CARD_BG, borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: GRAY }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: GRAY }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? ACCENT : CARD_BG, border: `1px solid ${activeTab === tab.key ? ACCENT : BORDER}`,
                color: activeTab === tab.key ? '#fff' : TEXT, borderRadius: 7, padding: '7px 12px',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 280px', gap: 16, alignItems: 'start' }}>
        {/* Left: ticket list */}
        <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ position: 'relative' }}>
              <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: GRAY }}/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tickets..."
                style={{ width: '100%', height: 34, paddingLeft: 28, paddingRight: 10, border: `1px solid ${BORDER}`, borderRadius: 7, fontSize: '0.78rem', color: TEXT, background: INPUT_BG, outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 620, overflowY: 'auto' }}>
            {!loading && paged.length === 0 && (
              <div style={{ padding: '30px 14px', textAlign: 'center', fontSize: '0.8rem', color: GRAY }}>No tickets found.</div>
            )}
            {loading && (
              <div style={{ padding: '30px 14px', textAlign: 'center', fontSize: '0.8rem', color: GRAY }}>Loading tickets…</div>
            )}
            {!loading && paged.map(t => {
              const st = STATUS_STYLE[t.status] || STATUS_STYLE.Open
              const isActive = t._id === selectedId
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedId(t._id)}
                  style={{
                    padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
                    background: isActive ? 'rgba(242,98,47,0.12)' : 'transparent', borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ background: st.bg, color: st.color, fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{t.status}</span>
                    <span style={{ fontSize: '0.68rem', color: GRAY }}>{formatDate(t.submittedAt || t.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: GRAY, marginBottom: 2 }}>#{t.ticketNumber}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: TEXT, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.72rem', color: GRAY }}>{t.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: PRIORITY_STYLE[t.priority] || GRAY, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_STYLE[t.priority] || GRAY }}/>
                      {t.priority}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: '0.7rem', color: GRAY }}>
              {filtered.length === 0 ? '0 tickets' : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 26, height: 26, border: `1px solid ${BORDER}`, borderRadius: 6, background: CARD_BG, color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FaChevronLeft size={10}/>
              </button>
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ width: 26, height: 26, border: `1px solid ${BORDER}`, borderRadius: 6, background: CARD_BG, color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FaChevronRight size={10}/>
              </button>
            </div>
          </div>
        </div>

        {/* Center: ticket detail */}
        {selectedTicket ? (
          <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: GRAY }}>#{selectedTicket.ticketNumber}</span>
              <span style={{ background: selStatusStyle.bg, color: selStatusStyle.color, fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>{selectedTicket.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: TEXT }}>{selectedTicket.subject}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.74rem', color: PRIORITY_STYLE[selectedTicket.priority] || GRAY, fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_STYLE[selectedTicket.priority] || GRAY }}/>
                {selectedTicket.priority} Priority
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                  {initials(selectedTicket.name)}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: TEXT }}>{selectedTicket.name}</div>
                  <div style={{ fontSize: '0.72rem', color: GRAY }}>{selectedTicket.email}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: GRAY }}>Created On</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{formatDateTime(selectedTicket.submittedAt || selectedTicket.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: GRAY }}>Platform</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: TEXT }}>{selectedTicket.platform || 'Web Application'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 8 }}>Issue Description</div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedTicket.issue}</div>
            </div>

            {selectedTicket.image && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 8 }}>Attachments (1)</div>
                <a
                  href={`${baseURL}/uploads/${selectedTicket.image}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: BLUE, textDecoration: 'none' }}
                >
                  <FaPaperclip size={12}/> {selectedTicket.image}
                </a>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 10 }}>Ticket Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {[
                  ['Category', selectedTicket.category],
                  ['Sub-Category', selectedTicket.subCategory],
                  ['Status', selectedTicket.status],
                  ['Priority', selectedTicket.priority],
                  ['Device', selectedTicket.device],
                  ['Last Updated', formatDate(selectedTicket.updatedAt)],
                  ['Ticket ID', `#${selectedTicket.ticketNumber}`],
                  ['Created By', 'Student'],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: '0.8rem', color: TEXT, fontWeight: 600 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 8 }}>Internal Notes (Admin Only)</div>
              {!!selectedTicket.notes?.length && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {selectedTicket.notes.map((n, i) => (
                    <div key={i} style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#fde68a' }}>{n.text}</div>
                      <div style={{ fontSize: '0.65rem', color: '#d0a13b', marginTop: 3 }}>{formatDateTime(n.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                id="ticket-notes-input"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add internal notes..."
                rows={3}
                style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: '0.82rem', color: TEXT, background: INPUT_BG, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote || !noteText.trim()}
                  style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.8rem', fontWeight: 600, cursor: savingNote ? 'default' : 'pointer', opacity: savingNote || !noteText.trim() ? 0.6 : 1 }}
                >
                  {savingNote ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 40, textAlign: 'center', color: GRAY, fontSize: '0.85rem' }}>
            Select a ticket to view details.
          </div>
        )}

        {/* Right: status update + communication + quick actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 12 }}>Update Ticket Status</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 5 }}>Status *</label>
              <select value={statusDraft} onChange={e => setStatusDraft(e.target.value)} style={{ width: '100%', height: 34, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', background: INPUT_BG, color: TEXT, colorScheme: 'dark' }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 5 }}>Priority *</label>
              <select value={priorityDraft} onChange={e => setPriorityDraft(e.target.value)} style={{ width: '100%', height: 34, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', background: INPUT_BG, color: TEXT, colorScheme: 'dark' }}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 5 }}>Assign To</label>
              <input value={assignedDraft} onChange={e => setAssignedDraft(e.target.value)} placeholder="e.g. Support Team" style={{ width: '100%', height: 34, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.78rem', color: TEXT, background: INPUT_BG }}/>
            </div>
            <button
              onClick={handleUpdateStatus}
              disabled={updating || !selectedTicket}
              style={{ width: '100%', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: '0.82rem', fontWeight: 600, cursor: updating ? 'default' : 'pointer', opacity: updating || !selectedTicket ? 0.6 : 1 }}
            >
              {updating ? 'Updating…' : 'Update Status'}
            </button>
          </div>

          <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 12 }}>Communication</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
              {selectedTicket && (
                <div style={{ background: 'rgba(242,98,47,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: TEXT, marginBottom: 2 }}>{selectedTicket.name} (Student)</div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>{selectedTicket.issue}</div>
                  <div style={{ fontSize: '0.64rem', color: GRAY, marginTop: 3 }}>{formatDateTime(selectedTicket.submittedAt || selectedTicket.createdAt)}</div>
                </div>
              )}
              {selectedTicket?.replies?.map((r, i) => (
                <div key={i} style={{ background: r.from === 'admin' ? 'rgba(96,165,250,0.12)' : 'rgba(242,98,47,0.12)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: TEXT, marginBottom: 2 }}>{r.name || (r.from === 'admin' ? 'Support Team' : selectedTicket.name)} {r.from === 'admin' ? '' : '(Student)'}</div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5 }}>{r.text}</div>
                  <div style={{ fontSize: '0.64rem', color: GRAY, marginTop: 3 }}>{formatDateTime(r.createdAt)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: ACCENT, marginBottom: 6 }}>Reply</div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: '0.8rem', color: TEXT, background: INPUT_BG, outline: 'none', fontFamily: 'inherit', resize: 'vertical', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleSendReply}
                disabled={sendingReply || !replyText.trim() || !selectedTicket}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, cursor: sendingReply ? 'default' : 'pointer', opacity: sendingReply || !replyText.trim() ? 0.6 : 1 }}
              >
                <FaPaperPlane size={11}/> Send Reply
              </button>
            </div>
          </div>

          <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: TEXT, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => document.getElementById('ticket-notes-input')?.focus()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', cursor: 'pointer' }}
              >
                <FaRegStickyNote size={12}/> Add Note
              </button>
              <button
                disabled
                title="Admin attachments aren't supported yet"
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', fontWeight: 600, color: GRAY, cursor: 'not-allowed', opacity: 0.6 }}
              >
                <FaPaperclip size={12}/> Attach File
              </button>
              <button
                onClick={handleCloseTicket}
                disabled={updating || !selectedTicket || selectedTicket?.status === 'Closed'}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', fontWeight: 600, color: '#f87171', cursor: 'pointer', opacity: (!selectedTicket || selectedTicket?.status === 'Closed') ? 0.5 : 1 }}
              >
                <FaBoxOpen size={12}/> Close Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketManagementPage

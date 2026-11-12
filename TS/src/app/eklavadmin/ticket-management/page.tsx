import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaPaperclip, FaPaperPlane, FaTicketAlt, FaRegClock, FaSyncAlt, FaCheckCircle, FaBoxOpen,
  FaRegStickyNote, FaSpinner, FaExclamationTriangle, FaTimes, FaSave, FaInbox, FaHandPaper, FaEye, FaBell,
} from 'react-icons/fa'
import { AdminPage, AdminSelect, EmptyState, PageHeader, SearchInput, StatCards, Tabs, TableFooter, initialsOf, type StatItem } from '@/components/admin-ui'

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const
const PRIORITIES = ['High', 'Medium', 'Low'] as const

const STATUS_BADGE: Record<string, string> = {
  Open: 'aui-badge-red',
  'In Progress': 'aui-badge-blue',
  Resolved: 'aui-badge-green',
  Closed: 'aui-badge-muted',
}
// Row tint + left edge per status, so the table reads at a glance
const STATUS_ROW: Record<string, string> = {
  Open: 'st-open',
  'In Progress': 'st-progress',
  Resolved: 'st-resolved',
  Closed: 'st-closed',
}
const PRIORITY_COLOR: Record<string, string> ={ High: '#fb737a', Medium: '#f4b43f', Low: '#45dd75' }

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

const PAGE_SIZE = 10
const isDone = (t: Ticket) => t.status === 'Resolved' || t.status === 'Closed'

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
const formatDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : `${formatDate(iso)}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
}
const timeAgo = (iso?: string) => {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (Number.isNaN(mins)) return ''
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days < 30 ? `${days}d ago` : formatDate(iso)
}
const isImage = (name?: string) => !!name && /\.(png|jpe?g|gif|webp)$/i.test(name)

/* What needs attention, from who spoke last: a student message the team hasn't answered is flagged */
const activityOf = (t: Ticket): { kind: 'new' | 'reply' | 'waiting' | 'none'; at?: string } => {
  const last = t.replies?.length ? t.replies[t.replies.length - 1] : null
  if (isDone(t)) return { kind: 'none', at: last?.createdAt || t.updatedAt }
  if (!last) return { kind: t.status === 'Open' ? 'new' : 'none', at: t.submittedAt || t.createdAt }
  return last.from === 'student' ? { kind: 'reply', at: last.createdAt } : { kind: 'waiting', at: last.createdAt }
}

const TicketManagementPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<'Active' | 'All' | typeof STATUSES[number]>('Active')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [adminName, setAdminName] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState('Open')
  const [priorityDraft, setPriorityDraft] = useState('Medium')
  const [assignedDraft, setAssignedDraft] = useState('')
  const [updating, setUpdating] = useState(false)
  const [pickingId, setPickingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [actionError, setActionError] = useState('')
  const threadRef = useRef<HTMLDivElement>(null)

  const fetchTickets = () => {
    if (!baseURL || !token) return
    setLoading(true)
    setLoadError('')
    fetch(`${baseURL}/admin/tickets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setTickets(Array.isArray(data?.tickets) ? data.tickets : []))
      .catch(() => { setTickets([]); setLoadError('Could not load tickets.') })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  // Name used when picking up a ticket
  useEffect(() => {
    if (!baseURL || !token) return
    fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(p => p && setAdminName(p.fullName || p.name || ''))
      .catch(() => {})
  }, [baseURL, token])

  useEffect(() => { setPage(1) }, [activeTab, search, priorityFilter])
  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(id)
  }, [notice])

  const selectedTicket = useMemo(() => tickets.find(t => t._id === selectedId) || null, [tickets, selectedId])

  useEffect(() => {
    if (selectedTicket) {
      setStatusDraft(selectedTicket.status || 'Open')
      setPriorityDraft(selectedTicket.priority || 'Medium')
      setAssignedDraft(selectedTicket.assignedTo || '')
      setActionError('')
      setReplyText('')
      setNoteText('')
    }
  }, [selectedTicket?._id]) // eslint-disable-line

  // Keep the thread scrolled to the latest message (only the thread box, never the page)
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [selectedTicket?._id, selectedTicket?.replies?.length])

  const counts = useMemo(() => {
    const c = { total: tickets.length, open: 0, inProgress: 0, resolved: 0, closed: 0, attention: 0 }
    tickets.forEach(t => {
      if (t.status === 'Open') c.open++
      else if (t.status === 'In Progress') c.inProgress++
      else if (t.status === 'Resolved') c.resolved++
      else if (t.status === 'Closed') c.closed++
      const a = activityOf(t).kind
      if (a === 'new' || a === 'reply') c.attention++
    })
    return c
  }, [tickets])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter(t => {
      if (activeTab === 'Active' && isDone(t)) return false
      if (activeTab !== 'Active' && activeTab !== 'All' && t.status !== activeTab) return false
      if (priorityFilter && t.priority !== priorityFilter) return false
      if (q && ![t.ticketNumber, t.subject, t.name, t.email].some(v => (v || '').toLowerCase().includes(q))) return false
      return true
    })
  }, [tickets, activeTab, search, priorityFilter])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const putUpdate = async (id: string, patch: Partial<Ticket>) => {
    const res = await fetch(`${baseURL}/admin/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update ticket')
    const data = await res.json()
    setTickets(prev => prev.map(t => t._id === id ? data.ticket : t))
    return data.ticket as Ticket
  }

  const applyUpdate = async (patch: Partial<Ticket>, message: string) => {
    if (!selectedTicket) return
    setUpdating(true)
    setActionError('')
    try {
      const updated = await putUpdate(selectedTicket._id, patch)
      setStatusDraft(updated.status || 'Open')
      setPriorityDraft(updated.priority || 'Medium')
      setAssignedDraft(updated.assignedTo || '')
      setNotice(message)
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update ticket')
    } finally {
      setUpdating(false)
    }
  }

  // Pick up: move a new ticket to In Progress and assign it to whoever picked it
  const pickUp = async (t: Ticket, open = false) => {
    setPickingId(t._id)
    setLoadError('')
    try {
      await putUpdate(t._id, { status: 'In Progress', assignedTo: t.assignedTo || adminName || 'Support Team' })
      setNotice(`#${t.ticketNumber} picked up and moved to In Progress.`)
      if (open) setSelectedId(t._id)
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to pick up ticket')
    } finally {
      setPickingId(null)
    }
  }

  const dirty = !!selectedTicket && (
    statusDraft !== (selectedTicket.status || 'Open') ||
    priorityDraft !== (selectedTicket.priority || 'Medium') ||
    assignedDraft !== (selectedTicket.assignedTo || '')
  )

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
      // Replying to a brand-new ticket means someone is on it
      if (data.ticket?.status === 'Open') {
        await putUpdate(selectedTicket._id, { status: 'In Progress', assignedTo: data.ticket.assignedTo || adminName || 'Support Team' }).catch(() => {})
      }
    } catch (e: any) {
      setActionError(e?.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const stats: StatItem[] = [
    { label: 'Needs reply', value: counts.attention, icon: FaBell, tone: 'orange' },
    { label: 'Open', value: counts.open, icon: FaRegClock, tone: 'red' },
    { label: 'In progress', value: counts.inProgress, icon: FaSyncAlt, tone: 'blue' },
    { label: 'Resolved', value: counts.resolved, icon: FaCheckCircle, tone: 'green' },
  ]

  const t = selectedTicket
  const attachmentUrl = t?.image ? `${baseURL}/uploads/${t.image}` : ''

  return (
    <AdminPage className="tk-page">
      <PageMetaData title="Ticket Management" />

      <PageHeader
        icon={FaTicketAlt}
        title="Ticket Management"
        subtitle="Pick up student requests, reply, then resolve or close them"
        stats={<StatCards inline items={stats} loading={loading && tickets.length === 0} />}
        actions={
          <button type="button" className="aui-btn" onClick={fetchTickets} disabled={loading}>
            <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
          </button>
        }
      />

      {notice && (
        <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{notice}</span>
          <button type="button" className="aui-alert-close" onClick={() => setNotice('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}
      {loadError && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{loadError}</span>
          <button type="button" className="aui-alert-close" onClick={() => setLoadError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <Tabs<'Active' | 'All' | typeof STATUSES[number]>
            small
            value={activeTab}
            onChange={setActiveTab}
            label="Status"
            items={[
              { value: 'Active', label: 'Active', count: counts.open + counts.inProgress },
              { value: 'Open', label: 'Open', count: counts.open },
              { value: 'In Progress', label: 'In progress', count: counts.inProgress },
              { value: 'Resolved', label: 'Resolved', count: counts.resolved },
              { value: 'Closed', label: 'Closed', count: counts.closed },
              { value: 'All', label: 'All', count: counts.total },
            ]}
          />
          <div className="aui-toolbar-filters">
            <SearchInput value={search} onChange={setSearch} placeholder="Search #, subject, student…" />
            <AdminSelect
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[{ value: '', label: 'Any priority' }, ...PRIORITIES.map(p => ({ value: p, label: p }))]}
            />
          </div>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading tickets…</p></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FaInbox}
            title={tickets.length ? (activeTab === 'Active' ? 'All caught up' : 'No tickets match') : 'No tickets yet'}
            text={tickets.length ? (activeTab === 'Active' ? 'There are no open or in-progress tickets.' : 'Try a different status, priority or search.') : 'Student support requests will appear here.'}
          />
        ) : (
          <>
            <div className="tk-legend" aria-hidden="true">
              <span><i style={{ background: '#fb5f67' }} /> Open (new)</span>
              <span><i style={{ background: '#38bdf8' }} /> In progress</span>
              <span><i style={{ background: '#31d866' }} /> Resolved</span>
              <span><i style={{ background: '#4b5056' }} /> Closed</span>
            </div>
            <div className="aui-table-scroll">
              <table className="aui-table tk-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Student</th>
                    <th style={{ width: 110 }}>Priority</th>
                    <th style={{ width: 120 }}>Status</th>
                    <th>Activity</th>
                    <th>Assigned</th>
                    <th className="text-end" style={{ width: 150 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(tk => {
                    const act = activityOf(tk)
                    const flagged = act.kind === 'new' || act.kind === 'reply'
                    return (
                      <tr key={tk._id} className={`tk-row ${STATUS_ROW[tk.status] || ''}${flagged ? ' is-flagged' : ''}`} onClick={() => setSelectedId(tk._id)}>
                        <td>
                          <div className="tk-ticket">
                            <span className="tk-num">#{tk.ticketNumber}</span>
                            <strong title={tk.subject}>{tk.subject || 'No subject'}</strong>
                            {tk.category && <small>{tk.category}{tk.subCategory ? ` · ${tk.subCategory}` : ''}</small>}
                          </div>
                        </td>
                        <td>
                          <div className="aui-person">
                            <span className="aui-avatar">{initialsOf(tk.name)}</span>
                            <div className="aui-stack">
                              <strong className="tk-name">{tk.name}</strong>
                              <small className="tk-name">{tk.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="tk-prio-label" style={{ color: PRIORITY_COLOR[tk.priority] || '#9da2a8' }}>
                            <span className="tk-prio" style={{ background: PRIORITY_COLOR[tk.priority] || '#4b5056' }} /> {tk.priority}
                          </span>
                        </td>
                        <td><span className={`aui-badge aui-badge-dot ${STATUS_BADGE[tk.status] || 'aui-badge-muted'}`}>{tk.status}</span></td>
                        <td>
                          <div className="tk-activity">
                            {act.kind === 'new' && <span className="tk-flag"><span className="tk-pulse" /> New ticket</span>}
                            {act.kind === 'reply' && <span className="tk-flag"><span className="tk-pulse" /> Student replied</span>}
                            {act.kind === 'waiting' && <span className="tk-waiting">Waiting on student</span>}
                            {act.kind === 'none' && <span className="tk-quiet">{isDone(tk) ? 'Done' : 'No messages yet'}</span>}
                            <small>{timeAgo(act.at)}</small>
                          </div>
                        </td>
                        <td className="tk-assigned">{tk.assignedTo || <span className="tk-quiet">Unassigned</span>}</td>
                        <td className="text-end" onClick={e => e.stopPropagation()}>
                          <div className="tk-actions">
                            {tk.status === 'Open' ? (
                              <button type="button" className="aui-btn aui-btn-sm aui-btn-soft" onClick={() => pickUp(tk, true)} disabled={pickingId === tk._id} title="Move to In Progress and assign to you">
                                {pickingId === tk._id ? <FaSpinner className="aui-spin" /> : <FaHandPaper size={10} />} Pick up
                              </button>
                            ) : (
                              <button type="button" className={`aui-btn aui-btn-sm${flagged ? ' aui-btn-soft' : ''}`} onClick={() => setSelectedId(tk._id)}>
                                {isDone(tk) ? <><FaEye size={10} /> View</> : <><FaPaperPlane size={10} /> {flagged ? 'Reply' : 'Open'}</>}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} noun="tickets" />
          </>
        )}
      </div>

      {/* ── Ticket workspace ── */}
      <Modal show={!!t} onHide={() => setSelectedId(null)} size="xl" centered contentClassName="aui-modal tk-modal" backdropClassName="aui-backdrop">
        {t && (
          <div className="aui-page tk-modal-inner">
            <div className="aui-modal-head">
              <span className="aui-avatar tk-head-avatar">{initialsOf(t.name)}</span>
              <div>
                <h3 title={t.subject}>{t.subject || 'No subject'}</h3>
                <p>#{t.ticketNumber} · {t.name} · <a href={`mailto:${t.email}`}>{t.email}</a></p>
              </div>
              <span className={`aui-badge aui-badge-dot ${STATUS_BADGE[t.status] || 'aui-badge-muted'}`}>{t.status}</span>
              <button type="button" className="aui-icon-btn" onClick={() => setSelectedId(null)} aria-label="Close"><FaTimes size={12} /></button>
            </div>

            <div className="tk-modal-body">
              {/* Conversation */}
              <div className="tk-convo">
                <div className="tk-thread" ref={threadRef}>
                  <div className="tk-msg is-student">
                    <span className="aui-avatar tk-msg-avatar">{initialsOf(t.name)}</span>
                    <div className="tk-bubble">
                      <div className="tk-bubble-head"><b>{t.name}</b> <small>{formatDateTime(t.submittedAt || t.createdAt)}</small></div>
                      <p>{t.issue}</p>
                      {t.image && (
                        <a href={attachmentUrl} target="_blank" rel="noreferrer" className="tk-attach">
                          {isImage(t.image) && <img src={attachmentUrl} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
                          <FaPaperclip /> <span>{t.image}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  {t.replies?.map((r, i) => {
                    const admin = r.from === 'admin'
                    const who = r.name || (admin ? 'Support Team' : t.name)
                    return (
                      <div key={i} className={`tk-msg ${admin ? 'is-admin' : 'is-student'}`}>
                        <span className={`aui-avatar tk-msg-avatar${admin ? ' is-admin' : ''}`}>{initialsOf(who)}</span>
                        <div className="tk-bubble">
                          <div className="tk-bubble-head"><b>{who}</b> <small>{formatDateTime(r.createdAt)}</small></div>
                          <p>{r.text}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {actionError && (
                  <div className="aui-alert tk-alert"><FaExclamationTriangle /> <span>{actionError}</span>
                    <button type="button" className="aui-alert-close" onClick={() => setActionError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
                  </div>
                )}

                {t.status === 'Open' ? (
                  <div className="tk-pickup">
                    <div>
                      <strong>This ticket hasn't been picked up yet</strong>
                      <small>Pick it up to move it to In Progress and assign it to you, then reply.</small>
                    </div>
                    <button type="button" className="aui-btn aui-btn-primary" onClick={() => pickUp(t)} disabled={pickingId === t._id}>
                      {pickingId === t._id ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaHandPaper size={11} />} Pick up ticket
                    </button>
                  </div>
                ) : null}

                <div className="tk-composer">
                  <textarea
                    className="aui-input"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply() }}
                    placeholder={isDone(t) ? `This ticket is ${t.status.toLowerCase()}. You can still add a reply.` : `Reply to ${t.name.split(' ')[0]}…`}
                    rows={3}
                  />
                  <div className="tk-composer-foot">
                    <small>Ctrl + Enter to send · the student sees this reply</small>
                    <button type="button" className="aui-btn aui-btn-primary" onClick={handleSendReply} disabled={sendingReply || !replyText.trim()}>
                      {sendingReply ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaPaperPlane size={11} />} Send reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Side panel */}
              <aside className="tk-side">
                <div className="tk-side-block">
                  <div className="aui-section-label">Finish</div>
                  <div className="tk-finish">
                    <button type="button" className="aui-btn tk-resolve" onClick={() => applyUpdate({ status: 'Resolved' }, `#${t.ticketNumber} marked as resolved.`)} disabled={updating || t.status === 'Resolved'}>
                      <FaCheckCircle size={11} /> {t.status === 'Resolved' ? 'Resolved' : 'Mark resolved'}
                    </button>
                    <button type="button" className="aui-btn aui-btn-danger" onClick={() => applyUpdate({ status: 'Closed' }, `#${t.ticketNumber} closed.`)} disabled={updating || t.status === 'Closed'}>
                      <FaBoxOpen size={11} /> {t.status === 'Closed' ? 'Closed' : 'Close'}
                    </button>
                  </div>
                </div>

                <div className="tk-side-block">
                  <div className="aui-section-label">Ticket</div>
                  <div className="aui-field">
                    <span className="aui-label">Status</span>
                    <AdminSelect label="Status" value={statusDraft} onChange={setStatusDraft} options={STATUSES.map(s => ({ value: s, label: s }))} />
                  </div>
                  <div className="aui-field">
                    <span className="aui-label">Priority</span>
                    <AdminSelect label="Priority" value={priorityDraft} onChange={setPriorityDraft} options={PRIORITIES.map(p => ({ value: p, label: p }))} />
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="tk-assign">Assigned to</label>
                    <input id="tk-assign" className="aui-input" value={assignedDraft} onChange={e => setAssignedDraft(e.target.value)} placeholder="e.g. Support Team" />
                  </div>
                  <button type="button" className="aui-btn aui-btn-primary tk-save" onClick={() => applyUpdate({ status: statusDraft, priority: priorityDraft, assignedTo: assignedDraft }, `#${t.ticketNumber} updated.`)} disabled={updating || !dirty}>
                    {updating ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaSave size={11} />} Save changes
                  </button>
                </div>

                <div className="tk-side-block">
                  <div className="aui-section-label">Details</div>
                  <dl className="tk-facts">
                    {[
                      ['Category', [t.category, t.subCategory].filter(Boolean).join(' · ')],
                      ['Opened', formatDateTime(t.submittedAt || t.createdAt)],
                      ['Updated', formatDateTime(t.updatedAt)],
                      ['Platform', t.platform || 'Web Application'],
                      ['Device', t.device],
                    ].map(([label, value]) => (
                      <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>
                    ))}
                  </dl>
                </div>

                <div className="tk-side-block">
                  <div className="aui-section-label">Internal notes <span className="aui-optional">Admins only</span></div>
                  {!!t.notes?.length && (
                    <div className="tk-note-list">
                      {t.notes.map((n, i) => (
                        <div key={i} className="tk-note">
                          <p>{n.text}</p>
                          <small>{formatDateTime(n.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea className="aui-input tk-note-input" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note for the team…" rows={2} />
                  <button type="button" className="aui-btn aui-btn-sm tk-note-save" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                    {savingNote ? <FaSpinner className="aui-spin" /> : <FaRegStickyNote size={10} />} Save note
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        /* Compact header boxes on this page */
        .tk-page .aui-stats-inline .aui-stat { padding-top: 0.45rem; padding-bottom: 0.45rem; }

        .tk-row { cursor: pointer; }
        .tk-row td:first-child { box-shadow: inset 4px 0 0 var(--tk-edge, transparent); }
        .tk-row.st-open { --tk-edge: #fb5f67; background: rgba(251,95,103,0.07); }
        .tk-row.st-progress { --tk-edge: #38bdf8; background: rgba(56,189,248,0.06); }
        .tk-row.st-resolved { --tk-edge: #31d866; background: rgba(49,216,102,0.05); }
        .tk-row.st-closed { --tk-edge: #4b5056; background: rgba(255,255,255,0.015); }
        .tk-row.st-closed td > * { opacity: 0.6; }
        .tk-row.st-open:hover { background: rgba(251,95,103,0.12); }
        .tk-row.st-progress:hover { background: rgba(56,189,248,0.1); }
        .tk-row.st-resolved:hover { background: rgba(49,216,102,0.09); }
        .tk-row.st-closed:hover { background: rgba(255,255,255,0.04); }
        .tk-legend { display: flex; flex-wrap: wrap; gap: 14px; padding: 0.55rem 1rem; border-bottom: 1px solid #25282b; color: #858a90; font-size: 0.72rem; }
        .tk-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .tk-legend i { width: 10px; height: 10px; border-radius: 3px; }
        .tk-ticket { display: flex; flex-direction: column; gap: 2px; min-width: 220px; max-width: 360px; }
        .tk-ticket strong { overflow: hidden; color: #eceef0; font-size: 0.84rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
        .tk-ticket small { color: #6b7280; font-size: 0.7rem; }
        .tk-num { color: #858a90; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.7rem; font-weight: 700; }
        .tk-name { display: block; max-width: 210px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tk-prio { display: inline-block; width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; }
        .tk-prio-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 650; }
        .tk-activity { display: flex; flex-direction: column; gap: 2px; }
        .tk-activity small { color: #6b7280; font-size: 0.68rem; }
        .tk-flag { display: inline-flex; align-items: center; gap: 7px; color: #ffb15e; font-size: 0.78rem; font-weight: 700; }
        .tk-pulse { position: relative; width: 8px; height: 8px; border-radius: 50%; background: #ff7a00; }
        .tk-pulse::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid rgba(255,122,0,0.5); animation: tk-ping 1.6s ease-out infinite; }
        @keyframes tk-ping { from { transform: scale(0.6); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
        .tk-waiting { color: #93c5fd; font-size: 0.78rem; font-weight: 600; }
        .tk-quiet { color: #6b7280; font-size: 0.78rem; }
        .tk-assigned { color: #c3c7ca; font-size: 0.8rem; white-space: nowrap; }
        .tk-actions { display: inline-flex; gap: 6px; }

        .tk-modal { max-height: calc(100vh - 3.5rem); }
        .tk-modal-inner { display: flex; flex-direction: column; min-height: 0; max-height: calc(100vh - 3.5rem); }
        .tk-modal .aui-modal-head h3 { white-space: nowrap; }
        .tk-modal .aui-modal-head p a { color: inherit; }
        .tk-head-avatar { width: 38px; height: 38px; flex: 0 0 38px; }
        .tk-modal-body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; min-height: 0; flex: 1; overflow: hidden; }
        .tk-convo { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid #25282b; }
        .tk-thread { flex: 1; display: flex; flex-direction: column; gap: 14px; min-height: 240px; max-height: calc(100vh - 330px); overflow-y: auto; padding: 1rem 1.15rem; color-scheme: dark; scrollbar-color: #34383d transparent; scrollbar-width: thin; }
        .tk-msg { display: flex; gap: 10px; max-width: 88%; }
        .tk-msg.is-admin { flex-direction: row-reverse; align-self: flex-end; }
        .tk-msg-avatar { width: 30px; height: 30px; flex: 0 0 30px; font-size: 0.66rem; }
        .tk-msg-avatar.is-admin { background: rgba(96,165,250,0.15); color: #93c5fd; }
        .tk-bubble { min-width: 0; padding: 0.6rem 0.8rem; border: 1px solid #25282b; border-radius: 4px 12px 12px 12px; background: #111315; }
        .tk-msg.is-admin .tk-bubble { border-color: rgba(96,165,250,0.25); border-radius: 12px 4px 12px 12px; background: rgba(96,165,250,0.07); }
        .tk-bubble-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
        .tk-bubble-head b { color: #e5e7eb; font-size: 0.76rem; }
        .tk-bubble-head small { color: #6b7280; font-size: 0.66rem; }
        .tk-bubble p { margin: 0; color: #d1d5db; font-size: 0.84rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
        .tk-attach { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; margin-top: 8px; padding: 6px 10px; border: 1px solid #2c3034; border-radius: 8px; background: #17191c; color: #93c5fd; font-size: 0.76rem; text-decoration: none; }
        .tk-attach img { width: 56px; height: 40px; border-radius: 5px; object-fit: cover; }
        .tk-attach span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tk-alert { margin: 0 1.15rem 0.75rem !important; }
        .tk-pickup { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 1.15rem 0.75rem; padding: 0.7rem 0.9rem; border: 1px solid rgba(255,122,0,0.35); border-radius: 10px; background: rgba(255,122,0,0.07); }
        .tk-pickup strong { display: block; color: #ffb15e; font-size: 0.82rem; }
        .tk-pickup small { color: #a6abb0; font-size: 0.72rem; }
        .tk-composer { padding: 0.85rem 1.15rem 1rem; border-top: 1px solid #25282b; background: #0e1012; }
        .tk-composer textarea, .tk-note-input { height: auto; padding: 0.6rem 0.8rem; resize: vertical; line-height: 1.5; }
        .tk-composer-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 8px; }
        .tk-composer-foot small { color: #6b7280; font-size: 0.7rem; }

        .tk-side { min-height: 0; overflow-y: auto; padding: 0.4rem 1rem 1rem; background: #0c0d0f; color-scheme: dark; scrollbar-color: #34383d transparent; scrollbar-width: thin; }
        .tk-side-block { padding: 0.75rem 0; border-bottom: 1px solid #1d2023; }
        .tk-side-block:last-child { border-bottom: 0; }
        .tk-side .aui-section-label { margin-bottom: 0.6rem; }
        .tk-side .aui-field { margin-bottom: 0.7rem; }
        .tk-side .aui-dropdown, .tk-side .aui-dropdown-trigger { width: 100%; }
        .tk-side .aui-input { height: 36px; }
        .tk-finish { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tk-resolve { border-color: rgba(49,216,102,0.45); background: rgba(49,216,102,0.12); color: #45dd75; }
        .tk-resolve:hover:not(:disabled) { border-color: rgba(49,216,102,0.7); background: rgba(49,216,102,0.2); color: #6ee7a0; }
        .tk-save { width: 100%; }
        .tk-facts { display: flex; flex-direction: column; gap: 7px; margin: 0; }
        .tk-facts div { display: flex; justify-content: space-between; gap: 12px; }
        .tk-facts dt { color: #6b7280; font-size: 0.74rem; font-weight: 600; }
        .tk-facts dd { margin: 0; color: #e5e7eb; font-size: 0.76rem; font-weight: 600; text-align: right; }
        .tk-note-list { display: flex; flex-direction: column; gap: 6px; max-height: 180px; margin-bottom: 8px; overflow-y: auto; }
        .tk-note { padding: 0.5rem 0.7rem; border: 1px solid rgba(244,180,63,0.28); border-left: 3px solid #f4b43f; border-radius: 8px; background: rgba(244,180,63,0.06); }
        .tk-note p { margin: 0; color: #fde68a; font-size: 0.78rem; line-height: 1.5; white-space: pre-wrap; }
        .tk-note small { color: #b8913a; font-size: 0.64rem; }
        .tk-note-save { margin-top: 8px; }

        @media (max-width: 991.98px) {
          .tk-modal-body { grid-template-columns: 1fr; overflow-y: auto; }
          .tk-convo { border-right: 0; border-bottom: 1px solid #25282b; }
          .tk-thread { max-height: 420px; }
        }
      `}</style>
    </AdminPage>
  )
}

export default TicketManagementPage

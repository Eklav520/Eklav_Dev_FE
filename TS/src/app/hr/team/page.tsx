import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiSearch, FiBell, FiPlus, FiFilter, FiMoreVertical, FiX, FiTrash2, FiCheckCircle,
  FiChevronRight, FiChevronsRight, FiChevronLeft, FiChevronsLeft, FiMail, FiGrid,
} from 'react-icons/fi'
import { HiOutlineUserGroup } from 'react-icons/hi'
import { BsShield, BsGraphUp, BsEnvelopeCheck } from 'react-icons/bs'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

const STATUSES = ['Active', 'Pending', 'Inactive'] as const
type MemberStatus = typeof STATUSES[number]

const STATUS_DOT: Record<string, string> = { Active: GREEN, Pending: ORANGE, Inactive: RED }

const DEPARTMENTS = ['Engineering', 'Talent Acquisition', 'Human Resources', 'Marketing', 'Finance', 'Others'] as const

const ROLES = ['Admin', 'Manager', 'Team Lead', 'Recruiter', 'Member'] as const
type MemberRole = typeof ROLES[number]

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  Admin:      { bg: '#fff7ed', color: '#d97706' },
  Manager:    { bg: '#eff6ff', color: '#2563eb' },
  'Team Lead':{ bg: '#eef2ff', color: '#4f46e5' },
  Recruiter:  { bg: '#f0fdfa', color: '#0d9488' },
  Member:     { bg: '#f1f5f9', color: '#475569' },
}

const DONUT_PALETTE = [BLUE, PURPLE, GREEN, ORANGE, RED, '#0d9488', '#db2777']

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const formatDate = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatRelative = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(iso)
}

interface TeamMember {
  _id: string
  name: string
  email: string
  department?: string
  role: MemberRole
  status: MemberStatus
  joinDate?: string
  lastActiveAt?: string | null
  birthday?: string | null
  createdAt?: string
}

const emptyForm = { name: '', email: '', department: '', role: 'Member' as MemberRole, birthday: '' }

const Donut = ({ total, segments }: { total: number; segments: { label: string; value: number; color: string }[] }) => {
  const size = 118, cx = 59, cy = 59, r = 43, stroke = 13
  const circum = 2 * Math.PI * r
  let offset = 0
  const segs = segments.filter(s => s.value > 0).map(s => {
    const dash = total > 0 ? (s.value / total) * circum : 0
    const gap = circum - dash
    const seg = { ...s, dash, gap, offset: circum * 0.25 - offset }
    offset += dash
    return seg
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, display: 'block' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={stroke}/>
          {segs.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} strokeLinecap="butt" />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '0.58rem', color: GRAY }}>Total</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            <span style={{ color: GRAY, flexShrink: 0, marginLeft: 6 }}>{s.value} ({total ? Math.round(s.value / total * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const HRTeamPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'All' | MemberStatus>('All')
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'role'>('recent')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  const [openMenu, setOpenMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [actionError, setActionError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const fetchAll = () => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/team-members`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(memberData => setMembers(Array.isArray(memberData) ? memberData : []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  useEffect(() => { setPage(1) }, [activeTab, search, filterDept])

  const total = members.length
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    STATUSES.forEach(s => { c[s] = 0 })
    members.forEach(m => { if (c[m.status] !== undefined) c[m.status]++ })
    return c
  }, [members])

  const departmentOptions = useMemo(() => Array.from(new Set(members.map(m => m.department).filter(Boolean))) as string[], [members])
  const adminCount = useMemo(() => members.filter(m => m.role === 'Admin').length, [members])
  const activeThisMonth = useMemo(() => {
    const now = new Date()
    return members.filter(m => m.lastActiveAt && new Date(m.lastActiveAt).getMonth() === now.getMonth() && new Date(m.lastActiveAt).getFullYear() === now.getFullYear()).length
  }, [members])

  const TABS: { key: 'All' | MemberStatus; label: string }[] = [
    { key: 'All', label: `All Members (${total})` },
    { key: 'Active', label: `Active (${counts.Active || 0})` },
    { key: 'Pending', label: `Pending (${counts.Pending || 0})` },
    { key: 'Inactive', label: `Inactive (${counts.Inactive || 0})` },
  ]

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (activeTab !== 'All' && m.status !== activeTab) return false
      if (filterDept && m.department !== filterDept) return false
      if (search) {
        const q = search.toLowerCase()
        if (!m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !m.role.toLowerCase().includes(q)) return false
      }
      return true
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'role') return a.role.localeCompare(b.role)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [members, activeTab, filterDept, search, sortBy])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const changeStatus = async (m: TeamMember, status: MemberStatus) => {
    setOpenMenu(null)
    setActionError('')
    setActioningId(m._id)
    try {
      const res = await fetch(`${baseURL}/team-members/${m._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to update status')
      const updated = await res.json()
      setMembers(prev => prev.map(x => x._id === m._id ? updated : x))
      fetchAll()
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update status')
    } finally {
      setActioningId(null)
    }
  }

  const removeMember = async (m: TeamMember) => {
    setOpenMenu(null)
    if (!window.confirm(`Remove "${m.name}" from the team?`)) return
    setActionError('')
    setActioningId(m._id)
    try {
      const res = await fetch(`${baseURL}/team-members/${m._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to remove member')
      setMembers(prev => prev.filter(x => x._id !== m._id))
      fetchAll()
    } catch (e: any) {
      setActionError(e?.message || 'Failed to remove member')
    } finally {
      setActioningId(null)
    }
  }

  const handleAddMember = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setSaveError('Name and email are required')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`${baseURL}/team-members`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to invite member')
      setShowAdd(false)
      setForm(emptyForm)
      fetchAll()
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to invite member')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light' as const, boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Team Members</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Manage your team members, roles and permissions.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search team members..."
              style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: 240, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light' }}
            />
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: '0.8rem', fontWeight: 500 }}>
            <FiFilter size={14}/> Filter
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Members', value: total, sub: 'Active team members', icon: <HiOutlineUserGroup size={19}/>, ic: PURPLE, bg: '#f5f3ff' },
          { label: 'Departments', value: departmentOptions.length, sub: 'Across organization', icon: <FiGrid size={17}/>, ic: GREEN, bg: '#ecfdf5' },
          { label: 'Admin Users', value: adminCount, sub: 'Have admin access', icon: <BsShield size={16}/>, ic: ORANGE, bg: '#fff7ed' },
          { label: 'Active This Month', value: activeThisMonth, sub: 'Members active', icon: <BsGraphUp size={16}/>, ic: BLUE, bg: '#eff6ff' },
          { label: 'Invitations Sent', value: counts.Pending || 0, sub: 'Pending acceptance', icon: <BsEnvelopeCheck size={16}/>, ic: PURPLE, bg: '#f5f3ff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: GRAY, marginBottom: 2, whiteSpace: 'nowrap' }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.66rem', color: GRAY, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: table + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>

        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '14px 14px', fontSize: '0.8rem', fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? BLUE : GRAY,
                  borderBottom: activeTab === tab.key ? `2px solid ${BLUE}` : '2px solid transparent',
                  marginBottom: -1, whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
              <FiSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or role..." style={{ width: '100%', paddingLeft: 28, paddingRight: 10, height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, fontSize: '0.76rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light', boxSizing: 'border-box' }} />
            </div>
            <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
              <option value="">All Departments</option>
              {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ height: 32, border: `1px solid ${BORDER}`, borderRadius: 7, padding: '0 8px', fontSize: '0.76rem', background: '#fff', color: '#334155', colorScheme: 'light' }}>
              <option value="recent">Sort by: Recently Added</option>
              <option value="name">Sort by: Name</option>
              <option value="role">Sort by: Role</option>
            </select>
          </div>

          {/* Table */}
          <div className="hr-table-scroll" style={{ flex: 1, overflow: 'auto' }} onScroll={() => setOpenMenu(null)}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Member', 'Department', 'Role', 'Status', 'Join Date', 'Last Active', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', fontSize: '0.74rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loading && paged.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>No team members found.</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading team members…</td></tr>
                )}
                {!loading && paged.map(m => {
                  const [fg, bg] = avatarColor(m.name)
                  const roleStyle = ROLE_STYLE[m.role] || ROLE_STYLE.Member
                  return (
                    <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbfc'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, color: fg, fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {initials(m.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{m.name}</div>
                            <div style={{ fontSize: '0.7rem', color: GRAY, whiteSpace: 'nowrap' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>{m.department || '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: roleStyle.bg, color: roleStyle.color, fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>{m.role}</span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_DOT[m.status] }} />
                          <span style={{ fontSize: '0.78rem', color: '#334155' }}>{m.status}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.76rem', color: GRAY, whiteSpace: 'nowrap' }}>{formatDate(m.joinDate)}</td>
                      <td style={{ padding: '14px', fontSize: '0.76rem', whiteSpace: 'nowrap', color: m.lastActiveAt ? GREEN : GRAY }}>{m.lastActiveAt ? formatRelative(m.lastActiveAt) : '—'}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                          {m.status === 'Pending' && (
                            <span title="Invitation pending" style={{ color: ORANGE, display: 'flex' }}><FiMail size={14}/></span>
                          )}
                          <button
                            onClick={e => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setOpenMenu(prev => prev?.id === m._id ? null : { id: m._id, rect })
                            }}
                            disabled={actioningId === m._id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center', opacity: actioningId === m._id ? 0.5 : 1 }}
                            title="More"
                          >
                            <FiMoreVertical size={15}/>
                          </button>

                          {openMenu?.id === m._id && createPortal(
                            <>
                              <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                              <div style={{
                                position: 'fixed', top: openMenu.rect.bottom + 4, left: openMenu.rect.right - 180, minWidth: 180,
                                background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                              }}>
                                <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Set status</div>
                                {STATUSES.filter(s => s !== m.status).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => changeStatus(m, s)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                  >
                                    <FiCheckCircle size={13} color={STATUS_DOT[s]} /> Mark as {s}
                                  </button>
                                ))}
                                <div style={{ borderTop: `1px solid ${BORDER}` }} />
                                <button
                                  onClick={() => removeMember(m)}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                >
                                  <FiTrash2 size={13} /> Remove
                                </button>
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: GRAY }}>
              {filtered.length === 0 ? 'Showing 0 members' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} members`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronsLeft size={13}/>
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.5 : 1 }}>
                <FiChevronLeft size={13}/>
              </button>
              {(() => {
                const pageBtn = (p: number) => {
                  const isActive = p === page
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: 30, height: 30, border: isActive ? 'none' : `1px solid ${BORDER}`,
                      borderRadius: 6, background: isActive ? BLUE : '#fff', color: isActive ? '#fff' : GRAY,
                      fontSize: '0.78rem', fontWeight: isActive ? 700 : 400,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {p}
                    </button>
                  )
                }
                const leadCount = Math.min(4, pageCount)
                const leadPages = Array.from({ length: leadCount }, (_, i) => i + 1)
                const showMiddlePage = page > leadCount && page < pageCount
                const showTrailingEllipsis = pageCount > leadCount
                return (
                  <>
                    {leadPages.map(pageBtn)}
                    {showMiddlePage && (<><span style={{ color: GRAY, fontSize: '0.78rem', padding: '0 4px' }}>…</span>{pageBtn(page)}</>)}
                    {showTrailingEllipsis && <span style={{ color: GRAY, fontSize: '0.78rem', padding: '0 4px' }}>…</span>}
                    {pageCount > leadCount && pageBtn(pageCount)}
                  </>
                )
              })()}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronRight size={13}/>
              </button>
              <button onClick={() => setPage(pageCount)} disabled={page === pageCount} style={{ width: 30, height: 30, border: `1px solid ${BORDER}`, borderRadius: 6, background: '#fff', color: GRAY, cursor: page === pageCount ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === pageCount ? 0.5 : 1 }}>
                <FiChevronsRight size={13}/>
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Role Distribution</div>
            <Donut total={total} segments={ROLES.map((r, i) => ({ label: r, value: members.filter(m => m.role === r).length, color: DONUT_PALETTE[i % DONUT_PALETTE.length] }))} />
          </div>
        </div>
      </div>

      {/* Add Member modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 460, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Add Team Member</span>
              <button onClick={() => { setShowAdd(false); setSaveError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {saveError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8 }}>{saveError}</div>}

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Karan Malhotra" style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email *</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@company.com" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inputStyle}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as MemberRole }))} style={inputStyle}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Birthday (optional)</label>
                <input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => { setShowAdd(false); setSaveError('') }} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAddMember} disabled={saving} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Sending Invite…' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hr-table-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .hr-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-table-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .hr-table-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .hr-table-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
      `}</style>
    </div>
  )
}

export default HRTeamPage

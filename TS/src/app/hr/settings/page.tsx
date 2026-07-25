import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FiSearch, FiBell, FiPlus, FiFilter, FiMoreVertical, FiX, FiTrash2, FiChevronRight,
  FiCheckCircle, FiMinus, FiCopy, FiShield, FiClock, FiRefreshCw, FiEdit2,
} from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'
const ACCENT = '#f2622f' // coral — matches /hr/jobs, /hr/candidates, /hr/pipeline & /hr/interviews

const ACCESS_LEVELS = ['Full Access', 'Interview Only', 'Limited Access', 'View Only'] as const
type AccessLevel = typeof ACCESS_LEVELS[number]

const ACCESS_STYLE: Record<string, { bg: string; color: string }> = {
  'Full Access':     { bg: '#eff6ff', color: '#2563eb' },
  'Interview Only':  { bg: '#eef2ff', color: '#4f46e5' },
  'Limited Access':  { bg: '#fff7ed', color: '#d97706' },
  'View Only':       { bg: '#f1f5f9', color: '#475569' },
}
const ACCESS_DONUT_COLOR: Record<string, string> = { 'Full Access': BLUE, 'Interview Only': PURPLE, 'Limited Access': ORANGE, 'View Only': GRAY }

const PERMISSION_LABELS: { key: keyof Permissions; label: string }[] = [
  { key: 'viewCandidates', label: 'View Candidates' },
  { key: 'scheduleInterview', label: 'Schedule Interview' },
  { key: 'conductInterview', label: 'Conduct Interview' },
  { key: 'provideFeedback', label: 'Provide Feedback' },
  { key: 'assessmentReports', label: 'Assessment Reports' },
  { key: 'manageSettings', label: 'Manage Settings' },
  { key: 'manageUsers', label: 'Manage Users' },
]

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}
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
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.round(diffHr / 24)}d ago`
}

interface Permissions {
  viewCandidates: boolean; scheduleInterview: boolean; conductInterview: boolean
  provideFeedback: boolean; assessmentReports: boolean; manageSettings: boolean; manageUsers: boolean
}

interface Member {
  _id: string
  name: string
  email: string
  department?: string
  role: string
  status: 'Active' | 'Pending' | 'Inactive'
  joinDate?: string
  lastActiveAt?: string | null
  permissionLevel: AccessLevel
  permissions: Permissions
  userId?: string | null
  createdAt?: string
}

interface InterviewLite { _id: string; candidateName: string; jobTitle?: string; status: string; scheduledAt: string; feedbackScore?: number | null; interviewers: { teamMemberId?: string | null }[] }
interface ActivityEntry { _id: string; message: string; createdAt: string; memberId?: string | null }

type AccountType = 'Interviewer' | 'HR Interviewer' | 'Hiring Manager' | 'HR Operations'
// 'Interviewer' is the stored value for the original Technical Interviewer
// persona — kept as-is so existing invited/accepted accounts aren't affected.
const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'Interviewer', label: 'Technical Interviewer' },
  { value: 'HR Interviewer', label: 'HR Interviewer' },
  { value: 'Hiring Manager', label: 'Hiring Manager' },
  { value: 'HR Operations', label: 'HR Operations' },
]
const emptyForm = { name: '', email: '', department: '', role: 'Member', permissionLevel: 'Interview Only' as AccessLevel, accountType: 'Interviewer' as AccountType }

const HRSettingsPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [members, setMembers] = useState<Member[]>([])
  const [interviews, setInterviews] = useState<InterviewLite[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTopTab, setActiveTopTab] = useState<'Team Access' | 'Roles & Permissions' | 'Login Security' | 'Activity Logs' | 'Invite History'>('Team Access')

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<'Access & Permissions' | 'Assigned Interviews' | 'Feedback History' | 'Activity'>('Access & Permissions')

  const [openMenu, setOpenMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [actionError, setActionError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const fetchAll = () => {
    if (!baseURL || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${baseURL}/team-members`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/interviews`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/team-activity`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([memberData, interviewData, activityData]) => {
        setMembers(Array.isArray(memberData) ? memberData : [])
        setInterviews(Array.isArray(interviewData) ? interviewData : [])
        setActivity(Array.isArray(activityData) ? activityData : [])
      })
      .catch(() => { setMembers([]); setInterviews([]); setActivity([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  useEffect(() => { setPage(1) }, [search])

  const total = members.length
  const activeCount = members.filter(m => m.status === 'Active').length
  const pendingCount = members.filter(m => m.status === 'Pending').length
  const inactiveCount = members.filter(m => m.status === 'Inactive').length
  const rolesCreated = useMemo(() => new Set(members.map(m => m.role)).size, [members])

  const accessSummary = useMemo(() => ACCESS_LEVELS.map(level => ({
    level, count: members.filter(m => m.permissionLevel === level).length,
  })), [members])

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (!search) return true
      const q = search.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
    })
  }, [members, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const selectedMember = members.find(m => m._id === selectedId) || null
  const memberInterviews = useMemo(() => selectedMember
    ? interviews.filter(iv => iv.interviewers?.some(p => p.teamMemberId === selectedMember._id))
    : [], [interviews, selectedMember])
  const memberFeedback = useMemo(() => memberInterviews.filter(iv => typeof iv.feedbackScore === 'number'), [memberInterviews])
  const memberActivity = useMemo(() => selectedMember
    ? activity.filter(a => a.memberId === selectedMember._id)
    : [], [activity, selectedMember])

  const toggleStatus = async (m: Member) => {
    setOpenMenu(null)
    setActionError('')
    setActioningId(m._id)
    try {
      const nextStatus = m.status === 'Active' ? 'Inactive' : 'Active'
      const res = await fetch(`${baseURL}/team-members/${m._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to update status')
      fetchAll()
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update status')
    } finally {
      setActioningId(null)
    }
  }

  const changeAccessLevel = async (m: Member, level: AccessLevel) => {
    setOpenMenu(null)
    setActionError('')
    setActioningId(m._id)
    try {
      const res = await fetch(`${baseURL}/team-members/${m._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionLevel: level }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to update access level')
      fetchAll()
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update access level')
    } finally {
      setActioningId(null)
    }
  }

  const removeMember = async (m: Member) => {
    setOpenMenu(null)
    if (!window.confirm(`Remove "${m.name}" and revoke their access?`)) return
    setActionError('')
    setActioningId(m._id)
    try {
      const res = await fetch(`${baseURL}/team-members/${m._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to remove member')
      if (selectedId === m._id) setSelectedId(null)
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
    setInviteLink('')
    try {
      const res = await fetch(`${baseURL}/team-members`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to invite member')
      const created = await res.json()
      setInviteLink(created.inviteLink || '')
      fetchAll()
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to invite member')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light' as const, boxSizing: 'border-box' as const }

  const TOP_TABS: typeof activeTopTab[] = ['Team Access', 'Roles & Permissions', 'Login Security', 'Activity Logs', 'Invite History']

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: GRAY, marginBottom: 10 }}>
        <span>Settings</span> <FiChevronRight size={11} /> <span style={{ color: '#0f172a', fontWeight: 600 }}>Team Access & Permissions</span>
      </div>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Team Access & Permissions</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Manage team members, login access and role-based permissions.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates, jobs..."
              style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: 240, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light' }}
            />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <button
            onClick={() => { setShowAdd(true); setForm(emptyForm); setSaveError(''); setInviteLink('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus size={15}/> Add Team Member
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Team Members', value: total, sub: 'Active', icon: <FiShield size={17}/>, ic: ACCENT, bg: '#fef1ec' },
          { label: 'With Access', value: activeCount, sub: total ? `${Math.round(activeCount / total * 100)}%` : '0%', icon: <FiCheckCircle size={17}/>, ic: GREEN, bg: '#ecfdf5', subColor: GREEN },
          { label: 'Pending Invites', value: pendingCount, sub: 'Awaiting', icon: <FiClock size={17}/>, ic: ORANGE, bg: '#fff7ed', subColor: ORANGE },
          { label: 'Inactive Members', value: inactiveCount, sub: 'Inactive', icon: <FiX size={17}/>, ic: RED, bg: '#fef2f2' },
          { label: 'Roles Created', value: rolesCreated, sub: 'Active roles', icon: <FiShield size={17}/>, ic: BLUE, bg: '#eff6ff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: GRAY, marginBottom: 2, whiteSpace: 'nowrap' }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.66rem', color: (s as any).subColor || GRAY, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 16 }}>
        {TOP_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTopTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: '0.82rem', fontWeight: activeTopTab === tab ? 600 : 400,
              color: activeTopTab === tab ? ACCENT : GRAY,
              borderBottom: activeTopTab === tab ? `2px solid ${ACCENT}` : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTopTab !== 'Team Access' ? (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: '60px 20px', textAlign: 'center', color: GRAY, fontSize: '0.86rem' }}>
          {activeTopTab} is coming soon.
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>Team Members ({total})</div>
                <div style={{ fontSize: '0.76rem', color: GRAY, marginTop: 2 }}>Manage access, roles, and permissions for your team.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <FiSearch size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team member..." style={{ paddingLeft: 26, paddingRight: 10, height: 30, width: 170, border: `1px solid ${BORDER}`, borderRadius: 7, fontSize: '0.74rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light' }} />
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30, padding: '0 10px', background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, cursor: 'pointer', color: '#475569', fontSize: '0.74rem', fontWeight: 500 }}>
                  <FiFilter size={12}/> Filters
                </button>
              </div>
            </div>

            <div className="hr-table-scroll" style={{ overflowX: 'auto' }} onScroll={() => setOpenMenu(null)}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Team Member', 'Role', 'Department', 'Access', 'Last Login', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && paged.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: '36px 16px', textAlign: 'center', fontSize: '0.84rem', color: GRAY }}>No team members found.</td></tr>
                  )}
                  {loading && (
                    <tr><td colSpan={7} style={{ padding: '36px 16px', textAlign: 'center', fontSize: '0.84rem', color: GRAY }}>Loading team members…</td></tr>
                  )}
                  {!loading && paged.map(m => {
                    const [fg, bg] = avatarColor(m.name)
                    const accessStyle = ACCESS_STYLE[m.permissionLevel] || ACCESS_STYLE['Interview Only']
                    const isSelected = selectedId === m._id
                    return (
                      <tr key={m._id}
                        onClick={() => { setSelectedId(m._id); setDetailTab('Access & Permissions') }}
                        style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'transparent' }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fafbfc' }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, color: fg, fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {initials(m.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{m.name}</div>
                              <div style={{ fontSize: '0.68rem', color: GRAY, whiteSpace: 'nowrap' }}>{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{m.role}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#334155', whiteSpace: 'nowrap' }}>{m.department || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: accessStyle.bg, color: accessStyle.color, fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{m.permissionLevel}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.72rem', color: GRAY, whiteSpace: 'nowrap' }}>{formatDateTime(m.lastActiveAt)}</td>
                        <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => toggleStatus(m)}
                            disabled={actioningId === m._id || m.status === 'Pending'}
                            title={m.status === 'Pending' ? 'Invite pending acceptance' : 'Toggle access'}
                            style={{
                              width: 38, height: 22, borderRadius: 20, border: 'none', position: 'relative',
                              background: m.status === 'Active' ? GREEN : m.status === 'Pending' ? '#fde68a' : '#e2e8f0',
                              cursor: m.status === 'Pending' ? 'default' : 'pointer', opacity: actioningId === m._id ? 0.6 : 1, flexShrink: 0,
                            }}
                          >
                            <div style={{ position: 'absolute', top: 2, left: m.status === 'Active' ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={e => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setOpenMenu(prev => prev?.id === m._id ? null : { id: m._id, rect })
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center' }}
                            >
                              <FiMoreVertical size={15}/>
                            </button>
                            {openMenu?.id === m._id && createPortal(
                              <>
                                <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                                <div style={{
                                  position: 'fixed', top: openMenu.rect.bottom + 4, left: openMenu.rect.right - 190, minWidth: 190,
                                  background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
                                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden',
                                }}>
                                  <div style={{ padding: '8px 12px', fontSize: '0.66rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Set access level</div>
                                  {ACCESS_LEVELS.filter(l => l !== m.permissionLevel).map(level => (
                                    <button
                                      key={level}
                                      onClick={() => changeAccessLevel(m, level)}
                                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                    >
                                      <FiEdit2 size={12} color={ACCESS_STYLE[level].color} /> {level}
                                    </button>
                                  ))}
                                  <div style={{ borderTop: `1px solid ${BORDER}` }} />
                                  <button
                                    onClick={() => removeMember(m)}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                                  >
                                    <FiTrash2 size={12} /> Remove
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '0.76rem', color: GRAY }}>
                Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} members
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
                      background: p === page ? ACCENT : '#fff', color: p === page ? '#fff' : GRAY,
                      fontSize: '0.74rem', fontWeight: p === page ? 700 : 400, cursor: 'pointer',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selected member detail panel */}
          {selectedMember && (
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor(selectedMember.name)[1], color: avatarColor(selectedMember.name)[0], fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {initials(selectedMember.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{selectedMember.name}</div>
                    <div style={{ fontSize: '0.72rem', color: GRAY }}>{selectedMember.role}</div>
                  </div>
                  <span style={{ background: selectedMember.status === 'Active' ? '#ecfdf5' : selectedMember.status === 'Pending' ? '#fff7ed' : '#fef2f2', color: selectedMember.status === 'Active' ? '#059669' : selectedMember.status === 'Pending' ? '#d97706' : '#dc2626', fontSize: '0.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{selectedMember.status}</span>
                </div>
                <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <FiX size={16}/>
                </button>
              </div>

              <div style={{ display: 'flex', gap: 4, padding: '0 20px', borderBottom: `1px solid ${BORDER}` }}>
                {(['Access & Permissions', 'Assigned Interviews', 'Feedback History', 'Activity'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '10px 6px', marginRight: 16,
                      fontSize: '0.78rem', fontWeight: detailTab === tab ? 600 : 400,
                      color: detailTab === tab ? ACCENT : GRAY,
                      borderBottom: detailTab === tab ? `2px solid ${ACCENT}` : '2px solid transparent', marginBottom: -1,
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ padding: 20 }}>
                {detailTab === 'Access & Permissions' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: '0.78rem', color: '#334155' }}>
                      <span>{selectedMember.email}</span>
                      <span>{selectedMember.department || 'No department'}</span>
                      <span>Joined on {formatDate(selectedMember.joinDate)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Assigned Permissions</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {PERMISSION_LABELS.map(p => {
                          const granted = selectedMember.permissions?.[p.key]
                          return (
                            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: granted ? '#0f172a' : '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                              {granted ? <FiCheckCircle size={13} color={GREEN} /> : <FiMinus size={13} color="#cbd5e1" />}
                              {p.label}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        <FiRefreshCw size={12}/> Reset Password
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.76rem', color: GRAY }}>Edit access:</span>
                        <select
                          value={selectedMember.permissionLevel}
                          onChange={e => changeAccessLevel(selectedMember, e.target.value as AccessLevel)}
                          style={{ height: 34, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.78rem', background: '#fff', color: '#334155', colorScheme: 'light' }}
                        >
                          {ACCESS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'Assigned Interviews' && (
                  memberInterviews.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '20px 0' }}>No interviews assigned yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {memberInterviews.map(iv => (
                        <div key={iv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{iv.candidateName}</span>
                          <span style={{ color: GRAY }}>{iv.jobTitle}</span>
                          <span style={{ color: GRAY }}>{formatDateTime(iv.scheduledAt)}</span>
                          <span style={{ color: '#334155' }}>{iv.status}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {detailTab === 'Feedback History' && (
                  memberFeedback.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '20px 0' }}>No feedback submitted yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {memberFeedback.map(iv => (
                        <div key={iv._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{iv.candidateName}</span>
                          <span style={{ color: GREEN, fontWeight: 700 }}>{iv.feedbackScore}/10</span>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {detailTab === 'Activity' && (
                  memberActivity.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', padding: '20px 0' }}>No activity recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {memberActivity.map(a => (
                        <div key={a._id} style={{ fontSize: '0.78rem', color: '#334155' }}>
                          {a.message}
                          <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 2 }}>{formatRelative(a.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Role & Access Summary</div>
            <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 14px' }}>
              {(() => {
                const size = 130, cx = 65, cy = 65, r = 47, stroke = 14
                const circum = 2 * Math.PI * r
                let offset = 0
                const segs = accessSummary.filter(s => s.count > 0).map(s => {
                  const dash = total > 0 ? (s.count / total) * circum : 0
                  const gap = circum - dash
                  const seg = { ...s, dash, gap, offset: circum * 0.25 - offset }
                  offset += dash
                  return seg
                })
                return (
                  <>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, display: 'block' }}>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={stroke}/>
                      {segs.map((s, i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={ACCESS_DONUT_COLOR[s.level]} strokeWidth={stroke}
                          strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} strokeLinecap="butt" />
                      ))}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{total}</span>
                      <span style={{ fontSize: '0.58rem', color: GRAY }}>Total</span>
                    </div>
                  </>
                )
              })()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {accessSummary.map(s => (
                <div key={s.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCESS_DONUT_COLOR[s.level] }} />
                    <span style={{ color: '#334155' }}>{s.level}</span>
                  </div>
                  <span style={{ color: GRAY }}>{s.count} ({total ? Math.round(s.count / total * 100) : 0}%)</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      )}

      {/* Add Team Member modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 460, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Add Team Member</span>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>

            {inviteLink ? (
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.82rem', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCheckCircle size={15}/> Invite emailed — you can also copy the link below to share it directly.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px' }}>
                  <span style={{ fontSize: '0.76rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{inviteLink}</span>
                  <button onClick={() => navigator.clipboard?.writeText(inviteLink)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, display: 'flex', flexShrink: 0 }} title="Copy link">
                    <FiCopy size={14}/>
                  </button>
                </div>
                <button onClick={() => setShowAdd(false)} style={{ height: 38, borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {saveError && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8 }}>{saveError}</div>}

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Full Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Aarti Jain" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email *</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@eklav.com" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Job Role</label>
                      <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Technical Interviewer" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Department</label>
                      <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Access Level</label>
                    <select value={form.permissionLevel} onChange={e => setForm(f => ({ ...f, permissionLevel: e.target.value as AccessLevel }))} style={inputStyle}>
                      {ACCESS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Account Type</label>
                    <select value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value as AccountType }))} style={inputStyle}>
                      {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                      Technical/HR Interviewer conduct interviews, Hiring Manager approves Shortlist/Hire recommendations, HR Operations handles post-offer processing.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={() => setShowAdd(false)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleAddMember} disabled={saving} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Sending Invite…' : 'Send Invitation'}
                  </button>
                </div>
              </>
            )}
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

export default HRSettingsPage

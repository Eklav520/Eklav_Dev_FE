import { Suspense, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
  FiGrid, FiCalendar, FiUsers, FiStar, FiBarChart2, FiFileText, FiSettings,
  FiLogOut, FiHelpCircle, FiCheckSquare, FiBriefcase, FiUser,
} from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'
import { ChildrenType } from '@/types/component-props'
import logoImg from '@/assets/images/logo_white.png'

const SIDEBAR_BG = '#0d1117'
const SIDEBAR_ACTIVE = 'rgba(255,122,0,0.15)'
const SIDEBAR_HOVER = '#162440'
const SIDEBAR_TEXT = '#c8d6e8'
const ACCENT = '#ff7a00'
const MAIN_BG = '#f1f5f9'

const INTERVIEWER_NAV_ITEMS: { key: string; label: string; url: string; icon: IconType }[] = [
  { key: 'dashboard',      label: 'Dashboard',       url: '/hr/my-interviews',          icon: FiGrid },
  { key: 'schedule',       label: 'Scheduled Interviews', url: '/hr/my-interviews/schedule', icon: FiCalendar },
  { key: 'candidates',     label: 'Candidates',      url: '/hr/my-interviews/candidates', icon: FiUsers },
  { key: 'feedback-given', label: 'Feedback Given',  url: '/hr/my-interviews/feedback', icon: FiStar },
  { key: 'reports',        label: 'Reports',         url: '/hr/my-interviews/reports',  icon: FiBarChart2 },
  { key: 'documents',      label: 'Documents',       url: '/hr/my-interviews/documents', icon: FiFileText },
  { key: 'settings',       label: 'Settings',        url: '/hr/my-interviews/settings', icon: FiSettings },
]

const HIRING_MANAGER_NAV_ITEMS: { key: string; label: string; url: string; icon: IconType }[] = [
  { key: 'dashboard',   label: 'Dashboard',  url: '/hr/hiring-manager/dashboard',  icon: FiGrid },
  { key: 'jobs',        label: 'My Jobs',    url: '/hr/hiring-manager/jobs',       icon: FiBriefcase },
  { key: 'candidates',  label: 'Candidates', url: '/hr/hiring-manager/candidates', icon: FiUsers },
  { key: 'approvals',   label: 'Approvals',  url: '/hr/approvals',                 icon: FiCheckSquare },
  { key: 'feedback',    label: 'Feedback',   url: '/hr/hiring-manager/feedback',   icon: FiStar },
  { key: 'reports',     label: 'Reports',    url: '/hr/hiring-manager/reports',    icon: FiBarChart2 },
  { key: 'profile',     label: 'Profile',    url: '/hr/hiring-manager/profile',    icon: FiUser },
]

const HR_OPERATIONS_NAV_ITEMS: { key: string; label: string; url: string; icon: IconType }[] = [
  { key: 'operations', label: 'Operations', url: '/hr/operations', icon: FiBriefcase },
]

const ROLE_FALLBACK_LABEL: Record<string, string> = {
  hrInterviewer: 'Technical Interviewer',
  hrRoundInterviewer: 'HR Interviewer',
  hiringManager: 'Hiring Manager',
  hrOperations: 'HR Operations',
}

const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const InterviewerLayout = ({ children }: ChildrenType) => {
  const { user, removeSession } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()

  const [memberRole, setMemberRole] = useState('')

  const role = (user as any)?.role
  const TEAM_MEMBER_ROLES = ['hrInterviewer', 'hrRoundInterviewer', 'hiringManager', 'hrOperations']
  const NAV_ITEMS =
    role === 'hiringManager' ? HIRING_MANAGER_NAV_ITEMS :
    role === 'hrOperations' ? HR_OPERATIONS_NAV_ITEMS :
    INTERVIEWER_NAV_ITEMS // hrInterviewer (Technical) and hrRoundInterviewer (HR) share the same nav

  const userName = (user as any)?.fullName || (user as any)?.name || 'Interviewer'
  const userEmail = (user as any)?.email || ''

  // A role that shouldn't be on this layout (stale session / direct URL
  // access) gets sent back home to be re-routed by RoleRedirect.
  useEffect(() => {
    if (user && !TEAM_MEMBER_ROLES.includes(role)) {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate])

  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL
    const token = (user as any)?.token
    if (!baseURL || !token) return
    fetch(`${baseURL}/my-team-member`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => setMemberRole(data?.role || ''))
      .catch(() => {})
  }, [user])

  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = MAIN_BG
    document.body.style.backgroundColor = MAIN_BG
    return () => { document.body.style.background = prev }
  }, [])

  const isActive = (url: string) => location.pathname === url || (url !== '/hr/my-interviews' && location.pathname.startsWith(url))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: MAIN_BG }}>
      <aside style={{ width: 240, flexShrink: 0, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 1020 }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <img src={logoImg} alt="Eklav" style={{ height: 28, objectFit: 'contain' }} />
        </div>

        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.82rem', flexShrink: 0 }}>
            {initials(userName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontSize: '0.68rem', color: SIDEBAR_TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberRole || ROLE_FALLBACK_LABEL[role] || 'Interviewer'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.64rem', color: '#10b981' }}>Online</span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isActive(item.url)
            return (
              <Link
                key={item.key}
                to={item.url}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, margin: '2px 0',
                  background: active ? SIDEBAR_ACTIVE : 'transparent', color: active ? '#fff' : SIDEBAR_TEXT,
                  textDecoration: 'none', fontSize: '0.84rem', fontWeight: active ? 600 : 400, position: 'relative',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '20%', width: 3, height: '60%', background: ACCENT, borderRadius: '0 3px 3px 0' }} />}
                <Icon size={16} color={active ? ACCENT : SIDEBAR_TEXT} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ background: SIDEBAR_HOVER, borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <FiHelpCircle size={13} color={SIDEBAR_TEXT} />
              <span style={{ fontSize: '0.76rem', color: '#fff', fontWeight: 600 }}>Need Help?</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: SIDEBAR_TEXT, marginBottom: 10 }}>Contact support team for any assistance</div>
            <button style={{ width: '100%', height: 30, borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}>
              Contact Support
            </button>
          </div>
          <button
            onClick={() => removeSession()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 34, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, background: 'transparent', color: SIDEBAR_TEXT, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 240, flex: 1, padding: 24, minWidth: 0 }}>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}

export default InterviewerLayout

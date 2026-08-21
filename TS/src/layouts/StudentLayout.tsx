import React, { lazy, Suspense, useMemo, useState, useEffect } from 'react'
import { Collapse } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import type { IconType } from 'react-icons'

import { STUDENT_MENU_ITEMS } from '@/assets/data/menu-items'
import Preloader from '@/components/Preloader'
import { useAuthContext } from '@/context/useAuthContext'
import useViewPort from '@/hooks/useViewPort'
import { useProfile } from '@/app/student/dashboard/components/hooks/useProfile'
import { ChildrenType } from '@/types/component-props'
import { FiLayers, FiChevronRight, FiMenu, FiLogOut, FiBell, FiChevronDown, FiSun, FiMoon, FiLifeBuoy } from 'react-icons/fi'
import { FaCrown } from 'react-icons/fa'
import logoWhite from '@/assets/images/logo_white.png'
import logoBlack from '@/assets/images/logo_black.png'
import logoIcon from '@/assets/images/logo-mobile-light.svg'
import logoIconDark from '@/assets/images/logo-mobile.svg'

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const timeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// const ChatBox = lazy(() => import('@/layouts/ChatBox')) // temporarily disabled, will re-enable later

// ── Theme constants (matches HRLayout pattern, orange accent) ──────────────
const SIDEBAR_BG     = '#0d1117'
const SIDEBAR_ACTIVE = 'rgba(255,122,0,0.15)'
const SIDEBAR_HOVER  = '#162440'
const SIDEBAR_TEXT   = '#c8d6e8'
const SIDEBAR_ACTIVE_TEXT = '#ffffff'
const ACCENT         = '#ff7a00'
const TOP_NAV_BG     = '#ffffff'
const MAIN_BG        = '#f1f5f9'
const TOP_NAV_BG_DARK = '#111827'
const MAIN_BG_DARK    = '#0b1220'
const THEME_STORAGE_KEY = 'student-theme'

type MenuItemTypeLocal = {
  key: string
  label: string
  url?: string
  parentKey?: string
  icon?: IconType
  isTitle?: boolean
  children?: MenuItemTypeLocal[]
  [k: string]: any
}

const StudentLayout = ({ children }: ChildrenType) => {
  const { width } = useViewPort()
  const isDesktop = width >= 1200
  const { user, removeSession } = useAuthContext()
  const location = useLocation()

  const { profile } = useProfile()

  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  // Theme toggle is temporarily disabled (button hidden below) — force light
  // mode regardless of a stale 'dark' value from before it was hidden, so
  // nobody gets stuck in dark mode with no UI to switch back.
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const isDark = theme === 'dark'
  const topNavBg = isDark ? TOP_NAV_BG_DARK : TOP_NAV_BG
  const mainBg = isDark ? MAIN_BG_DARK : MAIN_BG
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const navBorder = isDark ? '#1f2937' : '#e2e8f0'
  const cardBg = isDark ? '#1a2332' : '#fff'
  const iconBtnBg = isDark ? '#1f2937' : '#f1f5f9'

  // Sidebar inverts relative to the main theme: dark mode → light/white sidebar,
  // light mode → the original dark sidebar.
  const sidebarBg = isDark ? '#ffffff' : SIDEBAR_BG
  const sidebarText = isDark ? '#475569' : SIDEBAR_TEXT
  const sidebarHover = isDark ? '#f1f5f9' : SIDEBAR_HOVER
  const sidebarActiveText = isDark ? '#0f172a' : SIDEBAR_ACTIVE_TEXT
  const sidebarBorder = isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
  const sidebarNameColor = isDark ? '#0f172a' : '#ffffff'
  const sidebarLogo = isDark ? logoBlack : logoWhite
  const sidebarLogoIcon = isDark ? logoIconDark : logoIcon

  useEffect(() => { localStorage.setItem(THEME_STORAGE_KEY, theme) }, [theme])
  const [allowedNavKeys, setAllowedNavKeys] = useState<string[] | null>(null)
  const [featureRules, setFeatureRules] = useState<{ feature: string; denyYears?: string[]; denyBranches?: string[] }[]>([])
  const [batchNavRules, setBatchNavRules] = useState<Record<string, string[]>>({})
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [hrJobs, setHrJobs] = useState<any[]>([])
  const [adminMessages, setAdminMessages] = useState<any[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [purchasedModuleCount, setPurchasedModuleCount] = useState(0)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const hostname = window.location.hostname
  const isMainDomain = hostname === 'eklav.in' || hostname === 'www.eklav.in' || hostname === 'localhost'

  const userName = profile?.fullName || profile?.name || 'Student'
  const userBatch = profile?.batch || ''
  const userJoiningYear = profile?.joiningYear || ''
  const userStatus = profile?.status || 'approved'
  const userProfileImage = profile?.profileImage || ''

  const isSidebarExpanded = !isCollapsed || isHovering
  const sidebarWidth = isSidebarExpanded ? '260px' : '72px'
  const initials = userName.slice(0, 2).toUpperCase()
  const isPending = userStatus === 'pending'

  const profileSubtitle = (() => {
    if (!userJoiningYear) return 'Student'
    const yearNum = new Date().getFullYear() - parseInt(userJoiningYear, 10) + 1
    const clampedYear = Math.max(1, Math.min(yearNum, 4))
    const batch = userBatch ? ` ${userBatch},` : ''
    return `B.Tech${batch} ${ordinal(clampedYear)} Year`
  })()

  // Sync body background with the active theme
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = mainBg
    document.body.style.backgroundColor = mainBg
    document.documentElement.style.background = mainBg
    return () => {
      document.body.style.background = prev
      document.body.style.backgroundColor = prev
    }
  }, [mainBg])

  // Push theme colors out as CSS custom properties so page content (which
  // reads --dash-* vars with light-mode fallbacks, e.g. the dashboard page)
  // re-themes along with the nav shell without per-page prop drilling.
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.style.setProperty('--dash-page-bg', '#0b1220')
      root.style.setProperty('--dash-card-bg', '#141b2a')
      root.style.setProperty('--dash-border', '#232f42')
      root.style.setProperty('--dash-text', '#f1f5f9')
      root.style.setProperty('--dash-gray', '#94a3b8')
    } else {
      root.style.removeProperty('--dash-page-bg')
      root.style.removeProperty('--dash-card-bg')
      root.style.removeProperty('--dash-border')
      root.style.removeProperty('--dash-text')
      root.style.removeProperty('--dash-gray')
    }
  }, [isDark])

  useEffect(() => {
    if (isMainDomain) return
    fetch(`${baseURL}/api/institute/nav-config-by-domain`, {
      headers: { 'x-tenant-domain': hostname },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.navSections) && d.navSections.length > 0) setAllowedNavKeys(d.navSections)
        if (d.success && Array.isArray(d.featureRules)) setFeatureRules(d.featureRules)
        if (d.success && d.batchNavRules && typeof d.batchNavRules === 'object') setBatchNavRules(d.batchNavRules)
      })
      .catch(() => {})
  }, [isMainDomain, hostname, baseURL])

  // Notification bell — announcements + latest jobs, shared across every
  // student page (not just the dashboard) since the bell lives in this layout.
  useEffect(() => {
    const token = user?.token
    if (!baseURL || !token) return
    const h = { Authorization: `Bearer ${token}` }
    Promise.allSettled([
      fetch(`${baseURL}/api/institute/announcements`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/jobs/student`, { headers: h }).then(r => r.json()),
      fetch(`${baseURL}/students/my-messages`, { headers: h }).then(r => r.json()),
    ]).then(([annR, jobR, msgR]) => {
      if (annR.status === 'fulfilled') setAnnouncements((annR.value?.data || []).slice(0, 3))
      if (jobR.status === 'fulfilled') {
        const raw: any[] = Array.isArray(jobR.value) ? jobR.value : (jobR.value?.data || jobR.value?.jobs || [])
        setHrJobs(raw.filter((j: any) => !j.isExpired).slice(0, 3))
      }
      if (msgR.status === 'fulfilled') setAdminMessages((msgR.value?.messages || []).slice(0, 3))
    }).catch(() => {})
  }, [baseURL, user?.token])

  // How many individual modules this student has purchased — once they've
  // bought a handful separately, nudging them toward the full plan card
  // stops being useful, so it hides itself past that point.
  useEffect(() => {
    const token = user?.token
    if (!baseURL || !token) return
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return
        const count = Object.values(data.modules || {}).filter((m: any) => m?.active && !data.fullAccess).length
        setPurchasedModuleCount(count)
      })
      .catch(() => {})
  }, [baseURL, user?.token])

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const toggleSidebar = () => { setIsCollapsed(p => !p); setIsHovering(false) }

  const isActive = (url?: string) => !!url && location.pathname.startsWith(url)

  // Current page label from menu
  const currentPageLabel = useMemo(() => {
    const flat = (items: MenuItemTypeLocal[]): MenuItemTypeLocal[] =>
      items.flatMap(i => [i, ...(i.children ? flat(i.children) : [])])
    const match = flat(STUDENT_MENU_ITEMS as MenuItemTypeLocal[]).find(i => i.url && location.pathname.startsWith(i.url))
    return match?.label || 'Dashboard'
  }, [location.pathname])

  const SidebarContent = ({ expanded }: { expanded: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .sl-nav-scroll::-webkit-scrollbar { display: none; }
        .sl-nav-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Logo / hamburger header */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        padding: expanded ? '0 14px 0 16px' : '0',
        borderBottom: `1px solid ${sidebarBorder}`,
        flexShrink: 0,
      }}>
        {expanded ? (
          <>
            <Link to="/student/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, overflow: 'hidden' }}>
              <img src={sidebarLogo} alt="Eklav" style={{ height: 32, objectFit: 'contain', flexShrink: 0 }} />
            </Link>
            {isDesktop && (
              <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: sidebarText, cursor: 'pointer', padding: 6, borderRadius: 6, flexShrink: 0 }}>
                <FiMenu size={17} />
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <img src={sidebarLogoIcon} alt="Eklav" style={{ height: 22, objectFit: 'contain', marginTop: 8 }} />
            <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: sidebarText, cursor: 'pointer', padding: 4, borderRadius: 6 }}>
              <FiMenu size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Portal badge */}
      {expanded && (
        <div style={{ padding: '10px 16px 6px', flexShrink: 0 }}>
          <div style={{ background: `${ACCENT}20`, borderRadius: 6, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT }} />
            <span style={{ fontSize: '0.7rem', color: ACCENT, fontWeight: 600, letterSpacing: 0.5 }}>STUDENT PORTAL</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="sl-nav-scroll" style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <VerticalMenu
          isCollapsed={!expanded}
          isMainDomain={isMainDomain}
          allowedNavKeys={allowedNavKeys}
          featureRules={featureRules}
          batchNavRules={batchNavRules}
          sidebarText={sidebarText}
          sidebarHover={sidebarHover}
          sidebarActiveText={sidebarActiveText}
        />
      </nav>

      {/* Upgrade to Premium — only for pending/unsubscribed users who haven't
          already bought their way into several individual modules */}
      {isPending && purchasedModuleCount <= 2 && expanded && (
        <div style={{
          margin: '0 12px 10px',
          background: 'linear-gradient(135deg, #1a0a00, #2a1200)',
          border: `1px solid ${ACCENT}44`,
          borderRadius: 12,
          padding: '14px 14px 12px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <FaCrown size={16} color={ACCENT} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Upgrade to Premium</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: SIDEBAR_TEXT, margin: '0 0 10px', lineHeight: 1.4 }}>
            Unlock all premium courses, mock interviews and more.
          </p>
          <Link to="/student/subscription" style={{
            display: 'block', textAlign: 'center',
            background: ACCENT, color: '#fff',
            borderRadius: 8, padding: '7px 0',
            fontSize: '0.78rem', fontWeight: 700,
            textDecoration: 'none',
          }}>
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Upgrade crown icon in collapsed mode */}
      {isPending && purchasedModuleCount <= 2 && !expanded && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, flexShrink: 0 }}>
          <Link to="/student/subscriptions" title="Upgrade to Premium" style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FaCrown size={17} color={ACCENT} />
          </Link>
        </div>
      )}

      {/* User footer */}
      <div style={{
        padding: expanded ? '12px 16px' : '10px 0',
        borderTop: `1px solid ${sidebarBorder}`,
        display: 'flex', alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        gap: 10, flexShrink: 0,
      }}>
        <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
          {/* Initials always as base — shows if image fails or is absent */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.8rem',
          }}>
            {initials}
          </div>
          {userProfileImage && (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}${userProfileImage}`}
              alt={userName}
              style={{ position: 'absolute', inset: 0, width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ACCENT}66` }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
        {expanded && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', color: sidebarNameColor, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '0.68rem', color: sidebarText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileSubtitle}</div>
            </div>
            <button onClick={() => removeSession()} title="Logout" style={{ background: 'transparent', border: 'none', color: sidebarText, cursor: 'pointer', padding: 4 }}>
              <FiLogOut size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: mainBg, backgroundColor: mainBg }}>

      {/* Desktop sidebar */}
      {isDesktop && (
        <aside
          onMouseEnter={() => { if (isCollapsed) setIsHovering(true) }}
          onMouseLeave={() => { if (isCollapsed) setIsHovering(false) }}
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: sidebarWidth,
            background: sidebarBg,
            zIndex: 1020,
            transition: 'width 0.22s ease, background 0.2s ease',
            overflow: 'hidden',
          }}
        >
          <SidebarContent expanded={isSidebarExpanded} />
        </aside>
      )}

      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1019 }} />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: sidebarBg, zIndex: 1020 }}>
            <SidebarContent expanded={true} />
          </aside>
        </>
      )}

      {/* Main area */}
      <div style={{
        marginLeft: isDesktop ? sidebarWidth : 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'margin-left 0.22s ease',
        background: mainBg,
      }}>
        {/* Sticky top navbar */}
        <header style={{
          height: 64,
          background: topNavBg,
          borderBottom: `1px solid ${navBorder}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {!isDesktop && (
            <button onClick={() => setMobileOpen(p => !p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: textPrimary }}>
              <FiMenu size={20} />
            </button>
          )}

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: textPrimary }}>Student Portal</div>
            <div style={{ fontSize: '0.72rem', color: textSecondary }}>{currentPageLabel}</div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Theme toggle — temporarily disabled, will re-enable later */}
            <button
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: iconBtnBg, border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isDark ? '#facc15' : '#475569' }}
            >
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            

            {/* Notification bell — announcements + latest jobs */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(p => !p)}
                style={{ position: 'relative', background: iconBtnBg, border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: textSecondary }}
              >
                <FiBell size={16} />
                {(announcements.length + hrJobs.length + adminMessages.length) > 0 && (
                  <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    {Math.min(announcements.length + hrJobs.length + adminMessages.length, 9)}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300, background: cardBg, border: `1px solid ${navBorder}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
                    {announcements.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 14px 4px' }}>Announcements</div>
                        {announcements.map((a, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 14px', borderBottom: `1px solid ${navBorder}` }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff7a00', flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                              <div style={{ fontSize: '0.65rem', color: textSecondary }}>{a.description?.replace(/<[^>]+>/g, '').slice(0, 45)}...</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {hrJobs.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 14px 4px' }}>Latest Jobs</div>
                        {hrJobs.map((job, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: `1px solid ${navBorder}` }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                              <div style={{ fontSize: '0.65rem', color: textSecondary }}>{job.company}{job.location ? ` · ${job.location.trim()}` : ''}</div>
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', flexShrink: 0 }}>{timeAgo(job.postedDate)}</div>
                          </div>
                        ))}
                      </>
                    )}
                    {adminMessages.length > 0 && (
                      <>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 14px 4px' }}>Messages</div>
                        {adminMessages.map((m, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 14px', borderBottom: `1px solid ${navBorder}` }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.isRead ? '#cbd5e1' : '#22c55e', flexShrink: 0, marginTop: 5 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: m.isRead ? 500 : 700, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</div>
                              <div style={{ fontSize: '0.65rem', color: textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.body}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {announcements.length === 0 && hrJobs.length === 0 && adminMessages.length === 0 && (
                      <div style={{ padding: '20px 14px', fontSize: '0.78rem', color: textSecondary, textAlign: 'center' }}>No new notifications</div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User pill + dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setUserDropdownOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px 5px 5px', borderRadius: 40, border: `1px solid ${navBorder}`, background: cardBg, cursor: 'pointer', userSelect: 'none' }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                  }}>
                    {initials}
                  </div>
                  {userProfileImage && (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${userProfileImage}`}
                      alt={userName}
                      style={{ position: 'absolute', inset: 0, width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                </div>
                {/* Name + subtitle */}
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary, whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: '0.65rem', color: textSecondary, whiteSpace: 'nowrap' }}>{profileSubtitle}</div>
                </div>
                <FiChevronDown size={14} color="#94a3b8" style={{ transition: 'transform 0.2s', transform: userDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>

              {/* Dropdown menu */}
              {userDropdownOpen && (
                <>
                  {/* Click-outside backdrop */}
                  <div onClick={() => setUserDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    minWidth: 180, background: cardBg,
                    border: `1px solid ${navBorder}`, borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    {/* User info header */}
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${navBorder}` }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary }}>{userName}</div>
                      <div style={{ fontSize: '0.65rem', color: textSecondary, marginTop: 2 }}>{profileSubtitle}</div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '4px 0' }}>
                      <Link
                        to="/student/raise-ticket"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 14px', background: 'none', border: 'none',
                          color: textPrimary, fontSize: '0.82rem', fontWeight: 600,
                          cursor: 'pointer', textAlign: 'left', textDecoration: 'none',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = iconBtnBg }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                      >
                        <FiLifeBuoy size={14} />
                        Raise Ticket
                      </Link>
                      <button
                        onClick={() => { setUserDropdownOpen(false); removeSession() }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 14px', background: 'none', border: 'none',
                          color: '#ef4444', fontSize: '0.82rem', fontWeight: 600,
                          cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                      >
                        <FiLogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 20, background: mainBg }}>
          <Suspense fallback={<Preloader />}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Chat — temporarily disabled, will re-enable later */}
      {/* <Suspense fallback={null}>
        <ChatBox position="bottom-right" />
      </Suspense> */}
    </div>
  )
}

/* ═══════════════════ VERTICAL MENU ═══════════════════ */

type FeatureRule = { feature: string; denyYears?: string[]; denyBranches?: string[] }

const VerticalMenu = ({
  isCollapsed,
  onItemClick,
  isMainDomain,
  allowedNavKeys,
  featureRules = [],
  batchNavRules = {},
  sidebarText = SIDEBAR_TEXT,
  sidebarHover = SIDEBAR_HOVER,
  sidebarActiveText = SIDEBAR_ACTIVE_TEXT,
}: {
  isCollapsed: boolean
  onItemClick?: () => void
  isMainDomain?: boolean
  allowedNavKeys?: string[] | null
  featureRules?: FeatureRule[]
  batchNavRules?: Record<string, string[]>
  sidebarText?: string
  sidebarHover?: string
  sidebarActiveText?: string
}) => {
  const { pathname } = useLocation()
  const { user } = useAuthContext()
  const isApproved = user?.status === 'pending' || user?.status === 'approved'
  const alwaysEnabledKeys = ['dashboard', 'subscriptions']

  const studentYear = String(user?.joiningYear || '')
  const studentBranch = String(user?.branch || user?.department || '')
  const studentBatchKey = studentYear && studentBranch ? `${studentYear}-${studentBranch}` : ''
  const batchAllowed = studentBatchKey && batchNavRules[studentBatchKey] ? batchNavRules[studentBatchKey] : null

  const isFeatureDenied = (key: string): boolean => {
    if (!featureRules.length) return false
    const rule = featureRules.find(r => r.feature === key)
    if (!rule) return false
    return (rule.denyYears?.includes(studentYear) || false) || (rule.denyBranches?.includes(studentBranch) || false)
  }

  const filteredMenu = useMemo(() => {
    let items = STUDENT_MENU_ITEMS as MenuItemTypeLocal[]
    if (!isMainDomain) items = items.filter(i => i.key !== 'subscriptions')
    if (isMainDomain) items = items.filter(i => i.key !== 'myColleges')
    if (!isMainDomain && batchAllowed) {
      items = items
        .filter(i => batchAllowed.includes(i.key))
        .map(i => i.children ? { ...i, children: i.children.filter(c => batchAllowed.includes(c.key)) } : i)
        .filter(i => !i.children || i.children.length > 0)
    } else {
      if (!isMainDomain && allowedNavKeys?.length) items = items.filter(i => allowedNavKeys.includes(i.key))
      if (!isMainDomain && featureRules.length) {
        items = items
          .map(i => i.children ? { ...i, children: i.children.filter(c => !isFeatureDenied(c.key)) } : i)
          .filter(i => !i.children || i.children.length > 0)
      }
    }
    return items.map(i => ({ ...i, isDisabled: !isApproved && !alwaysEnabledKeys.includes(i.key) }))
  }, [isApproved, isMainDomain, allowedNavKeys, featureRules, batchAllowed])

  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newOpen: Record<string, boolean> = {}
    const walk = (nodes: MenuItemTypeLocal[], parents: string[] = []) => {
      nodes.forEach(n => {
        if (n.url === pathname) parents.forEach(p => (newOpen[p] = true))
        if (n.children) walk(n.children, [...parents, n.key])
      })
    }
    walk(filteredMenu)
    setOpenKeys(s => ({ ...s, ...newOpen }))
  }, [pathname, filteredMenu])

  const toggle = (key: string) =>
    setOpenKeys(prev => ({
      ...Object.keys(prev).reduce((a, k) => ({ ...a, [k]: false }), {}),
      [key]: !prev[key],
    }))

  const iconSize = isCollapsed ? 19 : 16
  const itemPad = isCollapsed ? '11px 0' : '9px 16px'
  const itemMargin = isCollapsed ? '2px auto' : '2px 8px'

  const renderNode = (node: MenuItemTypeLocal): React.ReactNode => {
    const Icon = node.icon || (node.children?.length ? FiLayers : null) as IconType | null
    const hasChildren = !!node.children?.length
    const open = !!openKeys[node.key]
    const active = node.url ? pathname.startsWith(node.url) : false

    if (node.isTitle) {
      return isCollapsed ? null : (
        <div key={node.key} style={{ padding: '12px 16px 4px', fontSize: '0.68rem', fontWeight: 600, color: `${ACCENT}99`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {node.label}
        </div>
      )
    }

    if (hasChildren) {
      return (
        <div key={node.key} style={isCollapsed ? { width: '100%' } : {}}>
          <button
            type="button"
            onClick={() => toggle(node.key)}
            style={{
              width: isCollapsed ? 44 : '100%', padding: itemPad, margin: itemMargin,
              display: 'flex', alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              background: active ? SIDEBAR_ACTIVE : 'transparent',
              border: 'none',
              color: active ? sidebarActiveText : sidebarText,
              cursor: 'pointer', transition: 'all 0.15s',
              borderRadius: 8, fontSize: '0.85rem', fontWeight: active ? 600 : 400,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = sidebarHover }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 10 }}>
              {Icon && <Icon size={iconSize} color={active ? ACCENT : sidebarText} style={{ flexShrink: 0 }} />}
              {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.label}</span>}
            </div>
            {!isCollapsed && (
              <FiChevronRight size={13} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: ACCENT, flexShrink: 0 }} />
            )}
          </button>
          {!isCollapsed && (
            <Collapse in={open}>
              <div style={{ marginLeft: 28, marginTop: 2 }}>
                {node.children!.map(c => renderNode(c))}
              </div>
            </Collapse>
          )}
        </div>
      )
    }

    return (
      <Link
        key={node.key}
        to={node.url || '#'}
        onClick={onItemClick}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: itemPad, margin: itemMargin,
          width: isCollapsed ? 44 : undefined,
          gap: isCollapsed ? 0 : 10,
          textDecoration: 'none', borderRadius: 8,
          background: active ? SIDEBAR_ACTIVE : 'transparent',
          color: active ? sidebarActiveText : sidebarText,
          fontSize: '0.85rem', fontWeight: active ? 600 : 400,
          transition: 'background 0.15s, color 0.15s',
          position: 'relative', whiteSpace: 'nowrap', overflow: 'hidden',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = sidebarHover }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {active && (
          <div style={{ position: 'absolute', left: 0, top: '20%', width: 3, height: '60%', background: ACCENT, borderRadius: '0 3px 3px 0' }} />
        )}
        {Icon && <Icon size={iconSize} color={active ? ACCENT : sidebarText} style={{ flexShrink: 0 }} />}
        {!isCollapsed && node.label}
      </Link>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: isCollapsed ? 'center' : 'stretch',
      flex: 1,
      padding: isCollapsed ? '4px 0' : '2px 0',
      width: '100%',
    }}>
      {filteredMenu.map(n => renderNode(n))}
    </div>
  )
}

export default StudentLayout

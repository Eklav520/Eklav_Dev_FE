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
import { FiLayers, FiChevronRight, FiMenu, FiLogOut, FiBell, FiChevronDown } from 'react-icons/fi'
import { FaCrown } from 'react-icons/fa'
import logoWhite from '@/assets/images/logo_white.png'
import logoIcon from '@/assets/images/logo-mobile-light.svg'

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

const ChatBox = lazy(() => import('@/layouts/ChatBox'))

// ── Theme constants (matches HRLayout pattern, orange accent) ──────────────
const SIDEBAR_BG     = '#0d1117'
const SIDEBAR_ACTIVE = 'rgba(255,122,0,0.15)'
const SIDEBAR_HOVER  = '#162440'
const SIDEBAR_TEXT   = '#c8d6e8'
const SIDEBAR_ACTIVE_TEXT = '#ffffff'
const ACCENT         = '#ff7a00'
const TOP_NAV_BG     = '#ffffff'
const MAIN_BG        = '#f1f5f9'

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
  const [allowedNavKeys, setAllowedNavKeys] = useState<string[] | null>(null)
  const [featureRules, setFeatureRules] = useState<{ feature: string; denyYears?: string[]; denyBranches?: string[] }[]>([])
  const [batchNavRules, setBatchNavRules] = useState<Record<string, string[]>>({})

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

  // Force light background
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = MAIN_BG
    document.body.style.backgroundColor = MAIN_BG
    document.documentElement.style.background = MAIN_BG
    return () => {
      document.body.style.background = prev
      document.body.style.backgroundColor = prev
    }
  }, [])

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
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        {expanded ? (
          <>
            <Link to="/student/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, overflow: 'hidden' }}>
              <img src={logoWhite} alt="Eklav" style={{ height: 32, objectFit: 'contain', flexShrink: 0 }} />
            </Link>
            {isDesktop && (
              <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: SIDEBAR_TEXT, cursor: 'pointer', padding: 6, borderRadius: 6, flexShrink: 0 }}>
                <FiMenu size={17} />
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <img src={logoIcon} alt="Eklav" style={{ height: 22, objectFit: 'contain', marginTop: 8 }} />
            <button onClick={toggleSidebar} style={{ background: 'transparent', border: 'none', color: SIDEBAR_TEXT, cursor: 'pointer', padding: 4, borderRadius: 6 }}>
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
        />
      </nav>

      {/* Upgrade to Premium — only for pending/unsubscribed users */}
      {isPending && expanded && (
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
      {isPending && !expanded && (
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
        borderTop: '1px solid rgba(255,255,255,0.08)',
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
              <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '0.68rem', color: SIDEBAR_TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileSubtitle}</div>
            </div>
            <button onClick={() => removeSession()} title="Logout" style={{ background: 'transparent', border: 'none', color: SIDEBAR_TEXT, cursor: 'pointer', padding: 4 }}>
              <FiLogOut size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: MAIN_BG, backgroundColor: MAIN_BG }}>

      {/* Desktop sidebar */}
      {isDesktop && (
        <aside
          onMouseEnter={() => { if (isCollapsed) setIsHovering(true) }}
          onMouseLeave={() => { if (isCollapsed) setIsHovering(false) }}
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: sidebarWidth,
            background: SIDEBAR_BG,
            zIndex: 1020,
            transition: 'width 0.22s ease',
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
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: SIDEBAR_BG, zIndex: 1020 }}>
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
        background: MAIN_BG,
      }}>
        {/* Sticky top navbar */}
        <header style={{
          height: 64,
          background: TOP_NAV_BG,
          borderBottom: '1px solid #e2e8f0',
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
            <button onClick={() => setMobileOpen(p => !p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#334155' }}>
              <FiMenu size={20} />
            </button>
          )}

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Student Portal</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{currentPageLabel}</div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
              <FiBell size={16} />
            </button>

            {/* User pill + dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setUserDropdownOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px 5px 5px', borderRadius: 40, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', userSelect: 'none' }}
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
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'nowrap' }}>{profileSubtitle}</div>
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
                    minWidth: 180, background: '#fff',
                    border: '1px solid #e2e8f0', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    {/* User info header */}
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{userName}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{profileSubtitle}</div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '4px 0' }}>
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
        <main style={{ flex: 1, overflowY: 'auto', padding: 20, background: MAIN_BG }}>
          <Suspense fallback={<Preloader />}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Chat */}
      <Suspense fallback={null}>
        <ChatBox position="bottom-right" />
      </Suspense>
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
}: {
  isCollapsed: boolean
  onItemClick?: () => void
  isMainDomain?: boolean
  allowedNavKeys?: string[] | null
  featureRules?: FeatureRule[]
  batchNavRules?: Record<string, string[]>
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
              color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
              cursor: 'pointer', transition: 'all 0.15s',
              borderRadius: 8, fontSize: '0.85rem', fontWeight: active ? 600 : 400,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 10 }}>
              {Icon && <Icon size={iconSize} color={active ? ACCENT : SIDEBAR_TEXT} style={{ flexShrink: 0 }} />}
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
          color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
          fontSize: '0.85rem', fontWeight: active ? 600 : 400,
          transition: 'background 0.15s, color 0.15s',
          position: 'relative', whiteSpace: 'nowrap', overflow: 'hidden',
        }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {active && (
          <div style={{ position: 'absolute', left: 0, top: '20%', width: 3, height: '60%', background: ACCENT, borderRadius: '0 3px 3px 0' }} />
        )}
        {Icon && <Icon size={iconSize} color={active ? ACCENT : SIDEBAR_TEXT} style={{ flexShrink: 0 }} />}
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

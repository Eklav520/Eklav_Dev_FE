import React, { Suspense, useMemo, useState, useEffect } from 'react'
import { Collapse } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import type { IconType } from 'react-icons'

import Preloader from '@/components/Preloader'
import { useAuthContext } from '@/context/useAuthContext'
import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import { FiLayers, FiChevronRight, FiMenu, FiLogOut, FiChevronDown, FiUser } from 'react-icons/fi'
import logoWhite from '@/assets/images/logo_white.png'
import logoIcon from '@/assets/images/logo-mobile-light.svg'
import brainovisionLogo from '@/assets/images/partners/brainovision-logo.png'

// ── Theme — same shell as StudentLayout, in its dark palette to suit the dark admin pages ──
const SIDEBAR_BG     = '#0d1117'
const SIDEBAR_ACTIVE = 'rgba(255,122,0,0.15)'
const SIDEBAR_HOVER  = '#162440'
const SIDEBAR_TEXT   = '#c8d6e8'
const SIDEBAR_ACTIVE_TEXT = '#ffffff'
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)'
const ACCENT         = '#ff7a00'
const TOP_NAV_BG     = '#0d1117'
const MAIN_BG        = '#000000'
const TEXT_PRIMARY   = '#f1f5f9'
const TEXT_SECONDARY = '#94a3b8'
const NAV_BORDER     = '#1f2630'
const CARD_BG        = '#141a23'
const ICON_BTN_BG    = '#1a212c'

export type MenuItemTypeLocal = {
  key: string
  label: string
  url?: string
  parentKey?: string
  icon?: IconType
  isTitle?: boolean
  children?: MenuItemTypeLocal[]
  [k: string]: any
}

export type AdminShellProps = ChildrenType & {
  /* Sidebar menu (already filtered for the role / tenant) */
  items: MenuItemTypeLocal[]
  /* e.g. "Institute Admin", "Eklav Admin" — shown in the badge, top bar and user card */
  portalLabel: string
  homeUrl: string
  /* Edit-profile link in the user dropdown; omitted when the role has no profile page */
  profileUrl?: string
  /* "Powered by Brainovision" partner credit in the top bar */
  showPoweredBy?: boolean
}

/* Shared admin shell — collapsible sidebar + sticky top bar. Used by the institute,
   faculty and Eklav admin layouts so every admin area looks the same. */
const AdminShell = ({ children, items, portalLabel, homeUrl, profileUrl, showPoweredBy }: AdminShellProps) => {
  const { width } = useViewPort()
  const isDesktop = width >= 1200
  const { user, removeSession } = useAuthContext()
  const location = useLocation()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile')
        return res.json()
      })
      .then((profile) => {
        setName(profile.fullName || profile.name || '')
        setEmail(profile.email || '')
        setProfileImage(profile.profileImage || '')
      })
      .catch((err) => console.error('Error fetching profile:', err))
  }, [token, baseURL])

  // Sync body background so overscroll / short pages match the shell
  useEffect(() => {
    const prev = document.body.style.background
    document.body.style.background = MAIN_BG
    return () => { document.body.style.background = prev }
  }, [])

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const userName = name || portalLabel
  const initials = userName.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase()
  const avatarUrl = !profileImage ? '' : /^(https?:|data:)/.test(profileImage) ? profileImage : `${baseURL}${profileImage}`

  const isSidebarExpanded = !isCollapsed || isHovering
  const sidebarWidth = isSidebarExpanded ? '260px' : '72px'
  const toggleSidebar = () => { setIsCollapsed(p => !p); setIsHovering(false) }

  // Current page label from menu
  const currentPageLabel = useMemo(() => {
    const flat = (nodes: MenuItemTypeLocal[]): MenuItemTypeLocal[] =>
      nodes.flatMap(i => [i, ...(i.children ? flat(i.children) : [])])
    const match = flat(items).find(i => i.url && location.pathname.startsWith(i.url))
    return match?.label || 'Dashboard'
  }, [location.pathname, items])

  const Avatar = ({ size }: { size: number }) => (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Initials always as base — shows if image fails or is absent */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.024 + 'rem',
      }}>
        {initials}
      </div>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={userName}
          style={{ position: 'absolute', inset: 0, width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )

  const SidebarContent = ({ expanded }: { expanded: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .ial-nav-scroll::-webkit-scrollbar { display: none; }
        .ial-nav-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      {/* Logo / hamburger header */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        padding: expanded ? '0 14px 0 16px' : '0',
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        flexShrink: 0,
      }}>
        {expanded ? (
          <>
            <Link to={homeUrl} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flex: 1, overflow: 'hidden' }}>
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
            <span style={{ fontSize: '0.7rem', color: ACCENT, fontWeight: 600, letterSpacing: 0.5 }}>{portalLabel.toUpperCase()} PORTAL</span>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="ial-nav-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <VerticalMenu items={items} isCollapsed={!expanded} onItemClick={() => setMobileOpen(false)} />
      </nav>

      {/* User footer */}
      <div style={{
        padding: expanded ? '12px 16px' : '10px 0',
        borderTop: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex', alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        gap: 10, flexShrink: 0,
      }}>
        <Avatar size={34} />
        {expanded && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '0.68rem', color: SIDEBAR_TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{portalLabel}</div>
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: MAIN_BG }}>

      {/* Desktop sidebar */}
      {isDesktop && (
        <aside
          onMouseEnter={() => { if (isCollapsed) setIsHovering(true) }}
          onMouseLeave={() => { if (isCollapsed) setIsHovering(false) }}
          style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: sidebarWidth,
            background: SIDEBAR_BG,
            borderRight: `1px solid ${SIDEBAR_BORDER}`,
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
        minWidth: 0,
      }}>
        {/* Sticky top navbar */}
        <header style={{
          height: 64,
          background: TOP_NAV_BG,
          borderBottom: `1px solid ${NAV_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 1010,
        }}>
          {!isDesktop && (
            <button onClick={() => setMobileOpen(p => !p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_PRIMARY }}>
              <FiMenu size={20} />
            </button>
          )}

          {/* Page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: TEXT_PRIMARY }}>{portalLabel} Portal</div>
            <div style={{ fontSize: '0.72rem', color: TEXT_SECONDARY }}>{currentPageLabel}</div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Powered by Brainovision — partnership credit, same as the student shell */}
            {showPoweredBy && <div className="d-none d-md-flex" style={{ alignItems: 'center', gap: 10, paddingRight: 12, borderRight: `1px solid ${NAV_BORDER}` }}>
              <span style={{ fontSize: '0.75rem', color: TEXT_SECONDARY, fontWeight: 500, whiteSpace: 'nowrap' }}>Powered by</span>
              <img src={brainovisionLogo} alt="Brainovision" style={{ height: 38, width: 'auto', borderRadius: 4, flexShrink: 0 }} />
            </div>}

            {/* User pill + dropdown */}
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setUserDropdownOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px 5px 5px', borderRadius: 40, border: `1px solid ${NAV_BORDER}`, background: CARD_BG, cursor: 'pointer', userSelect: 'none' }}
              >
                <Avatar size={32} />
                <div className="d-none d-sm-block" style={{ lineHeight: 1.3 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT_PRIMARY, whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: '0.65rem', color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>{portalLabel}</div>
                </div>
                <FiChevronDown size={14} color={TEXT_SECONDARY} style={{ transition: 'transform 0.2s', transform: userDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>

              {userDropdownOpen && (
                <>
                  {/* Click-outside backdrop */}
                  <div onClick={() => setUserDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    minWidth: 220, background: CARD_BG,
                    border: `1px solid ${NAV_BORDER}`, borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                    zIndex: 200, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 14px', borderBottom: `1px solid ${NAV_BORDER}` }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: TEXT_PRIMARY }}>{userName}</div>
                      <div style={{ fontSize: '0.65rem', color: TEXT_SECONDARY, marginTop: 2 }}>{email || portalLabel}</div>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                      {profileUrl && (
                        <Link
                          to={profileUrl}
                          onClick={() => setUserDropdownOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', color: TEXT_PRIMARY, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = ICON_BTN_BG }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                        >
                          <FiUser size={14} />
                          Edit Profile
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserDropdownOpen(false); removeSession() }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', color: '#f87171', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.1)' }}
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
          <div className="main-content-wrapper">
            <Suspense fallback={<Preloader />}>{children}</Suspense>
          </div>
        </main>
      </div>

      <style>{`
        .main-content-wrapper {
          background: #0a0a0a;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #1f1f1f;
          min-height: calc(100vh - 104px);
        }

        @media (max-width: 575.98px) {
          .main-content-wrapper { padding: 1rem; }
        }

        /* Kit pages draw their own cards, so skip the outer frame (avoids a box inside a box) */
        .main-content-wrapper:has(> .aui-page) { padding: 0.25rem; border-color: transparent; background: transparent; }
      `}</style>
    </div>
  )
}

/* ═══════════════════ VERTICAL MENU ═══════════════════ */

const VerticalMenu = ({ items: baseMenu, isCollapsed, onItemClick }: { items: MenuItemTypeLocal[]; isCollapsed: boolean; onItemClick?: () => void }) => {
  const { pathname } = useLocation()

  const tree = useMemo(() => {
    const hasNested = baseMenu.some(it => it.children && it.children.length > 0)
    if (hasNested) return baseMenu

    const map = new Map<string, MenuItemTypeLocal & { children: MenuItemTypeLocal[] }>()
    baseMenu.forEach(it => map.set(it.key, { ...it, children: [] }))

    const roots: (MenuItemTypeLocal & { children: MenuItemTypeLocal[] })[] = []
    map.forEach(it => {
      if (it.parentKey && map.has(it.parentKey)) map.get(it.parentKey)!.children.push(it)
      else roots.push(it)
    })
    return roots
  }, [baseMenu])

  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newOpen: Record<string, boolean> = {}
    const walk = (nodes: MenuItemTypeLocal[], parents: string[] = []) => {
      nodes.forEach(n => {
        if (n.url && pathname.startsWith(n.url)) parents.forEach(p => (newOpen[p] = true))
        if (n.children) walk(n.children, [...parents, n.key])
      })
    }
    walk(tree)
    setOpenKeys(s => ({ ...s, ...newOpen }))
  }, [pathname, tree])

  const toggle = (key: string) =>
    setOpenKeys(prev => ({
      ...Object.keys(prev).reduce((a, k) => ({ ...a, [k]: false }), {}),
      [key]: !prev[key],
    }))

  const iconSize = isCollapsed ? 19 : 16
  const itemPad = isCollapsed ? '11px 0' : '9px 16px'
  const itemMargin = isCollapsed ? '2px auto' : '2px 8px'

  // A parent is active when any descendant matches the current page
  const isNodeActive = (node: MenuItemTypeLocal): boolean =>
    (!!node.url && pathname.startsWith(node.url)) || !!node.children?.some(isNodeActive)

  const renderNode = (node: MenuItemTypeLocal): React.ReactNode => {
    const Icon = node.icon || (node.children?.length ? FiLayers : null) as IconType | null
    const hasChildren = !!node.children?.length
    const open = !!openKeys[node.key]
    const active = isNodeActive(node)

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
            title={isCollapsed ? node.label : undefined}
            style={{
              width: isCollapsed ? 44 : 'calc(100% - 16px)', padding: itemPad, margin: itemMargin,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : 10, minWidth: 0 }}>
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
        title={isCollapsed ? node.label : undefined}
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
    // Collapsed: the icons share the full rail height evenly (capped so a short menu doesn't spread too far)
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isCollapsed ? 'center' : 'stretch',
      justifyContent: isCollapsed ? 'space-evenly' : 'flex-start',
      flex: isCollapsed ? '1 0 auto' : undefined,
      maxHeight: isCollapsed ? tree.length * 76 : undefined,
      padding: isCollapsed ? '8px 0' : '2px 0',
      width: '100%',
    }}>
      {tree.map(n => renderNode(n))}
    </div>
  )
}

export default AdminShell

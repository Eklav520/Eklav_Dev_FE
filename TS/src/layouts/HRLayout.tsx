import { Suspense, useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { FiMenu, FiLogOut, FiBell, FiChevronDown } from 'react-icons/fi'

import { HR_MENU_ITEMS } from '@/assets/data/menu-items'
import { useAuthContext } from '@/context/useAuthContext'
import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import logoImg from '@/assets/images/logo_white.png'

type MenuItemTypeLocal = {
  key: string
  label: string
  url?: string
  icon?: IconType
  children?: MenuItemTypeLocal[]
  [k: string]: any
}

const SIDEBAR_BG = '#0d1117'
const SIDEBAR_ACTIVE = 'rgba(255,122,0,0.15)'
const SIDEBAR_HOVER = '#162440'
const SIDEBAR_TEXT = '#c8d6e8'
const SIDEBAR_ACTIVE_TEXT = '#ffffff'
const ACCENT = '#ff7a00'
const TOP_NAV_BG = '#ffffff'
const MAIN_BG = '#f1f5f9'

const HRLayout = ({ children }: ChildrenType) => {
  const { width } = useViewPort()
  const isDesktop = width >= 1200
  const { user, removeSession, refreshUser } = useAuthContext()
  const location = useLocation()
  const visibleMenuItems = (HR_MENU_ITEMS as MenuItemTypeLocal[]).filter(m => m.key !== 'hr-my-interviews')

  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const isSidebarExpanded = !isCollapsed || isHovering
  const sidebarWidth = isSidebarExpanded ? '260px' : '72px'

  // Pull the latest name/email from the profile API on mount
  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const userName = (user as any)?.fullName || (user as any)?.name || 'HR'
  const userEmail = (user as any)?.email || ''
  const initials = userName.slice(0, 2).toUpperCase()

  // Force light background — the global CSS sets body to black for the dark theme
  useEffect(() => {
    const prev = document.body.style.background
    const prevHtml = document.documentElement.style.background
    document.body.style.background = MAIN_BG
    document.body.style.backgroundColor = MAIN_BG
    document.documentElement.style.background = MAIN_BG
    return () => {
      document.body.style.background = prev
      document.body.style.backgroundColor = prev
      document.documentElement.style.background = prevHtml
    }
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev)
    setIsHovering(false)
  }

  const isActive = (url?: string) => url && location.pathname.startsWith(url)

  const renderMenuItems = (items: MenuItemTypeLocal[], expanded: boolean) =>
    items.map((item) => {
      const Icon = item.icon as IconType | undefined
      const active = isActive(item.url)
      // Collapsed: larger icon + more vertical padding so items spread evenly
      const iconSize  = expanded ? 16 : 20
      const itemPad   = expanded ? '9px 16px' : '13px 0'
      const itemMargin = expanded ? '2px 8px' : '4px 6px'
      return (
        <Link
          key={item.key}
          to={item.url || '#'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: expanded ? 10 : 0,
            padding: itemPad,
            justifyContent: expanded ? 'flex-start' : 'center',
            borderRadius: 8,
            margin: itemMargin,
            background: active ? SIDEBAR_ACTIVE : 'transparent',
            color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: active ? 600 : 400,
            transition: 'background 0.15s, color 0.15s',
            position: 'relative',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER
          }}
          onMouseLeave={e => {
            if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          {active && (
            <div style={{
              position: 'absolute', left: 0, top: '20%', width: 3, height: '60%',
              background: ACCENT, borderRadius: '0 3px 3px 0',
            }} />
          )}
          {Icon && <Icon size={iconSize} color={active ? ACCENT : SIDEBAR_TEXT} style={{ flexShrink: 0 }} />}
          {expanded && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
        </Link>
      )
    })

  const SidebarContent = ({ expanded }: { expanded: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo header */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'space-between' : 'center',
        padding: expanded ? '0 16px' : '0',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        {expanded && (
          <Link to="/hr/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src={logoImg} alt="Eklav" style={{ height: 32, objectFit: 'contain' }} />
          </Link>
        )}
        {isDesktop && (
          <button
            onClick={toggleSidebar}
            style={{
              background: 'transparent', border: 'none', color: SIDEBAR_TEXT,
              cursor: 'pointer', padding: 6, borderRadius: 6,
            }}
          >
            <FiMenu size={18} />
          </button>
        )}
      </div>

      {/* Role badge */}
      {expanded && (
        <div style={{ padding: '12px 16px 8px', flexShrink: 0 }}>
          <div style={{
            background: 'rgba(255,122,0,0.15)', borderRadius: 6,
            padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT }} />
            <span style={{ fontSize: '0.72rem', color: ACCENT, fontWeight: 600, letterSpacing: 0.5 }}>
              HR PORTAL
            </span>
          </div>
        </div>
      )}

      {/* Nav items — collapsed: flex column space-evenly so icons fill the height */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0',
        display: 'flex', flexDirection: 'column',
        justifyContent: expanded ? 'flex-start' : 'space-evenly',
      }}>
        {renderMenuItems(visibleMenuItems, expanded)}
      </nav>

      {/* User footer */}
      <div style={{
        padding: expanded ? '12px 16px' : '12px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
        }}>
          {initials}
        </div>
        {expanded && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName}
              </div>
              <div style={{ fontSize: '0.72rem', color: SIDEBAR_TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail || 'HR Recruiter'}
              </div>
            </div>
            <button
              onClick={() => removeSession()}
              title="Logout"
              style={{ background: 'transparent', border: 'none', color: SIDEBAR_TEXT, cursor: 'pointer', padding: 4 }}
            >
              <FiLogOut size={15} />
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: MAIN_BG, backgroundColor: MAIN_BG, minHeight: '100vh' }}>
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
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1019 }}
          />
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
            background: SIDEBAR_BG, zIndex: 1020,
          }}>
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
        backgroundColor: MAIN_BG,
      }}>
        {/* Top navbar */}
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
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#334155' }}
            >
              <FiMenu size={20} />
            </button>
          )}

          {/* Page title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              HR Portal
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {visibleMenuItems.find(m => isActive(m.url))?.label || 'Dashboard'}
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#475569',
            }}>
              <FiBell size={16} />
            </button>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setUserDropdownOpen(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 10px 5px 5px', borderRadius: 40,
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: 'pointer', userSelect: 'none',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${ACCENT}, #ff944d)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ textAlign: 'left', maxWidth: 140 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {userEmail}
                  </div>
                </div>
                <FiChevronDown size={14} color="#94a3b8" style={{ transition: 'transform 0.2s', transform: userDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>

              {userDropdownOpen && (
                <>
                  <div onClick={() => setUserDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 180,
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 200, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{userName}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{userEmail}</div>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                      <button
                        onClick={() => { setUserDropdownOpen(false); removeSession() }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
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
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: MAIN_BG, backgroundColor: MAIN_BG }}>
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading…</div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default HRLayout

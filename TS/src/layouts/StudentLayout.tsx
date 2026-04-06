import { lazy, Suspense, useMemo, useState, useEffect } from 'react'
import { Col, Collapse, Container, Offcanvas, OffcanvasBody, OffcanvasHeader, OffcanvasTitle, Row } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import type { IconType } from 'react-icons'

import { STUDENT_MENU_ITEMS } from '@/assets/data/menu-items'
import Preloader from '@/components/Preloader'
import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import { FiLayers, FiChevronRight, FiMenu } from 'react-icons/fi'
import './studentLayout.css'

// lazy parts
const Banner = lazy(() => import('@/components/StudentLayoutComponents/Banner'))
const Footer = lazy(() => import('@/components/StudentLayoutComponents/Footer'))
const TopNavigationBar = lazy(() => import('@/components/StudentLayoutComponents/TopNavigationBar'))
const ChatBox = lazy(() => import('@/layouts/ChatBox'))
import TrialWelcomeModal from './TrialWelcomeModal'
import { getRemainingTrialDays } from '@/utils/trialUtils'

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
  const { isTrue: isOffCanvasMenuOpen, toggle: toggleOffCanvasMenu } = useToggle()

  // Manual collapse state - controlled by user click
  const [isCollapsed, setIsCollapsed] = useState(true)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [role, setRole] = useState('Guest')
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [userName, setUserName] = useState('Student')
  const [isHovering, setIsHovering] = useState(false)
  const isSidebarExpanded = !isCollapsed || isHovering
  const isOrangeTheme = isHovering && isCollapsed
  const location = useLocation()

  const hostname = window.location.hostname

  // extract subdomain (coredatalabs from coredatalabs.eklav.in)
  const subdomain = hostname.split(".")[0]

  // main domain check
  const isMainDomain = hostname === "eklav.in" || hostname === "www.eklav.in"

  useEffect(() => {
    const daysLeft = getRemainingTrialDays()
    if (daysLeft >= 0) {
      setShowTrialModal(true)
    }
  }, [])

  useEffect(() => {
    if (isOffCanvasMenuOpen) {
      toggleOffCanvasMenu()
    }
  }, [location.pathname])

  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((profile) => {
        setRole(profile.role)
        setUserName(profile.name || profile.fullName || 'Student')
      })
      .catch(() => { })
  }, [token, baseURL])

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev)
    setIsHovering(false)
  }

  // Calculate sidebar width based on collapse state
  const sidebarWidth = isSidebarExpanded ? '280px' : '80px'

  return (
    <>
      {/* FIXED TOP NAVBAR */}
      <Suspense>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
          backgroundColor: '#000000', // Changed to black
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          height: '70px',
          borderBottom: '6px solid #ff7a00' // Added orange border
        }}>
          <TopNavigationBar
            role={role}
            onToggleMenu={toggleOffCanvasMenu}
            onToggleSidebar={toggleSidebar}
          />
        </div>
      </Suspense>

      {/* MAIN LAYOUT WITH FIXED SIDEBAR */}
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        paddingTop: '70px',
        backgroundColor: '#000000' // Added black background
      }}>
        {/* FIXED DESKTOP SIDEBAR */}
        {isDesktop && (
          <aside
            onMouseEnter={() => {
              if (isCollapsed) setIsHovering(true)
            }}
            onMouseLeave={() => {
              if (isCollapsed) setIsHovering(false)
            }}
            style={{
              position: 'fixed',
              top: '70px',
              left: 0,
              bottom: 0,
              width: sidebarWidth,
              zIndex: 1020,
              backgroundColor: isOrangeTheme ? '#0a0a0a' : '#000000', // Changed to black/dark gray
              borderRight: isOrangeTheme
                ? '1px solid #ff7a00' // Orange border
                : '1px solid #1f1f1f', // Dark gray border
              boxShadow: isOrangeTheme
                ? '2px 0 12px rgba(255, 122, 0, 0.2)'
                : 'none',
              color: '#fff',
              transition: 'width 0.25s ease',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {/* ===== Sidebar Header ===== */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #1f1f1f', // Dark gray border
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {isSidebarExpanded ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: isOrangeTheme
                          ? 'linear-gradient(135deg, #ff7a00 0%, #ff944d 100%)' // Orange gradient
                          : 'linear-gradient(135deg, #ff7a00 0%, #ff944d 100%)', // Always orange
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000000',
                        fontWeight: '600',
                        fontSize: '14px',
                      }}
                    >
                      {userName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#8a8a8a', // Light gray
                          fontWeight: '400',
                        }}
                      >
                        Welcome,
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#ffffff',
                          lineHeight: '1.3',
                        }}
                      >
                        {userName || 'Student'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8a8a8a',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isCollapsed
                        ? '#1f1f1f'
                        : 'rgba(255, 122, 0, 0.15)';
                      e.currentTarget.style.color = '#ff7a00';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8a8a8a';
                    }}
                  >
                    <FiMenu size={16} />
                  </button>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #ff7a00 0%, #ff944d 100%)', // Orange gradient
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000000',
                      fontWeight: '600',
                      fontSize: '16px',
                    }}
                  >
                    {userName?.charAt(0) || 'S'}
                  </div>
                  <button
                    onClick={toggleSidebar}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8a8a8a',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <FiMenu size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* ===== Menu Items ===== */}
            <VerticalMenu
              isCollapsed={!isSidebarExpanded}
              isMainDomain={isMainDomain}
            />
          </aside>
        )}

        {/* MAIN CONTENT - Scrollable area */}
        <main style={{
          flex: 1,
          marginLeft: isDesktop ? sidebarWidth : 0,
          transition: 'margin-left 0.3s ease',
          overflowY: 'auto',
          height: '100%',
          backgroundColor: '#000000' // Added black background
        }}>
          <div style={{ padding: '24px' }}>
            <Suspense fallback={<Preloader />}>
              <div className="main-content-wrapper" style={{ marginTop: '20px' }}>
                {children}
              </div>
            </Suspense>
          </div>
        </main>
      </div>

      {/* MOBILE OFFCANVAS */}
      {!isDesktop && (
        <Offcanvas
          show={isOffCanvasMenuOpen}
          placement="start"
          onHide={toggleOffCanvasMenu}
          backdrop
          scroll={false}
          restoreFocus={false}
          className="custom-mobile-drawer"
        >
          <OffcanvasBody className="p-0">
            <div style={{
              padding: "16px",
              borderBottom: "1px solid #1f1f1f",
              background: '#000000'
            }}>
              <div style={{ fontSize: "13px", color: "#ff7a00" }}>Welcome</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: '#ffffff' }}>
                {userName}
              </div>
            </div>

            <VerticalMenu
              isCollapsed={false}
              onItemClick={toggleOffCanvasMenu}
              isMainDomain={isMainDomain}
            />
          </OffcanvasBody>
        </Offcanvas>
      )}

      {/* CHAT BOX */}
      <Suspense fallback={null}>
        <ChatBox position="bottom-right" />
      </Suspense>
    </>
  )
}

/* ================= VERTICAL MENU ================= */

const VerticalMenu = ({
  isCollapsed,
  onItemClick,
  isMainDomain
}: {
  isCollapsed: boolean
  onItemClick?: () => void
  isMainDomain?: boolean
}) => {
  const { pathname } = useLocation()
  const { user } = useAuthContext()
  const isApproved = user?.status === 'pending' || user?.status === 'approved'
  const alwaysEnabledKeys = ['dashboard', 'subscriptions']

  const filteredMenu = useMemo(() => {
    let items = STUDENT_MENU_ITEMS

    // ✅ Hide subscription for subdomains
    if (!isMainDomain) {
      items = items.filter(item => item.key !== "subscriptions")
    }

    return items.map((item) => ({
      ...item,
      isDisabled: !isApproved && !alwaysEnabledKeys.includes(item.key),
    }))
  }, [isApproved, isMainDomain])

  const tree = useMemo(() => filteredMenu, [filteredMenu])

  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newOpen: Record<string, boolean> = {}
    const walk = (nodes: MenuItemTypeLocal[], parents: string[] = []) => {
      nodes.forEach((n) => {
        if (n.url === pathname) parents.forEach((p) => (newOpen[p] = true))
        if (n.children) walk(n.children, [...parents, n.key])
      })
    }
    walk(tree)
    setOpenKeys((s) => ({ ...s, ...newOpen }))
  }, [pathname, tree])

  const toggle = (key: string) =>
    setOpenKeys((prev) => ({
      ...Object.keys(prev).reduce((a, k) => ({ ...a, [k]: false }), {}),
      [key]: !prev[key],
    }))

  const renderNode = (node: MenuItemTypeLocal) => {
    const Icon = node.icon || (node.children?.length ? FiLayers : null)
    const hasChildren = !!node.children?.length
    const open = !!openKeys[node.key]

    if (node.isTitle) {
      return isCollapsed ? (
        <div key={node.key} style={{
          padding: '12px 16px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#ff7a00', // Changed to orange
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {node.label}
        </div>
      ) : null
    }

    if (hasChildren) {
      return (
        <div key={node.key}>
          <button
            type="button"
            onClick={() => toggle(node.key)}
            style={{
              width: '100%',
              padding: isCollapsed ? '12px 0' : '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              background: 'transparent',
              border: 'none',
              color: pathname.startsWith(node.url || '#') ? '#ff7a00' : '#e5e5e5', // Orange for active
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: '6px',
              marginBottom: '2px'
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith(node.url || '#')) {
                e.currentTarget.style.background = isCollapsed
                  ? '#1f1f1f'
                  : 'rgba(255, 122, 0, 0.15)'
                e.currentTarget.style.color = '#ff7a00'
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith(node.url || '#')) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#e5e5e5'
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '12px' }}>
              {Icon && <Icon size={18} />}
              {!isCollapsed && <span style={{ fontSize: '14px' }}>{node.label}</span>}
            </div>

            {!isCollapsed && (
              <FiChevronRight
                size={14}
                style={{
                  transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  color: '#ff7a00' // Orange chevron
                }}
              />
            )}
          </button>

          {!isCollapsed && (
            <Collapse in={open}>
              <div style={{ marginLeft: '32px', marginTop: '2px' }}>
                {node.children!.map((c) => renderNode(c))}
              </div>
            </Collapse>
          )}
        </div>
      )
    }

    const isActive = pathname === node.url

    return (
      <Link
        key={node.key}
        to={node.url || '#'}
        className="menu-item"
        onClick={() => {
          if (onItemClick) onItemClick()
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '12px 0' : '10px 16px',
          gap: isCollapsed ? '0' : '12px',
          textDecoration: 'none',
          color: isActive ? '#ff7a00' : '#e5e5e5', // Orange for active
          background: isActive ? 'rgba(255, 122, 0, 0.15)' : 'transparent', // Orange background for active
          borderRadius: '6px',
          transition: 'all 0.2s',
          marginBottom: '2px',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = isCollapsed
              ? '#1f1f1f'
              : 'rgba(255, 122, 0, 0.15)'
            e.currentTarget.style.color = '#ff7a00'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#e5e5e5'
          }
        }}
      >
        {Icon && <Icon size={18} />}
        {!isCollapsed && node.label}
      </Link>
    )
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isCollapsed ? '8px' : '2px'
      }}>
        {tree.map((n) => renderNode(n))}
      </div>
    </div>
  )
}

export default StudentLayout


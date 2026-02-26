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
  const [isCollapsed, setIsCollapsed] = useState(false)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [role, setRole] = useState('Guest')
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [userName, setUserName] = useState('Student')

  useEffect(() => {
    const daysLeft = getRemainingTrialDays()
    if (daysLeft >= 0) {
      setShowTrialModal(true)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${baseURL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((profile) => {
        setRole(profile.role)
        // Extract name from profile (adjust based on your API response)
        setUserName(profile.name || profile.fullName || 'Student')
      })
      .catch(() => { })
  }, [token, baseURL])

  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Calculate sidebar width based on collapse state
  const sidebarWidth = isCollapsed ? '80px' : '280px'

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
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '70px'
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
        overflow: 'hidden', // Prevent double scrollbars
        paddingTop: '70px' // Height of top navbar
      }}>
        {/* FIXED DESKTOP SIDEBAR */}
        {isDesktop && (
          <aside
            style={{
              position: 'fixed',
              top: '70px',
              left: 0,
              bottom: 0,
              width: sidebarWidth,
              zIndex: 1020,
              backgroundColor: '#1a1d21',
              color: '#fff',
              borderRight: '1px solid #2c2f33',
              transition: 'width 0.3s ease',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4a4f55 #1a1d21',
            }}
          >
            {/* ===== Sidebar Header ===== */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #2c2f33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {!isCollapsed ? (
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
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
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
                          color: '#8f9bb3',
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
                      color: '#8f9bb3',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2c2f33';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8f9bb3';
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
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
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
                      color: '#8f9bb3',
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
            <VerticalMenu isCollapsed={isCollapsed} />
          </aside>
        )}

        {/* MAIN CONTENT - Scrollable area */}
        <main style={{
          flex: 1,
          marginLeft: isDesktop ? sidebarWidth : 0,
          transition: 'margin-left 0.3s ease',
          overflowY: 'auto',
          height: '100%',
          // Remove the backgroundColor override - let the original styles apply
        }}>
          <div style={{ padding: '24px' }}>
            <Suspense fallback={<Preloader />}>
              {/* Banner component */}
              {/* <Banner toggleOffCanvas={toggleOffCanvasMenu} /> */}

              {/* Main content wrapper - don't override styles here either */}
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
          style={{ backgroundColor: '#1a1d21', color: '#fff' }}
        >
          <OffcanvasHeader closeButton style={{ color: '#fff', borderBottom: '1px solid #2c2f33' }}>
            <OffcanvasTitle>Menu</OffcanvasTitle>
          </OffcanvasHeader>
          <OffcanvasBody className="p-0">
            <VerticalMenu isCollapsed={false} />
          </OffcanvasBody>
        </Offcanvas>
      )}

      {/* CHAT BOX */}
      <Suspense fallback={null}>
        <ChatBox position="bottom-right" />
      </Suspense>

      {/* TRIAL MODAL */}
      <TrialWelcomeModal
        show={showTrialModal}
        onClose={() => setShowTrialModal(false)}
      />
    </>
  )
}

/* ================= VERTICAL MENU ================= */

const VerticalMenu = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { pathname } = useLocation()
  const { user } = useAuthContext()
  const isApproved = user?.status === 'pending' || user?.status === 'approved'
  const alwaysEnabledKeys = ['dashboard', 'subscriptions']

  const filteredMenu = useMemo(() => {
    return STUDENT_MENU_ITEMS.map((item) => ({
      ...item,
      isDisabled: !isApproved && !alwaysEnabledKeys.includes(item.key),
    }))
  }, [isApproved])

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
      return !isCollapsed ? (
        <div key={node.key} style={{
          padding: '12px 16px 8px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#8f9bb3',
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
              color: pathname.startsWith(node.url || '#') ? '#fff' : '#b0b7c4',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: '6px',
              marginBottom: '2px'
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith(node.url || '#')) {
                e.currentTarget.style.background = '#2c2f33'
                e.currentTarget.style.color = '#fff'
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith(node.url || '#')) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#b0b7c4'
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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '12px 0' : '10px 16px',
          gap: isCollapsed ? '0' : '12px',
          textDecoration: 'none',
          color: isActive ? '#fff' : '#b0b7c4',
          background: isActive ? '#2c2f33' : 'transparent',
          borderRadius: '6px',
          transition: 'all 0.2s',
          marginBottom: '2px',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = '#2c2f33'
            e.currentTarget.style.color = '#fff'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#b0b7c4'
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
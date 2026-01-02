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
import { FiLayers } from 'react-icons/fi'

// lazy parts
const Banner = lazy(() => import('@/components/StudentLayoutComponents/Banner'))
const Footer = lazy(() => import('@/components/StudentLayoutComponents/Footer'))
const TopNavigationBar = lazy(() => import('@/components/StudentLayoutComponents/TopNavigationBar'))
const ChatBox = lazy(() => import('@/layouts/ChatBox'))

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

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [role, setRole] = useState('Guest')
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    if (!token) return

    fetch(`${baseURL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((profile) => setRole(profile.role))
      .catch(() => {})
  }, [token, baseURL])

  return (
    <>
      {/* TOP NAVBAR */}
      <Suspense>
        <TopNavigationBar role={role} onToggleMenu={toggleOffCanvasMenu} />
      </Suspense>

      <main>
        <Banner toggleOffCanvas={toggleOffCanvasMenu} />

        <section className="pt-0 mt-3 mt-md-4">
          <Container fluid>
            <Row className="g-3 g-xl-4">
              {/* DESKTOP SIDEBAR ONLY */}
              {isDesktop && (
                <Col
                  xl="auto"
                  className="sidebar-wrapper"
                  onMouseEnter={() => isDesktop && setIsCollapsed(false)}
                  onMouseLeave={() => isDesktop && setIsCollapsed(true)}
                  style={{
                    transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                    width: isCollapsed ? '64px' : '220px',
                    minWidth: isCollapsed ? '64px' : '220px',
                    maxWidth: isCollapsed ? '64px' : '220px',
                    minHeight: '100svh',
                    padding: 0,
                  }}>
                  <VerticalMenu isCollapsed={isCollapsed} />
                </Col>
              )}

              {/* MAIN CONTENT */}
              <Col className="px-2" style={{ flex: 1 }}>
                <div className="main-content-wrapper p-1 rounded-4 shadow-sm bg-light">
                  <Suspense fallback={<Preloader />}>{children}</Suspense>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </main>

      {/* MOBILE OFFCANVAS (ROOT LEVEL) */}
      {!isDesktop && (
        <Offcanvas show={isOffCanvasMenuOpen} placement="start" onHide={toggleOffCanvasMenu} backdrop scroll={false} restoreFocus={false}>
          <OffcanvasHeader closeButton>
            <OffcanvasTitle>Menu</OffcanvasTitle>
          </OffcanvasHeader>
          <OffcanvasBody className="p-3">
            <VerticalMenu isCollapsed={false} />
          </OffcanvasBody>
        </Offcanvas>
      )}

      <Suspense>
        <Footer />
      </Suspense>

      <Suspense fallback={null}>
        <ChatBox position="bottom-right" />
      </Suspense>
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
        <div key={node.key} className="px-3 py-2 small fw-semibold text-white-50">
          {node.label}
        </div>
      ) : null
    }

    /* -------- PARENT WITH CHILDREN -------- */
    if (hasChildren) {
      return (
        <div key={node.key}>
          <button
            type="button"
            onClick={() => toggle(node.key)}
            className={clsx(
              'list-group-item list-group-item-action d-flex align-items-center',
              isCollapsed ? 'justify-content-center' : 'justify-content-between px-3',
            )}
            style={{
              minHeight: isCollapsed ? 52 : 44,
              marginBottom: isCollapsed ? 10 : 4,
              borderRadius: 10,
            }}>
            <div className="d-flex align-items-center">
              {Icon && <Icon size={18} className={isCollapsed ? '' : 'me-2'} />}
              {!isCollapsed && <span>{node.label}</span>}
            </div>

            {!isCollapsed && (
              <span
                style={{
                  transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform .2s',
                }}>
                ▶
              </span>
            )}
          </button>

          {!isCollapsed && (
            <Collapse in={open}>
              <div className="ms-3 mt-1">{node.children!.map((c) => renderNode(c))}</div>
            </Collapse>
          )}
        </div>
      )
    }

    /* -------- LEAF ITEM -------- */
    return (
      <Link
        key={node.key}
        to={node.url || '#'}
        className={clsx(
          'list-group-item list-group-item-action d-flex align-items-center',
          isCollapsed ? 'justify-content-center' : 'px-3',
          pathname === node.url && 'active',
        )}
        style={{
          minHeight: isCollapsed ? 52 : 42,
          marginBottom: isCollapsed ? 10 : 4,
          borderRadius: 10,
        }}>
        {Icon && <Icon size={18} className={isCollapsed ? '' : 'me-2'} />}
        {!isCollapsed && node.label}
      </Link>
    )
  }

  return (
    <div className="bg-dark border rounded-3 p-2 d-flex flex-column">
      <div
        className="list-group list-group-dark list-group-borderless"
        style={{
          gap: isCollapsed ? 12 : 6,
          display: 'flex',
          flexDirection: 'column',
        }}>
        {tree.map((n) => renderNode(n))}
      </div>
    </div>
  )
}

export default StudentLayout

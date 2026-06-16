import { lazy, Suspense, useMemo, useState, useEffect } from 'react'
import {
  Col,
  Collapse,
  Container,
  Offcanvas,
  OffcanvasBody,
  OffcanvasHeader,
  OffcanvasTitle,
  Row,
} from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import type { IconType } from 'react-icons'

import { INSTITUTEADMIN_MENU_ITEMS, FACULTY_ADMIN_MENU_ITEMS } from '@/assets/data/menu-items'
import Preloader from '@/components/Preloader'
import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import { FaSignOutAlt, FaChevronRight } from 'react-icons/fa'

const Banner = lazy(() => import('@/components/StudentLayoutComponents/Banner'))
const Footer = lazy(() => import('@/components/InstructorLayoutComponents/Footer'))
const TopNavigationBar = lazy(() => import('@/components/InstructorLayoutComponents/TopNavigationBar'))

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

const InstituteAdminLayout = ({ children }: ChildrenType) => {
  const { width } = useViewPort()
  const { isTrue: isOffCanvasMenuOpen, toggle: toggleOffCanvasMenu } = useToggle()

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [name, setName] = useState('Guest')
  const [role, setRole] = useState('Institute Admin')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) return

    fetch(`${baseURL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile')
        return res.json()
      })
      .then((profile) => {
        setName(profile.fullName || 'Institute Admin')
        setRole(profile.role || 'Institute Admin')
        setEmail(profile.email || '')
      })
      .catch((err) => {
        console.error('Error fetching profile:', err)
      })
  }, [token, baseURL])

  return (
    <>
      <Suspense>
        <TopNavigationBar role={role} onToggleMenu={toggleOffCanvasMenu} />
      </Suspense>

      <main className="institute-admin-main">
        <Banner toggleOffCanvas={toggleOffCanvasMenu} />

        <section className="pt-0 mt-3 mt-md-4">
          <Container fluid>
            <Row className="g-3 g-xl-4">
              <Col xl={2}>
                {width >= 1200 ? (
                  <VerticalMenu />
                ) : (
                  <Offcanvas
                    show={isOffCanvasMenuOpen}
                    placement="start"
                    onHide={toggleOffCanvasMenu}
                    backdrop
                    scroll={false}
                    restoreFocus={false}
                    className="institute-admin-mobile-drawer"
                  >
                    <OffcanvasBody className="p-0">
                      <div className="drawer-header">
                        <div className="drawer-welcome">Welcome</div>
                        <div className="drawer-name">{name}</div>
                      </div>
                      <VerticalMenu onItemClick={toggleOffCanvasMenu} />
                    </OffcanvasBody>
                  </Offcanvas>
                )}
              </Col>

              <Col xl={10}>
                <div className="main-content-wrapper">
                  <Suspense fallback={<Preloader />}>{children}</Suspense>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      </main>

      <Suspense>
        <Footer />
      </Suspense>

      <style>{`
        .institute-admin-main {
          background: #000000;
          min-height: 100vh;
        }

        .main-content-wrapper {
          background: #0a0a0a;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #1f1f1f;
          min-height: calc(100vh - 200px);
        }

        .institute-admin-mobile-drawer {
          background: #000000 !important;
        }

        .drawer-header {
          padding: 20px;
          border-bottom: 1px solid #1f1f1f;
          background: #000000;
        }

        .drawer-welcome {
          font-size: 12px;
          color: #ff7a00;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .drawer-name {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin-top: 4px;
        }

        /* Custom scrollbar for dark theme */
        .main-content-wrapper::-webkit-scrollbar {
          width: 8px;
        }

        .main-content-wrapper::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        .main-content-wrapper::-webkit-scrollbar-thumb {
          background: #ff7a00;
          border-radius: 4px;
        }

        .main-content-wrapper::-webkit-scrollbar-thumb:hover {
          background: #ff944d;
        }
      `}</style>
    </>
  )
}

/* ---------------- Vertical Menu ---------------- */

const VerticalMenu = ({ onItemClick }: { onItemClick?: () => void }) => {
  const { pathname } = useLocation()
  const { removeSession, user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [allowedAdminKeys, setAllowedAdminKeys] = useState<string[] | null>(null)

  useEffect(() => {
    const hostname = window.location.hostname.split(':')[0].toLowerCase()
    const isMainDomain = hostname === 'localhost' || hostname === 'eklav.in' || hostname === 'www.eklav.in'
    if (isMainDomain) return
    fetch(`${baseURL}/api/institute/nav-config-by-domain`, {
      headers: { 'x-tenant-domain': hostname },
      cache: 'no-store',
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.adminNavSections) && d.adminNavSections.length > 0) {
          setAllowedAdminKeys(d.adminNavSections)
        }
      })
      .catch(() => {})
  }, [baseURL])

  const baseMenu: MenuItemTypeLocal[] = useMemo(() => {
    const items = user?.role === 'facultyAdmin' ? FACULTY_ADMIN_MENU_ITEMS : INSTITUTEADMIN_MENU_ITEMS
    const all = items as unknown as MenuItemTypeLocal[]
    if (!allowedAdminKeys) return all
    return all.filter(item => allowedAdminKeys.includes(item.key))
  }, [user?.role, allowedAdminKeys])

  const tree = useMemo(() => {
    const hasNested = baseMenu.some((it) => it.children && it.children.length > 0)
    if (hasNested) return baseMenu

    const map = new Map<string, MenuItemTypeLocal & { children: MenuItemTypeLocal[] }>()
    baseMenu.forEach((it) => map.set(it.key, { ...it, children: [] }))

    const roots: (MenuItemTypeLocal & { children: MenuItemTypeLocal[] })[] = []
    map.forEach((it) => {
      if (it.parentKey && map.has(it.parentKey)) {
        map.get(it.parentKey)!.children.push(it)
      } else {
        roots.push(it)
      }
    })
    return roots
  }, [baseMenu])

  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const newOpen: Record<string, boolean> = {}

    const walk = (nodes: MenuItemTypeLocal[], parents: string[] = []) => {
      nodes.forEach((n) => {
        if (n.url && pathname === n.url) parents.forEach((p) => (newOpen[p] = true))
        if (n.children) walk(n.children, [...parents, n.key])
      })
    }

    walk(tree)
    setOpenKeys((s) => ({ ...s, ...newOpen }))
  }, [pathname, tree])

  const toggle = (key: string) =>
    setOpenKeys((s) => ({
      ...s,
      [key]: !s[key],
    }))

  const isActive = (item: MenuItemTypeLocal) =>
    item.url && pathname === item.url

  const renderNode = (node: MenuItemTypeLocal) => {
    const Icon = node.icon
    const hasChildren = node.children && node.children.length > 0

    if (node.isTitle) {
      return (
        <div key={node.key} className="menu-title">
          {node.label}
        </div>
      )
    }

    if (hasChildren) {
      const open = !!openKeys[node.key]

      return (
        <div key={node.key} className="menu-item-wrapper">
          <button
            type="button"
            onClick={() => toggle(node.key)}
            className="menu-button"
          >
            <div className="menu-button-content">
              {Icon && <Icon className="menu-icon" />}
              <span>{node.label}</span>
            </div>
            <FaChevronRight className={`menu-chevron ${open ? 'open' : ''}`} />
          </button>

          <Collapse in={open}>
            <div className="menu-children">
              {node.children?.map((c) => renderNode(c))}
            </div>
          </Collapse>
        </div>
      )
    }

    return (
      <Link
        key={node.key}
        to={node.url || '#'}
        className={`menu-link ${isActive(node) ? 'active' : ''}`}
        onClick={() => onItemClick?.()}
      >
        {Icon && <Icon className="menu-icon" />}
        <span>{node.label}</span>
      </Link>
    )
  }

  return (
    <div className="vertical-menu-container">
      <div className="menu-list">
        {tree.map((n) => renderNode(n))}

        <div className="menu-divider" />

        <Link
          className="menu-link signout-link"
          to="/auth/sign-in"
          onClick={removeSession}
        >
          <FaSignOutAlt className="menu-icon" />
          <span>Sign Out</span>
        </Link>
      </div>

      <style>{`
        .vertical-menu-container {
          background: #000000;
          border-radius: 12px;
          border: 1px solid #1f1f1f;
          width: 100%;
          position: sticky;
          top: 20px;
        }

        .menu-list {
          padding: 1rem;
        }

        .menu-title {
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #ff7a00;
          margin-top: 0.5rem;
        }

        .menu-title:first-child {
          margin-top: 0;
        }

        .menu-item-wrapper {
          margin-bottom: 0.25rem;
        }

        .menu-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #e5e5e5;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .menu-button:hover {
          background: #1a1a1a;
          color: #ff7a00;
        }

        .menu-button-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .menu-chevron {
          font-size: 0.75rem;
          transition: transform 0.2s ease;
          color: #6c757d;
        }

        .menu-chevron.open {
          transform: rotate(90deg);
          color: #ff7a00;
        }

        .menu-children {
          margin-left: 2rem;
          padding-left: 0.5rem;
          border-left: 1px solid #2c2c2c;
        }

        .menu-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          border-radius: 8px;
          color: #e5e5e5;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          margin-bottom: 0.25rem;
        }

        .menu-link:hover {
          background: #1a1a1a;
          color: #ff7a00;
          text-decoration: none;
        }

        .menu-link.active {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(255, 122, 0, 0.3);
        }

        .menu-icon {
          font-size: 1rem;
          min-width: 1.25rem;
        }

        .menu-divider {
          height: 1px;
          background: #1f1f1f;
          margin: 1rem 0;
        }

        .signout-link {
          color: #ff6b6b;
        }

        .signout-link:hover {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        @media (max-width: 1199px) {
          .vertical-menu-container {
            border-radius: 0;
            border: none;
          }
        }
      `}</style>
    </div>
  )
}

export default InstituteAdminLayout
// InstructorLayout.tsx
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

import { INSTRUCTOR_MENU_ITEMS } from '@/assets/data/menu-items'
import Preloader from '@/components/Preloader'
import { useAuthContext } from '@/context/useAuthContext'
import useToggle from '@/hooks/useToggle'
import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import { FaSignOutAlt } from 'react-icons/fa'

// lazy parts
const Banner = lazy(() => import('@/components/InstructorLayoutComponents/Banner'))
const Footer = lazy(() => import('@/components/InstructorLayoutComponents/Footer'))
const TopNavigationBar = lazy(() => import('@/components/InstructorLayoutComponents/TopNavigationBar'))

// Minimal local menu item type for the VerticalMenu
type MenuItemTypeLocal = {
  key: string
  label: string
  url?: string
  parentKey?: string
  icon?: IconType
  isTitle?: boolean
  children?: MenuItemTypeLocal[]
  // forward any unknown fields
  [k: string]: any
}

const InstructorLayout = ({ children }: ChildrenType) => {
  const { width } = useViewPort()
  const { isTrue: isOffCanvasMenuOpen, toggle: toggleOffCanvasMenu } = useToggle()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const [name, setName] = useState('Guest')
  const [role, setRole] = useState('Guest')
  const [email, setEmail] = useState('')



  
     useEffect(() => {
        if (!token) return
    
        fetch(`${baseURL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch profile')
            return res.json()
          })
          .then((profile) => {
            console.log("profile",profile)
            setName(profile.fullName || 'Guest')
            setRole(profile.role)
    
            if (profile.email) {
              setEmail(profile.email)
            }
          })
          .catch((err) => {
            console.error('Error fetching profile:', err)
          })
      }, [token])

  return (
    <>
      <Suspense>
        <TopNavigationBar role={role}/>
      </Suspense>

      <main>
        {/* <Banner toggleOffCanvas={toggleOffCanvasMenu} /> */}
        <section className="pt-0 mt-3 mt-md-4">
          <Container fluid>
            <Row className="g-3 g-xl-4">
              <Col xl={2}>
                {width >= 1200 ? (
                  <VerticalMenu />
                ) : (
                  <Offcanvas show={isOffCanvasMenuOpen} placement="end" onHide={toggleOffCanvasMenu}>
                    <OffcanvasHeader className="bg-light" closeButton>
                      <OffcanvasTitle>Menu</OffcanvasTitle>
                    </OffcanvasHeader>
                    <OffcanvasBody className="p-3 p-xl-0">
                      <VerticalMenu />
                    </OffcanvasBody>
                  </Offcanvas>
                )}
              </Col>

              <Col xl={10}>
                <div className="main-content-wrapper p-4 rounded-4 shadow-sm bg-light">
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
    </>
  )
}

/* -------- VerticalMenu (same mechanics as Student layout) -------- */

const VerticalMenu = () => {
  const { pathname } = useLocation()
  const { removeSession } = useAuthContext()

  // 1) Memoize source menu for stability
  const baseMenu: MenuItemTypeLocal[] = useMemo(() => {
    // If INSTRUCTOR_MENU_ITEMS is already nested, we keep as-is.
    return INSTRUCTOR_MENU_ITEMS as unknown as MenuItemTypeLocal[]
  }, [])

  // 2) Build a tree from baseMenu if needed (handles flat lists using parentKey)
  const tree = useMemo(() => {
    const hasNested = baseMenu.some((it) => Array.isArray(it.children) && it.children.length > 0)
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

  // 3) Collapsible open state
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({})

  const openKeysChanged = (a: Record<string, boolean>, b: Record<string, boolean>) => {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return true
    for (const k of aKeys) if (a[k] !== b[k]) return true
    return false
  }

  // 4) Auto-open parents that contain the current route
  useEffect(() => {
    const newOpen: Record<string, boolean> = {}

    const walk = (nodes: MenuItemTypeLocal[], parents: string[] = []) => {
      nodes.forEach((n) => {
        if (n.url && pathname === n.url) parents.forEach((p) => (newOpen[p] = true))
        if (n.children && n.children.length) walk(n.children, [...parents, n.key])
      })
    }

    walk(tree as MenuItemTypeLocal[])

    if (openKeysChanged(openKeys, { ...openKeys, ...newOpen })) {
      setOpenKeys((s) => ({ ...s, ...newOpen }))
    }
  }, [pathname, tree]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key: string) => setOpenKeys((s) => ({ ...s, [key]: !s[key] }))
  const isActive = (item: MenuItemTypeLocal) => !!(item.url && pathname === item.url)

  // 5) Render nodes
  const renderNode = (node: MenuItemTypeLocal) => {
    const Icon = node.icon
    const hasChildren = Array.isArray(node.children) && node.children.length > 0

    if (node.isTitle) {
      return (
        <div key={node.key} className="px-3 py-2 text-sm fw-semibold text-white-50">
          {node.label}
        </div>
      )
    }

    if (hasChildren) {
      const open = !!openKeys[node.key]
      return (
        <div key={node.key} className="mb-1">
          <button
            type="button"
            onClick={() => toggle(node.key)}
            className={clsx(
              'list-group-item list-group-item-action d-flex align-items-center justify-content-between',
              'px-3 py-2',
            )}
          >
            <div className="d-flex align-items-center">
              {Icon && <Icon className="me-2" />}
              <span>{node.label}</span>
            </div>

            <div
              className="ms-2"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>

          <Collapse in={open}>
            <div>
              <div className="ms-3">
                {(node.children || []).map((c) => renderNode(c))}
              </div>
            </div>
          </Collapse>
        </div>
      )
    }

    return (
      <Link
        key={node.key}
        to={node.url || '#'}
        className={clsx('list-group-item list-group-item-action d-flex align-items-center px-3 py-2', {
          active: isActive(node),
        })}
      >
        {Icon && <Icon className="me-2" />}
        <span>{node.label}</span>
      </Link>
    )
  }

  return (
    <div className="bg-dark border rounded-3 pb-0 p-3 w-100">
      <div className="list-group list-group-dark list-group-borderless collapse-list">
        {(tree as MenuItemTypeLocal[]).map((n) => renderNode(n))}

        {/* Sign out (fixed item at end) */}
        <Link className="list-group-item list-group-item-action d-flex align-items-center px-3 py-2 text-danger bg-danger-soft-hover" to="/auth/sign-in" onClick={removeSession}>
          <FaSignOutAlt className="fa-fw me-2" />
          <span>Sign Out</span>
        </Link>
      </div>
    </div>
  )
}

export default InstructorLayout

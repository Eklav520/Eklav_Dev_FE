import logoImg from '@/assets/images/logo-light.svg'
import AppMenu from '@/components/admin/AppMenu'
import { useAuthContext } from '@/context/useAuthContext'
import { useLayoutContext } from '@/context/useLayoutContext'
import useViewPort from '@/hooks/useViewPort'
import { ChildrenType } from '@/types/component-props'
import { lazy } from 'react'
import { Offcanvas, OffcanvasBody, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { BsGearFill, BsGlobe, BsPower } from 'react-icons/bs'

import { Link } from 'react-router-dom'

const NavbarTopbar = lazy(() => import('@/components/adminLayoutComponents/NavbarTopbar'))

const AdminLayout = ({ children }: ChildrenType) => {
  const { width } = useViewPort()

  const { appMenuControl } = useLayoutContext()
  const { removeSession } = useAuthContext()

  return (
    <main>
      <nav className="navbar sidebar navbar-expand-xl navbar-dark bg-dark">
        <div className="d-flex align-items-center">
          <Link className="navbar-brand" to="/">
            <img className="navbar-brand-item" src={logoImg} alt="logo" />
          </Link>
        </div>
        {width >= 1200 ? (
          <div className="sidebar-content d-flex flex-column bg-dark">
            <AppMenu />
            <div className="px-3 mt-auto pt-3">
              <div className="d-flex align-items-center justify-content-between text-primary-hover">
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Settings</Tooltip>}>
                  <Link className="h5 mb-0 text-body" to="/admin/admin-settings" data-bs-toggle="tooltip" data-bs-placement="top" title="Settings">
                    <BsGearFill />
                  </Link>
                </OverlayTrigger>
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Home</Tooltip>}>
                  <Link className="h5 mb-0 text-body" to="/" data-bs-toggle="tooltip" data-bs-placement="top" title="Home">
                    <BsGlobe />
                  </Link>
                </OverlayTrigger>
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Sign out</Tooltip>}>
                  <Link
                    className="h5 mb-0 text-body"
                    onClick={removeSession}
                    to="/auth/sign-in"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Sign outss">
                    <BsPower />
                  </Link>
                </OverlayTrigger>
              </div>
            </div>
          </div>
        ) : (
          <Offcanvas className="flex-row custom-scrollbar h-100 " show={appMenuControl.open} placement="start" onHide={appMenuControl.toggle}>
            <OffcanvasBody className="admin-offcanvas-menu d-flex flex-column bg-dark">
              <AppMenu />
              <div className="px-3 mt-auto pt-3">
                <div className="d-flex align-items-center justify-content-between text-primary-hover">
                  <Link className="h5 mb-0 text-body" to="/admin/admin-settings" data-bs-toggle="tooltip" data-bs-placement="top" title="Settings">
                    <BsGearFill />
                  </Link>
                  <Link className="h5 mb-0 text-body" to="/" data-bs-toggle="tooltip" data-bs-placement="top" title="Home">
                    <BsGlobe />
                  </Link>
                  <Link
                    className="h5 mb-0 text-body"
                    onClick={removeSession}
                    to="/auth/sign-in"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    title="Sign out">
                    <BsPower />
                  </Link>
                </div>
              </div>
            </OffcanvasBody>
          </Offcanvas>
        )}
      </nav>
      <div className="page-content">
        <NavbarTopbar />
        <div className="page-content-wrapper border">{children}</div>
      </div>
    </main>
  )
}
export default AdminLayout

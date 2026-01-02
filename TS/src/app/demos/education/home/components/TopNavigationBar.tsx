import TopNavbar from '@/components/TopNavbar'
import { useLayoutContext } from '@/context/useLayoutContext'
import type { LayoutState } from '@/types/context'
import AppMenu from '@/components/TopNavbar/components/AppMenu'

import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Container, Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { toSentenceCase } from '@/utils/change-casing'
import clsx from 'clsx'
import { BsGear, BsInfoCircle, BsPerson, BsPower, BsSearch } from 'react-icons/bs'
import { FaRegClock } from 'react-icons/fa'

import avatar1 from '@/assets/images/avatar/01.jpg'
import logo from '@/assets/images/logo.svg'
import logoLight from '@/assets/images/logo-light.svg'
import { useAuthContext } from '@/context/useAuthContext'

const TopNavigationBar = () => {
  const { appMenuControl, changeTheme, theme } = useLayoutContext()

  type ThemeModeType = {
    theme: LayoutState['theme']
    icon: ReactNode
  }

  const themeModes: ThemeModeType[] = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          fill="currentColor"
          className="bi bi-sun fa-fw mode-switch"
          viewBox="0 0 16 16">
          <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
          <use href="#" />
        </svg>
      ),
      theme: 'light',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          fill="currentColor"
          className="bi bi-moon-stars fa-fw mode-switch"
          viewBox="0 0 16 16">
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z" />
          <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z" />
          <use href="#" />
        </svg>
      ),
      theme: 'dark',
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          fill="currentColor"
          className="bi bi-circle-half fa-fw mode-switch"
          viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
          <use href="#" />
        </svg>
      ),
      theme: 'auto',
    },
  ]

  const { removeSession } = useAuthContext()

  return (
    <TopNavbar>
      <Container>
        <Link className="navbar-brand me-0" to="/">
          <img height={36} width={170} className="light-mode-item navbar-brand-item" src={logo} alt="logo" />
          <img height={36} width={170} className="dark-mode-item navbar-brand-item" src={logoLight} alt="logo" />
        </Link>
        <button
          onClick={appMenuControl.toggle}
          className="navbar-toggler ms-auto"
          type="button"
          data-bs-toggle="collapse"
          aria-expanded={appMenuControl.open}
          aria-label="Toggle navigation">
          <span className="navbar-toggler-animation">
            <span />
            <span />
            <span />
          </span>
        </button>
        <AppMenu mobileMenuOpen={appMenuControl.open} menuClassName="mx-auto" showExtraPages />
        <Dropdown className="nav nav-item   nav-search px-1 px-lg-3">
          <DropdownToggle
            as="a"
            className="nav-link arrow-none"
            role="button"
            id="navSearch"
            data-bs-toggle="dropdown"
            aria-expanded="true"
            data-bs-auto-close="outside"
            data-bs-display="static">
            <BsSearch className="fs-4"> </BsSearch>
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end shadow rounded p-2" aria-labelledby="navSearch" data-bs-popper="none">
            <form className="input-group">
              <input className="form-control border-primary" type="search" placeholder="Search..." aria-label="Search" />
              <button className="btn btn-primary m-0" type="submit">
                Search
              </button>
            </form>
            <ul className="list-group list-group-borderless p-2 small">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span className="fw-bold">Recent Searches:</span>
                <button className="btn btn-sm btn-link mb-0 px-0">Clear all</button>
              </li>
              <li className="list-group-item text-primary-hover text-truncate">
                <a href="#" className="text-body">

                  <FaRegClock className="me-1" />
                  Digital marketing course for Beginner
                </a>
              </li>
              <li className="list-group-item text-primary-hover text-truncate">
                <a href="#" className="text-body">

                  <FaRegClock className="me-1" />
                  Customer Life cycle
                </a>
              </li>
              <li className="list-group-item text-primary-hover text-truncate">
                <a href="#" className="text-body">

                  <FaRegClock className="me-1" />
                  What is Search
                </a>
              </li>
              <li className="list-group-item text-primary-hover text-truncate">
                <a href="#" className="text-body">

                  <FaRegClock className="me-1" />
                  Facebook ADS
                </a>
              </li>
            </ul>
          </DropdownMenu>
        </Dropdown>
        <Dropdown drop="start" className="ms-1 ms-lg-0">
          <DropdownToggle
            as={Link}
            className="avatar avatar-sm p-0 arrow-none"
            to="#"
            id="profileDropdown"
            role="button"
            data-bs-auto-close="outside"
            data-bs-display="static"
            data-bs-toggle="dropdown"
            aria-expanded="false">
            <img className="avatar-img rounded-circle" src={avatar1} alt="avatar" />
          </DropdownToggle>
          <DropdownMenu as="ul" className="dropdown-animation dropdown-menu-end shadow pt-3" aria-labelledby="profileDropdown">
            <li className="px-3 mb-3">
              <div className="d-flex align-items-center">
                <div className="avatar me-3">
                  <img className="avatar-img rounded-circle shadow" src={avatar1} alt="avatar" />
                </div>
                <div>
                  <a className="h6" href="#">
                    Lori Ferguson
                  </a>
                  <p className="small m-0">example@gmail.com</p>
                </div>
              </div>
            </li>
            <li>

              <DropdownDivider />
            </li>
            <li>
              <DropdownItem href="#">
                <BsPerson className="fa-fw me-2" />
                Edit Profile
              </DropdownItem>
            </li>
            <li>
              <DropdownItem href="#">
                <BsGear className="fa-fw me-2" />
                Account Settings
              </DropdownItem>
            </li>
            <li>
              <DropdownItem href="#">
                <BsInfoCircle className="fa-fw me-2" />
                Help
              </DropdownItem>
            </li>
            <li>
              <a className="dropdown-item bg-danger-soft-hover" onClick={removeSession}>
                <BsPower className="fa-fw me-2" />
                Sign OutSS
              </a>
            </li>
            <li>

              <DropdownDivider />
            </li>
            <li>
              <div className="bg-light dark-mode-switch theme-icon-active d-flex align-items-center p-1 rounded mt-2">
                {themeModes.map((mode, idx) => (
                  <button
                    onClick={() => changeTheme(mode.theme)}
                    data-bs-theme-value={mode.theme}
                    type="button"
                    className={clsx('btn btn-sm mb-0', { active: theme === mode.theme })}
                    key={mode.theme + idx}>
                    {mode.icon}
                    {toSentenceCase(mode.theme)}
                  </button>
                ))}
              </div>
            </li>
          </DropdownMenu>
        </Dropdown>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar

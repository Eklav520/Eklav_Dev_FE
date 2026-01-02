import TopNavbar from '@/components/TopNavbar'

import { Col, Container, Dropdown, DropdownItem, DropdownToggle } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import logoLight from '@/assets/images/logo-light.svg'
import logo from '@/assets/images/logo.svg'
import { FaChevronDown, FaGlobe, FaSearch, FaShoppingCart, FaSignInAlt } from 'react-icons/fa'

import { CATEGORY_MENU_ITEMS } from '@/assets/data/menu-items'
import grFlag from '@/assets/images/flags/gr.svg'
import spFlag from '@/assets/images/flags/sp.svg'
import ukFlag from '@/assets/images/flags/uk.svg'
import { MenuItem, MenuItemWithChildren } from '@/components/TopNavbar/components/AppMenu'
import clsx from 'clsx'
import { Fragment } from 'react'

const TopNavigationBar = () => {
  return (
    <TopNavbar className="navbar-transparent">
      <Container>
        <Link className="navbar-brand" to="/">
          <img width={170} height={36} className="light-mode-item navbar-brand-item" src={logo} alt="logo" />
          <img className="dark-mode-item navbar-brand-item" src={logoLight} alt="logo" />
        </Link>
        <button
          className="navbar-toggler ms-auto"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarCollapse"
          aria-controls="navbarCollapse"
          aria-expanded="true"
          aria-label="Toggle navigation">
          <span className="me-2">
            <FaSearch className="fs-5" />
          </span>
        </button>
        <ul className="navbar-nav navbar-nav-scroll dropdown-clickable d-sm-none d-xl-block">
          {CATEGORY_MENU_ITEMS.map((item, idx) => {
            return (
              <Fragment key={item.key + idx}>
                {item.children ? (
                  <MenuItemWithChildren
                    item={item}
                    level={1}
                    itemClassName="nav-item dropdown-menu-shadow-stacked"
                    linkClassName={clsx('arrow-none nav-link rounded-3 text-primary px-3 py-3 py-xl-0')}
                  />
                ) : (
                  <MenuItem item={item} level={1} />
                )}
              </Fragment>
            )
          })}
        </ul>
        <div className="navbar-collapse collapse" id="navbarCollapse">
          <Col xl={8}>
            <div className="nav my-3 my-xl-0 px-4 flex-nowrap align-items-center">
              <div className="nav-item w-100">
                <form className="rounded position-relative">
                  <input className="form-control pe-5 bg-secondary bg-opacity-10 border-0" type="search" placeholder="Search" aria-label="Search" />
                  <button className="btn btn-link bg-transparent px-2 py-0 position-absolute top-50 end-0 translate-middle-y" type="button">
                    <FaSearch className="fs-6 text-primary" />
                  </button>
                </form>
              </div>
            </div>
          </Col>
        </div>
        <div className="navbar-nav position-relative overflow-visible me-3">
          <Link to="#" className="nav-link">

            <FaShoppingCart className="fs-5" />
          </Link>
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-circle bg-success mt-xl-2 ms-n1">
            5<span className="visually-hidden">unread messages</span>
          </span>
        </div>
        <ul className="navbar-nav navbar-nav-scroll me-3 d-none d-xl-block">
          <Dropdown className="nav-item">
            <DropdownToggle
              as="a"
              className="nav-link dropdown-toggle arrow-none"
              href="#"
              id="language"
              data-bs-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false">
              <FaGlobe className="me-2" />
              <span className="d-none d-lg-inline-block">Language</span>
              <FaChevronDown className="ms-1" size={10} />
            </DropdownToggle>
            <ul className="dropdown-menu dropdown-menu-end min-w-auto" aria-labelledby="language">
              <li>
                <DropdownItem href="#">
                  <img alt="uk" height={12} width={18} className="fa-fw me-2" src={ukFlag} />
                  English
                </DropdownItem>
              </li>
              <li>
                <DropdownItem href="#">
                  <img alt="gr" height={12} width={18} className="fa-fw me-2" src={grFlag} />
                  German
                </DropdownItem>
              </li>
              <li>
                <DropdownItem href="#">
                  <img alt="sp" height={12} width={18} className="fa-fw me-2" src={spFlag} />
                  French
                </DropdownItem>
              </li>
            </ul>
          </Dropdown>
        </ul>
        <div className="navbar-nav d-none d-lg-inline-block">
          <button className="btn btn-danger-soft mb-0">
            <FaSignInAlt className="me-2" />
            Sign Up
          </button>
        </div>
      </Container>
    </TopNavbar>
  )
}

export default TopNavigationBar

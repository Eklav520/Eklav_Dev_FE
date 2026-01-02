import { Card, CardBody, CardFooter, CardHeader, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { notificationsData } from '../data'

import { Link } from 'react-router-dom'
import { BsBell } from 'react-icons/bs'

const NotificationDropdown = () => {
  return (
    <Dropdown drop="start" className="nav-item ms-0 ms-md-3">
      <DropdownToggle as="a" className="btn btn-light btn-round mb-0 arrow-none flex-centered" role="button">
        <BsBell className="fa-fw" />
      </DropdownToggle>
      <span className="notif-badge animation-blink" />
      <DropdownMenu className="dropdown-animation dropdown-menu-end dropdown-menu-size-md p-0 shadow-lg border-0">
        <Card className="bg-transparent">
          <CardHeader className="bg-transparent border-bottom py-4 d-flex justify-content-between align-items-center">
            <h6 className="m-0">
              Notifications <span className="badge bg-danger bg-opacity-10 text-danger ms-2">2 new</span>
            </h6>
            <a className="small" href="#">
              Clear all
            </a>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="list-group list-unstyled list-group-flush">
              {notificationsData.map((notification, idx) => (
                <li key={idx}>
                  <Link to="" className="list-group-item-action border-0 border-bottom d-flex p-3">
                    <div className="me-3">
                      <div className="avatar avatar-md">
                        <img className="avatar-img rounded-circle" src={notification.avatar} alt="avatar" />
                      </div>
                    </div>
                    <div>
                      <h6 className="mb-1">{notification.title}</h6>
                      <p className="small text-body m-0">{notification.description}</p>
                      <u className="small">View detail</u>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
          <CardFooter className="bg-transparent border-0 py-3 text-center position-relative">
            <Link to="" className="stretched-link">
              See all incoming activity
            </Link>
          </CardFooter>
        </Card>
      </DropdownMenu>
    </Dropdown>
  )
}

export default NotificationDropdown

import { Col, Nav, NavItem, NavLink, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import { FaBell, FaCog, FaEnvelopeOpenText, FaGlobe, FaSlidersH, FaUserCircle } from 'react-icons/fa'
import AccountSetting from './AccountSetting'
import EmailSettings from './EmailSettings'
import GeneralSettings from './GeneralSettings'
import NotificationsSettings from './NotificationsSettings'
import SocialMediaSettings from './SocialMediaSettings'
import WebsiteSettings from './WebsiteSettings'

const AllSettings = () => {
  return (
    <>
      <Row>
        <Col xs={12} className="mb-3">
          <h1 className="h3 mb-2 mb-sm-0">Admin Settings</h1>
        </Col>
      </Row>
      <Row className="g-4">
        <TabContainer defaultActiveKey={'tab-1'}>
          <Col xl={3}>
            <Nav className="nav-pills nav-tabs-bg-dark flex-column">
              <NavItem>

                <NavLink data-bs-toggle="tab" eventKey="tab-1">
                  <FaGlobe className="me-2" />
                  Website Settings
                </NavLink>
              </NavItem>
              <NavItem>

                <NavLink data-bs-toggle="tab" eventKey="tab-2">
                  <FaCog className="me-2" />
                  General Settings
                </NavLink>
              </NavItem>
              <NavItem>

                <NavLink data-bs-toggle="tab" eventKey="tab-3">
                  <FaBell className="me-2" />
                  Notification Settings
                </NavLink>
              </NavItem>
              <NavItem>

                <NavLink data-bs-toggle="tab" eventKey="tab-4">
                  <FaUserCircle className="me-2" />
                  Account Settings
                </NavLink>
              </NavItem>
              <NavItem>

                <NavLink data-bs-toggle="tab" eventKey="tab-5">
                  <FaSlidersH className="me-2" />
                  Social Settings
                </NavLink>
              </NavItem>
              <NavItem>

                <NavLink className="mb-0" data-bs-toggle="tab" eventKey="tab-6">
                  <FaEnvelopeOpenText className="me-2" />
                  Email Settings
                </NavLink>
              </NavItem>
            </Nav>
          </Col>
          <Col xl={9}>
            <TabContent>
              <TabPane eventKey="tab-1">
                <WebsiteSettings />
              </TabPane>
              <TabPane eventKey="tab-2">
                <GeneralSettings />
              </TabPane>
              <TabPane eventKey="tab-3">
                <NotificationsSettings />
              </TabPane>
              <TabPane eventKey="tab-4">
                <AccountSetting />
              </TabPane>
              <TabPane eventKey="tab-5">
                <SocialMediaSettings />
              </TabPane>
              <TabPane eventKey="tab-6">
                <EmailSettings />
              </TabPane>
            </TabContent>
          </Col>
        </TabContainer>
      </Row>
    </>
  )
}

export default AllSettings

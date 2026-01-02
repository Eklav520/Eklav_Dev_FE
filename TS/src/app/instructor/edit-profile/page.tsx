import PageMetaData from '@/components/PageMetaData'
import { Row } from 'react-bootstrap'
import EditProfile from './components/EditProfile'
import EmailChange from './components/EmailChange'
import LinkedAccount from './components/LinkedAccount'
import PasswordChange from './components/PasswordChange'
import SocialMedia from './components/SocialMedia'

const EditProfilePage = () => {
  return (
    <>
      <PageMetaData title="Edit Profile" />
      <EditProfile />
      {/* <Row className="g-4 mt-3">
        <LinkedAccount />
        <SocialMedia />
        <EmailChange />
        <PasswordChange />
      </Row> */}
    </>
  )
}

export default EditProfilePage

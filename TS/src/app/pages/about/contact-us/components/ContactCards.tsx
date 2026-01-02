import { Card, Col, Container, Row } from 'react-bootstrap'
import { FaMapMarkerAlt, FaPhoneAlt, FaRegEnvelope } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import { contactInfos, type ContactInfo } from '../data'

import map from '@/assets/images/element/map.svg'

const ContactCard = ({ contact }: { contact: ContactInfo }) => {
  const { address, email, name, phone } = contact
  return (
    <Card className={'card-body  shadow py-5 text-center h-100'}>
      <h5 className="mb-3">{name}</h5>
      <ul className="list-inline mb-0">
        <li className="list-item mb-3  h6 fw-light">
          <Link to="">

            <FaMapMarkerAlt className="fa-fw me-2 mt-1" />
            {address}
          </Link>
        </li>
        <li className="list-item mb-3 h6 fw-light">
          <Link to="">

            <FaPhoneAlt className="fa-fw me-2" />
            {phone}
          </Link>
        </li>
        <li className="list-item mb-0 h6 fw-light">
          <Link to="">

            <FaRegEnvelope className="fa-fw me-2" />
            {email}
          </Link>
        </li>
      </ul>
    </Card>
  )
}

const ContactCards = () => {
  return (
    <section className="pt-5 pb-0" style={{ backgroundImage: `url(${map})`, backgroundPosition: 'center left', backgroundSize: 'cover' }}>
      <Container>
        <Row>
          <Col lg={8} xl={6} className="text-center mx-auto">
            <h6 className="text-primary">Contact us</h6>
            <h1 className="mb-4">We&apos;re here to help!</h1>
          </Col>
        </Row>
        <Row className="g-4 g-md-5 mt-0 mt-lg-3">
          <Col lg={4} className="mt-lg-0">
            <Card className="card-body bg-primary shadow py-5 text-center h-100">
              <h5 className="text-white mb-3">Customer Support</h5>
              <ul className="list-inline mb-0">
                <li className="list-item mb-3">
                  <Link to="" className="text-white">

                    <FaMapMarkerAlt className="fa-fw  me-2 mt-1" />
                    Chicago HQ Estica Cop. Macomb, MI 48042
                  </Link>
                </li>
                <li className="list-item mb-3">
                  <Link to="" className="text-white">

                    <FaPhoneAlt className="fa-fw  me-2" />
                    (423) 733-8222
                  </Link>
                </li>
                <li className="list-item mb-0">
                  <Link to="" className="text-white">

                    <FaRegEnvelope className="fa-fw  me-2" />
                    example@email.com
                  </Link>
                </li>
              </ul>
            </Card>
          </Col>

          {contactInfos.map((contact, idx) => (
            <Col lg={4} className="mt-lg-0" key={idx}>
              <ContactCard contact={contact} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
export default ContactCards

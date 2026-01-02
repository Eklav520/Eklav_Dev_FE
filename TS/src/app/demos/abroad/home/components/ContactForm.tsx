import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import TextFormInput from '@/components/form/TextFormInput'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { BsWhatsapp } from 'react-icons/bs'
import { FaGlobe, FaTty } from 'react-icons/fa'

const ContactForm = () => {
  const contactFormSchema = yup.object({
    name: yup.string().required('Please enter your first name'),
    whatsappNo: yup.number().required('Please enter your whatsapp number'),
    email: yup.string().email('Please enter valid email').required('Please enter your email'),
    phoneNo: yup.number().required('Please enter your phone number'),
    message: yup.string().required('Please enter your message'),
  })
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(contactFormSchema),
  })
  return (
    <section id="contact-form" className="position-relative overflow-hidden pt-0 pt-md-5">
      <Container>
        <Row className="g-4 g-lg-5 align-items-center">
          <Col lg={6}>
            <h2 className="h1 mb-3">Get in touch with us</h2>
            <p>Claim your free 10-minute phone call to see if we are right for your kid.</p>
            <Row className="mt-5">
              <Col sm={6} lg={12} xl={6} className="mb-5">
                <Card className="card-body shadow">
                  <div className="icon-lg bg-success text-white rounded-circle position-absolute top-0 start-100 translate-middle ms-n6">
                    <BsWhatsapp />
                  </div>
                  <h6>WhatsApp number</h6>
                  <p className="h6 mb-0">
                    <a href="#" className="text-primary-hover mb-0 fw-light stretched-link">
                      +256 359 556
                    </a>
                  </p>
                </Card>
              </Col>
              <Col sm={6} lg={12} xl={6} className="mb-5 mb-xl-0">
                <Card className="card-body shadow">
                  <div className="icon-lg bg-purple text-white rounded-circle position-absolute top-0 start-100 translate-middle ms-n6">
                    <FaTty />
                  </div>
                  <h6>Telephone</h6>
                  <p className="h6 mb-0">
                    <a href="#" className="text-primary-hover mb-0 fw-light stretched-link">
                      +123 456 789
                    </a>
                  </p>
                </Card>
              </Col>
              <Col xs={12} className="mb-5 mb-xl-0">
                <Card className="card-body shadow">
                  <div className="icon-lg bg-orange text-white rounded-circle position-absolute top-0 start-100 translate-middle ms-n6">
                    <FaGlobe />
                  </div>
                  <h6>Address</h6>
                  <p className="h6 mb-0">
                    <a href="#" className="text-primary-hover mb-0 fw-light stretched-link">
                      2492 Centennial NW, Acworth, GA, 30102
                    </a>
                  </p>
                </Card>
              </Col>
            </Row>
          </Col>
          <Col lg={6}>
            <Card className="card card-body shadow p-4 p-sm-5 position-relative">
              <form className="row g-3 position-relative" onSubmit={handleSubmit(() => {})}>
                <TextFormInput name="name" label="Name *" control={control} containerClassName="col-md-6 col-lg-12 col-xl-6" />
                <TextFormInput name="phoneNo" label="Phone Number *" control={control} containerClassName="col-md-6 col-lg-12 col-xl-6" />
                <TextFormInput name="whatsappNo" label="Whatsapp number *" control={control} containerClassName="col-md-6 col-lg-12 col-xl-6" />
                <TextFormInput name="email" type="email" label="Email *" control={control} containerClassName="col-md-6 col-lg-12 col-xl-6" />
                <Col xs={12}>
                  <label className="form-label">Contact Purpose</label>
                  <ChoicesFormInput className="form-select js-choice z-index-9" aria-label=".form-select-sm">
                    <option>Contact Purpose</option>
                    <option>IELTS</option>
                    <option>PTE</option>
                    <option>GRE</option>
                    <option>Study In CANADA</option>
                    <option>Study In U.K.</option>
                    <option>Get In Touch With Our Executive</option>
                  </ChoicesFormInput>
                </Col>
                <TextAreaFormInput name="message" label="Message *" rows={3} control={control} containerClassName="col-12" />
                <Col xs={12}>
                  <Button variant="primary" type="submit" className="mb-0">
                    Send Inquiry
                  </Button>
                </Col>
              </form>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default ContactForm

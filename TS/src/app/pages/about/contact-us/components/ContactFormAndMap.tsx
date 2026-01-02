import { Button, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaBasketballBall, FaFacebookSquare, FaInstagram, FaLinkedinIn, FaPinterest, FaTwitter } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

import contactImg from '@/assets/images/element/contact.svg'
import TextFormInput from '@/components/form/TextFormInput'
import TextAreaFormInput from '@/components/form/TextAreaFormInput'
import { yupResolver } from '@hookform/resolvers/yup'

const ContactFormAndMap = () => {
  const contactFormSchema = yup.object({
    name: yup.string().required('Please enter your name'),
    email: yup.string().email('Please enter valid email').required('Please enter your email'),
    message: yup.string().required('Please enter your message'),
  })

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(contactFormSchema),
  })

  return (
    <>
      <section>
        <Container>
          <Row className="g-4 g-lg-0 align-items-center">
            <Col md={6} className="align-items-center text-center">
              <img src={contactImg} className="h-400px" alt="contact-image" />
              <div className="d-sm-flex align-items-center justify-content-center mt-2 mt-sm-4">
                <h5 className="mb-0">Follow us on:</h5>
                <ul className="list-inline mb-0 ms-sm-2">
                  <li className="list-inline-item">

                    <Link className="fs-5 me-1 text-facebook" to="">
                      <FaFacebookSquare className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="fs-5 me-1 text-instagram" to="">
                      <FaInstagram className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="fs-5 me-1 text-twitter" to="">
                      <FaTwitter className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="fs-5 me-1 text-linkedin" to="">
                      <FaLinkedinIn className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="fs-5 me-1 text-dribbble" to="">
                      <FaBasketballBall className="fa-fw" />
                    </Link>
                  </li>
                  <li className="list-inline-item">

                    <Link className="fs-5 me-1 text-pinterest" to="">
                      <FaPinterest className="fa-fw" />
                    </Link>
                  </li>
                </ul>
              </div>
            </Col>
            <Col md={6}>
              <h2 className="mt-4 mt-md-0">Let&apos;s talk</h2>
              <p>To request a quote or want to meet up for coffee, contact us directly or fill out the form and we will get back to you promptly</p>
              <form onSubmit={handleSubmit(() => {})}>
                <TextFormInput
                  name="name"
                  label="Your name *"
                  control={control}
                  className="form-control-lg"
                  containerClassName="mb-4 bg-light-input"
                />
                <TextFormInput
                  name="email"
                  type="email"
                  label="Email address *"
                  control={control}
                  className="form-control-lg"
                  containerClassName="mb-4 bg-light-input"
                />
                <TextAreaFormInput name="message" label="Message *" rows={4} control={control} containerClassName="mb-4 bg-light-input" />
                <div className="d-grid">
                  <Button variant="primary" size="lg" className="mb-0" type="submit">
                    Send Message
                  </Button>
                </div>
              </form>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="pt-0">
        <Container>
          <Row>
            <Col xs={12}>
              <iframe
                className="w-100 h-400px grayscale rounded"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878428698!3d40.74076684379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sGoogle!5e0!3m2!1sen!2sin!4v1586000412513!5m2!1sen!2sin"
                height={500}
                style={{ border: 0 }}
                aria-hidden="false"
                tabIndex={0}
              />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  )
}
export default ContactFormAndMap

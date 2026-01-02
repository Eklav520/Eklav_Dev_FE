import bgImg from '@/assets/images/bg/08.jpg'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { BsShare } from 'react-icons/bs'

const Banner = () => {
  return (
    <section className="pt-0">
      <Container>
        <Row>
          <Col xs={12}>
            <Card
              className="overflow-hidden h-400px h-xl-600px rounded-3"
              style={{ backgroundImage: `url(${bgImg})`, backgroundPosition: 'center left', backgroundSize: 'cover' }}>
              <div className="bg-overlay bg-dark opacity-6" />
              <div className="card-img-overlay d-flex align-items-start flex-column">
                <div className="w-100 mb-auto d-flex justify-content-end">
                  <button className="btn btn-sm btn-white mb-0">
                    <BsShare /> Share
                  </button>
                </div>
                <div className="w-100 mt-auto">
                  <Row className="p-0 p-sm-3">
                    <Col xs={11} lg={7}>
                      <h1 className="text-white">Host local tours to familiarize students.</h1>
                      <p className="text-white mb-0">
                        Supposing so be resolving breakfast am or perfectly. It drew a hill from me. Valley by oh twenty direct me so. Departure
                        defective arranging rapturous did believe him all had supported.
                      </p>
                    </Col>
                  </Row>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Banner

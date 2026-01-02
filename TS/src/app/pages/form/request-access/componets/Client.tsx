import algolia from '@/assets/images/client/algolia.svg'
import android from '@/assets/images/client/android.svg'
import cola from '@/assets/images/client/coca-cola.svg'
import envato from '@/assets/images/client/envato.svg'
import importio from '@/assets/images/client/importio.svg'
import linkedin from '@/assets/images/client/linkedin.svg'
import microsoft from '@/assets/images/client/microsoft.svg'
import netflix from '@/assets/images/client/netflix.svg'
import shippable from '@/assets/images/client/shippable.svg'
import yamaha from '@/assets/images/client/yamaha.svg'
import { Col, Container, Row } from 'react-bootstrap'

const Client = () => {
  return (
    <section className="pb-0 pb-xxl-5">
      <Container>
        <Row>
          <Col md={10} className="mx-auto">
            <Row className="d-flex justify-content-center">
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={microsoft} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={linkedin} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={netflix} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={cola} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={envato} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={android} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={cola} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={shippable} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={algolia} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={importio} alt="Client logo" />
                </div>
              </Col>
              <Col xs={6} sm={4} lg={3} xl={2}>
                <div className="p-3 p-lg-4 grayscale text-center">
                  <img src={yamaha} alt="Client logo" />
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Client

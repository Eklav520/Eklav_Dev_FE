import { Col, Container, Row } from 'react-bootstrap'

import client1 from '@/assets/images/client/coca-cola.svg'
import client2 from '@/assets/images/client/android.svg'
import client3 from '@/assets/images/client/envato.svg'
import client4 from '@/assets/images/client/microsoft.svg'
import client5 from '@/assets/images/client/netflix.svg'
import client6 from '@/assets/images/client/google.svg'
import client7 from '@/assets/images/client/linkedin.svg'
import TinySlider from '@/components/TinySlider'
import type { TinySliderSettings } from 'tiny-slider'

const Clients = () => {
  const clients = [client1, client2, client3, client4, client5, client6, client7]

  const clientSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 80,
    autoplayButton: false,
    autoplayTimeout: 2000,
    autoplayButtonOutput: false,
    nested: 'inner',
    autoplay: true,
    controls: false,
    edgePadding: 2,

    items: 6,
    nav: false,
    responsive: {
      1: {
        items: 2,
      },
      576: {
        items: 3,
      },
      768: {
        items: 4,
      },
      992: {
        items: 5,
      },
      1200: {
        items: 6,
      },
    },
  }

  return (
    <section className="pb-0 pb-md-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={12}>
            <div className="tiny-slider">
              <TinySlider settings={clientSliderSettings}>
                {clients.map((client, idx) => (
                  <div className="item" key={idx}>

                    <img className="grayscale" src={client} alt="client-logo" />
                  </div>
                ))}
              </TinySlider>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Clients

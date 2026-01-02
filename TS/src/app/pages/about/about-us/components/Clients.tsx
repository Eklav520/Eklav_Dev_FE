import { Col, Container, Row } from 'react-bootstrap'

import client1 from '@/assets/images/client/coca-cola.svg'
import client2 from '@/assets/images/client/android.svg'
import client3 from '@/assets/images/client/envato.svg'
import client4 from '@/assets/images/client/microsoft.svg'
import client5 from '@/assets/images/client/netflix.svg'
import client6 from '@/assets/images/client/importio.svg'
import client7 from '@/assets/images/client/linkedin.svg'
import client8 from '@/assets/images/client/shippable.svg'
import client9 from '@/assets/images/client/algolia.svg'
import client10 from '@/assets/images/client/yamaha.svg'

const Clients = () => {
  const clients = [client4, client7, client5, client1, client3, client2, client1, client8, client9, client6, client10]
  return (
    <section className="bg-light">
      <Container>
        <Row className="d-flex justify-content-center">
          {clients.map((client, idx) => (
            <Col xs={6} sm={4} lg={2} key={idx}>
              <div className="p-4 grayscale text-center">
                <img src={client} alt="client-image" />
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
export default Clients

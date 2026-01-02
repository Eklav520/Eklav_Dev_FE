import bgImg from '@/assets/images/bg/05.jpg'
import { Col, Container, Row } from 'react-bootstrap'

const Banner = () => {
  return (
    <section className="bg-light">
      <Container>
        <Row className="position-relative pb-4">
          <Col lg={8} className="position-relative">
            <h1>Study in Canada for international students</h1>
            <p>
              For who thoroughly her boy estimating conviction. Removed demands expense account in outward tedious do. Particular way thoroughly
              unaffected projection favorable Mrs can be projecting own. Thirty it matter enable become admire in giving.
            </p>
          </Col>
        </Row>
        <div
          className="h-300px mb-n9 rounded-3"
          style={{ backgroundImage: `url(${bgImg})`, backgroundPosition: 'center left', backgroundSize: 'cover' }}></div>
      </Container>
    </section>
  )
}

export default Banner

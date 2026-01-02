import { Card, Col, Container, Row } from 'react-bootstrap'

import { BsFullscreen } from 'react-icons/bs'
import GlightBox from '@/components/GlightBox'
import { useEffect } from 'react'
import { initIsotope } from '@/helpers/init-isotope'

import about16 from '@/assets/images/about/16.jpg'
import about17 from '@/assets/images/about/17.jpg'
import about18 from '@/assets/images/about/18.jpg'
import about19 from '@/assets/images/about/19.jpg'
import about20 from '@/assets/images/about/20.jpg'
import about21 from '@/assets/images/about/21.jpg'
import about22 from '@/assets/images/about/22.jpg'
import about23 from '@/assets/images/about/23.jpg'

const Portfolio = () => {
  const portfolioImages = [about19, about20, about17, about21, about18, about16, about23, about22]

  useEffect(() => {
    initIsotope()
  }, [])

  return (
    <section>
      <Container>
        <Row>
          <Col lg={8} className="mb-4">
            <h2>Our Lovely Movements</h2>
            <p className="mb-0">Perceived end knowledge certainly day sweetness why cordially</p>
          </Col>
        </Row>
        <Row className="g-4 filter-container overflow-hidden" data-isotope='{"layoutMode": "masonry"}'>
          {portfolioImages.map((image, idx) => (
            <Col xs={6} md={4} lg={3} className="grid-item" key={idx}>
              <Card className="overflow-hidden">
                <div className="card-overlay-hover">
                  <img src={image} className="rounded-3" alt="course image" />
                </div>
                <GlightBox className="card-element-hover position-absolute w-100 h-100" data-glightbox data-gallery="gallery" href={image}>
                  <BsFullscreen size={30} className="fs-6 text-white position-absolute top-50 start-50 translate-middle bg-dark rounded-3 p-2 lh-1" />
                </GlightBox>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Portfolio

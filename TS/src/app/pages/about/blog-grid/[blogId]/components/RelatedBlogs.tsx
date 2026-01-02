import { Link } from 'react-router-dom'
import { Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'
import TinySlider from '@/components/TinySlider'
import { getAllBlogs } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import type { BlogType } from '@/types/other'

const BlogCard = ({ blog }: { blog: BlogType }) => {
  const { title, image, createdAt } = blog
  return (
    <Card className="bg-transparent">
      <Row className="g-0">
        <Col md={4}>
          
        </Col>
        <Col md={8}>
          <CardBody>
            <CardTitle as="h6">
              <Link to="">{title}</Link>
            </CardTitle>
            <span className="small">{createdAt}</span>
          </CardBody>
        </Col>
      </Row>
    </Card>
  )
}

const RelatedBlogs = () => {
  const relatedBlogs = useFetchData(getAllBlogs)
  const blogSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 20,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaChevronLeft size={16} />), renderToString(<FaChevronRight size={16} />)],
    autoplay: false,
    mouseDrag: true,
    controls: true,
    edgePadding: 2,

    items: 3,
    nav: false,
    responsive: {
      1: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 2,
      },
      1200: {
        items: 3,
      },
    },
  }
  return (
    <section className="pt-0">
      <Container>
        <Row className="mb-4">
          <Col xs={12}>
            <h2 className="mb-0">You may also like</h2>
          </Col>
        </Row>
        <div className="tiny-slider arrow-round arrow-hover arrow-dark">
          {relatedBlogs && (
            <TinySlider className="tiny-slider-inner" settings={blogSliderSettings}>
              {relatedBlogs.slice(0, 4)?.map((blog, idx) => <BlogCard blog={blog} key={idx} />)}
            </TinySlider>
          )}
        </div>
      </Container>
    </section>
  )
}
export default RelatedBlogs

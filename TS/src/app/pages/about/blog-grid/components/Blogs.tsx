import { Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import Pagination from './Pagination'
import { Link } from 'react-router-dom'

import { getAllBlogs } from '@/helpers/data'
import type { BlogType } from '@/types/other'
import { useFetchData } from '@/hooks/useFetchData'

const BlogCard = ({ blog }: { blog: BlogType }) => {
  const { category, createdAt, description, image, name, title } = blog
  return (
    <Card className="bg-transparent">
      <div className="overflow-hidden rounded-3">
        <div className="image-gallery">
          {image.map((img, i) => (
            <img key={i} src={img} className="card-img" alt="course image" />
          ))}
        </div>
        {/* <img src={image[0]} className="card-img" alt="course image" /> */}
        <div className="bg-overlay bg-dark opacity-4" />
        <div className="card-img-overlay d-flex align-items-start p-3">
          <span role="button" className={`badge text-bg-${category.variant}`}>
            {category.name}
          </span>
        </div>
      </div>
      <CardBody>
        <CardTitle>
          <Link to="">{title}</Link>
        </CardTitle>
        <p className="text-truncate-2">{description}</p>
        <div className="d-flex justify-content-between">
          <h6 className="mb-0">
            <Link to="">{name}</Link>
          </h6>
          <span className="small">{createdAt}</span>
        </div>
      </CardBody>
    </Card>
  )
}

const Blogs = () => {
  const allBlogs = useFetchData(getAllBlogs)
  return (
    <section className="position-relative pt-0 pt-lg-5">
      <Container>
        <Row className="g-4">
          {allBlogs?.map((blog, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <BlogCard blog={blog} />
            </Col>
          ))}
        </Row>
        <Pagination />
      </Container>
    </section>
  )
}
export default Blogs

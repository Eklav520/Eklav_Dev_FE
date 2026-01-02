import { Card, CardBody, CardTitle, Col, Container, Row } from 'react-bootstrap'
import Pagination from './Pagination'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { BlogType } from '@/types/other'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'

dayjs.extend(relativeTime)

const BlogCard = ({ blog }: { blog: BlogType }) => {
  const { category, description, image, name, title, createdAt } = blog
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const defaultImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title || 'Student')}&backgroundType=gradientLinear`
  const imageSrc = Array.isArray(image) && image.length > 0 ? `${baseURL}/uploads/${image[0]}` : defaultImage

  return (
    <Card className="bg-transparent shadow-sm h-100">
      <div className="overflow-hidden rounded-top" style={{ height: 180 }}>
        <img
          loading="lazy"
          src={imageSrc}
          onError={(e) => (e.currentTarget.src = defaultImage)}
          className="card-img-top object-fit-cover"
          alt={title || 'Blog image'}
          style={{ height: '100%', width: '100%', objectFit: 'cover', backgroundColor: '#f0f0f0' }}
        />
        <div className="card-img-overlay d-flex align-items-start p-2">
          <span className={`badge text-bg-${category.variant}`}>{category.name}</span>
        </div>
      </div>

      <CardBody>
        <CardTitle>
          <Link to={`/pages/about/blog-grid/${blog._id}`} className="text-decoration-none">
            {title}
          </Link>
        </CardTitle>
        {/* <p className="text-truncate-2">{description}</p> */}
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 text-primary">{name}</h6>
          <span className="small text-muted">{dayjs(createdAt).fromNow()}</span>
        </div>
      </CardBody>
    </Card>
  )
}

const Blogs = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [blogs, setBlogs] = useState<BlogType[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 8

  const totalPages = Math.ceil(total / limit)

  useEffect(() => {
    const fetchBlogs = async () => {
      const res = await fetch(`${baseURL}/blogs?page=${currentPage}&limit=${limit}`)
      const data = await res.json()
      setBlogs(data.blogs)
      setTotal(data.total)
    }
    fetchBlogs()
  }, [currentPage])

  return (
    <section className="position-relative pt-2 pt-lg-5">
      <Container fluid>
        <Row className="g-4">
          {blogs.map((blog, idx) => (
            <Col sm={6} lg={4} xl={3} key={idx}>
              <BlogCard blog={blog} />
            </Col>
          ))}
        </Row>

        <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-4 pt-2">
          <p className="mb-0 text-start ms-3">
            Showing page {currentPage} of {totalPages}
          </p>

          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                    <FaAngleLeft className="icons-center" />
                  </button>
                </li>

                {[...Array(totalPages)].map((_, idx) => (
                  <li key={idx} className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                      {idx + 1}
                    </button>
                  </li>
                ))}

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                    <FaAngleRight className="icons-center" />
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </Container>
    </section>
  )
}


export default Blogs

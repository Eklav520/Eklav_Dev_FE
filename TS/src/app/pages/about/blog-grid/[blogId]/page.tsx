import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Container, Spinner, Alert, Row, Col, Badge, Button } from 'react-bootstrap'
import type { BlogType } from '@/types/other'
import GLightbox from 'glightbox'
import 'glightbox/dist/css/glightbox.min.css'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Footer from '@/components/Footer'
dayjs.extend(relativeTime)

const BlogDetail = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { blogId } = useParams<{ blogId: string }>()
  const [blog, setBlog] = useState<BlogType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`${baseURL}/blogs/${blogId}`)
        if (!res.ok) throw new Error('Failed to fetch blog')
        const data = await res.json()
        setBlog(data)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    if (blogId) fetchBlog()
  }, [blogId])

  useEffect(() => {
    const lightbox = GLightbox({ selector: '.glightbox' })
    return () => lightbox.destroy()
  }, [blog])

  if (loading)
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    )

  if (error)
    return (
      <Alert variant="danger" className="mt-5 text-center">
        {error}
      </Alert>
    )

  if (!blog)
    return (
      <Alert variant="warning" className="mt-5 text-center">
        Blog not found
      </Alert>
    )

  const images: string[] = Array.isArray(blog.image) ? blog.image : blog.image ? [blog.image] : []

  return (
    <Container fluid className="py-5" data-bs-theme="auto">
      <div className="p-4 p-md-5 rounded shadow-sm bg-body text-body">
        {/* Title & Category */}
        <Row className="align-items-center mb-4">
          <div className="d-flex align-items-center mb-3">
            <h4 className="mb-0 fw-bold me-1">Title :</h4>
            <h4 className="mb-0 text-primary">{blog.title}</h4>
          </div>
          <Col xs="auto">
            {blog.category?.name && (
              <Badge bg={blog.category.variant || 'secondary'} className="fs-6 px-3 py-2 text-uppercase">
                {blog.category.name}
              </Badge>
            )}
          </Col>
        </Row>

        {/* Author & Date */}
        <div className="mb-3 text-muted">
          <strong>Created By :</strong> {blog.name} | {dayjs(blog.createdAt).fromNow()}
        </div>

        {/* Image Gallery */}
        <div className="mb-4 d-flex flex-wrap gap-3">
          {images.length > 0 ? (
            images.map((img, index) => (
              <a key={index} href={`${baseURL}/uploads/${img}`} className="glightbox" data-gallery="blog-gallery">
                <img
                  src={`${baseURL}/uploads/${img}`}
                  alt={`blog-img-${index}`}
                  className="rounded"
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: 'cover',
                    border: '2px solid var(--bs-border-color)',
                  }}
                />
              </a>
            ))
          ) : (
            <img
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(blog.title || 'Blog')}`}
              alt="default-img"
              className="rounded"
              style={{ width: 200, height: 200 }}
            />
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <h5 className="fw-bold">Description :</h5>
          <div className="fs-5 lh-lg" dangerouslySetInnerHTML={{ __html: blog.description }} />
        </div>

        {/* Project File */}
        {blog.projectFile && (
          <div className="mt-4">
            <h5 className="fw-bold mb-2 text-success">Download Folder</h5>
            <a href={`${baseURL}/uploads/${blog.projectFile}`} download target="_blank" rel="noopener noreferrer" className="btn btn-outline-success">
              📁 Download Project File
            </a>
          </div>
        )}
      </div>
      <Footer className="pt-5 bg-light" />
    </Container>
  )
}

export default BlogDetail

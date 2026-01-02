import { useEffect, useState } from 'react'
import { Button, Col, Container, Row } from 'react-bootstrap'
import CreateBlogModal from './CreateBlogModal'
import Blogs from './Blogs'

interface BlogType {
  _id: string // <-- not `id`
  title: string
  description: string
  image: string
  name: string
  createdAt: string
  category: {
    name: string
    variant: string
  }
}

const Banner = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [showModal, setShowModal] = useState(false)
  const [blogs, setBlogs] = useState<BlogType[]>([])
  const [alertMsg, setAlertMsg] = useState('')
  const [showAlert, setShowAlert] = useState(false)

  const getAllBlogs = async () => {
    const response = await fetch(`${baseURL}/blogs`)
    if (!response.ok) {
      throw new Error('Failed to fetch blogs')
    }
    return await response.json()
  }

  const fetchBlogs = async () => {
    try {
      const response = await getAllBlogs()
      setBlogs(response)
    } catch (err) {
      console.error('Error fetching blogs:', err)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  const createBlog = async (newBlog: any) => {
    try {
      const response = await fetch(`${baseURL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBlog),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create blog')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating blog:', error)
      throw error
    }
  }

  const handleCreateBlog = async (newBlog: any) => {
    try {
      const formData = new FormData()
      formData.append('title', newBlog.title)
      formData.append('description', newBlog.description)
      formData.append('name', newBlog.name)
      formData.append('categoryName', newBlog.category.name)
      formData.append('categoryVariant', newBlog.category.variant)

      if (newBlog.imageFiles && newBlog.imageFiles.length > 0) {
        for (let i = 0; i < newBlog.imageFiles.length; i++) {
          formData.append('image', newBlog.imageFiles[i]) // repeat field name for array
        }
      }

      if (newBlog.projectFile) {
        formData.append('project', newBlog.projectFile)
      }

      const response = await fetch(`${baseURL}/blogs`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create blog')
      }

      await response.json()
      await fetchBlogs()
      setShowModal(false)
      setAlertMsg('✅ Blog successfully submitted!')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    } catch (err) {
      console.error('Failed to create blog:', err)
      setAlertMsg('❌ Failed to submit blog.')
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)
    }
  }

  return (
    <section className="py-2">
      {showAlert && (
        <div className="alert alert-success text-center mt-3" role="alert">
          {alertMsg}
        </div>
      )}
      <Container fluid>
        <Row className="position-relative">
          <Col lg={10} className="mx-auto text-center position-relative">
            <h1>Student Blog</h1>
          </Col>
          <Col>
            <Button onClick={() => setShowModal(true)}>Create Blog</Button>
          </Col>
        </Row>
      </Container>
      <CreateBlogModal show={showModal} handleClose={() => setShowModal(false)} onSubmit={handleCreateBlog} />
      <Blogs />
    </section>
  )
}

export default Banner

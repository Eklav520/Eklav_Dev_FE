import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'

interface Props {
  show: boolean
  handleClose: () => void
  onSubmit: (blog: any) => void
}

const CreateBlogModal: React.FC<Props> = ({ show, handleClose, onSubmit }) => {
  const [blog, setBlog] = useState({
    title: '',
    description: '',
    name: '',
    imageFiles: [] as File[], // multiple image files
    projectFile: null as File | null, // optional project file
    categoryName: '',
    categoryVariant: 'primary',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBlog((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    const formattedBlog = {
      title: blog.title,
      description: blog.description,
      name: blog.name,
      category: {
        name: blog.categoryName,
        variant: blog.categoryVariant,
      },
      imageFiles: blog.imageFiles,
      projectFile: blog.projectFile,
    }

    onSubmit(formattedBlog)
    handleClose()

    // Reset form
    setBlog({
      title: '',
      description: '',
      name: '',
      imageFiles: [],
      projectFile: null,
      categoryName: '',
      categoryVariant: 'primary',
    })
  }

  return (
    <Modal show={show} onHide={handleClose} fullscreen>
      <Modal.Header closeButton>
        <Modal.Title>Create Blog</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control name="title" value={blog.title} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-6">
            <Form.Label>Description</Form.Label>
            <ReactQuill
              theme="snow"
              value={blog.description}
              onChange={(value: any) =>
                setBlog((prev) => ({
                  ...prev,
                  description: value,
                }))
              }
              style={{ height: 300 }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Author Name</Form.Label>
            <Form.Control name="name" value={blog.name} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Control name="categoryName" value={blog.categoryName} onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Badge Variant</Form.Label>
            <Form.Select name="categoryVariant" value={blog.categoryVariant} onChange={handleChange}>
              <option value="primary">Primary</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Upload Images</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = (e.target as HTMLInputElement).files
                if (files) {
                  setBlog((prev) => ({ ...prev, imageFiles: Array.from(files) }))
                }
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Upload Mini Project (.zip, .pdf, .docx)</Form.Label>
            <Form.Control
              type="file"
              accept=".zip,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                setBlog((prev) => ({ ...prev, projectFile: file || null }))
              }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CreateBlogModal

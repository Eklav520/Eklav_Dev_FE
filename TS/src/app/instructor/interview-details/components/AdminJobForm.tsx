import React, { useState } from 'react'
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'


const AdminJobForm: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    experience: '',
    salary: '',
    location: '',
    skills: '',
    highlights: '', // ✅ HTML string
    jobType: '',
    domain: '',
    expiryDate: '',
    logo: '',
    tag: ''
  })

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${baseURL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          highlights: formData.highlights // ✅ send HTML directly
        })
      })

      if (!response.ok) throw new Error('Failed to create job')

      setSuccessMessage('Job posted successfully')

      // ✅ Reset form
      setFormData({
        title: '',
        company: '',
        experience: '',
        salary: '',
        location: '',
        skills: '',
        highlights: '',
        jobType: '',
        domain: '',
        expiryDate: '',
        logo: '',
        tag: ''
      })
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
      <h4 className="mb-3">Post New Job</h4>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Job Title</Form.Label>
            <Form.Control
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Company</Form.Label>
            <Form.Control
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Job Type</Form.Label>
            <Form.Select
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option>Internship</option>
              <option>Fresher</option>
              <option>Experienced</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Domain</Form.Label>
            <Form.Select
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              required
            >
              <option value="">Select</option>
              <option>Tech</option>
              <option>Non-Tech</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Experience</Form.Label>
            <Form.Control
              name="experience"
              value={formData.experience}
              placeholder="0–2 years"
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Salary</Form.Label>
            <Form.Control
              name="salary"
              value={formData.salary}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Expiry Date</Form.Label>
            <Form.Control
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tag</Form.Label>
            <Form.Control
              name="tag"
              value={formData.tag}
              placeholder="Women Preferred"
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* ✅ RICH TEXT EDITOR */}
      {/* ✅ RICH TEXT EDITOR */}
      <Form.Group className="mb-4">
        <Form.Label>Key Highlights</Form.Label>

        {/* Inline CSS ONLY for this editor */}
        <style>
          {`
      .job-quill-editor .ql-container {
        min-height: 240px;
      }

      .job-quill-editor .ql-editor {
        min-height: 220px;
        font-size: 0.95rem;
        line-height: 1.6;
      }
    `}
        </style>

        <div className="job-quill-editor">
          <ReactQuill
            theme="snow"
            value={formData.highlights}
            onChange={value =>
              setFormData(prev => ({ ...prev, highlights: value }))
            }
            placeholder="Add job highlights..."
            modules={{
              toolbar: [
                [{ header: [false, 2, 3] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
          />
        </div>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Skills (comma separated)</Form.Label>
        <Form.Control
          name="skills"
          value={formData.skills}
          placeholder="React, Node, MongoDB"
          onChange={handleChange}
        />
      </Form.Group>

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Spinner size="sm" className="me-2" />
            Posting...
          </>
        ) : (
          'Post Job'
        )}
      </Button>
    </Form>
  )
}

export default AdminJobForm

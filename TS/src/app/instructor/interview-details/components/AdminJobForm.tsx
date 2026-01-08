import React, { useState } from 'react'
import { Form, Button, Row, Col, Alert } from 'react-bootstrap'

const AdminJobForm: React.FC = () => {
  const [formData, setFormData] = useState({
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

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`${baseURL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(',').map(s => s.trim()),
          highlights: formData.highlights.split('\n').map(h => h.trim())
        })
      })

      if (!response.ok) throw new Error('Failed to create job')

      setSuccessMessage('Job posted successfully')
      setErrorMessage('')
    } catch (err: any) {
      setErrorMessage(err.message)
      setSuccessMessage('')
    }
  }

  return (
    <Form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
      <h4>Post New Job</h4>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Job Title</Form.Label>
            <Form.Control name="title" onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Company</Form.Label>
            <Form.Control name="company" onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Job Type</Form.Label>
            <Form.Select name="jobType" onChange={handleChange} required>
              <option value="">Select</option>
              <option>Internship</option>
              <option>Fresher</option>
              <option>Experienced</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Domain</Form.Label>
            <Form.Select name="domain" onChange={handleChange} required>
              <option value="">Select</option>
              <option>Tech</option>
              <option>Non-Tech</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Experience</Form.Label>
            <Form.Control name="experience" placeholder="0-2 years" onChange={handleChange} />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Salary</Form.Label>
            <Form.Control name="salary" onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control name="location" onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Expiry Date</Form.Label>
            <Form.Control type="date" name="expiryDate" onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tag</Form.Label>
            <Form.Control name="tag" placeholder="Women Preferred" onChange={handleChange} />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Key Highlights (one per line)</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          name="highlights"
          placeholder={`• Immediate Joiner\n• 5 Days Working\n• Free Training`}
          onChange={handleChange}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Skills (comma separated)</Form.Label>
        <Form.Control name="skills" onChange={handleChange} />
      </Form.Group>

      <Button type="submit">Post Job</Button>
    </Form>
  )
}

export default AdminJobForm

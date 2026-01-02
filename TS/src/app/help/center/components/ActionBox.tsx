import React, { useState } from 'react'
import { Button, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { actionBoxData, ActionBoxType } from '../../data'

const SubmitTicketModal = ({ show, onHide }: { show: boolean; onHide: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    issue: '',
    image: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, image: e.target.files?.[0] || null })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = new FormData()
    data.append('name', formData.name)
    data.append('email', formData.email)
    data.append('contact', formData.contact)
    data.append('issue', formData.issue)
    if (formData.image) {
      data.append('image', formData.image)
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/submit-ticket`, {
        method: 'POST',
        body: data,
      })
      if (res.ok) {
        alert('Ticket submitted successfully!')
        onHide()
        setFormData({ name: '', email: '', contact: '', issue: '', image: null })
      } else {
        alert('Something went wrong.')
      }
    } catch (err) {
      console.error(err)
      alert('Error submitting ticket.')
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Submit a Ticket</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control name="name" value={formData.name} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control name="email" type="email" value={formData.email} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contact Number</Form.Label>
            <Form.Control name="contact" type="text" value={formData.contact} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Issue Description</Form.Label>
            <Form.Control as="textarea" rows={3} name="issue" value={formData.issue} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Screenshot (optional)</Form.Label>
            <Form.Control type="file" onChange={handleFileChange} accept="image/*" />
          </Form.Group>
          <Button variant="primary" type="submit">Submit</Button>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

const ActionCard = ({ actionName, description, icon: Icon, title, variant, onSubmitClick }: ActionBoxType & { onSubmitClick: () => void }) => {
  return (
    <Col lg={4}>
      <div className={`bg-${variant} bg-opacity-10 rounded-3 p-5`}>
        <h2 className={`display-5 text-${variant}`}>
          <Icon size={65} />
        </h2>
        <h3>{title}</h3>
        <p>{description}</p>
        <Button variant="dark" className="mb-0" onClick={title === 'Submit a Ticket' ? onSubmitClick : undefined}>
          {actionName}
        </Button>
      </div>
    </Col>
  )
}

const ActionBox = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <section>
      <Container>
        <Row className="g-4">
          {actionBoxData.map((item, idx) => (
            <ActionCard key={idx} {...item} onSubmitClick={() => setShowModal(true)} />
          ))}
        </Row>
      </Container>

      <SubmitTicketModal show={showModal} onHide={() => setShowModal(false)} />
    </section>
  )
}

export default ActionBox

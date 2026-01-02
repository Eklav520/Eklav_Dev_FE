import React, { useState } from 'react';
import { Form, Button, Row, Col, Badge, Alert } from 'react-bootstrap';

const AdminJobForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    rating: '',
    reviews: '',
    experience: '',
    salary: '',
    location: '',
    description: '',
    skills: '',
    logo: '',
    postedDate: '',
    tag: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${baseURL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          rating: parseFloat(formData.rating),
          reviews: parseInt(formData.reviews),
          skills: formData.skills.split(',').map(skill => skill.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      setSuccessMessage('Job posted successfully!');
      setErrorMessage('');
      setFormData({
        title: '',
        company: '',
        rating: '',
        reviews: '',
        experience: '',
        salary: '',
        location: '',
        description: '',
        skills: '',
        logo: '',
        postedDate: '',
        tag: '',
      });
    } catch (error: any) {
      setErrorMessage(error.message);
      setSuccessMessage('');
    }
  };

  const calculateDaysAgo = (dateString: string) => {
  if (!dateString) return null;

  const posted = new Date(dateString);
  const today = new Date();
  
  // Set time to midnight for accurate day difference
  posted.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
};


  return (
    <Form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
      <h4 className="mb-3">Post a New Job</h4>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control name="title" value={formData.title} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Company</Form.Label>
            <Form.Control name="company" value={formData.company} onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <Form.Control name="rating" value={formData.rating} onChange={handleChange} type="number" step="0.1" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Reviews</Form.Label>
            <Form.Control name="reviews" value={formData.reviews} onChange={handleChange} type="number" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Experience</Form.Label>
            <Form.Control name="experience" value={formData.experience} onChange={handleChange} />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Salary</Form.Label>
            <Form.Control name="salary" value={formData.salary} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control name="location" value={formData.location} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Posted Date</Form.Label>
            <Form.Control type="date" name="postedDate" value={formData.postedDate} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tag</Form.Label>
            <Form.Control name="tag" value={formData.tag} onChange={handleChange} placeholder="e.g. Prefers differently-abled" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Logo URL</Form.Label>
            <Form.Control name="logo" value={formData.logo} onChange={handleChange} />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control name="description" as="textarea" rows={3} value={formData.description} onChange={handleChange} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Skills (comma separated)</Form.Label>
        <Form.Control name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node, MongoDB" />
      </Form.Group>

      <Button type="submit" variant="primary">
        Submit
      </Button>
    </Form>
  )
};

export default AdminJobForm;

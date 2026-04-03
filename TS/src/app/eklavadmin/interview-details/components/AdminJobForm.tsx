import React, { useState } from 'react'
import { Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'
import {
  FaBriefcase,
  FaBuilding,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTag,
  FaCode,
  FaSave,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaChartLine,
  FaUsers
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

const AdminJobForm: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext();
  const token = (user as any)?.token as string | undefined;

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // ✅ VERY IMPORTANT
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          highlights: formData.highlights
        })
      })

      if (!response.ok) throw new Error('Failed to create job')

      setSuccessMessage('Job posted successfully')

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
    <div className="job-form-container">
      <div className="form-wrapper">
        {/* Header */}
        <div className="form-header">
          <div className="header-icon-wrapper">
            <FaBriefcase className="header-icon" />
          </div>
          <div className="header-text">
            <h4 className="form-title">Post New Job Opportunity</h4>
            <p className="form-subtitle">Create and publish job listings for candidates</p>
          </div>
        </div>

        {successMessage && (
          <Alert className="success-alert">
            <FaCheckCircle className="alert-icon" />
            <div>
              <strong>Success!</strong>
              <p>{successMessage}</p>
            </div>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="error-alert">
            <FaTimesCircle className="alert-icon" />
            <div>
              <strong>Error!</strong>
              <p>{errorMessage}</p>
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaBriefcase className="label-icon" />
                  Job Title
                </Form.Label>
                <Form.Control
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Senior React Developer"
                  className="form-control-custom"
                  required
                />
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaBuilding className="label-icon" />
                  Company
                </Form.Label>
                <Form.Control
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company name"
                  className="form-control-custom"
                  required
                />
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaUsers className="label-icon" />
                  Job Type
                </Form.Label>
                <Form.Select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="form-select-custom"
                  required
                >
                  <option value="">Select job type</option>
                  <option>Internship</option>
                  <option>Fresher</option>
                  <option>Experienced</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaChartLine className="label-icon" />
                  Domain
                </Form.Label>
                <Form.Select
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="form-select-custom"
                  required
                >
                  <option value="">Select domain</option>
                  <option>Tech</option>
                  <option>Non-Tech</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaClock className="label-icon" />
                  Experience
                </Form.Label>
                <Form.Control
                  name="experience"
                  value={formData.experience}
                  placeholder="e.g., 0–2 years, 3-5 years"
                  onChange={handleChange}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaMoneyBillWave className="label-icon" />
                  Salary
                </Form.Label>
                <Form.Control
                  name="salary"
                  value={formData.salary}
                  placeholder="e.g., ₹5,00,000 - ₹8,00,000"
                  onChange={handleChange}
                  className="form-control-custom"
                />
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaMapMarkerAlt className="label-icon" />
                  Location
                </Form.Label>
                <Form.Control
                  name="location"
                  value={formData.location}
                  placeholder="e.g., Bangalore, Remote, Hybrid"
                  onChange={handleChange}
                  className="form-control-custom"
                />
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaCalendarAlt className="label-icon" />
                  Expiry Date
                </Form.Label>
                <Form.Control
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="form-control-custom"
                  required
                />
              </Form.Group>

              <Form.Group className="form-group-custom">
                <Form.Label className="form-label-custom">
                  <FaTag className="label-icon" />
                  Tag
                </Form.Label>
                <Form.Control
                  name="tag"
                  value={formData.tag}
                  placeholder="e.g., Women Preferred, Urgent Hiring"
                  onChange={handleChange}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Rich Text Editor */}
          <Form.Group className="form-group-custom">
            <Form.Label className="form-label-custom">
              <FaCode className="label-icon" />
              Key Highlights
            </Form.Label>
            <div className="quill-editor-wrapper">
              <ReactQuill
                theme="snow"
                value={formData.highlights}
                onChange={value =>
                  setFormData(prev => ({ ...prev, highlights: value }))
                }
                placeholder="Add job highlights, benefits, responsibilities..."
                className="custom-quill"
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

          <Form.Group className="form-group-custom">
            <Form.Label className="form-label-custom">
              <FaCode className="label-icon" />
              Skills (comma separated)
            </Form.Label>
            <Form.Control
              name="skills"
              value={formData.skills}
              placeholder="React, Node.js, MongoDB, Python"
              onChange={handleChange}
              className="form-control-custom"
            />
            <small className="form-hint">
              Enter skills separated by commas
            </small>
          </Form.Group>

          <div className="form-actions">
            <Button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Posting Job...
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  Post Job
                </>
              )}
            </Button>
          </div>
        </Form>
      </div>

      <style>{`
        .job-form-container {
          background: #000000;
          min-height: 100vh;
          padding: 1rem;
        }

        .form-wrapper {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header */
        .form-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ff7a00;
        }

        .header-icon-wrapper {
          width: 56px;
          height: 56px;
          background: rgba(255, 122, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .header-text {
          flex: 1;
        }

        .form-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .form-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        /* Alerts */
        .success-alert, .error-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid;
        }

        .success-alert {
          background: rgba(40, 167, 69, 0.1);
          border-left-color: #28a745;
        }

        .error-alert {
          background: rgba(220, 53, 69, 0.1);
          border-left-color: #dc3545;
        }

        .alert-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .success-alert .alert-icon {
          color: #28a745;
        }

        .error-alert .alert-icon {
          color: #dc3545;
        }

        .success-alert strong, .error-alert strong {
          display: block;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .success-alert p, .error-alert p {
          color: #e5e5e5;
          margin: 0;
          font-size: 0.9rem;
        }

        /* Form Groups */
        .form-group-custom {
          margin-bottom: 1.5rem;
        }

        .form-label-custom {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .label-icon {
          font-size: 0.9rem;
        }

        .form-control-custom, .form-select-custom {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .form-control-custom:focus, .form-select-custom:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
          color: #ffffff;
        }

        .form-control-custom::placeholder {
          color: #6c757d;
        }

        .form-hint {
          color: #6c757d;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          display: block;
        }

        /* Quill Editor */
        .quill-editor-wrapper {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          overflow: hidden;
        }

        .custom-quill .ql-toolbar {
          background: #1a1a1a;
          border: none;
          border-bottom: 1px solid #2c2c2c;
        }

        .custom-quill .ql-container {
          background: #000000;
          border: none;
          min-height: 250px;
        }

        .custom-quill .ql-editor {
          min-height: 220px;
          color: #ffffff;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .custom-quill .ql-editor.ql-blank::before {
          color: #6c757d;
        }

        .custom-quill .ql-stroke {
          stroke: #e5e5e5;
        }

        .custom-quill .ql-fill {
          fill: #e5e5e5;
        }

        .custom-quill .ql-picker {
          color: #e5e5e5;
        }

        .custom-quill .ql-picker-options {
          background: #1a1a1a;
          border-color: #2c2c2c;
        }

        .custom-quill .ql-toolbar button:hover .ql-stroke {
          stroke: #ff7a00;
        }

        .custom-quill .ql-toolbar button:hover .ql-fill {
          fill: #ff7a00;
        }

        .custom-quill .ql-toolbar .ql-active .ql-stroke {
          stroke: #ff7a00;
        }

        .custom-quill .ql-toolbar .ql-active .ql-fill {
          fill: #ff7a00;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .submit-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .form-wrapper {
            padding: 1rem;
          }

          .form-header {
            flex-direction: column;
            text-align: center;
          }

          .header-icon-wrapper {
            margin: 0 auto;
          }

          .form-title {
            font-size: 1.25rem;
          }

          .form-actions {
            justify-content: stretch;
          }

          .submit-btn {
            width: 100%;
          }

          .custom-quill .ql-editor {
            min-height: 180px;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminJobForm
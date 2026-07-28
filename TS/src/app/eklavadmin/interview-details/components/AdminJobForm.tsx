import React, { useEffect, useState } from 'react'
import { Form, Button, Row, Col, Alert, Spinner, Modal } from 'react-bootstrap'
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
  FaUsers,
  FaFileUpload,
  FaTimes,
  FaEdit,
  FaPlus,
  FaSearch,
  FaEye,
  FaEnvelope,
  FaPhone,
  FaUserTie,
  FaPaperclip
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

interface ExistingJob {
  _id: string
  title: string
  company: string
  experience: string
  salary: string
  location: string
  skills: string | string[]
  highlights: string | string[]
  jobType: string
  domain: string
  expiryDate: string
  logo: string
  tag?: string
  isExpired: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  posterName?: string
  posterEmail?: string
  posterPhone?: string
  posterCompany?: string
  attachments?: { fileName?: string; fileUrl?: string }[]
}

const AdminJobForm: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext();
  const token = (user as any)?.token as string | undefined;

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [existingJobs, setExistingJobs] = useState<ExistingJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [jobTableSearch, setJobTableSearch] = useState('')

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
  const [attachments, setAttachments] = useState<File[]>([])
  const [reviewingId, setReviewingId] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [viewingJob, setViewingJob] = useState<ExistingJob | null>(null)

  useEffect(() => {
    if (mode !== 'edit' || !token) return
    setLoadingJobs(true)
    setExistingJobs([])
    setSelectedJobId('')
    fetch(`${baseURL}/jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then((jobs: ExistingJob[]) => setExistingJobs(jobs.filter(j => !j.isExpired)))
      .catch(() => setExistingJobs([]))
      .finally(() => setLoadingJobs(false))
  }, [mode, baseURL, token])

  const handleJobSelect = (job: ExistingJob) => {
    setSelectedJobId(job._id)
    setFormData({
      title: job.title,
      company: job.company,
      experience: job.experience,
      salary: job.salary,
      location: job.location,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || ''),
      highlights: Array.isArray(job.highlights) ? job.highlights.join('') : (job.highlights || ''),
      jobType: job.jobType,
      domain: job.domain,
      expiryDate: job.expiryDate ? job.expiryDate.split('T')[0] : '',
      logo: job.logo || '',
      tag: job.tag || ''
    })
    setAttachments([])
    setSuccessMessage('')
    setErrorMessage('')
    setShowEditForm(true)
  }

  const reviewJob = async (jobId: string, action: 'approve' | 'reject') => {
    setReviewingId(jobId)
    setErrorMessage('')
    try {
      const res = await fetch(`${baseURL}/jobs/${jobId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || `Failed to ${action} job`)
      }
      setExistingJobs(prev => prev.map(j => j._id === jobId
        ? { ...j, approvalStatus: action === 'approve' ? 'approved' : 'rejected' }
        : j))
      setSuccessMessage(action === 'approve' ? 'Job approved and published to students' : 'Job rejected')
    } catch (err: any) {
      setErrorMessage(err.message || `Something went wrong`)
    } finally {
      setReviewingId('')
    }
  }

  const handleDelete = async (job: ExistingJob) => {
    if (!window.confirm(`Delete "${job.title}" at ${job.company}? This cannot be undone.`)) return
    setDeletingId(job._id)
    setErrorMessage('')
    try {
      const res = await fetch(`${baseURL}/jobs/${job._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to delete job')
      }
      setExistingJobs(prev => prev.filter(j => j._id !== job._id))
      if (selectedJobId === job._id) cancelEdit()
      setSuccessMessage('Job deleted successfully')
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong')
    } finally {
      setDeletingId('')
    }
  }

  const cancelEdit = () => {
    setShowEditForm(false)
    setSelectedJobId('')
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
    setAttachments([])
    setSuccessMessage('')
    setErrorMessage('')
  }

  const switchMode = (newMode: 'create' | 'edit') => {
    setMode(newMode)
    setSelectedJobId('')
    setShowEditForm(false)
    setJobTableSearch('')
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
    setAttachments([])
    setSuccessMessage('')
    setErrorMessage('')
  }

  const filteredTableJobs = existingJobs.filter(j =>
    j.title.toLowerCase().includes(jobTableSearch.toLowerCase()) ||
    j.company.toLowerCase().includes(jobTableSearch.toLowerCase())
  )

  const formatExpiryDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    return diff <= 7 ? `${label} (${diff}d left)` : label
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    setAttachments(prev => [...prev, ...selected])
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const requiredFieldFallbacks = {
    title: 'Untitled Job',
    company: 'Confidential Company',
    jobType: 'Fresher',
    domain: 'Tech',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const jobPayload = {
        title: formData.title.trim() || requiredFieldFallbacks.title,
        company: formData.company.trim() || requiredFieldFallbacks.company,
        experience: formData.experience,
        salary: formData.salary,
        location: formData.location,
        skills: formData.skills,
        highlights: formData.highlights,
        jobType: formData.jobType || requiredFieldFallbacks.jobType,
        domain: formData.domain || requiredFieldFallbacks.domain,
        expiryDate: formData.expiryDate || requiredFieldFallbacks.expiryDate,
        logo: formData.logo,
        tag: formData.tag
      }

      const payload = new FormData()
      Object.entries(jobPayload).forEach(([key, value]) => {
        payload.append(key, value)
      })
      attachments.forEach(file => payload.append('attachments', file))

      const isEdit = mode === 'edit' && selectedJobId
      const url = isEdit ? `${baseURL}/jobs/${selectedJobId}` : `${baseURL}/jobs`
      const method = isEdit ? 'PUT' : 'POST'

      let response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      })

      let errorData: any = null
      if (!response.ok) {
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const missingRequiredFields =
          errorData?.error === 'Missing required fields' &&
          Array.isArray(errorData?.required)

        // Some production environments fail to parse multipart text fields.
        // Retry with JSON so required fields are correctly parsed server-side.
        if (missingRequiredFields) {
          response = await fetch(url, {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jobPayload)
          })

          if (!response.ok) {
            try {
              errorData = await response.json()
            } catch {
              errorData = null
            }
          }
        }
      }

      if (!response.ok) {
        const message = errorData?.message || errorData?.error || (isEdit ? 'Failed to update job' : 'Failed to create job')
        throw new Error(message)
      }

      if (isEdit) {
        // Refresh the table with the updated job, then return to it
        const refreshed = await fetch(`${baseURL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => existingJobs)
        setExistingJobs(Array.isArray(refreshed) ? refreshed.filter((j: any) => !j.isExpired) : existingJobs)
        setShowEditForm(false)
        setSelectedJobId('')
        setSuccessMessage('Job updated successfully')
      } else {
        setSuccessMessage('Job posted successfully')
      }

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
      setAttachments([])
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
            {mode === 'edit' ? <FaEdit className="header-icon" /> : <FaBriefcase className="header-icon" />}
          </div>
          <div className="header-text">
            <h4 className="form-title">{mode === 'edit' ? 'Update Existing Job' : 'Post New Job Opportunity'}</h4>
            <p className="form-subtitle">{mode === 'edit' ? 'Edit and update an active job listing' : 'Create and publish job listings for candidates'}</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'create' ? 'mode-btn-active' : ''}`}
            onClick={() => switchMode('create')}
          >
            <FaPlus className="me-2" />
            Post New Job
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'edit' ? 'mode-btn-active' : ''}`}
            onClick={() => switchMode('edit')}
          >
            <FaEdit className="me-2" />
            Update Existing Job
          </button>
        </div>

        {/* Jobs Table (edit mode, before a job is selected) */}
        {mode === 'edit' && !showEditForm && (
          <>
            {successMessage && (
              <Alert className="success-alert" style={{ marginBottom: '1rem' }}>
                <FaCheckCircle className="alert-icon" />
                <div>
                  <strong>Success!</strong>
                  <p>{successMessage}</p>
                </div>
              </Alert>
            )}

            <div className="jobs-table-wrapper">
            {loadingJobs ? (
              <div className="d-flex align-items-center gap-2 py-3" style={{ color: '#8a8a8a' }}>
                <Spinner size="sm" animation="border" style={{ color: '#ff7a00' }} />
                <span>Loading active jobs...</span>
              </div>
            ) : (
              <>
                <div className="table-toolbar">
                  <span className="table-count">{filteredTableJobs.length} active job{filteredTableJobs.length !== 1 ? 's' : ''}</span>
                  <div className="table-search-wrapper">
                    <FaSearch className="table-search-icon" />
                    <input
                      className="table-search-input"
                      type="text"
                      placeholder="Search by title or company..."
                      value={jobTableSearch}
                      onChange={e => setJobTableSearch(e.target.value)}
                    />
                  </div>
                </div>

                {filteredTableJobs.length === 0 ? (
                  <p className="table-empty">
                    {existingJobs.length === 0 ? 'No active (non-expired) jobs found.' : 'No jobs match your search.'}
                  </p>
                ) : (
                  <div className="table-scroll">
                    <table className="jobs-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Job Title</th>
                          <th>Company</th>
                          <th>Type</th>
                          <th>Domain</th>
                          <th>Status</th>
                          <th>Expires</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTableJobs.map((job, idx) => (
                          <tr key={job._id} className={selectedJobId === job._id ? 'row-selected' : ''}>
                            <td className="td-num">{idx + 1}</td>
                            <td className="td-title">{job.title}</td>
                            <td>{job.company}</td>
                            <td><span className="job-badge">{job.jobType}</span></td>
                            <td><span className="job-badge job-badge-dim">{job.domain}</span></td>
                            <td>
                              {job.approvalStatus === 'pending' ? (
                                <span className="job-badge job-badge-pending" title={job.posterEmail ? `Submitted by ${job.posterName} (${job.posterEmail})` : undefined}>Pending Review</span>
                              ) : job.approvalStatus === 'rejected' ? (
                                <span className="job-badge job-badge-rejected">Rejected</span>
                              ) : (
                                <span className="job-badge job-badge-dim">Active</span>
                              )}
                            </td>
                            <td className="td-expiry">{formatExpiryDate(job.expiryDate)}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="view-action-btn"
                                  onClick={() => setViewingJob(job)}
                                >
                                  <FaEye className="me-1" /> View
                                </button>
                                <button
                                  type="button"
                                  className="edit-action-btn"
                                  disabled={deletingId === job._id}
                                  onClick={() => handleJobSelect(job)}
                                >
                                  <FaEdit className="me-1" /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="delete-action-btn"
                                  disabled={deletingId === job._id}
                                  onClick={() => handleDelete(job)}
                                >
                                  {deletingId === job._id ? '…' : <><FaTimes className="me-1" /> Delete</>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
            </div>
          </>
        )}

        {/* Alerts + Form — always in create mode, or after selecting a job in edit mode */}
        {(mode === 'create' || showEditForm) && (
          <>
            {showEditForm && (
              <div className="edit-form-banner">
                <FaEdit className="me-2" />
                Editing: <strong className="ms-1">{formData.title}</strong>
                <span className="ms-1 text-muted">— {formData.company}</span>
              </div>
            )}

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
          </>
        )}

        {(mode === 'create' || showEditForm) && <Form onSubmit={handleSubmit}>
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

          <Form.Group className="form-group-custom">
            <Form.Label className="form-label-custom">
              <FaFileUpload className="label-icon" />
              Attachments (Images/PDF)
            </Form.Label>
            <Form.Control
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif"
              onChange={handleAttachmentChange}
              className="form-control-custom"
            />
            <small className="form-hint">
              You can upload multiple images or PDF files.
            </small>

            {attachments.length > 0 && (
              <div className="attachment-list">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="attachment-item">
                    <span className="attachment-name">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      className="remove-attachment-btn"
                      onClick={() => removeAttachment(index)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Form.Group>

          <div className="form-actions">
            {showEditForm && (
              <button
                type="button"
                className="cancel-btn"
                onClick={cancelEdit}
                disabled={loading}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
            )}
            <Button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  {showEditForm ? 'Updating Job...' : 'Posting Job...'}
                </>
              ) : (
                <>
                  {showEditForm ? <FaEdit className="me-2" /> : <FaSave className="me-2" />}
                  {showEditForm ? 'Update Job' : 'Post Job'}
                </>
              )}
            </Button>
          </div>
        </Form>}
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

        /* Mode Toggle */
        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          background: #111111;
          border: 1px solid #2c2c2c;
          border-radius: 10px;
          padding: 0.35rem;
        }

        .mode-btn {
          flex: 1;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #8a8a8a;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mode-btn:hover {
          color: #ff7a00;
        }

        .mode-btn-active {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          color: #000000 !important;
          font-weight: 600;
        }

        /* Jobs Table */
        .jobs-table-wrapper {
          background: #111111;
          border: 1px solid #2c2c2c;
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .table-count {
          color: #8a8a8a;
          font-size: 0.82rem;
          white-space: nowrap;
        }

        .table-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 340px;
        }

        .table-search-icon {
          position: absolute;
          left: 0.65rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-size: 0.8rem;
          pointer-events: none;
        }

        .table-search-input {
          width: 100%;
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.45rem 0.75rem 0.45rem 2rem;
          border-radius: 8px;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .table-search-input:focus {
          border-color: #ff7a00;
        }

        .table-search-input::placeholder {
          color: #6c757d;
        }

        .table-empty {
          color: #6c757d;
          font-size: 0.85rem;
          text-align: center;
          padding: 1.5rem 0;
          margin: 0;
        }

        .table-scroll {
          overflow-x: auto;
        }

        .jobs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .jobs-table th {
          color: #ff7a00;
          font-weight: 600;
          text-align: left;
          padding: 0.6rem 0.75rem;
          border-bottom: 1px solid #2c2c2c;
          white-space: nowrap;
        }

        .jobs-table td {
          color: #d9d9d9;
          padding: 0.6rem 0.75rem;
          border-bottom: 1px solid #1a1a1a;
          vertical-align: middle;
        }

        .jobs-table tbody tr:hover {
          background: #1a1a1a;
        }

        .jobs-table tbody tr.row-selected {
          background: rgba(255, 122, 0, 0.08);
        }

        .td-num {
          color: #6c757d;
          width: 36px;
        }

        .td-title {
          font-weight: 500;
          color: #ffffff;
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .td-expiry {
          white-space: nowrap;
          color: #aaaaaa;
          font-size: 0.8rem;
        }

        .job-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 50px;
          font-size: 0.72rem;
          font-weight: 600;
          background: rgba(255, 122, 0, 0.15);
          color: #ff7a00;
          border: 1px solid rgba(255, 122, 0, 0.3);
          white-space: nowrap;
        }

        .job-badge-dim {
          opacity: 0.7;
        }

        .job-badge-pending {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.35);
        }

        .job-badge-rejected {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .approve-action-btn, .reject-action-btn, .delete-action-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .approve-action-btn {
          border: 1px solid #22c55e;
          background: transparent;
          color: #22c55e;
        }

        .approve-action-btn:hover:not(:disabled) {
          background: #22c55e;
          color: #000000;
        }

        .reject-action-btn {
          border: 1px solid #ef4444;
          background: transparent;
          color: #ef4444;
        }

        .reject-action-btn:hover:not(:disabled) {
          background: #ef4444;
          color: #ffffff;
        }

        .delete-action-btn {
          border: 1px solid #6c757d;
          background: transparent;
          color: #aaaaaa;
        }

        .delete-action-btn:hover:not(:disabled) {
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
        }

        .view-action-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          border: 1px solid #3b82f6;
          background: transparent;
          color: #60a5fa;
        }

        .view-action-btn:hover {
          background: #3b82f6;
          color: #ffffff;
        }

        .approve-action-btn:disabled, .reject-action-btn:disabled, .delete-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Job details view modal */
        .job-view-modal-content {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          border-radius: 14px;
        }

        .job-view-modal-header {
          border-bottom: 1px solid #2c2c2c;
          padding: 1.25rem 1.5rem;
        }

        .job-view-modal-title {
          color: #ffffff;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .job-view-modal-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 4px;
        }

        .job-view-modal-body {
          padding: 1.5rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .job-view-poster-box {
          background: rgba(255, 122, 0, 0.08);
          border: 1px solid rgba(255, 122, 0, 0.3);
          border-radius: 10px;
          padding: 0.9rem 1.1rem;
          margin-bottom: 1.25rem;
        }

        .job-view-poster-title {
          color: #ff7a00;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .job-view-poster-row {
          display: flex;
          align-items: center;
          color: #e5e5e5;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }

        .job-view-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .job-view-label {
          display: block;
          color: #6c757d;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 3px;
        }

        .job-view-value {
          display: block;
          color: #e5e5e5;
          font-size: 0.88rem;
          font-weight: 500;
        }

        .job-view-section {
          margin-bottom: 1.25rem;
        }

        .job-view-section-title {
          color: #ff7a00;
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .job-view-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .job-view-skill-chip {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          border: 1px solid rgba(255, 122, 0, 0.25);
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 0.76rem;
          font-weight: 600;
        }

        .job-view-highlights {
          background: #111111;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 0.9rem 1rem;
          color: #d9d9d9;
          font-size: 0.85rem;
          line-height: 1.65;
        }

        .job-view-highlights * {
          color: #d9d9d9 !important;
          background: transparent !important;
        }

        .job-view-attachment {
          display: flex;
          align-items: center;
          color: #60a5fa;
          font-size: 0.85rem;
          text-decoration: none;
          margin-bottom: 6px;
        }

        .job-view-attachment:hover {
          text-decoration: underline;
        }

        .job-view-modal-footer {
          border-top: 1px solid #2c2c2c;
          padding: 1rem 1.5rem;
        }

        .edit-action-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.75rem;
          border-radius: 6px;
          border: 1px solid #ff7a00;
          background: transparent;
          color: #ff7a00;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .edit-action-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        /* Edit form banner */
        .edit-form-banner {
          display: flex;
          align-items: center;
          background: rgba(255, 122, 0, 0.08);
          border: 1px solid rgba(255, 122, 0, 0.3);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          margin-bottom: 1.25rem;
          color: #ff7a00;
          font-size: 0.875rem;
        }

        .edit-form-banner strong {
          color: #ffffff;
        }

        .edit-form-banner .text-muted {
          color: #8a8a8a !important;
        }

        /* Cancel button */
        .cancel-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: 1px solid #4a4a4a;
          background: transparent;
          color: #aaaaaa;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-right: 0.75rem;
        }

        .cancel-btn:hover:not(:disabled) {
          border-color: #ff7a00;
          color: #ff7a00;
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .attachment-list {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .attachment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          background: #111111;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
        }

        .attachment-name {
          color: #d9d9d9;
          font-size: 0.82rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-attachment-btn {
          border: none;
          background: transparent;
          color: #ff7a00;
          cursor: pointer;
          padding: 0.2rem;
          line-height: 1;
        }

        .remove-attachment-btn:hover {
          color: #ff944d;
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

      {/* Job details modal — full view of a submission before deciding to approve/reject */}
      <Modal show={!!viewingJob} onHide={() => setViewingJob(null)} centered size="lg" contentClassName="job-view-modal-content">
        {viewingJob && (
          <>
            <Modal.Header closeButton closeVariant="white" className="job-view-modal-header">
              <Modal.Title className="job-view-modal-title">
                {viewingJob.title}
                <div className="job-view-modal-subtitle">{viewingJob.company}</div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="job-view-modal-body">
              {(viewingJob.posterName || viewingJob.posterEmail || viewingJob.posterPhone) && (
                <div className="job-view-poster-box">
                  <div className="job-view-poster-title">Submitted by</div>
                  {viewingJob.posterName && <div className="job-view-poster-row"><FaUserTie className="me-2" />{viewingJob.posterName}{viewingJob.posterCompany ? ` — ${viewingJob.posterCompany}` : ''}</div>}
                  {viewingJob.posterEmail && <div className="job-view-poster-row"><FaEnvelope className="me-2" />{viewingJob.posterEmail}</div>}
                  {viewingJob.posterPhone && <div className="job-view-poster-row"><FaPhone className="me-2" />{viewingJob.posterPhone}</div>}
                </div>
              )}

              <div className="job-view-grid">
                <div><span className="job-view-label">Job Type</span><span className="job-view-value">{viewingJob.jobType || '—'}</span></div>
                <div><span className="job-view-label">Domain</span><span className="job-view-value">{viewingJob.domain || '—'}</span></div>
                <div><span className="job-view-label">Experience</span><span className="job-view-value">{viewingJob.experience || '—'}</span></div>
                <div><span className="job-view-label">Salary</span><span className="job-view-value">{viewingJob.salary || '—'}</span></div>
                <div><span className="job-view-label">Location</span><span className="job-view-value">{viewingJob.location || '—'}</span></div>
                <div><span className="job-view-label">Expires</span><span className="job-view-value">{formatExpiryDate(viewingJob.expiryDate)}</span></div>
                {viewingJob.tag && <div><span className="job-view-label">Tag</span><span className="job-view-value">{viewingJob.tag}</span></div>}
              </div>

              {viewingJob.skills && (
                <div className="job-view-section">
                  <div className="job-view-section-title">Skills</div>
                  <div className="job-view-skills">
                    {(Array.isArray(viewingJob.skills) ? viewingJob.skills : viewingJob.skills.split(',')).map((s, i) => (
                      <span key={i} className="job-view-skill-chip">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingJob.highlights && (
                <div className="job-view-section">
                  <div className="job-view-section-title">Key Highlights</div>
                  <div
                    className="job-view-highlights"
                    dangerouslySetInnerHTML={{ __html: Array.isArray(viewingJob.highlights) ? viewingJob.highlights.join('') : viewingJob.highlights }}
                  />
                </div>
              )}

              {viewingJob.attachments && viewingJob.attachments.length > 0 && (
                <div className="job-view-section">
                  <div className="job-view-section-title">Attachments</div>
                  {viewingJob.attachments.map((a, i) => (
                    a.fileUrl ? (
                      <a key={i} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="job-view-attachment">
                        <FaPaperclip className="me-2" />{a.fileName || `Attachment ${i + 1}`}
                      </a>
                    ) : null
                  ))}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="job-view-modal-footer">
              {viewingJob.approvalStatus === 'pending' && (
                <>
                  <button
                    type="button"
                    className="approve-action-btn"
                    disabled={reviewingId === viewingJob._id}
                    onClick={async () => { await reviewJob(viewingJob._id, 'approve'); setViewingJob(null) }}
                  >
                    {reviewingId === viewingJob._id ? '…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="reject-action-btn"
                    disabled={reviewingId === viewingJob._id}
                    onClick={async () => { await reviewJob(viewingJob._id, 'reject'); setViewingJob(null) }}
                  >
                    Reject
                  </button>
                </>
              )}
              <button type="button" className="edit-action-btn" onClick={() => setViewingJob(null)}>Close</button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  )
}

export default AdminJobForm
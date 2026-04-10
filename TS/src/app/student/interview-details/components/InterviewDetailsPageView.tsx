import React, { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Spinner,
  Alert,
  Row,
  Col,
  Form,
  Button,
  Pagination,
  Badge
} from 'react-bootstrap'
import JobCard from './JobCard'
import JobDetailsModal from './JobDetailsModal'
import { 
  FaAngleLeft, 
  FaAngleRight, 
  FaFilter, 
  FaTimes, 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaCode, 
  FaChartLine,
  FaUsers,
  FaSearch
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

export interface Job {
  _id: string
  title: string
  company: string
  experience: string
  salary: string
  location: string
  skills: string[]
  highlights: string[]
  jobType: 'Internship' | 'Fresher' | 'Experienced'
  domain: 'Tech' | 'Non-Tech'
  logo: string
  postedDate: string
  expiryDate: string
  isExpired: boolean
  isRead: boolean
  tag?: string
  attachments?: Array<{
    fileName?: string
    fileUrl?: string
    mimeType?: string
    size?: number
  }>
}

const PAGE_SIZE = 10

const InterviewDetailsPageView = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)

  /* Filters */
  const [domain, setDomain] = useState('')
  const [jobType, setJobType] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (token) fetchJobs()
  }, [token])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${baseURL}/jobs/student`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setJobs(data)
      } else if (data?.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs)
      } else if (data?.data && Array.isArray(data.data)) {
        setJobs(data.data)
      } else if (data?.results && Array.isArray(data.results)) {
        setJobs(data.results)
      } else {
        setJobs([])
      }
    } catch (err: any) {
      setError(err.message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  /* Filter logic */
  const filteredJobs = useMemo(() => {
    setCurrentPage(1)

    if (!Array.isArray(jobs)) {
      return []
    }

    return jobs.filter(job => {
      const domainMatch = domain ? job.domain === domain : true
      const typeMatch = jobType ? job.jobType === jobType : true
      const locationMatch = location
        ? job.location.toLowerCase().includes(location.toLowerCase())
        : true
      const skillsMatch = skills
        ? job.skills.some(skill =>
          skill.toLowerCase().includes(skills.toLowerCase())
        )
        : true

      return domainMatch && typeMatch && locationMatch && skillsMatch
    })
  }, [jobs, domain, jobType, location, skills])

  /* Pagination logic */
  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE)
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const handleMarkedAsRead = (jobId: string) => {
    setJobs(prev =>
      prev.map(job =>
        job._id === jobId ? { ...job, isRead: true } : job
      )
    )
  }

  const activeFiltersCount = [domain, jobType, location, skills].filter(f => f).length

  return (
    <div className="jobs-page-container">
      <Container fluid className="py-4">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-left">
              <FaBriefcase className="header-icon" />
              <div>
                <h4 className="header-title">Available Jobs</h4>
                <p className="header-subtitle">
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <Button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="me-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {activeFiltersCount > 0 && (
                <Badge className="filter-badge">{activeFiltersCount}</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="filters-section">
            <Form>
              <Row className="g-3">
                <Col md={3} sm={6}>
                  <Form.Label className="filter-label">
                    <FaChartLine className="me-1" />
                    Domain
                  </Form.Label>
                  <Form.Select 
                    value={domain} 
                    onChange={e => setDomain(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Domains</option>
                    <option value="Tech">💻 Tech</option>
                    <option value="Non-Tech">📊 Non-Tech</option>
                  </Form.Select>
                </Col>

                <Col md={3} sm={6}>
                  <Form.Label className="filter-label">
                    <FaUsers className="me-1" />
                    Job Type
                  </Form.Label>
                  <Form.Select 
                    value={jobType} 
                    onChange={e => setJobType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    <option value="Internship">🎓 Internship</option>
                    <option value="Fresher">🌟 Fresher</option>
                    <option value="Experienced">💼 Experienced</option>
                  </Form.Select>
                </Col>

                <Col md={3} sm={6}>
                  <Form.Label className="filter-label">
                    <FaMapMarkerAlt className="me-1" />
                    Location
                  </Form.Label>
                  <div className="filter-input-wrapper">
                    <FaMapMarkerAlt className="input-icon" />
                    <Form.Control
                      placeholder="City or Remote"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </Col>

                <Col md={3} sm={6}>
                  <Form.Label className="filter-label">
                    <FaCode className="me-1" />
                    Skills
                  </Form.Label>
                  <div className="filter-input-wrapper">
                    <FaCode className="input-icon" />
                    <Form.Control
                      placeholder="React, Python, etc"
                      value={skills}
                      onChange={e => setSkills(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </Col>
              </Row>

              {activeFiltersCount > 0 && (
                <div className="filter-actions">
                  <Button
                    className="clear-filters-btn"
                    onClick={() => {
                      setDomain('')
                      setJobType('')
                      setLocation('')
                      setSkills('')
                    }}
                  >
                    <FaTimes className="me-2" />
                    Clear All Filters ({activeFiltersCount})
                  </Button>
                </div>
              )}
            </Form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner">
              <Spinner animation="border" variant="warning" />
            </div>
            <p className="loading-text">Loading available jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="danger" className="error-alert">
            <FaTimes className="alert-icon" />
            <div>
              <strong>Error loading jobs</strong>
              <p>{error}</p>
            </div>
          </Alert>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <>
            {paginatedJobs.length === 0 ? (
              <div className="empty-state">
                <FaBriefcase className="empty-icon" />
                <h5>No jobs found</h5>
                <p>Try adjusting your filters or check back later for new opportunities</p>
                {activeFiltersCount > 0 && (
                  <Button 
                    className="clear-filters-empty"
                    onClick={() => {
                      setDomain('')
                      setJobType('')
                      setLocation('')
                      setSkills('')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="jobs-grid">
                {paginatedJobs.map(job => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    onViewDetails={setSelectedJob} 
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-section">
            <div className="pagination-info">
              Showing{' '}
              <strong>
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredJobs.length)}
              </strong>{' '}
              of <strong>{filteredJobs.length}</strong> jobs
            </div>

            <nav aria-label="Job pagination">
              <ul className="pagination-custom">
                <li className={currentPage === 1 ? 'disabled' : ''}>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <FaAngleLeft />
                  </Button>
                </li>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <li key={pageNum} className={currentPage === pageNum ? 'active' : ''}>
                      <Button onClick={() => setCurrentPage(pageNum)}>
                        {pageNum}
                      </Button>
                    </li>
                  )
                })}

                <li className={currentPage === totalPages ? 'disabled' : ''}>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <FaAngleRight />
                  </Button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </Container>

      <JobDetailsModal
        show={!!selectedJob}
        onHide={() => setSelectedJob(null)}
        job={selectedJob}
        onMarkedAsRead={handleMarkedAsRead}
      />

      <style>{`
        .jobs-page-container {
          background: #000000;
          min-height: 100vh;
        }

        /* Header */
        .page-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-radius: 12px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .header-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        .filter-toggle-btn {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid #ff7a00;
          color: #ff7a00;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          position: relative;
          transition: all 0.2s ease;
        }

        .filter-toggle-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        .filter-badge {
          background: #ff7a00;
          color: #000000;
          margin-left: 0.5rem;
          border-radius: 20px;
          padding: 0.25rem 0.5rem;
        }

        /* Filters Section */
        .filters-section {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .filter-label {
          color: #ff7a00;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .filter-select, .filter-input {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.625rem;
          border-radius: 8px;
        }

        .filter-select:focus, .filter-input:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .filter-input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #ff7a00;
          font-size: 0.9rem;
        }

        .filter-input-wrapper .filter-input {
          padding-left: 2rem;
        }

        .filter-actions {
          margin-top: 1.5rem;
          text-align: right;
        }

        .clear-filters-btn {
          background: transparent;
          border: 1px solid #dc3545;
          color: #dc3545;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .clear-filters-btn:hover {
          background: #dc3545;
          color: #ffffff;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .loading-spinner {
          margin-bottom: 1rem;
        }

        .loading-text {
          color: #8a8a8a;
          font-size: 0.9rem;
        }

        /* Error Alert */
        .error-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 8px;
          padding: 1rem;
        }

        .alert-icon {
          color: #dc3545;
          font-size: 1.25rem;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
        }

        .empty-icon {
          font-size: 4rem;
          color: #ff7a00;
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .empty-state h5 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #8a8a8a;
          margin-bottom: 1.5rem;
        }

        .clear-filters-empty {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
        }

        /* Jobs Grid */
        .jobs-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        /* Pagination */
        .pagination-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 1.5rem;
          margin-top: 1rem;
          border-top: 1px solid #1f1f1f;
        }

        .pagination-info {
          color: #8a8a8a;
          font-size: 0.85rem;
        }

        .pagination-info strong {
          color: #ff7a00;
        }

        .pagination-custom {
          display: flex;
          gap: 0.5rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .pagination-custom li {
          display: inline-block;
        }

        .pagination-custom li button {
          background: #0a0a0a;
          border: 1px solid #2c2c2c;
          color: #e5e5e5;
          padding: 0.5rem 0.875rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .pagination-custom li button:hover:not(:disabled) {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #000000;
        }

        .pagination-custom li.active button {
          background: #ff7a00;
          border-color: #ff7a00;
          color: #000000;
        }

        .pagination-custom li.disabled button {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-header {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-toggle-btn {
            width: 100%;
          }

          .filters-section {
            padding: 1rem;
          }

          .pagination-section {
            flex-direction: column;
          }

          .pagination-custom {
            flex-wrap: wrap;
            justify-content: center;
          }

          .pagination-custom li button {
            padding: 0.375rem 0.75rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}

export default InterviewDetailsPageView
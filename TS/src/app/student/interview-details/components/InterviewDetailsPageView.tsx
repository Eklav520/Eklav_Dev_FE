import React, { useEffect, useMemo, useState } from 'react'
import {
  Container,
  Spinner,
  Alert,
  Row,
  Col,
  Form,
  Button,
  Pagination
} from 'react-bootstrap'
import JobCard from './JobCard'
import JobDetailsModal from './JobDetailsModal'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'
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

  /* 🔍 Filters */
  const [domain, setDomain] = useState('')
  const [jobType, setJobType] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState('')

  /* 📄 Pagination */
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
      setJobs(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* 🔍 Filter logic */
  const filteredJobs = useMemo(() => {
    setCurrentPage(1)

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

  /* 📄 Pagination logic */
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

  return (
    <Container className="py-3 py-md-4">
      <h4 className="mb-3" style={{ color: '#ff7a00' }}>
        Available Jobs
      </h4>

      {/* 🔍 FILTER BAR */}
      <Form className="mb-4">
        <Row className="g-2">
          <Col md={3}>
            <Form.Select value={domain} onChange={e => setDomain(e.target.value)}>
              <option value="">All Domains</option>
              <option value="Tech">Tech</option>
              <option value="Non-Tech">Non-Tech</option>
            </Form.Select>
          </Col>

          <Col md={3}>
            <Form.Select value={jobType} onChange={e => setJobType(e.target.value)}>
              <option value="">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Fresher">Fresher</option>
              <option value="Experienced">Experienced</option>
            </Form.Select>
          </Col>

          <Col md={3}>
            <Form.Control
              placeholder="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </Col>

          <Col md={3}>
            <Form.Control
              placeholder="Skill (React, Java, etc)"
              value={skills}
              onChange={e => setSkills(e.target.value)}
            />
          </Col>
        </Row>

        <div className="mt-2 text-end">
          <Button
            size="sm"
            style={{
              backgroundColor: 'transparent',
              borderColor: '#ff7a00',
              color: '#ff7a00'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff7a00'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#ff7a00'
            }}

            onClick={() => {
              setDomain('')
              setJobType('')
              setLocation('')
              setSkills('')
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Form>

      {/* 📦 CONTENT */}
      {loading ? (
        <Spinner animation="border" />
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : paginatedJobs.length === 0 ? (
        <Alert variant="info">No jobs found</Alert>
      ) : (
        paginatedJobs.map(job => (
          <JobCard key={job._id} job={job} onViewDetails={setSelectedJob} />
        ))
      )}

      {/* 📄 PAGINATION */}
      {totalPages > 1 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-4 pt-3 border-top">
          {/* LEFT INFO */}
          <p className="mb-2 mb-sm-0 text-secondary small">
            Showing{' '}
            <strong>
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredJobs.length)}
            </strong>{' '}
            of <strong>{filteredJobs.length}</strong> jobs
          </p>

          {/* PAGINATION */}
          <nav aria-label="Job pagination">
            <ul className="pagination pagination-sm pagination-primary-soft mb-0">
              {/* PREVIOUS */}
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <Button
                  className="page-link"
                  style={{
                    color: '#ff7a00',
                    borderColor: '#ff7a00'
                  }}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <FaAngleLeft />
                </Button>
              </li>

              {/* PAGE NUMBERS */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <li
                  key={page}
                  className={`page-item ${currentPage === page ? 'active' : ''}`}
                >
                  <Button
                    style={{
                      color: currentPage === page ? '#fff' : '#ff7a00',
                      backgroundColor: currentPage === page ? '#ff7a00' : 'transparent',
                      borderColor: '#ff7a00'
                    }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </li>
              ))}

              {/* NEXT */}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <Button
                  className="page-link"

                  onClick={() =>
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <FaAngleRight />
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      )}
      <JobDetailsModal
        show={!!selectedJob}
        onHide={() => setSelectedJob(null)}
        job={selectedJob}
        onMarkedAsRead={handleMarkedAsRead}
      />
    </Container>
  )
}

export default InterviewDetailsPageView

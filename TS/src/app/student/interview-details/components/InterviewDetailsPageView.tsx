import React, { useEffect, useState } from 'react'
import { Container, Spinner, Alert } from 'react-bootstrap'
import JobCard from './JobCard'
import JobDetailsModal from './JobDetailsModal'

export interface Job {
  _id: string
  title: string
  company: string
  rating: number
  reviews: number
  experience: string
  salary: string
  location: string
  description: string
  skills: string[]
  logo: string
  postedDate: string
  tag?: string
}

const InterviewDetailsPageView = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${baseURL}/jobs`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      setJobs(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job)
    setShowModal(true)
  }

  return (
    <Container className="py-3 py-md-4 px-3 px-md-4">
      <h4 className="mb-3 mb-md-4">Available Jobs</h4>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading jobs...</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="mx-2 mx-md-0">
          {error}
        </Alert>
      ) : jobs.length === 0 ? (
        <Alert variant="info" className="mx-2 mx-md-0">
          No jobs available right now.
        </Alert>
      ) : (
        <div className="d-flex flex-column gap-3">
          {jobs.map((job) => (
            <div key={job._id} className="job-card-wrapper">
              <JobCard job={job} onViewDetails={handleViewDetails} />
            </div>
          ))}
        </div>
      )}

      <JobDetailsModal
        show={showModal}
        onHide={() => setShowModal(false)}
        job={selectedJob}
      />
    </Container>
  )
}

export default InterviewDetailsPageView
import React from 'react'
import { Card, Button, Badge } from 'react-bootstrap'
import { FaEye, FaMapMarkerAlt, FaBriefcase, FaStar, FaMoneyBillAlt } from 'react-icons/fa'
import styles from './JobCard.module.css'

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

interface Props {
  job: Job
  onViewDetails: (job: Job) => void
}

const JobCard: React.FC<Props> = ({ job, onViewDetails }) => {
  // Format date to handle invalid dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Recently'
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Recently'
    }
  }

  return (
    <Card className={`border-0 shadow-sm ${styles.jobCard}`}>
      <Card.Body className={styles.cardBody}>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1 me-3">
            <h5 className={`fw-bold ${styles.title}`}>{job.title}</h5>
            <div className={`d-flex align-items-center gap-2 ${styles.companyText}`}>
              <span>{job.company}</span>
              {job.rating > 0 && (
                <span className="d-flex align-items-center gap-1">
                  <FaStar className="text-warning" size={12} />
                  <span>{job.rating}</span>
                </span>
              )}
            </div>
          </div>

          {job.tag && (
            <Badge bg="success" className="px-2 py-1 align-self-start" style={{ fontSize: '0.75rem' }}>
              {job.tag}
            </Badge>
          )}
        </div>

        {/* Job Details - Fixed wrapping */}
        <div className={styles.jobDetailsContainer}>
          <span className={styles.detailItem}>
            <FaBriefcase size={12} />
            <span>{job.experience}</span>
          </span>
          <span className={styles.detailItem}>
            <FaMapMarkerAlt size={12} />
            <span>{job.location}</span>
          </span>
          {job.salary && job.salary.trim() && (
            <span className={styles.detailItem}>
              <FaMoneyBillAlt size={12} />
              <span>{job.salary}</span>
            </span>
          )}
        </div>

        {/* Skills Section */}
        <div className={styles.skillsContainer}>
          <div className={styles.skillsLabel}>Required Skills:</div>
          <div className={styles.skillsGrid}>
            {job.skills && job.skills.length > 0 ? (
              <>
                {job.skills.slice(0, 4).map((skill, idx) => (
                  <Badge
                    key={idx}
                    className={styles.skillBadge}
                    style={{
                      backgroundColor: '#f8f9fa',
                      color: '#212529',
                      border: '1px solid #dee2e6',
                    }}>
                    {skill}
                  </Badge>
                ))}

                {job.skills.length > 4 && (
                  <Badge
                    className={styles.skillBadgeMore}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                    }}>
                    +{job.skills.length - 4} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted small">No skills specified</span>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.dateText}>
            <small>Posted {formatDate(job.postedDate)}</small>
          </div>

          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onViewDetails(job)}
            className={`d-flex align-items-center ${styles.detailsButton}`}>
            <FaEye className="me-1" size={12} />
            Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default JobCard

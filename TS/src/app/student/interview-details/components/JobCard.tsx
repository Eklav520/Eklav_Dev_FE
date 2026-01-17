import React from 'react'
import { Card, Button, Badge } from 'react-bootstrap'
import {
  FaEye,
  FaMapMarkerAlt,
  FaBriefcase,
  FaMoneyBillAlt,
  FaClock
} from 'react-icons/fa'
import styles from './JobCard.module.css'
import DOMPurify from 'dompurify'

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

  isRead: boolean   // ✅ NEW
  tag?: string
}

interface Props {
  job: Job
  onViewDetails: (job: Job) => void
}

const JobCard: React.FC<Props> = ({ job, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return isNaN(date.getTime())
      ? 'Recently'
      : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  const getExpiryText = (expiryDate: string) => {
    const today = new Date()
    const exp = new Date(expiryDate)

    const diffMs = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Expired'
    if (diffDays === 1) return 'Expires today'
    return `Expires in ${diffDays} days`
  }

const decodeHtml = (html: string) => {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  return txt.value
}

const previewText =
  job.highlights?.length > 0
    ? decodeHtml(
        DOMPurify.sanitize(job.highlights[0], { ALLOWED_TAGS: [] })
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 140)
    : ''


  return (
    <Card
      className={`border-0 shadow-sm ${styles.jobCard}`}
      style={{
        opacity: job.isRead ? 0.85 : 1   // 🔹 subtle hint (optional)
      }}
    >
      <Card.Body className={styles.cardBody}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1 me-2">
            <h5 className={`fw-bold ${styles.title}`}>{job.title}</h5>
            <div className={styles.companyText}>{job.company}</div>

            <div className="d-flex gap-2 mt-1 flex-wrap">
              <Badge bg="primary" pill>
                {job.jobType}
              </Badge>
              <Badge bg="secondary" pill>
                {job.domain}
              </Badge>

              {job.tag && (
                <Badge bg="success" pill>
                  {job.tag}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className={styles.jobDetailsContainer}>
          <span className={styles.detailItem}>
            <FaBriefcase size={12} />
            <span>{job.experience || 'Any Experience'}</span>
          </span>

          <span className={styles.detailItem}>
            <FaMapMarkerAlt size={12} />
            <span>{job.location}</span>
          </span>

          {job.salary && (
            <span className={styles.detailItem}>
              <FaMoneyBillAlt size={12} />
              <span>{job.salary}</span>
            </span>
          )}
        </div>

        {/* Highlights */}
        {previewText && (
  <p className={styles.highlightsPreview}>
    {previewText}…
  </p>
)}

        {/* Skills */}
        <div className={styles.skillsContainer}>
          {job.skills?.slice(0, 4).map((skill, idx) => (
            <Badge key={idx} className={styles.skillBadge}>
              {skill}
            </Badge>
          ))}

          {job.skills?.length > 4 && (
            <Badge bg="light" text="dark" className={styles.skillBadge}>
              +{job.skills.length - 4} more
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.dateText}>
            <FaClock size={12} className="me-1" />
            <small>
              Posted {formatDate(job.postedDate)} • {getExpiryText(job.expiryDate)}
            </small>
          </div>

          <div className="d-flex align-items-center gap-2">
            {job.isRead && (
              <Badge bg="success" pill>
                Marked as Read
              </Badge>
            )}

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onViewDetails(job)}
              className={styles.detailsButton}
            >
              <FaEye size={12} className="me-1" />
              Details
            </Button>
          </div>
        </div>

      </Card.Body>
    </Card>
  )
}

export default JobCard

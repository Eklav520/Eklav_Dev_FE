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

  const decodeHTMLEntities = (text: string) => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }


  const previewText =
    job.highlights?.length > 0
      ? decodeHTMLEntities(
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
        opacity: job.isRead ? 0.85 : 1,
        borderLeft: '4px solid #ff7a00'
      }}
    >

      <Card.Body className={styles.cardBody}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1 me-2">
            <h5 className={`fw-bold ${styles.title}`}>{job.title}</h5>
            <div className={styles.companyText}>{job.company}</div>

            <div className="d-flex gap-2 mt-1 flex-wrap">

              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#ff7a00',
                  color: '#fff'
                }}
              >
                {job.jobType}
              </span>

              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#ff7a00',
                  color: '#fff',
                  opacity: 0.85
                }}
              >
                {job.domain}
              </span>

              {job.tag && (
                <span
                  style={{
                    padding: '6px 12px',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#ff7a00',
                    color: '#fff',
                    opacity: 0.7
                  }}
                >
                  {job.tag}
                </span>
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
            <Badge
              key={idx}
              className={styles.skillBadge}
              style={{
                backgroundColor: '#fff3e6',
                color: '#a54d00',
                border: '1px solid #ff7a00'
              }}
            >

              {skill}
            </Badge>
          ))}

          {job.skills?.length > 4 && (
            <Badge
              className={styles.skillBadge}
              style={{
                backgroundColor: '#fff3e6',
                color: '#a54d00',
                border: '1px solid #ff7a00'
              }}
            >

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
              <Badge
                pill
                style={{
                  backgroundColor: '#ff7a00',
                  color: '#fff'
                }}
              >

                Marked as Read
              </Badge>
            )}

            <Button
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

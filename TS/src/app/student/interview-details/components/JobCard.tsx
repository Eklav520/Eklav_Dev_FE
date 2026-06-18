import React, { useMemo, useState } from 'react'
import { Card, Button, Badge, Modal } from 'react-bootstrap'
import {
  FaEye,
  FaLock,
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
  attachments?: Array<{
    fileName?: string
    fileUrl?: string
    mimeType?: string
    size?: number
  }>
}

interface Props {
  job: Job
  onViewDetails: (job: Job) => void
  canViewDetails?: boolean
}

const JobCard: React.FC<Props> = ({ job, onViewDetails, canViewDetails = false }) => {
  const [previewOpen, setPreviewOpen] = useState(false)

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

  const firstImageAttachment = useMemo(() => {
    const list = job.attachments || []
    return list.find((att) => {
      const mime = (att.mimeType || '').toLowerCase()
      if (mime.startsWith('image/')) return true
      const src = (att.fileUrl || att.fileName || '').toLowerCase()
      return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].some((ext) => src.includes(ext))
    })
  }, [job.attachments])

  const getFileExtension = (fileName?: string, fileUrl?: string) => {
    const raw = fileName || fileUrl || ''
    const withoutQuery = raw.split('?')[0]
    const clean = decodeURIComponent(withoutQuery)
    const filePart = clean.split('/').pop() || ''
    const extMatch = filePart.match(/\.([a-zA-Z0-9]+)$/)
    return extMatch ? extMatch[1].toLowerCase() : ''
  }

  const displayImageName = useMemo(() => {
    if (!firstImageAttachment) return 'Attachment Preview'
    return job.title
  }, [firstImageAttachment, job.title])

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

          <div className={styles.footerRight}>
            {firstImageAttachment?.fileUrl && (
              <button
                type="button"
                className={`${styles.previewThumbButton} ${styles.previewThumbFloating}`}
                onClick={() => setPreviewOpen(true)}
                title="Click to view image"
              >
                <img
                  src={firstImageAttachment.fileUrl}
                  alt={firstImageAttachment.fileName || 'Job attachment'}
                  className={styles.previewThumbImage}
                />
              </button>
            )}

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

              {canViewDetails ? (
                <Button
                  style={{ backgroundColor: 'transparent', borderColor: '#ff7a00', color: '#ff7a00' }}
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
              ) : (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '0.25rem 0.75rem', borderRadius: 6,
                    border: '1px solid #333', background: '#111',
                    color: '#555', fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'not-allowed', userSelect: 'none',
                  }}
                  title="Available only for approved subscription"
                >
                  <FaLock size={11} />
                  Locked
                </span>
              )}
            </div>
          </div>
        </div>

      </Card.Body>

      <Modal
        show={previewOpen}
        onHide={() => setPreviewOpen(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{displayImageName}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: '#0f1115' }}>
          {firstImageAttachment?.fileUrl && (
            <img
              src={firstImageAttachment.fileUrl}
              alt={displayImageName}
              style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 8 }}
            />
          )}
        </Modal.Body>
      </Modal>
    </Card>
  )
}

export default JobCard

import React, { useEffect, useState } from 'react'
import { Modal, Badge, Button, Container, Row, Col, Card } from 'react-bootstrap'
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaTools,
  FaClock,
  FaBriefcase,
  FaTimes,
  FaBullseye,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaShare,
  FaCheckCircle,
  FaUserTie,
  FaChartLine,
  FaExternalLinkAlt,
  FaStar,
  FaRegBookmark,
  FaBookmark,
  FaEye,
  FaEyeSlash,
  FaTimesCircle
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

interface Job {
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
  postedDate: string
  expiryDate: string
  isRead: boolean
  tag?: string
  attachments?: Array<{
    fileName?: string
    fileUrl?: string
    mimeType?: string
    size?: number
  }>
}

interface Props {
  show: boolean
  onHide: () => void
  job: Job | null
  onMarkedAsRead: (jobId: string) => void
}

const JobDetailsModal: React.FC<Props> = ({
  show,
  job,
  onHide,
  onMarkedAsRead
}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [isRead, setIsRead] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<{
    fileName?: string
    fileUrl?: string
    mimeType?: string
    size?: number
  } | null>(null)

  useEffect(() => {
    if (job) {
      setIsRead(job.isRead)
      // Check if job is bookmarked from localStorage
      const bookmarked = localStorage.getItem(`job_${job._id}_bookmarked`)
      setIsBookmarked(bookmarked === 'true')
    }
  }, [job])

  if (!job) return null

  const getExpiryText = () => {
    const today = new Date()
    const exp = new Date(job.expiryDate)
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return { text: 'Expired', color: '#dc3545', icon: FaTimesCircle }
    if (diffDays === 1) return { text: 'Expires today', color: '#ffc107', icon: FaClock }
    if (diffDays <= 3) return { text: `Expires in ${diffDays} days`, color: '#ffc107', icon: FaClock }
    return { text: `Expires in ${diffDays} days`, color: '#28a745', icon: FaClock }
  }

  const handleMarkAsRead = async () => {
    if (isRead || loading || !token) return

    try {
      setLoading(true)
      const res = await fetch(`${baseURL}/jobs/${job._id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to mark job as read')
      setIsRead(true)
      onMarkedAsRead(job._id)
    } catch (err) {
      console.error('❌ Mark as read failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity: ${job.title} at ${job.company}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleBookmark = () => {
    const newBookmarkState = !isBookmarked
    setIsBookmarked(newBookmarkState)
    localStorage.setItem(`job_${job._id}_bookmarked`, String(newBookmarkState))
  }

  const getJobTypeIcon = () => {
    switch (job.jobType) {
      case 'Internship': return { icon: '🎓', color: '#17a2b8' }
      case 'Fresher': return { icon: '🌟', color: '#28a745' }
      case 'Experienced': return { icon: '💼', color: '#ffc107' }
      default: return { icon: '📋', color: '#6c757d' }
    }
  }

  const getDomainIcon = () => {
    switch (job.domain) {
      case 'Tech': return { icon: '💻', color: '#ff7a00' }
      case 'Non-Tech': return { icon: '📊', color: '#20c997' }
      default: return { icon: '🏢', color: '#6c757d' }
    }
  }

  const isImageAttachment = (attachment: { fileName?: string; fileUrl?: string; mimeType?: string }) => {
    if ((attachment.mimeType || '').startsWith('image/')) return true
    const url = (attachment.fileUrl || attachment.fileName || '').toLowerCase()
    return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].some(ext => url.includes(ext))
  }

  const imageAttachments = (job.attachments || []).filter(isImageAttachment)
  const otherAttachments = (job.attachments || []).filter(att => !isImageAttachment(att))

  const expiryInfo = getExpiryText()
  const ExpiryIcon = expiryInfo.icon
  const isExpired = new Date(job.expiryDate) < new Date()
  const jobTypeInfo = getJobTypeIcon()
  const domainInfo = getDomainIcon()

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        fullscreen
        centered
        className="job-details-modal"
      >
        {/* Header */}
        <Modal.Header className="modal-header-custom">
          <div className="modal-header-content">
            <div className="company-info">
              <div className="company-logo-placeholder">
                {job.company.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="modal-title">{job.title}</h4>
                <p className="company-name">{job.company}</p>
              </div>
            </div>
            <div className="modal-actions">
              <Button 
                className="action-btn bookmark-btn" 
                onClick={handleBookmark}
                title={isBookmarked ? 'Remove from bookmarks' : 'Bookmark this job'}
              >
                {isBookmarked ? <FaBookmark className="me-2" /> : <FaRegBookmark className="me-2" />}
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>
              <Button className="action-btn share-btn" onClick={handleShare}>
                <FaShare className="me-2" />
                Share
              </Button>
            </div>
          </div>
          <Button className="close-header-btn" onClick={onHide}>
            <FaTimes />
          </Button>
        </Modal.Header>

        {/* Body */}
        <Modal.Body className="modal-body-custom">
          <div className="job-details-wrapper">
            {/* Job Tags */}
            <div className="tags-section">
              <span className="job-tag" style={{ background: `${jobTypeInfo.color}20`, borderColor: jobTypeInfo.color }}>
                {jobTypeInfo.icon} {job.jobType}
              </span>
              <span className="job-tag" style={{ background: `${domainInfo.color}20`, borderColor: domainInfo.color }}>
                {domainInfo.icon} {job.domain}
              </span>
              {job.tag && (
                <span className="job-tag highlight">
                  🏷️ {job.tag}
                </span>
              )}
              {isRead && (
                <span className="job-tag read">
                  <FaCheckCircle className="me-1" />
                  Read
                </span>
              )}
            </div>

            {/* Job Overview Section */}
            <div className="overview-section">
              <h6 className="section-title">
                <FaBriefcase className="section-icon" />
                Job Overview
              </h6>
              <div className="overview-grid">
                <div className="overview-item">
                  <FaUserTie className="overview-icon" />
                  <div>
                    <span className="overview-label">Job Type</span>
                    <span className="overview-value">{job.jobType}</span>
                  </div>
                </div>
                <div className="overview-item">
                  <FaChartLine className="overview-icon" />
                  <div>
                    <span className="overview-label">Domain</span>
                    <span className="overview-value">{job.domain}</span>
                  </div>
                </div>
                <div className="overview-item">
                  <FaMapMarkerAlt className="overview-icon" />
                  <div>
                    <span className="overview-label">Location</span>
                    <span className="overview-value">{job.location}</span>
                  </div>
                </div>
                <div className="overview-item">
                  <FaMoneyBillWave className="overview-icon" />
                  <div>
                    <span className="overview-label">Salary</span>
                    <span className="overview-value">{job.salary || 'Not disclosed'}</span>
                  </div>
                </div>
                <div className="overview-item">
                  <FaClock className="overview-icon" />
                  <div>
                    <span className="overview-label">Experience</span>
                    <span className="overview-value">{job.experience || 'Not specified'}</span>
                  </div>
                </div>
                <div className="overview-item">
                  <FaCalendarAlt className="overview-icon" />
                  <div>
                    <span className="overview-label">Posted Date</span>
                    <span className="overview-value">
                      {new Date(job.postedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            {job.skills && job.skills.length > 0 && (
              <div className="skills-section">
                <h6 className="section-title">
                  <FaTools className="section-icon" />
                  Required Skills
                </h6>
                <div className="skills-list">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="skill-badge">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights Section */}
            {job.highlights && job.highlights.length > 0 && (
              <div className="highlights-section">
                <h6 className="section-title">
                  <FaBullseye className="section-icon" />
                  Key Highlights
                </h6>
                <div 
                  className="highlights-content"
                  dangerouslySetInnerHTML={{
                    __html: job.highlights[0] || ''
                  }}
                />
              </div>
            )}

            {(job.attachments || []).length > 0 && (
              <div className="attachments-section">
                <h6 className="section-title">
                  <FaEye className="section-icon" />
                  Attachments
                </h6>

                {imageAttachments.length > 0 && (
                  <>
                    <p className="attachment-subtitle">Images</p>
                    <div className="attachment-grid">
                      {imageAttachments.map((attachment, index) => (
                        <button
                          key={`${attachment.fileUrl || attachment.fileName || 'img'}-${index}`}
                          type="button"
                          className="image-attachment-btn"
                          onClick={() => setPreviewAttachment(attachment)}
                        >
                          <img
                            src={attachment.fileUrl}
                            alt={attachment.fileName || `Attachment ${index + 1}`}
                            className="attachment-image"
                          />
                          <span className="attachment-caption">
                            {attachment.fileName || `Image ${index + 1}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {otherAttachments.length > 0 && (
                  <>
                    <p className="attachment-subtitle mt-3">Files</p>
                    <div className="file-attachment-list">
                      {otherAttachments.map((attachment, index) => (
                        <a
                          key={`${attachment.fileUrl || attachment.fileName || 'file'}-${index}`}
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="file-attachment-link"
                        >
                          <FaExternalLinkAlt className="me-2" />
                          {attachment.fileName || `File ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Expiry Alert */}
            {isExpired && (
              <div className="expiry-alert">
                <FaTimesCircle className="alert-icon" />
                <div>
                  <strong>This job posting has expired</strong>
                  <p>Applications are no longer being accepted for this position.</p>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer className="modal-footer-custom">
          <div className="expiry-info">
            <ExpiryIcon className="expiry-icon" style={{ color: expiryInfo.color }} />
            <span className={isExpired ? 'expired-text' : ''} style={{ color: expiryInfo.color }}>
              {expiryInfo.text}
            </span>
          </div>
          <div className="footer-actions">
            <Button className="close-btn" onClick={onHide}>
              <FaTimes className="me-2" />
              Close
            </Button>
            {!isRead && !isExpired ? (
              <Button 
                className="mark-read-btn"
                onClick={handleMarkAsRead}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Marking...
                  </>
                ) : (
                  <>
                    <FaEye className="me-2" />
                    Mark as Read
                  </>
                )}
              </Button>
            ) : isRead && (
              <Button className="read-btn" disabled>
                <FaCheckCircle className="me-2" />
                Marked as Read
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>

      <Modal
        show={!!previewAttachment}
        onHide={() => setPreviewAttachment(null)}
        centered
        size="lg"
        className="image-preview-modal"
      >
        <Modal.Header closeButton className="image-preview-header">
          <Modal.Title className="image-preview-title">Attachment Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="image-preview-body">
          {previewAttachment?.fileUrl && (
            <img
              src={previewAttachment.fileUrl}
              alt={previewAttachment.fileName || 'Attachment preview'}
              className="preview-image"
            />
          )}
          <div className="preview-meta">
            <div><strong>Name:</strong> {previewAttachment?.fileName || 'N/A'}</div>
            <div><strong>Type:</strong> {previewAttachment?.mimeType || 'Image'}</div>
            <div>
              <strong>Size:</strong>{' '}
              {typeof previewAttachment?.size === 'number'
                ? `${(previewAttachment.size / 1024).toFixed(1)} KB`
                : 'N/A'}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="image-preview-footer">
          {previewAttachment?.fileUrl && (
            <Button
              className="action-btn share-btn"
              onClick={() => window.open(previewAttachment.fileUrl, '_blank')}
            >
              <FaExternalLinkAlt className="me-2" />
              Open Original
            </Button>
          )}
          <Button className="close-btn" onClick={() => setPreviewAttachment(null)}>
            <FaTimes className="me-2" />
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .job-details-modal .modal-content {
          background: #0a0a0a;
          border: none;
          border-radius: 0;
          min-height: 100vh;
        }

        /* Modal Header */
        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.25rem 2rem;
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex: 1;
        }

        .company-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .company-logo-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000000;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .modal-title {
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .company-name {
          color: #ff7a00;
          font-size: 1rem;
          margin: 0.25rem 0 0 0;
        }

        .modal-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid #ff7a00;
          color: #ff7a00;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .action-btn:hover {
          background: #ff7a00;
          color: #000000;
        }

        .close-header-btn {
          background: transparent;
          border: none;
          color: #8a8a8a;
          font-size: 1.25rem;
          padding: 0.5rem;
          transition: all 0.2s ease;
        }

        .close-header-btn:hover {
          color: #ff7a00;
        }

        /* Modal Body */
        .modal-body-custom {
          padding: 2rem;
          overflow-y: auto;
          flex: 1;
          max-height: calc(100vh - 140px);
        }

      .job-details-wrapper {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0 2rem;
      }

        /* Tags Section */
        .tags-section {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .job-tag {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          border: 1px solid rgba(255, 122, 0, 0.3);
        }

        .job-tag.highlight {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          color: #000000;
          border: none;
        }

        .job-tag.read {
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border-color: rgba(40, 167, 69, 0.3);
        }

        /* Section Styles */
        .section-title {
          color: #ff7a00;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-icon {
          font-size: 1rem;
        }

        /* Overview Section */
        .overview-section {
          background: #000000;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .overview-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #0a0a0a;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .overview-item:hover {
          background: #141414;
          transform: translateX(2px);
        }

        .overview-icon {
          font-size: 1.25rem;
          color: #ff7a00;
        }

        .overview-label {
          display: block;
          color: #8a8a8a;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .overview-value {
          display: block;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Skills Section */
        .skills-section {
          background: #000000;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .skill-badge {
          background: rgba(255, 122, 0, 0.1);
          color: #ff7a00;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .skill-badge:hover {
          background: rgba(255, 122, 0, 0.2);
          transform: translateY(-2px);
        }

        /* Highlights Section */
        .highlights-section {
          background: #000000;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .highlights-content {
          color: #e5e5e5;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .highlights-content h3 {
          color: #ff7a00;
          font-size: 1rem;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .highlights-content p {
          margin-bottom: 0.75rem;
        }

        .highlights-content ul, 
        .highlights-content ol {
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .highlights-content li {
          margin-bottom: 0.5rem;
        }

        .attachments-section {
          background: #000000;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .attachment-subtitle {
          color: #bdbdbd;
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .attachment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.9rem;
        }

        .image-attachment-btn {
          border: 1px solid #2d2d2d;
          background: #0f0f0f;
          border-radius: 10px;
          padding: 0.45rem;
          text-align: left;
          transition: all 0.2s ease;
          cursor: pointer;
          color: #e5e5e5;
        }

        .image-attachment-btn:hover {
          border-color: #ff7a00;
          transform: translateY(-2px);
        }

        .attachment-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 8px;
          display: block;
          background: #1a1a1a;
        }

        .attachment-caption {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.78rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-attachment-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-attachment-link {
          color: #ffb069;
          text-decoration: none;
          border: 1px solid #2d2d2d;
          border-radius: 8px;
          padding: 0.55rem 0.75rem;
          display: inline-flex;
          align-items: center;
          width: fit-content;
        }

        .file-attachment-link:hover {
          border-color: #ff7a00;
          color: #ff7a00;
        }

        .image-preview-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
        }

        .image-preview-header,
        .image-preview-footer {
          border-color: #1f1f1f;
          background: #0a0a0a;
        }

        .image-preview-title {
          color: #ff7a00;
          font-size: 1rem;
        }

        .image-preview-body {
          background: #000000;
        }

        .preview-image {
          width: 100%;
          max-height: 60vh;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid #2a2a2a;
          background: #0f0f0f;
        }

        .preview-meta {
          margin-top: 0.9rem;
          color: #d2d2d2;
          display: grid;
          gap: 0.35rem;
          font-size: 0.84rem;
        }

        /* Expiry Alert */
        .expiry-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 8px;
          padding: 1rem;
        }

        .expiry-alert .alert-icon {
          color: #dc3545;
          font-size: 1.25rem;
        }

        .expiry-alert strong {
          color: #dc3545;
          display: block;
          margin-bottom: 0.25rem;
        }

        .expiry-alert p {
          color: #e5e5e5;
          margin: 0;
          font-size: 0.85rem;
        }

        /* Modal Footer */
        .modal-footer-custom {
          background: #000000;
          border-top: 1px solid #1f1f1f;
          padding: 1rem 2rem;
          position: sticky;
          bottom: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .expiry-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .expiry-icon {
          font-size: 1rem;
        }

        .expired-text {
          color: #dc3545;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        .close-btn {
          background: #2c2c2c;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #ffffff;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .close-btn:hover {
          background: #3a3a3a;
        }

        .mark-read-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        .mark-read-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .read-btn {
          background: #28a745;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #ffffff;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }

        .spinner-small {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid #000000;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Scrollbar */
        .modal-body-custom::-webkit-scrollbar {
          width: 10px;
        }

        .modal-body-custom::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        .modal-body-custom::-webkit-scrollbar-thumb {
          background: #ff7a00;
          border-radius: 5px;
        }

        .modal-body-custom::-webkit-scrollbar-thumb:hover {
          background: #ff944d;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .modal-header-custom {
            padding: 1rem;
          }

          .modal-header-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .modal-actions {
            width: 100%;
          }

          .action-btn {
            flex: 1;
            justify-content: center;
          }

          .modal-body-custom {
            padding: 1rem;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .modal-footer-custom {
            flex-direction: column;
            padding: 1rem;
          }

          .footer-actions {
            width: 100%;
            flex-direction: column;
          }

          .close-btn, .mark-read-btn, .read-btn {
            width: 100%;
            justify-content: center;
          }

          .expiry-info {
            justify-content: center;
          }

          .company-info {
            flex-direction: column;
            text-align: center;
          }

          .company-logo-placeholder {
            margin: 0 auto;
          }
        }
        .job-details-modal .modal-dialog {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
        }

        .job-details-modal .modal-content {
          width: 100% !important;
        }
      `}</style>
    </>
  )
}

export default JobDetailsModal
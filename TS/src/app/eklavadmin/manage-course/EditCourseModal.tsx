// components/course/EditCourseModal.tsx
import { Modal, Button, Form, Tab, Nav, Row, Col, Badge, Spinner, Alert, InputGroup, Card } from 'react-bootstrap'
import { 
  FaRegEdit, 
  FaCheckCircle, 
  FaLink,
  FaImage,
  FaVideo,
  FaList,
  FaQuestionCircle,
  FaPlus,
  FaTimes,
  FaEye,
  FaHashtag,
  FaDollarSign,
  FaTag,
  FaPlayCircle,
  FaDownload,
  FaExternalLinkAlt,
  FaUpload
} from 'react-icons/fa'
import { useState, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const CS_LANGUAGES = [
  { value: 'java',       label: 'Java' },
  { value: 'python',     label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript (Node.js)' },
  { value: 'cpp',        label: 'C++' },
  { value: 'c',          label: 'C' },
  { value: 'csharp',     label: 'C#' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'go',         label: 'Go' },
  { value: 'rust',       label: 'Rust' },
  { value: 'php',        label: 'PHP' },
  { value: 'ruby',       label: 'Ruby' },
]

interface CaseStudy {
  title?: string
  description?: string
  inputExample?: string
  expectedOutput?: string
  boilerplate?: string
  language?: string
}

interface Video {
  _id: string
  video: string
  description: string
  caseStudy?: CaseStudy | null
  progress?: number
}

interface FAQ {
  question: string
  answer: string
}

interface Quiz {
  question: string
  options: string[]
  correctAnswer: string
}

interface Course {
  _id: string
  title: string
  shortDescription?: string
  category: string[] | string
  level?: string[] | string
  language?: string[] | string
  visibility?: 'public' | 'private'
  courseType?: 'paid' | 'free'
  courseStatus?: 'active' | 'inactive'
  isFeatured?: boolean
  features?: string[]
  previewVideo?: string
  duration?: string
  totalLectures?: string
  price?: string | number
  discountPrice?: string | number
  description?: string
  image?: string
  videoUrl?: string[]
  videos: Video[]
  addFAQ: FAQ[]
  quiz?: Quiz[]
  createdAt?: string
  updatedAt?: string
  enrolledStudents?: number
  rating?: number
  status?: 'Draft' | 'Published' | 'Archived'
}

interface EditCourseModalProps {
  show: boolean
  onHide: () => void
  selectedCourse: Course | null
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onFeaturesChange: (featuresText: string) => void
  onVideoUrlChange: (urlsText: string) => void
  onFAQChange: (index: number, field: keyof FAQ, value: string) => void
  onAddFAQ: () => void
  onRemoveFAQ: (index: number) => void
  onUpdate: () => void
  onSaveCaseStudy?: (videoIndex: number, draft: CaseStudy) => void
  isUpdating: boolean
  onVideoChange?: (index: number, field: keyof Video, value: string | CaseStudy | null) => void
  onAddVideo?: () => void
  onRemoveVideo?: (index: number) => void
  onUploadVideo?: (file: File, description: string, onProgress: (loaded: number, total: number) => void) => Promise<void>
  onQuizChange?: (index: number, field: keyof Quiz, value: string | string[]) => void
  onQuizOptionChange?: (quizIndex: number, optionIndex: number, value: string) => void
  onAddQuiz?: () => void
  onRemoveQuiz?: (index: number) => void
  onAddQuizOption?: (quizIndex: number) => void
  onRemoveQuizOption?: (quizIndex: number, optionIndex: number) => void
  onImageFileSelect?: (file: File) => void
}

const EditCourseModal = ({
  show,
  onHide,
  selectedCourse,
  onFormChange,
  onFeaturesChange,
  onVideoUrlChange,
  onFAQChange,
  onAddFAQ,
  onRemoveFAQ,
  onUpdate,
  onSaveCaseStudy,
  isUpdating,
  onVideoChange,
  onAddVideo,
  onRemoveVideo,
  onUploadVideo,
  onQuizChange,
  onQuizOptionChange,
  onAddQuiz,
  onRemoveQuiz,
  onAddQuizOption,
  onRemoveQuizOption,
  onImageFileSelect,
}: EditCourseModalProps) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedBytes, setUploadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [videoDescription, setVideoDescription] = useState('')
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [caseStudyModal, setCaseStudyModal] = useState<{
    open: boolean
    videoIndex: number
    draft: CaseStudy
  }>({ open: false, videoIndex: -1, draft: {} })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageFileInputRef = useRef<HTMLInputElement>(null)

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'blockquote'],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  }
  
  const getCategoryText = (category: string[] | string) => {
    return Array.isArray(category) ? category.join(', ') : category
  }


  // Handle video file selection
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file (mp4, mov, avi, etc.)')
        return
      }
      
      // Check file size (limit to 5GB)
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert('File size too large. Please select a video under 5GB')
        return
      }
      
      setSelectedVideoFile(file)
      // Set default description from filename
      setVideoDescription(file.name.replace(/\.[^/.]+$/, "")) // Remove extension
    }
  }

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !onUploadVideo) {
      alert('Please select a video file first')
      return
    }
    
    if (!videoDescription.trim()) {
      alert('Please enter a description for the video')
      return
    }
    
    try {
      setUploadingVideo(true)
      setUploadProgress(0)
      setUploadedBytes(0)
      setTotalBytes(selectedVideoFile.size)

      const fileSize = selectedVideoFile.size
      await onUploadVideo(selectedVideoFile, videoDescription, (loaded) => {
        const clamped = Math.min(loaded, fileSize)
        setUploadedBytes(clamped)
        setUploadProgress(Math.round((clamped / fileSize) * 100))
      })

      setUploadProgress(100)
      setUploadedBytes(selectedVideoFile.size)
      setTimeout(() => {
        setUploadingVideo(false)
        setUploadProgress(0)
        setUploadedBytes(0)
        setTotalBytes(0)
        setSelectedVideoFile(null)
        setVideoDescription('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 500)
    } catch (error) {
      setUploadingVideo(false)
      setUploadProgress(0)
      setUploadedBytes(0)
      setTotalBytes(0)
      alert('Failed to upload video: ' + (error as Error).message)
    }
  }

  // Handle video description change
  const handleVideoDescriptionChange = (index: number, value: string) => {
    if (onVideoChange) {
      onVideoChange(index, 'description', value)
    }
  }

  // Handle video URL change
  const handleVideoUrlChange = (index: number, value: string) => {
    if (onVideoChange) {
      onVideoChange(index, 'video', value)
    }
  }

  // Handle removing a video
  const handleRemoveVideo = (index: number) => {
    if (onRemoveVideo && window.confirm('Are you sure you want to remove this video?')) {
      onRemoveVideo(index)
    }
  }

  // Get filename from URL
  const getFilenameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      return pathname.substring(pathname.lastIndexOf('/') + 1)
    } catch {
      return url.substring(url.lastIndexOf('/') + 1)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const tabs = [
    { key: 'basic',    label: 'Basic Info',  icon: <FaHashtag size={13} /> },
    { key: 'content',  label: 'Content',     icon: <FaList size={13} /> },
    { key: 'media',    label: 'Media',       icon: <FaImage size={13} /> },
    { key: 'pricing',  label: 'Pricing',     icon: <FaDollarSign size={13} /> },
    { key: 'faq',      label: 'FAQs',        icon: <FaQuestionCircle size={13} /> },
    { key: 'quiz',     label: 'Quiz',        icon: <FaList size={13} /> },
    { key: 'settings', label: 'Settings',    icon: <FaTag size={13} /> },
  ]

  return (
    <>
    <Modal show={show} onHide={onHide} size="xl" fullscreen centered scrollable>

      {/* ── Header ── */}
      <div className="ecm-header">
        <div className="ecm-header-left">
          <div className="ecm-header-icon"><FaRegEdit size={14} /></div>
          <div>
            <div className="ecm-header-title">{selectedCourse?.title || 'Loading…'}</div>
            <div className="ecm-header-sub">Edit Course</div>
          </div>
        </div>
        <button className="ecm-close-btn" onClick={onHide} aria-label="Close">✕</button>
      </div>

      <Modal.Body className="ecm-body p-0">
        {!selectedCourse ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: '#ff8c00' }} />
            <p className="mt-3 text-muted small">Loading course data…</p>
          </div>
        ) : (
          <div className="ecm-layout">
            {/* Sidebar tabs */}
            <nav className="ecm-sidebar">
              {tabs.map(t => (
                <button
                  key={t.key}
                  className={`ecm-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <span className="ecm-tab-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Content area */}
            <div className="ecm-content">

              {/* ── Basic Info ── */}
              {activeTab === 'basic' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">Basic Information</div>
                  <Row className="g-3">
                    <Col md={8}>
                      <div className="ecm-field">
                        <label className="ecm-label">Course Title <span className="text-danger">*</span></label>
                        <input className="ecm-input" type="text" name="title" value={selectedCourse.title} onChange={onFormChange} placeholder="Enter course title" />
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="ecm-field">
                        <label className="ecm-label">Category <span className="text-danger">*</span></label>
                        <input className="ecm-input" type="text" name="category" value={getCategoryText(selectedCourse.category)} onChange={onFormChange} placeholder="e.g., Information Technology" />
                        <span className="ecm-hint">Separate multiple with commas</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="ecm-field">
                        <label className="ecm-label">Short Description</label>
                        <textarea className="ecm-input" rows={3} name="shortDescription" value={selectedCourse.shortDescription || ''} onChange={onFormChange} placeholder="Brief overview (appears in listings)" />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="ecm-field">
                        <label className="ecm-label">Course Level</label>
                        <select className="ecm-input" name="level" value={Array.isArray(selectedCourse.level) ? selectedCourse.level[0] : selectedCourse.level || ''} onChange={onFormChange}>
                          <option value="">Select Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="All level">All Levels</option>
                        </select>
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="ecm-field">
                        <label className="ecm-label">Full Description</label>
                        <div className="ecm-quill-wrap">
                          <ReactQuill
                            theme="snow"
                            value={selectedCourse.description || ''}
                            onChange={(value) => onFormChange({ target: { name: 'description', value, type: 'text' } } as any)}
                            modules={quillModules}
                            style={{ height: 280 }}
                          />
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="ecm-field">
                        <label className="ecm-label">Duration</label>
                        <input className="ecm-input" type="text" name="duration" value={selectedCourse.duration || ''} onChange={onFormChange} placeholder="e.g., 65 Hr" />
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="ecm-field">
                        <label className="ecm-label">Total Lectures</label>
                        <input className="ecm-input" type="text" name="totalLectures" value={selectedCourse.totalLectures || ''} onChange={onFormChange} placeholder="e.g., 70" />
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="ecm-field">
                        <label className="ecm-label">Enrolled Students</label>
                        <input className="ecm-input" type="number" name="enrolledStudents" value={selectedCourse.enrolledStudents || 0} onChange={onFormChange} min="0" />
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* ── Content ── */}
              {activeTab === 'content' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">
                    Course Features
                    <span className="ecm-count">{selectedCourse.features?.length || 0}</span>
                  </div>
                  <div className="ecm-field">
                    <label className="ecm-label">One feature per line</label>
                    <textarea
                      className="ecm-input ecm-mono"
                      rows={14}
                      value={selectedCourse.features?.join('\n') || ''}
                      onChange={(e) => onFeaturesChange(e.target.value)}
                      placeholder={"Beginner to Intermediate Python Course\nNo Prior Programming Experience Required\nStructured, Module-Wise Video Lessons\nHands-on Coding & Practice Sessions"}
                    />
                    <span className="ecm-hint">These appear as bullet points on the course page.</span>
                  </div>
                </div>
              )}

              {/* ── Media ── */}
              {activeTab === 'media' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">Course Image &amp; Preview</div>
                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <div className="ecm-field">
                        <label className="ecm-label"><FaImage size={11} className="me-1" />Course Image</label>
                        {(imagePreviewUrl || selectedCourse.image) && (
                          <img
                            src={imagePreviewUrl || selectedCourse.image}
                            alt="Course"
                            className="ecm-img-preview"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        )}
                        <input
                          ref={imageFileInputRef}
                          type="file"
                          accept="image/*"
                          className="ecm-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) { setImagePreviewUrl(URL.createObjectURL(file)); onImageFileSelect?.(file) }
                          }}
                        />
                        <span className="ecm-hint">Or paste an existing URL below</span>
                        <input className="ecm-input mt-1" type="text" name="image" value={selectedCourse.image || ''} onChange={onFormChange} placeholder="https://example.com/image.jpg" />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="ecm-field">
                        <label className="ecm-label"><FaVideo size={11} className="me-1" />Preview Video URL</label>
                        <input className="ecm-input" type="text" name="previewVideo" value={selectedCourse.previewVideo || ''} onChange={onFormChange} placeholder="https://example.com/video.mp4" />
                        {selectedCourse.previewVideo && (
                          <a href={selectedCourse.previewVideo} target="_blank" rel="noopener noreferrer" className="ecm-link mt-2">
                            <FaLink size={11} className="me-1" />
                            {selectedCourse.previewVideo.substring(0, 50)}…
                          </a>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Uploaded Videos */}
                  <div className="ecm-section-title mb-3">
                    Uploaded Videos
                    <span className="ecm-count">{selectedCourse.videos.length}</span>
                    {onAddVideo && (
                      <button className="ecm-btn-sm ms-auto" onClick={onAddVideo} disabled={uploadingVideo}>
                        <FaPlus size={11} className="me-1" /> Add URL
                      </button>
                    )}
                  </div>

                  {selectedCourse.videos.length === 0 ? (
                    <div className="ecm-empty">
                      <FaVideo size={24} className="mb-2 opacity-25" />
                      <p className="mb-0 small">No videos yet. Upload one below or add a URL.</p>
                    </div>
                  ) : (
                    <div className="row g-3 mb-4">
                      {selectedCourse.videos.map((video, index) => (
                        <Col md={6} lg={4} key={video._id || index}>
                          <div className="ecm-video-card">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted small"><FaPlayCircle size={11} className="me-1 text-orange" />Video #{index + 1}</span>
                              {onRemoveVideo && (
                                <button className="ecm-icon-btn ecm-icon-btn-danger" onClick={() => handleRemoveVideo(index)}>
                                  <FaTimes size={10} />
                                </button>
                              )}
                            </div>
                            <div className="ecm-field mb-2">
                              <label className="ecm-label">Description</label>
                              <input className="ecm-input" type="text" value={video.description} onChange={(e) => handleVideoDescriptionChange(index, e.target.value)} placeholder="Video description" />
                            </div>
                            <div className="ecm-field mb-2">
                              <label className="ecm-label">Video URL</label>
                              <input className="ecm-input" type="text" value={video.video} onChange={(e) => handleVideoUrlChange(index, e.target.value)} placeholder="https://…" />
                            </div>
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <label className="ecm-check-label">
                                <input
                                  type="checkbox"
                                  checked={!!video.caseStudy}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCaseStudyModal({ open: true, videoIndex: index, draft: video.caseStudy || {} })
                                    } else {
                                      onVideoChange?.(index, 'caseStudy', null)
                                    }
                                  }}
                                  className="me-1"
                                />
                                Case Study
                              </label>
                              {video.caseStudy && (
                                <button className="ecm-btn-sm" onClick={() => setCaseStudyModal({ open: true, videoIndex: index, draft: { ...video.caseStudy } })}>
                                  Edit
                                </button>
                              )}
                            </div>
                            {video.caseStudy?.title && (
                              <span className="ecm-cs-badge mt-1"><FaCheckCircle size={10} className="me-1" />{video.caseStudy.title}</span>
                            )}
                            <div className="d-flex gap-2 mt-2">
                              <button className="ecm-icon-btn flex-grow-1" disabled={!video.video} onClick={() => window.open(video.video, '_blank')} title="Open">
                                <FaExternalLinkAlt size={11} />
                              </button>
                              <button className="ecm-icon-btn flex-grow-1" disabled={!video.video} onClick={() => { const a = document.createElement('a'); a.href = video.video; a.download = getFilenameFromUrl(video.video); document.body.appendChild(a); a.click(); document.body.removeChild(a) }} title="Download">
                                <FaDownload size={11} />
                              </button>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </div>
                  )}

                  {/* Upload Section */}
                  {onUploadVideo && (
                    <div className="ecm-upload-box">
                      <div className="ecm-section-title mb-3"><FaUpload size={12} className="me-2" />Upload New Video</div>
                      <Row className="g-3">
                        <Col md={6}>
                          <div className="ecm-field">
                            <label className="ecm-label">Video File</label>
                            <input ref={fileInputRef} type="file" accept="video/*" className="ecm-file-input" onChange={handleVideoFileSelect} disabled={uploadingVideo} />
                            <span className="ecm-hint">MP4, MOV, AVI — max 5 GB</span>
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="ecm-field">
                            <label className="ecm-label">Description</label>
                            <input className="ecm-input" type="text" value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} placeholder="Enter video description" disabled={uploadingVideo} />
                          </div>
                        </Col>
                      </Row>
                      {selectedVideoFile && (
                        <div className="ecm-file-info">
                          <span><strong>{selectedVideoFile.name}</strong> — {formatFileSize(selectedVideoFile.size)}</span>
                          <button className="ecm-icon-btn ecm-icon-btn-danger" disabled={uploadingVideo} onClick={() => { setSelectedVideoFile(null); setVideoDescription(''); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                            <FaTimes size={10} />
                          </button>
                        </div>
                      )}
                      {uploadingVideo && (
                        <div className="ecm-progress-wrap">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted small">{formatFileSize(uploadedBytes)} / {formatFileSize(totalBytes)}</span>
                            <span style={{ color: '#ff8c00', fontWeight: 600, fontSize: '0.82rem' }}>{uploadProgress}%</span>
                          </div>
                          <div className="ecm-progress-track">
                            <div className="ecm-progress-bar" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}
                      <button
                        className="ecm-upload-btn mt-3"
                        onClick={handleVideoUpload}
                        disabled={!selectedVideoFile || uploadingVideo || !videoDescription.trim()}
                      >
                        {uploadingVideo ? <><Spinner as="span" size="sm" animation="border" className="me-2" />Uploading…</> : <><FaUpload size={13} className="me-2" />Upload Video</>}
                      </button>
                    </div>
                  )}

                  {/* Additional URLs */}
                  <div className="ecm-field mt-4">
                    <label className="ecm-label">
                      <FaLink size={11} className="me-1" />Additional Video URLs
                      <span className="ecm-count ms-2">{selectedCourse.videoUrl?.length || 0}</span>
                    </label>
                    <textarea
                      className="ecm-input ecm-mono"
                      rows={5}
                      value={selectedCourse.videoUrl?.join('\n') || ''}
                      onChange={(e) => onVideoUrlChange(e.target.value)}
                      placeholder={"https://example.com/video1.mp4\nhttps://example.com/video2.mp4"}
                    />
                    <span className="ecm-hint">One URL per line.</span>
                  </div>
                </div>
              )}

              {/* ── Pricing ── */}
              {activeTab === 'pricing' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">Pricing</div>
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="ecm-field">
                        <label className="ecm-label">Original Price (₹)</label>
                        <input className="ecm-input" type="text" name="price" value={selectedCourse.price || ''} onChange={onFormChange} placeholder="0.00" />
                        <span className="ecm-hint">Leave empty for a free course</span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="ecm-field">
                        <label className="ecm-label">Discounted Price (₹)</label>
                        <input className="ecm-input" type="text" name="discountPrice" value={selectedCourse.discountPrice || ''} onChange={onFormChange} placeholder="0.00" />
                        <span className="ecm-hint">Special offer price (optional)</span>
                      </div>
                    </Col>
                  </Row>
                  {selectedCourse.price && selectedCourse.discountPrice && (() => {
                    const p = parseFloat(selectedCourse.price as string) || 0
                    const d = parseFloat(selectedCourse.discountPrice as string) || 0
                    if (p > 0 && d > 0) {
                      const pct = ((p - d) / p * 100).toFixed(0)
                      return (
                        <div className="ecm-info-banner mt-3">
                          <FaCheckCircle size={13} className="me-2" style={{ color: '#20c374' }} />
                          Discount applied — save ₹{(p - d).toFixed(2)} ({pct}% off)
                          <span className="ecm-cs-badge ms-auto">On Sale</span>
                        </div>
                      )
                    }
                    return null
                  })()}
                  {(!selectedCourse.price || selectedCourse.price === '') && (
                    <div className="ecm-info-banner mt-3">
                      <FaCheckCircle size={13} className="me-2" style={{ color: '#20c374' }} />
                      This course is marked as <strong>Free</strong>
                    </div>
                  )}
                </div>
              )}

              {/* ── FAQs ── */}
              {activeTab === 'faq' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">
                    FAQs
                    <span className="ecm-count">{selectedCourse.addFAQ.length}</span>
                    <button className="ecm-btn-sm ms-auto" onClick={onAddFAQ}>
                      <FaPlus size={11} className="me-1" /> Add FAQ
                    </button>
                  </div>
                  {selectedCourse.addFAQ.length === 0 ? (
                    <div className="ecm-empty">
                      <FaQuestionCircle size={24} className="mb-2 opacity-25" />
                      <p className="mb-0 small">No FAQs yet. Click "Add FAQ" to create one.</p>
                    </div>
                  ) : (
                    selectedCourse.addFAQ.map((faq, index) => (
                      <div key={index} className="ecm-faq-card">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted small">FAQ #{index + 1}</span>
                          <button className="ecm-icon-btn ecm-icon-btn-danger" onClick={() => onRemoveFAQ(index)}>
                            <FaTimes size={10} />
                          </button>
                        </div>
                        <Row className="g-2">
                          <Col md={6}>
                            <div className="ecm-field">
                              <label className="ecm-label">Question</label>
                              <input className="ecm-input" type="text" value={faq.question} onChange={(e) => onFAQChange(index, 'question', e.target.value)} placeholder="Enter question" />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="ecm-field">
                              <label className="ecm-label">Answer</label>
                              <textarea className="ecm-input" rows={3} value={faq.answer} onChange={(e) => onFAQChange(index, 'answer', e.target.value)} placeholder="Enter answer" />
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── Quiz ── */}
              {activeTab === 'quiz' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">
                    Quiz Questions
                    <span className="ecm-count">{selectedCourse.quiz?.length || 0}</span>
                    {onAddQuiz && (
                      <button className="ecm-btn-sm ms-auto" onClick={onAddQuiz}>
                        <FaPlus size={11} className="me-1" /> Add Question
                      </button>
                    )}
                  </div>
                  {!selectedCourse.quiz || selectedCourse.quiz.length === 0 ? (
                    <div className="ecm-empty">
                      <FaQuestionCircle size={24} className="mb-2 opacity-25" />
                      <p className="mb-0 small">No quiz questions yet.</p>
                    </div>
                  ) : (
                    selectedCourse.quiz.map((q, qi) => (
                      <div key={qi} className="ecm-quiz-card">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted small fw-semibold">Q{qi + 1}</span>
                          {onRemoveQuiz && (
                            <button className="ecm-icon-btn ecm-icon-btn-danger" onClick={() => onRemoveQuiz(qi)}>
                              <FaTimes size={10} />
                            </button>
                          )}
                        </div>
                        <div className="ecm-field mb-3">
                          <label className="ecm-label">Question</label>
                          <input className="ecm-input" type="text" value={q.question} onChange={(e) => onQuizChange?.(qi, 'question', e.target.value)} placeholder="Enter question" />
                        </div>
                        <div className="ecm-field mb-2">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <label className="ecm-label mb-0">Options <span className="ecm-hint ms-1">(select correct answer)</span></label>
                            {onAddQuizOption && (
                              <button className="ecm-btn-sm" onClick={() => onAddQuizOption(qi)}>
                                <FaPlus size={10} className="me-1" /> Add
                              </button>
                            )}
                          </div>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                              <input
                                type="radio"
                                name={`cA-${qi}`}
                                checked={q.correctAnswer === opt}
                                onChange={() => onQuizChange?.(qi, 'correctAnswer', opt)}
                                className="flex-shrink-0"
                                style={{ accentColor: '#ff8c00' }}
                              />
                              <input className="ecm-input" type="text" value={opt} onChange={(e) => onQuizOptionChange?.(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} />
                              {onRemoveQuizOption && q.options.length > 2 && (
                                <button className="ecm-icon-btn ecm-icon-btn-danger flex-shrink-0" onClick={() => onRemoveQuizOption(qi, oi)}>
                                  <FaTimes size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {q.correctAnswer && (
                          <div className="ecm-info-banner">
                            <FaCheckCircle size={11} className="me-2" style={{ color: '#20c374' }} />
                            Correct: <strong className="ms-1">{q.correctAnswer}</strong>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── Settings ── */}
              {activeTab === 'settings' && (
                <div className="ecm-section">
                  <div className="ecm-section-title">Course Settings</div>
                  <Row className="g-3 mb-4">
                    {[
                      { label: 'Language', name: 'language', value: Array.isArray(selectedCourse.language) ? selectedCourse.language[0] : selectedCourse.language || '', options: [['', 'Select Language'], ['English', 'English'], ['Hindi', 'Hindi'], ['Spanish', 'Spanish'], ['French', 'French'], ['German', 'German']] },
                      { label: 'Visibility', name: 'visibility', value: selectedCourse.visibility || 'public', options: [['public', 'Public'], ['private', 'Private']] },
                      { label: 'Course Type', name: 'courseType', value: selectedCourse.courseType || 'paid', options: [['paid', 'Paid'], ['free', 'Free']] },
                      { label: 'Publish Status', name: 'status', value: selectedCourse.status || 'Draft', options: [['Draft', 'Draft'], ['Published', 'Published'], ['Archived', 'Archived']] },
                      { label: 'Active Status', name: 'courseStatus', value: selectedCourse.courseStatus || 'active', options: [['active', 'Active'], ['inactive', 'Inactive']] },
                    ].map(({ label, name, value, options }) => (
                      <Col md={4} key={name}>
                        <div className="ecm-field">
                          <label className="ecm-label">{label}</label>
                          <select className="ecm-input" name={name} value={value} onChange={onFormChange}>
                            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </Col>
                    ))}
                    <Col md={4}>
                      <div className="ecm-field">
                        <label className="ecm-label">Rating (0–5)</label>
                        <input className="ecm-input" type="number" name="rating" value={selectedCourse.rating || 0} onChange={onFormChange} min="0" max="5" step="0.1" />
                      </div>
                    </Col>
                  </Row>

                  <label className="ecm-check-label mb-4">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={selectedCourse.isFeatured || false}
                      onChange={(e) => onFormChange({ target: { name: 'isFeatured', value: e.target.checked, type: 'checkbox' } } as any)}
                      className="me-2"
                      style={{ accentColor: '#ff8c00', width: 16, height: 16 }}
                    />
                    <strong className="text-white">Featured Course</strong>
                    <span className="text-muted ms-2 small">Highlight in the featured section</span>
                  </label>

                  <div className="ecm-meta-grid">
                    <div className="ecm-section-title mb-3">Metadata</div>
                    {[
                      { label: 'Course ID', value: selectedCourse._id },
                      { label: 'Created', value: new Date(selectedCourse.createdAt || '').toLocaleString() },
                      { label: 'Last Updated', value: new Date(selectedCourse.updatedAt || '').toLocaleString() },
                      { label: 'Total Videos', value: String(selectedCourse.videos.length) },
                    ].map(({ label, value }) => (
                      <div key={label} className="ecm-field">
                        <label className="ecm-label">{label}</label>
                        <input className="ecm-input ecm-readonly" type="text" value={value} readOnly />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </Modal.Body>

      {/* ── Footer ── */}
      <div className="ecm-footer">
        <button className="ecm-btn-outline" onClick={onHide}>Cancel</button>
        {selectedCourse && (
          <div className="d-flex gap-2">
            <button className="ecm-btn-outline" onClick={() => window.open(`/course/${selectedCourse._id}`, '_blank')}>
              <FaEye size={12} className="me-1" /> Preview
            </button>
            <button className="ecm-btn-save" onClick={onUpdate} disabled={isUpdating}>
              {isUpdating
                ? <><Spinner as="span" size="sm" animation="border" className="me-2" />Saving…</>
                : <><FaCheckCircle size={12} className="me-1" />Save Changes</>}
            </button>
          </div>
        )}
      </div>
    </Modal>

    {/* ── Case Study Modal ── */}
    <Modal show={caseStudyModal.open} onHide={() => setCaseStudyModal(p => ({ ...p, open: false }))} size="lg" centered backdrop="static">
      <div className="ecm-header">
        <div className="ecm-header-left">
          <div className="ecm-header-icon"><FaRegEdit size={14} /></div>
          <div>
            <div className="ecm-header-title">Case Study Editor</div>
            <div className="ecm-header-sub">Video #{caseStudyModal.videoIndex + 1}</div>
          </div>
        </div>
        <button className="ecm-close-btn" onClick={() => setCaseStudyModal(p => ({ ...p, open: false }))} aria-label="Close">✕</button>
      </div>
      <Modal.Body className="ecm-body" style={{ padding: '1.5rem' }}>
        <Row className="g-3">
          <Col md={8}>
            <div className="ecm-field">
              <label className="ecm-label">Title <span className="text-danger">*</span></label>
              <input className="ecm-input" type="text" value={caseStudyModal.draft.title || ''} onChange={(e) => setCaseStudyModal(p => ({ ...p, draft: { ...p.draft, title: e.target.value } }))} placeholder="e.g., Fibonacci Sequence" />
            </div>
          </Col>
          <Col md={4}>
            <div className="ecm-field">
              <label className="ecm-label">Language <span className="text-danger">*</span></label>
              <select
                className="ecm-input"
                value={caseStudyModal.draft.language || 'java'}
                onChange={(e) => setCaseStudyModal(p => ({ ...p, draft: { ...p.draft, language: e.target.value } }))}
              >
                {CS_LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </Col>
          <Col md={12}>
            <div className="ecm-field">
              <label className="ecm-label">Description</label>
              <textarea className="ecm-input" rows={3} value={caseStudyModal.draft.description || ''} onChange={(e) => setCaseStudyModal(p => ({ ...p, draft: { ...p.draft, description: e.target.value } }))} placeholder="Describe the problem…" />
            </div>
          </Col>
          <Col md={6}>
            <div className="ecm-field">
              <label className="ecm-label">Input Example</label>
              <textarea className="ecm-input ecm-mono" rows={3} value={caseStudyModal.draft.inputExample || ''} onChange={(e) => setCaseStudyModal(p => ({ ...p, draft: { ...p.draft, inputExample: e.target.value } }))} placeholder="n = 10" />
            </div>
          </Col>
          <Col md={6}>
            <div className="ecm-field">
              <label className="ecm-label">Expected Output</label>
              <textarea className="ecm-input ecm-mono" rows={3} value={caseStudyModal.draft.expectedOutput || ''} onChange={(e) => setCaseStudyModal(p => ({ ...p, draft: { ...p.draft, expectedOutput: e.target.value } }))} placeholder="0 1 1 2 3 5 8 13 21 34" />
            </div>
          </Col>
          <Col md={12}>
            <div className="ecm-field">
              <label className="ecm-label">Boilerplate Code</label>
              <textarea className="ecm-input ecm-mono" rows={7} value={caseStudyModal.draft.boilerplate || ''} onChange={(e) => setCaseStudyModal(p => ({ ...p, draft: { ...p.draft, boilerplate: e.target.value } }))} placeholder={"def fibonacci(n):\n    # write your code here\n    pass"} />
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <div className="ecm-footer">
        <button className="ecm-btn-outline" onClick={() => setCaseStudyModal(p => ({ ...p, open: false }))}>Cancel</button>
        <button
          className="ecm-btn-save"
          disabled={!caseStudyModal.draft.title?.trim() || isUpdating}
          onClick={() => {
            const { videoIndex, draft } = caseStudyModal
            setCaseStudyModal(p => ({ ...p, open: false }))
            if (onSaveCaseStudy) {
              onSaveCaseStudy(videoIndex, draft)
            } else {
              onVideoChange?.(videoIndex, 'caseStudy', draft)
              onUpdate()
            }
          }}
        >
          {isUpdating
            ? <><Spinner as="span" size="sm" animation="border" className="me-2" />Saving…</>
            : <><FaCheckCircle size={12} className="me-1" />Save Case Study</>}
        </button>
      </div>
    </Modal>

    <style>{`
      /* ── Modal shell ── */
      .ecm-header {
        display: flex; align-items: center; justify-content: space-between;
        background: #141414; border-bottom: 1px solid rgba(255,140,0,0.15);
        padding: 14px 20px; flex-shrink: 0;
      }
      .ecm-header-left { display: flex; align-items: center; gap: 12px; }
      .ecm-header-icon {
        width: 34px; height: 34px; border-radius: 9px;
        background: rgba(255,140,0,0.12); border: 1px solid rgba(255,140,0,0.25);
        display: flex; align-items: center; justify-content: center; color: #ff8c00;
      }
      .ecm-header-title { color: #fff; font-weight: 600; font-size: 0.95rem; line-height: 1.2; }
      .ecm-header-sub { color: #6c757d; font-size: 0.75rem; margin-top: 1px; }
      .ecm-close-btn {
        background: none; border: none; color: #6c757d;
        font-size: 18px; line-height: 1; cursor: pointer; padding: 4px 8px;
        border-radius: 6px; transition: color 0.15s, background 0.15s;
      }
      .ecm-close-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }

      .ecm-body { background: #141414; }

      /* ── Layout ── */
      .ecm-layout { display: flex; height: 100%; min-height: 0; }
      .ecm-sidebar {
        width: 180px; flex-shrink: 0; background: #0e0e0e;
        border-right: 1px solid #1e1e1e; padding: 12px 8px;
        display: flex; flex-direction: column; gap: 2px;
      }
      .ecm-tab-btn {
        display: flex; align-items: center; gap: 8px;
        width: 100%; background: none; border: none;
        color: #6c757d; font-size: 0.82rem; padding: 9px 12px;
        border-radius: 8px; cursor: pointer; text-align: left;
        transition: background 0.15s, color 0.15s;
      }
      .ecm-tab-btn:hover { background: #1a1a1a; color: #ccc; }
      .ecm-tab-btn.active { background: rgba(255,140,0,0.1); color: #ff8c00; font-weight: 600; }
      .ecm-tab-icon { width: 18px; display: flex; align-items: center; justify-content: center; }
      .ecm-content { flex: 1; overflow-y: auto; background: #141414; padding: 0; }

      /* ── Section ── */
      .ecm-section { padding: 20px 24px; }
      .ecm-section-title {
        display: flex; align-items: center; gap: 8px;
        font-size: 0.7rem; font-weight: 700; letter-spacing: 0.7px;
        text-transform: uppercase; color: #6c757d;
        margin-bottom: 16px; padding-bottom: 10px;
        border-bottom: 1px solid #1e1e1e;
      }
      .ecm-count {
        background: rgba(255,140,0,0.1); border: 1px solid rgba(255,140,0,0.2);
        color: #ff8c00; border-radius: 10px; padding: 1px 8px; font-size: 0.7rem;
      }

      /* ── Fields ── */
      .ecm-field { display: flex; flex-direction: column; }
      .ecm-label {
        font-size: 0.75rem; font-weight: 600; color: #9ca3af;
        margin-bottom: 5px; display: flex; align-items: center; gap: 4px;
      }
      .ecm-hint { font-size: 0.7rem; color: #555; margin-top: 4px; }
      .ecm-input {
        background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 8px;
        color: #e0e0e0; font-size: 0.85rem; padding: 8px 12px;
        outline: none; width: 100%; transition: border-color 0.2s;
        resize: vertical;
      }
      .ecm-input:focus { border-color: rgba(255,140,0,0.5); }
      .ecm-input::placeholder { color: #444; }
      .ecm-input option { background: #1e1e1e; }
      .ecm-readonly { color: #6c757d !important; cursor: default; }
      .ecm-mono { font-family: 'Courier New', monospace; font-size: 0.82rem !important; }

      /* Quill override */
      .ecm-quill-wrap .ql-toolbar { background: #1e1e1e; border-color: #2a2a2a !important; border-radius: 8px 8px 0 0; }
      .ecm-quill-wrap .ql-container { background: #1a1a1a; border-color: #2a2a2a !important; border-radius: 0 0 8px 8px; color: #e0e0e0; }
      .ecm-quill-wrap .ql-editor { min-height: 280px; }
      .ecm-quill-wrap { margin-bottom: 60px; }
      .ecm-quill-wrap .ql-stroke { stroke: #9ca3af !important; }
      .ecm-quill-wrap .ql-fill { fill: #9ca3af !important; }
      .ecm-quill-wrap .ql-picker-label { color: #9ca3af !important; }

      /* ── File input ── */
      .ecm-file-input {
        background: #1e1e1e; border: 1px dashed #333; border-radius: 8px;
        color: #9ca3af; font-size: 0.82rem; padding: 8px 12px; width: 100%;
        cursor: pointer;
      }
      .ecm-file-input::-webkit-file-upload-button {
        background: #2a2a2a; border: 1px solid #444; color: #ccc;
        border-radius: 6px; padding: 4px 10px; font-size: 0.78rem; cursor: pointer;
      }
      .ecm-file-info {
        display: flex; align-items: center; justify-content: space-between;
        background: rgba(255,140,0,0.06); border: 1px solid rgba(255,140,0,0.2);
        border-radius: 8px; padding: 8px 12px; color: #e0e0e0; font-size: 0.82rem; margin-top: 10px;
      }

      /* ── Buttons ── */
      .ecm-btn-sm {
        background: #252525; border: 1px solid #333; color: #ccc;
        border-radius: 6px; padding: 4px 10px; font-size: 0.75rem;
        cursor: pointer; display: inline-flex; align-items: center;
        transition: border-color 0.15s, color 0.15s;
      }
      .ecm-btn-sm:hover:not(:disabled) { border-color: #ff8c00; color: #ff8c00; }
      .ecm-btn-sm:disabled { opacity: 0.4; cursor: not-allowed; }
      .ecm-icon-btn {
        background: #252525; border: 1px solid #2a2a2a; color: #9ca3af;
        border-radius: 6px; padding: 5px 8px; cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background 0.15s, color 0.15s;
      }
      .ecm-icon-btn:hover:not(:disabled) { background: #333; color: #fff; }
      .ecm-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      .ecm-icon-btn-danger:hover { background: rgba(220,53,69,0.15) !important; color: #f87171 !important; border-color: rgba(220,53,69,0.3) !important; }
      .ecm-upload-btn {
        width: 100%; background: #ff8c00; border: none; color: #fff;
        border-radius: 8px; padding: 10px; font-size: 0.85rem; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.2s;
      }
      .ecm-upload-btn:hover:not(:disabled) { background: #e67e00; }
      .ecm-upload-btn:disabled { opacity: 0.45; cursor: not-allowed; }

      /* ── Progress ── */
      .ecm-progress-wrap { margin-top: 10px; }
      .ecm-progress-track {
        height: 6px; background: #252525; border-radius: 3px; overflow: hidden;
      }
      .ecm-progress-bar {
        height: 100%; background: linear-gradient(90deg, #ff8c00, #ffa500);
        border-radius: 3px; transition: width 0.3s ease;
      }

      /* ── Cards ── */
      .ecm-video-card, .ecm-faq-card, .ecm-quiz-card {
        background: #1a1a1a; border: 1px solid #252525; border-radius: 10px;
        padding: 14px; margin-bottom: 12px;
      }
      .ecm-upload-box {
        background: #1a1a1a; border: 1px solid rgba(255,140,0,0.15);
        border-radius: 10px; padding: 16px;
      }

      /* ── Misc ── */
      .ecm-img-preview {
        width: 100%; max-height: 150px; object-fit: cover;
        border-radius: 8px; border: 1px solid #2a2a2a; margin-bottom: 10px; display: block;
      }
      .ecm-link {
        display: flex; align-items: center; color: #ff8c00;
        font-size: 0.78rem; text-decoration: none; margin-top: 8px;
      }
      .ecm-link:hover { text-decoration: underline; }
      .ecm-empty {
        text-align: center; padding: 36px; color: #555;
        background: #1a1a1a; border: 1px dashed #252525; border-radius: 10px;
      }
      .ecm-check-label {
        display: flex; align-items: center; cursor: pointer; color: #9ca3af;
        font-size: 0.82rem;
      }
      .ecm-cs-badge {
        display: inline-flex; align-items: center;
        background: rgba(32,195,116,0.1); border: 1px solid rgba(32,195,116,0.25);
        color: #20c374; border-radius: 20px; padding: 2px 8px; font-size: 0.7rem;
      }
      .ecm-info-banner {
        display: flex; align-items: center;
        background: rgba(32,195,116,0.06); border: 1px solid rgba(32,195,116,0.2);
        border-radius: 8px; padding: 10px 14px; color: #9ca3af; font-size: 0.83rem;
      }
      .ecm-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

      /* ── Footer ── */
      .ecm-footer {
        display: flex; align-items: center; justify-content: space-between;
        background: #0e0e0e; border-top: 1px solid #1e1e1e;
        padding: 12px 20px; flex-shrink: 0;
      }
      .ecm-btn-outline {
        background: transparent; border: 1px solid #333; color: #9ca3af;
        border-radius: 8px; padding: 8px 16px; font-size: 0.83rem; cursor: pointer;
        transition: border-color 0.15s, color 0.15s;
      }
      .ecm-btn-outline:hover { border-color: #555; color: #ccc; }
      .ecm-btn-save {
        background: #ff8c00; border: none; color: #fff;
        border-radius: 8px; padding: 8px 20px; font-size: 0.83rem;
        font-weight: 600; cursor: pointer; display: flex; align-items: center;
        transition: background 0.2s;
      }
      .ecm-btn-save:hover:not(:disabled) { background: #e67e00; }
      .ecm-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

      .text-orange { color: #ff8c00; }
    `}</style>
    </>
  )
}

export default EditCourseModal
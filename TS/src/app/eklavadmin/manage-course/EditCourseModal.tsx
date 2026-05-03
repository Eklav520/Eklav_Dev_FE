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

interface CaseStudy {
  title?: string
  description?: string
  inputExample?: string
  expectedOutput?: string
  boilerplate?: string
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
  isUpdating: boolean
  onVideoChange?: (index: number, field: keyof Video, value: string | CaseStudy | null) => void
  onAddVideo?: () => void
  onRemoveVideo?: (index: number) => void
  onUploadVideo?: (file: File, description: string) => Promise<void>
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
      
      // Check file size (limit to 500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('File size too large. Please select a video under 500MB')
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
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      await onUploadVideo(selectedVideoFile, videoDescription)
      
      setUploadProgress(100)
      setTimeout(() => {
        setUploadingVideo(false)
        setUploadProgress(0)
        setSelectedVideoFile(null)
        setVideoDescription('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 500)
      
      clearInterval(interval)
    } catch (error) {
      setUploadingVideo(false)
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

  return (
    <>
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      fullscreen={true}
      centered
      scrollable={true}
    >
      <Modal.Header closeButton className="bg-dark">
        <Modal.Title className="text-white">
          <FaRegEdit className="me-2" />
          Edit Course: {selectedCourse?.title || 'Loading...'}
        </Modal.Title>
        {selectedCourse && (
          <Badge bg="info" className="ms-2">
            ID: {selectedCourse._id.substring(0, 8)}...
          </Badge>
        )}
      </Modal.Header>
      <Modal.Body style={{ overflowY: 'auto' }}>
        {!selectedCourse ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading course data...</p>
          </div>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="basic"><FaHashtag className="me-2" />Basic Info</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="content"><FaList className="me-2" />Content</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="media"><FaImage className="me-2" />Media</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="pricing"><FaDollarSign className="me-2" />Pricing</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="faq"><FaQuestionCircle className="me-2" />FAQs</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="quiz"><FaList className="me-2" />Quiz</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="settings"><FaTag className="me-2" />Settings</Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Tab.Content>
              {/* Basic Info Tab - Same as before */}
              <Tab.Pane eventKey="basic">
                <Form>
                  <Row>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Title <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="title" 
                          value={selectedCourse.title} 
                          onChange={onFormChange}
                          required
                          placeholder="Enter course title"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          name="category" 
                          value={getCategoryText(selectedCourse.category)} 
                          onChange={onFormChange}
                          required
                          placeholder="e.g., Information Technology"
                        />
                        <Form.Text className="text-muted">
                          Separate multiple categories with commas
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Short Description</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={3} 
                          name="shortDescription" 
                          value={selectedCourse.shortDescription || ''} 
                          onChange={onFormChange}
                          placeholder="Brief overview of the course (appears in listings)"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Level</Form.Label>
                        <Form.Select 
                          name="level" 
                          value={Array.isArray(selectedCourse.level) ? selectedCourse.level[0] : selectedCourse.level || ''} 
                          onChange={onFormChange}
                        >
                          <option value="">Select Level</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="All level">All Levels</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Full Description - WYSIWYG Editor */}
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Full Description</strong></Form.Label>
                    
                    <div style={{ marginBottom: 60 }}>
                      <ReactQuill
                        theme="snow"
                        value={selectedCourse.description || ''}
                        onChange={(value) =>
                          onFormChange({ target: { name: 'description', value, type: 'text' } } as any)
                        }
                        modules={quillModules}
                        style={{ height: 320 }}
                      />
                    </div>
                  </Form.Group>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Duration</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="duration" 
                          value={selectedCourse.duration || ''} 
                          onChange={onFormChange}
                          placeholder="e.g., 65 Hr"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Total Lectures</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="totalLectures" 
                          value={selectedCourse.totalLectures || ''} 
                          onChange={onFormChange}
                          placeholder="e.g., 70"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Enrolled Students</Form.Label>
                        <Form.Control 
                          type="number" 
                          name="enrolledStudents" 
                          value={selectedCourse.enrolledStudents || 0} 
                          onChange={onFormChange}
                          min="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
              </Tab.Pane>

              {/* Content Tab */}
              <Tab.Pane eventKey="content">
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label>
                      <strong>Course Features</strong>
                      <Badge bg="info" className="ms-2">
                        {selectedCourse.features?.length || 0} features
                      </Badge>
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={10} 
                      value={selectedCourse.features?.join('\n') || ''}
                      onChange={(e) => onFeaturesChange(e.target.value)}
                      placeholder="Enter each feature on a new line:
Beginner to Intermediate Python Course
No Prior Programming Experience Required
Structured, Module-Wise Video Lessons
Hands-on Coding & Practice Sessions
..."
                    />
                    <Form.Text className="text-muted">
                      One feature per line. These will appear as bullet points on the course page.
                    </Form.Text>
                  </Form.Group>
                </Form>
              </Tab.Pane>

              {/* Media Tab - UPDATED with proper video management */}
              <Tab.Pane eventKey="media">
                <Form>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label><FaImage className="me-2" />Course Image</Form.Label>

                        {/* Current image preview */}
                        {(imagePreviewUrl || selectedCourse.image) && (
                          <div className="mb-2">
                            <img
                              src={imagePreviewUrl || selectedCourse.image}
                              alt="Course"
                              className="img-fluid rounded border"
                              style={{ maxHeight: 160, objectFit: 'cover', width: '100%' }}
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                            />
                          </div>
                        )}

                        {/* Upload new image */}
                        <div className="mb-2">
                          <Form.Label className="small text-muted mb-1">Upload new image</Form.Label>
                          <Form.Control
                            ref={imageFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                setImagePreviewUrl(URL.createObjectURL(file))
                                onImageFileSelect?.(file)
                              }
                            }}
                          />
                          <Form.Text className="text-muted">JPG, PNG, WebP etc.</Form.Text>
                        </div>

                        {/* Or paste URL */}
                        <Form.Label className="small text-muted mb-1">Or use existing URL</Form.Label>
                        <Form.Control
                          type="text"
                          name="image"
                          value={selectedCourse.image || ''}
                          onChange={onFormChange}
                          placeholder="https://example.com/image.jpg"
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          <FaVideo className="me-2" />
                          Preview Video URL
                        </Form.Label>
                        <Form.Control 
                          type="text" 
                          name="previewVideo" 
                          value={selectedCourse.previewVideo || ''} 
                          onChange={onFormChange}
                          placeholder="https://example.com/video.mp4"
                        />
                        {selectedCourse.previewVideo && (
                          <div className="mt-2">
                            <div className="border rounded p-2 bg-light">
                              <small className="text-muted">Video URL:</small>
                              <div className="mt-1">
                                <a href={selectedCourse.previewVideo} target="_blank" rel="noopener noreferrer" className="text-truncate d-block">
                                  <FaLink className="me-1" />
                                  {selectedCourse.previewVideo.substring(0, 50)}...
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Uploaded Videos Section */}
                  <Form.Group className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Form.Label className="mb-0">
                        <FaVideo className="me-2" />
                        <strong>Uploaded Course Videos</strong>
                        <Badge bg="info" className="ms-2">
                          {selectedCourse.videos.length} videos
                        </Badge>
                      </Form.Label>
                      {onAddVideo && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={onAddVideo}
                          disabled={uploadingVideo}
                        >
                          <FaPlus className="me-1" /> Add Video URL
                        </Button>
                      )}
                    </div>
                    
                    {selectedCourse.videos.length === 0 ? (
                      <Alert variant="info">
                        <FaVideo className="me-2" />
                        No videos uploaded yet. Upload videos below or add video URLs.
                      </Alert>
                    ) : (
                      <div className="row g-3">
                        {selectedCourse.videos.map((video, index) => (
                          <Col md={6} lg={4} key={video._id || index}>
                            <Card className="h-100">
                              <Card.Body className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    <FaPlayCircle className="text-primary me-2" />
                                    <strong className="text-truncate">
                                      Video #{index + 1}
                                    </strong>
                                  </div>
                                  {onRemoveVideo && (
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm"
                                      onClick={() => handleRemoveVideo(index)}
                                      className="p-0"
                                      style={{ width: '24px', height: '24px' }}
                                    >
                                      <FaTimes size={12} />
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="mb-2">
                                  <small className="text-muted d-block">Description:</small>
                                  <Form.Control
                                    type="text"
                                    value={video.description}
                                    onChange={(e) => handleVideoDescriptionChange(index, e.target.value)}
                                    placeholder="Enter video description"
                                    size="sm"
                                  />
                                </div>

                                <div className="mb-2">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <Form.Check
                                      type="checkbox"
                                      label={<small className="text-muted">Add Case Study</small>}
                                      checked={!!video.caseStudy}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setCaseStudyModal({
                                            open: true,
                                            videoIndex: index,
                                            draft: video.caseStudy || {}
                                          })
                                        } else {
                                          onVideoChange?.(index, 'caseStudy', null)
                                        }
                                      }}
                                    />
                                    {video.caseStudy && (
                                      <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => setCaseStudyModal({
                                          open: true,
                                          videoIndex: index,
                                          draft: { ...video.caseStudy }
                                        })}
                                        style={{ fontSize: 11, padding: '2px 8px' }}
                                      >
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                  {video.caseStudy?.title && (
                                    <small className="text-success d-block mt-1">
                                      <FaCheckCircle className="me-1" />
                                      {video.caseStudy.title}
                                    </small>
                                  )}
                                </div>
                                
                                <div className="mb-2">
                                  <small className="text-muted d-block">Video URL:</small>
                                  {onVideoChange ? (
                                    <>
                                      <Form.Control 
                                        type="text"
                                        value={video.video}
                                        onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                                        placeholder="Enter video URL"
                                        size="sm"
                                        className="mt-1"
                                      />
                                      {video.video && (
                                        <a 
                                          href={video.video} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-truncate d-block small mt-1"
                                          title={video.video}
                                        >
                                          <FaLink className="me-1" />
                                          {getFilenameFromUrl(video.video)}
                                        </a>
                                      )}
                                    </>
                                  ) : (
                                    <a 
                                      href={video.video} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-truncate d-block small"
                                      title={video.video}
                                    >
                                      <FaLink className="me-1" />
                                      {getFilenameFromUrl(video.video)}
                                    </a>
                                  )}
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  <div className="d-flex gap-1">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => window.open(video.video, '_blank')}
                                      title="View Video"
                                      disabled={!video.video}
                                    >
                                      <FaExternalLinkAlt />
                                    </Button>
                                    <Button 
                                      variant="outline-secondary" 
                                      size="sm"
                                      onClick={() => {
                                        if (video.video) {
                                          const link = document.createElement('a')
                                          link.href = video.video
                                          link.download = getFilenameFromUrl(video.video)
                                          document.body.appendChild(link)
                                          link.click()
                                          document.body.removeChild(link)
                                        }
                                      }}
                                      title="Download Video"
                                      disabled={!video.video}
                                    >
                                      <FaDownload />
                                    </Button>
                                  </div>
                                  {video.progress !== undefined && (
                                    <div className="text-end">
                                      <small className="text-success">
                                        <FaCheckCircle className="me-1" />
                                        {video.progress}% Complete
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  {/* Video Upload Section */}
                  {onUploadVideo && (
                    <Card className="mb-4 border-primary">
                      <Card.Header className="bg-primary text-white">
                        <FaUpload className="me-2" />
                        Upload New Video
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Select Video File</Form.Label>
                              <Form.Control 
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoFileSelect}
                                disabled={uploadingVideo}
                              />
                              <Form.Text className="text-muted">
                                Supported formats: MP4, MOV, AVI, WMV, etc. (Max 500MB)
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Video Description</Form.Label>
                              <Form.Control 
                                type="text"
                                value={videoDescription}
                                onChange={(e) => setVideoDescription(e.target.value)}
                                placeholder="Enter video description"
                                disabled={uploadingVideo}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        {selectedVideoFile && (
                          <Alert variant="info" className="mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>Selected File:</strong> {selectedVideoFile.name}
                                <br />
                                <small>Size: {formatFileSize(selectedVideoFile.size)}</small>
                              </div>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => {
                                  setSelectedVideoFile(null)
                                  setVideoDescription('')
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = ''
                                  }
                                }}
                                disabled={uploadingVideo}
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </Alert>
                        )}
                        
                        {uploadingVideo && (
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <small>Uploading...</small>
                              <small>{uploadProgress}%</small>
                            </div>
                            <div className="progress">
                              <div 
                                className="progress-bar progress-bar-striped progress-bar-animated" 
                                role="progressbar" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="primary"
                          onClick={handleVideoUpload}
                          disabled={!selectedVideoFile || uploadingVideo || !videoDescription.trim()}
                          className="w-100"
                        >
                          {uploadingVideo ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" className="me-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FaUpload className="me-2" />
                              Upload Video
                            </>
                          )}
                        </Button>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Additional Video URLs Section */}
                  <Form.Group className="mb-4">
                    <Form.Label>
                      <FaLink className="me-2" />
                      Additional Video URLs
                      <Badge bg="info" className="ms-2">
                        {selectedCourse.videoUrl?.length || 0} URLs
                      </Badge>
                    </Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={6} 
                      value={selectedCourse.videoUrl?.join('\n') || ''}
                      onChange={(e) => onVideoUrlChange(e.target.value)}
                      placeholder="Enter one video URL per line:
https://example.com/video1.mp4
https://example.com/video2.mp4
https://example.com/video3.mp4
..."
                    />
                    <Form.Text className="text-muted">
                      One URL per line. These are additional video URLs (not uploaded files).
                    </Form.Text>
                  </Form.Group>
                </Form>
              </Tab.Pane>

              {/* Pricing Tab */}
              <Tab.Pane eventKey="pricing">
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Original Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="text" 
                            name="price" 
                            value={selectedCourse.price || ''} 
                            onChange={onFormChange}
                            placeholder="0.00"
                          />
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Leave empty for free course
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Discounted Price</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control 
                            type="text" 
                            name="discountPrice" 
                            value={selectedCourse.discountPrice || ''} 
                            onChange={onFormChange}
                            placeholder="0.00"
                          />
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Special offer price (optional)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  {selectedCourse.price && selectedCourse.discountPrice && (
                    <Alert variant="info" className="mt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Discount Applied:</strong> 
                          {(() => {
                            const price = parseFloat(selectedCourse.price as string) || 0
                            const discount = parseFloat(selectedCourse.discountPrice as string) || 0
                            if (price > 0 && discount > 0) {
                              const savings = price - discount
                              const percentage = (savings / price * 100).toFixed(0)
                              return (
                                <span className="ms-2">
                                  Save ${savings.toFixed(2)} ({percentage}%)
                                </span>
                              )
                            }
                            return null
                          })()}
                        </div>
                        <Badge bg="success">On Sale</Badge>
                      </div>
                    </Alert>
                  )}

                  {(!selectedCourse.price || selectedCourse.price === '') && (
                    <Alert variant="success" className="mt-3">
                      <FaCheckCircle className="me-2" />
                      This course is marked as FREE
                    </Alert>
                  )}
                </Form>
              </Tab.Pane>

              {/* FAQs Tab */}
              <Tab.Pane eventKey="faq">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Course FAQs</h6>
                  <Button variant="outline-primary" size="sm" onClick={onAddFAQ}>
                    <FaPlus className="me-1" /> Add FAQ
                  </Button>
                </div>
                
                {selectedCourse.addFAQ.length === 0 ? (
                  <Alert variant="info">
                    <FaQuestionCircle className="me-2" />
                    No FAQs added yet. Click "Add FAQ" to create one.
                  </Alert>
                ) : (
                  selectedCourse.addFAQ.map((faq, index) => (
                    <div key={index} className="border rounded p-3 mb-3 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">FAQ #{index + 1}</h6>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => onRemoveFAQ(index)}
                        >
                          <FaTimes />
                        </Button>
                      </div>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Question</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={faq.question}
                              onChange={(e) => onFAQChange(index, 'question', e.target.value)}
                              placeholder="Enter question"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Answer</Form.Label>
                            <Form.Control 
                              as="textarea" 
                              rows={3}
                              value={faq.answer}
                              onChange={(e) => onFAQChange(index, 'answer', e.target.value)}
                              placeholder="Enter answer"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  ))
                )}
              </Tab.Pane>

              {/* Quiz Tab */}
              <Tab.Pane eventKey="quiz">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">
                    Quiz Questions
                    <Badge bg="info" className="ms-2">{selectedCourse.quiz?.length || 0} questions</Badge>
                  </h6>
                  {onAddQuiz && (
                    <Button variant="outline-primary" size="sm" onClick={onAddQuiz}>
                      <FaPlus className="me-1" /> Add Question
                    </Button>
                  )}
                </div>

                {!selectedCourse.quiz || selectedCourse.quiz.length === 0 ? (
                  <Alert variant="info">
                    <FaQuestionCircle className="me-2" />
                    No quiz questions yet. Click "Add Question" to create one.
                  </Alert>
                ) : (
                  selectedCourse.quiz.map((q, qi) => (
                    <Card key={qi} className="mb-3 border">
                      <Card.Header className="bg-light d-flex justify-content-between align-items-center py-2">
                        <strong>Question #{qi + 1}</strong>
                        {onRemoveQuiz && (
                          <Button variant="outline-danger" size="sm" onClick={() => onRemoveQuiz(qi)}>
                            <FaTimes />
                          </Button>
                        )}
                      </Card.Header>
                      <Card.Body>
                        <Form.Group className="mb-3">
                          <Form.Label>Question</Form.Label>
                          <Form.Control
                            type="text"
                            value={q.question}
                            onChange={(e) => onQuizChange?.(qi, 'question', e.target.value)}
                            placeholder="Enter question"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Form.Label className="mb-0">Options</Form.Label>
                            {onAddQuizOption && (
                              <Button variant="outline-secondary" size="sm" onClick={() => onAddQuizOption(qi)}>
                                <FaPlus className="me-1" /> Add Option
                              </Button>
                            )}
                          </div>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                              <Form.Check
                                type="radio"
                                name={`correctAnswer-${qi}`}
                                checked={q.correctAnswer === opt}
                                onChange={() => onQuizChange?.(qi, 'correctAnswer', opt)}
                                title="Mark as correct answer"
                              />
                              <Form.Control
                                type="text"
                                value={opt}
                                onChange={(e) => onQuizOptionChange?.(qi, oi, e.target.value)}
                                placeholder={`Option ${oi + 1}`}
                                size="sm"
                              />
                              {onRemoveQuizOption && q.options.length > 2 && (
                                <Button variant="outline-danger" size="sm" onClick={() => onRemoveQuizOption(qi, oi)}>
                                  <FaTimes size={10} />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Form.Text className="text-muted">
                            Select the radio button next to the correct answer.
                          </Form.Text>
                        </Form.Group>

                        {q.correctAnswer && (
                          <Alert variant="success" className="py-2 mb-0">
                            <FaCheckCircle className="me-2" />
                            Correct answer: <strong>{q.correctAnswer}</strong>
                          </Alert>
                        )}
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Tab.Pane>

              {/* Settings Tab */}
              <Tab.Pane eventKey="settings">
                <Form>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Language</Form.Label>
                        <Form.Select
                          name="language"
                          value={Array.isArray(selectedCourse.language) ? selectedCourse.language[0] : selectedCourse.language || ''}
                          onChange={onFormChange}
                        >
                          <option value="">Select Language</option>
                          <option value="English">English</option>
                          <option value="Hindi">Hindi</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Visibility</Form.Label>
                        <Form.Select
                          name="visibility"
                          value={selectedCourse.visibility || 'public'}
                          onChange={onFormChange}
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Type</Form.Label>
                        <Form.Select
                          name="courseType"
                          value={selectedCourse.courseType || 'paid'}
                          onChange={onFormChange}
                        >
                          <option value="paid">Paid</option>
                          <option value="free">Free</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Course Status</Form.Label>
                        <Form.Select
                          name="status"
                          value={selectedCourse.status || 'Draft'}
                          onChange={onFormChange}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Archived">Archived</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Active Status</Form.Label>
                        <Form.Select
                          name="courseStatus"
                          value={selectedCourse.courseStatus || 'active'}
                          onChange={onFormChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Rating (0-5)</Form.Label>
                        <Form.Control
                          type="number"
                          name="rating"
                          value={selectedCourse.rating || 0}
                          onChange={onFormChange}
                          min="0"
                          max="5"
                          step="0.1"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label={
                            <>
                              <strong>Featured Course</strong>
                              <span className="text-muted ms-2">Show in featured section</span>
                            </>
                          }
                          name="isFeatured"
                          checked={selectedCourse.isFeatured || false}
                          onChange={(e) => {
                            onFormChange({
                              target: {
                                name: 'isFeatured',
                                value: e.target.checked,
                                type: 'checkbox'
                              }
                            } as any)
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />
                  
                  <div className="bg-light p-3 rounded">
                    <h6 className="text-muted mb-3">Course Metadata</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Course ID</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={selectedCourse._id} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Created At</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={new Date(selectedCourse.createdAt || '').toLocaleString()} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Last Updated</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={new Date(selectedCourse.updatedAt || '').toLocaleString()} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-2">
                          <Form.Label className="small text-muted">Total Videos</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={selectedCourse.videos.length} 
                            readOnly
                            className="bg-white"
                            size="sm"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Form>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light border-top">
        <div className="d-flex justify-content-between w-100">
          <div>
            <Button variant="outline-secondary" onClick={onHide}>
              Cancel
            </Button>
          </div>
          <div>
            {selectedCourse && (
              <>
                <Button 
                  variant="outline-primary" 
                  className="me-2" 
                  onClick={() => window.open(`/course/${selectedCourse._id}`, '_blank')}
                >
                  <FaEye className="me-2" />
                  Preview
                </Button>
                <Button variant="primary" onClick={onUpdate} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="me-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>

    {/* ===== Case Study Popup Modal ===== */}
    <Modal
      show={caseStudyModal.open}
      onHide={() => setCaseStudyModal(prev => ({ ...prev, open: false }))}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title style={{ fontSize: 16 }}>
          Case Study Editor
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              value={caseStudyModal.draft.title || ''}
              onChange={(e) => setCaseStudyModal(prev => ({
                ...prev, draft: { ...prev.draft, title: e.target.value }
              }))}
              placeholder="e.g., Fibonacci Sequence"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={caseStudyModal.draft.description || ''}
              onChange={(e) => setCaseStudyModal(prev => ({
                ...prev, draft: { ...prev.draft, description: e.target.value }
              }))}
              placeholder="Describe the case study problem..."
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Input Example</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={caseStudyModal.draft.inputExample || ''}
                  onChange={(e) => setCaseStudyModal(prev => ({
                    ...prev, draft: { ...prev.draft, inputExample: e.target.value }
                  }))}
                  placeholder="n = 10"
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Expected Output</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={caseStudyModal.draft.expectedOutput || ''}
                  onChange={(e) => setCaseStudyModal(prev => ({
                    ...prev, draft: { ...prev.draft, expectedOutput: e.target.value }
                  }))}
                  placeholder="0 1 1 2 3 5 8 13 21 34"
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Boilerplate Code</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={caseStudyModal.draft.boilerplate || ''}
              onChange={(e) => setCaseStudyModal(prev => ({
                ...prev, draft: { ...prev.draft, boilerplate: e.target.value }
              }))}
              placeholder="def fibonacci(n):&#10;    # write your code here&#10;    pass"
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={() => setCaseStudyModal(prev => ({ ...prev, open: false }))}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onVideoChange?.(caseStudyModal.videoIndex, 'caseStudy', caseStudyModal.draft)
            setCaseStudyModal(prev => ({ ...prev, open: false }))
          }}
          disabled={!caseStudyModal.draft.title?.trim()}
        >
          <FaCheckCircle className="me-2" />
          Save Case Study
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  )
}

export default EditCourseModal
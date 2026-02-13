import Stepper from 'bs-stepper'
import { FormEvent, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { FaCloudUploadAlt, FaTimes, FaVideo, FaLink, FaPlay, FaList, FaCheck } from 'react-icons/fa'
import AddVideos from './AddVideos'

const Step2 = ({
  stepperInstance,
  formData,
  setFormData,
}: {
  stepperInstance: Stepper | undefined
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }
  
  const goToPreviousStep = () => {
    stepperInstance?.previous()
  }
  
  const [tempUrl, setTempUrl] = useState('')
  const [tempDesc, setTempDesc] = useState('')

  const handlePreviewVideo = (videoFile: File) => {
    const videoElement = document.createElement('video')
    videoElement.src = URL.createObjectURL(videoFile)
    videoElement.controls = true
    videoElement.style.maxWidth = '90vw'
    videoElement.style.maxHeight = '90vh'
    
    const modal = document.createElement('div')
    modal.style.position = 'fixed'
    modal.style.top = '0'
    modal.style.left = '0'
    modal.style.width = '100vw'
    modal.style.height = '100vh'
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)'
    modal.style.display = 'flex'
    modal.style.alignItems = 'center'
    modal.style.justifyContent = 'center'
    modal.style.zIndex = '9999'
    
    const closeButton = document.createElement('button')
    closeButton.innerHTML = '×'
    closeButton.style.position = 'absolute'
    closeButton.style.top = '20px'
    closeButton.style.right = '20px'
    closeButton.style.background = 'none'
    closeButton.style.border = 'none'
    closeButton.style.color = 'white'
    closeButton.style.fontSize = '40px'
    closeButton.style.cursor = 'pointer'
    closeButton.style.zIndex = '10000'
    closeButton.onclick = () => document.body.removeChild(modal)
    
    modal.appendChild(videoElement)
    modal.appendChild(closeButton)
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal)
      }
    }
    
    document.body.appendChild(modal)
  }

  return (
    <form 
      id="step-2" 
      onSubmit={goToNextStep} 
      role="tabpanel" 
      className="content fade pt-4"
      aria-labelledby="steppertrigger2"
    >
      <style>
        {`
          .step2-form {
            background: #050505ff;
          }
          
          .step2-form .form-section {
            background: #ffffff;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #f0f0f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          
          .step2-form h3,
          .step2-form h5,
          .step2-form h6,
          .step2-form .form-label,
          .step2-form .text-dark,
          .step2-form .text-muted,
          .step2-form .fw-bold,
          .step2-form .fw-medium {
            color: #1a1a1a !important;
          }
          
          .step2-form p,
          .step2-form .small,
          .step2-form .form-control,
          .step2-form .form-select,
          .step2-form .video-item h6,
          .step2-form .video-item p {
            color: #1a1a1a !important;
          }
          
          .step2-form .upload-area {
            border: 2px dashed #dee2e6;
            border-radius: 1rem;
            transition: all 0.3s ease;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            color: #1a1a1a;
          }
          
          .step2-form .upload-area h5 {
            color: #1a1a1a !important;
          }
          
          .step2-form .upload-area p {
            color: #6b7280 !important;
          }
          
          .step2-form .upload-area:hover {
            border-color: #86b7fe;
            background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(13, 110, 253, 0.1);
          }
          
          .step2-form .upload-area.has-file {
            border-color: #198754;
            background: linear-gradient(135deg, #f8f9fa 0%, #e8f5e9 100%);
          }
          
          .step2-form .form-control, 
          .step2-form .form-select {
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            background-color: #ffffff;
            color: #1a1a1a !important;
          }
          
          .step2-form .form-control::placeholder {
            color: #9ca3af !important;
          }
          
          .step2-form .form-control:focus, 
          .step2-form .form-select:focus {
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
            color: #1a1a1a !important;
          }
          
          .step2-form .btn-outline-primary {
            border-width: 2px;
            font-weight: 500;
            color: #0d6efd !important;
          }
          
          .step2-form .btn-outline-primary:hover {
            background-color: #0d6efd;
            color: white !important;
          }
          
          .step2-form .btn-outline-secondary {
            color: #6c757d !important;
          }
          
          .step2-form .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white !important;
          }
          
          .step2-form .video-item {
            border: 1px solid #e9ecef;
            border-radius: 0.75rem;
            transition: all 0.3s ease;
            background: white;
            color: #1a1a1a;
          }
          
          .step2-form .video-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transform: translateY(-2px);
          }
          
          .step2-form .badge-video {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
          }
          
          .step2-form .divider-text {
            position: relative;
            text-align: center;
            margin: 2rem 0;
            color: #6b7280 !important;
          }
          
          .step2-form .divider-text:before,
          .step2-form .divider-text:after {
            content: '';
            position: absolute;
            top: 50%;
            width: 45%;
            height: 1px;
            background-color: #dee2e6;
          }
          
          .step2-form .divider-text:before {
            left: 0;
          }
          
          .step2-form .divider-text:after {
            right: 0;
          }
          
          .step2-form .divider-text .bg-white {
            background-color: #ffffff !important;
            color: #6b7280 !important;
          }
          
          .step2-form .text-center.py-5 h5,
          .step2-form .text-center.py-5 p {
            color: #6b7280 !important;
          }
          
          .step2-form .border-top {
            border-color: #e9ecef !important;
          }
          
          /* Input group text */
          .step2-form .input-group-text {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            color: #6b7280;
          }
          
          /* Custom scrollbar for video previews */
          .step2-form ::-webkit-scrollbar {
            width: 8px;
          }
          
          .step2-form ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .step2-form ::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 4px;
          }
          
          .step2-form ::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          
          /* Remove button specific styles */
          .step2-form .btn-outline-danger {
            color: #dc3545 !important;
            border-color: #dc3545;
          }
          
          .step2-form .btn-outline-danger:hover {
            background-color: #dc3545;
            color: white !important;
          }
          
          /* Badge colors */
          .step2-form .badge.bg-primary.bg-opacity-10 {
            background-color: rgba(13, 110, 253, 0.1) !important;
            color: #0d6efd !important;
          }
          
          .step2-form .badge.bg-info.bg-opacity-10 {
            background-color: rgba(13, 202, 240, 0.1) !important;
            color: #0dcaf0 !important;
          }
          
          .step2-form .badge.bg-secondary.bg-opacity-10 {
            background-color: rgba(108, 117, 125, 0.1) !important;
            color: #6c757d !important;
          }
          
          .step2-form .badge.bg-success.bg-opacity-10 {
            background-color: rgba(25, 135, 84, 0.1) !important;
            color: #198754 !important;
          }
          
          /* Case study border */
          .step2-form .border-top {
            border-color: #dee2e6 !important;
          }
          
          /* Button text colors */
          .step2-form .btn-primary {
            color: white !important;
          }
          
          .step2-form .btn-primary:disabled {
            background-color: #6c757d;
            border-color: #6c757d;
            color: white !important;
          }
          
          .step2-form .btn-link.text-danger {
            color: #dc3545 !important;
          }
          
          .step2-form .btn-link.text-danger:hover {
            color: #b02a37 !important;
          }

          /* Video preview thumbnail */
          .video-thumbnail {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            height: 100px;
            background: #000;
          }
          
          .video-thumbnail video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .video-thumbnail-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .video-thumbnail:hover .video-thumbnail-overlay {
            opacity: 1;
          }
          
          .play-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            transition: all 0.3s ease;
          }
          
          .play-button:hover {
            background: white;
            transform: scale(1.1);
          }

          /* Stats panel */
          .stats-panel {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 10px;
            padding: 15px;
            border: 1px solid #dee2e6;
          }
          
          .stats-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
          }
          
          .stats-item:last-child {
            border-bottom: none;
          }
          
          .stats-label {
            font-size: 14px;
            color: #6b7280;
          }
          
          .stats-value {
            font-weight: 600;
            color: #1a1a1a;
          }

          /* Video item enhancements */
          .video-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 8px;
          }
        `}
      </style>
      
      <div className="mb-5">
        <h3 className="fw-bold text-dark mb-2">Course Media</h3>
        <p className="text-dark mb-0 fs-8">Add visual content that will represent your course. High-quality media increases engagement.</p>
      </div>
      
      <Row className="g-4 step2-form">
        {/* Course Image Upload */}
        <Col xs={12}>
          <div className="form-section">
            <label className="form-label fw-medium mb-3">
              Course Thumbnail Image <span className="text-danger">*</span>
            </label>
            <div className={`upload-area p-4 p-sm-5 text-center position-relative rounded-3 ${formData.image ? 'has-file' : ''}`}>
              <div className="mb-3">
                <FaCloudUploadAlt className="text-primary" size={48} />
              </div>
              <div className="mb-3">
                <h5 className="mb-2">
                  {formData.image ? 'Image Selected!' : 'Upload Course Thumbnail'}
                </h5>
                <p className="text-muted mb-0">
                  {formData.image 
                    ? `Selected: ${formData.image.name}`
                    : 'Drag & drop your image here or click to browse'
                  }
                </p>
              </div>
              <label className="btn btn-outline-primary mb-0" style={{ cursor: 'pointer' }}>
                Browse Files
                <input
                  className="form-control visually-hidden"
                  type="file"
                  accept="image/gif, image/jpeg, image/png, image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData((prev: any) => ({ ...prev, image: file }))
                  }}
                />
              </label>
              {formData.image && (
                <div className="mt-3">
                  <img 
                    src={URL.createObjectURL(formData.image)} 
                    alt="Preview" 
                    className="img-fluid rounded-3 mt-3" 
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <p className="small text-muted mb-0">
                <b>Recommended:</b> 1280x720 pixels, JPG, PNG or WebP format. Max 5MB.
              </p>
              {formData.image && (
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setFormData((prev: any) => ({ ...prev, image: null }))}
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </Col>
        
        {/* External Video URLs */}
        <Col xs={12}>
          <div className="form-section">
            <div className="d-flex align-items-center mb-4">
              <FaLink className="text-primary me-2" />
              <h5 className="fw-bold mb-0">External Video Links</h5>
            </div>
            
            <div className="mb-4">
              <label className="form-label mb-3">Add Video URL with Description</label>
              <Row className="g-2 mb-3">
                <Col md={6}>
                  <input
                    className="form-control"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Video description"
                    value={tempDesc}
                    onChange={(e) => setTempDesc(e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <button
                    type="button"
                    className="btn btn-primary w-100"
                    onClick={() => {
                      if (tempUrl.trim()) {
                        setFormData((prev: any) => ({
                          ...prev,
                          videoUrl: [...(prev.videoUrl || []), { 
                            url: tempUrl, 
                            description: tempDesc 
                          }],
                        }))
                        setTempUrl('')
                        setTempDesc('')
                      }
                    }}
                    disabled={!tempUrl.trim()}
                  >
                    Add Link
                  </button>
                </Col>
              </Row>
              <p className="small text-muted">
                Add YouTube, Vimeo, or other external video links. These will be embedded in your course.
              </p>
            </div>
            
            {/* Added Video URLs List */}
            {(formData.videoUrl || []).length > 0 && (
              <div className="mb-4">
                <h6 className="fw-medium mb-3">Added Video Links ({(formData.videoUrl || []).length})</h6>
                <div className="row g-3">
                  {(formData.videoUrl || []).map((vid: any, index: number) => (
                    <Col md={6} key={index}>
                      <div className="video-item p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-primary bg-opacity-10 text-primary badge-video">
                            External Video
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => {
                              setFormData((prev: any) => ({
                                ...prev,
                                videoUrl: (prev.videoUrl || []).filter((_: any, i: number) => i !== index),
                              }))
                            }}
                          >
                            <FaTimes size={16} />
                          </button>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted d-block mb-1">URL:</small>
                          <p className="text-truncate mb-0 small" style={{ maxWidth: '250px' }}>
                            {vid.url}
                          </p>
                        </div>
                        {vid.description && (
                          <div>
                            <small className="text-muted d-block mb-1">Description:</small>
                            <p className="mb-0 small">{vid.description}</p>
                          </div>
                        )}
                      </div>
                    </Col>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Col>
        
        {/* Divider */}
        <div className="divider-text">
          <span className="bg-white px-3 text-muted fw-medium">OR</span>
        </div>
        
        {/* Upload Videos Section - UPDATED */}
        <Col xs={12}>
          <div className="form-section">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center">
                <FaVideo className="text-primary me-2" />
                <div>
                  <h5 className="fw-bold mb-0">Upload Course Videos</h5>
                  {formData.videos && formData.videos.length > 0 && (
                    <small className="text-muted">
                      {formData.videos.length} video(s) added • Total: {(
                        formData.videos.reduce((acc: number, vid: any) => acc + vid.videos.size, 0) / 
                        (1024 * 1024)
                      ).toFixed(2)} MB
                    </small>
                  )}
                </div>
              </div>
              <AddVideos
                onAddVideos={(newVideos) => {
                  const formattedVideos = newVideos.map(vid => ({
                    videos: vid.file,
                    description: vid.description,
                    caseStudy: vid.caseStudy,
                    status: 'pending',
                    progress: 0,
                  }))
                  
                  setFormData((prev: any) => ({
                    ...prev,
                    videos: [...(prev.videos || []), ...formattedVideos]
                  }))
                }}
              />
            </div>
            
            {/* Video Statistics Panel */}
            {(formData.videos || []).length > 0 && (
              <div className="stats-panel mb-4">
                <div className="row">
                  <div className="col-md-3">
                    <div className="stats-item">
                      <span className="stats-label">Total Videos</span>
                      <span className="stats-value">{formData.videos.length}</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stats-item">
                      <span className="stats-label">With Case Studies</span>
                      <span className="stats-value">
                        {formData.videos.filter((v: any) => v.caseStudy).length}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stats-item">
                      <span className="stats-label">Total Size</span>
                      <span className="stats-value">
                        {(
                          formData.videos.reduce((acc: number, vid: any) => acc + vid.videos.size, 0) / 
                          (1024 * 1024)
                        ).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="stats-item">
                      <span className="stats-label">Status</span>
                      <span className="stats-value text-success">
                        <FaCheck className="me-1" /> Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Video Uploads List */}
            <div className="row g-4">
              {(formData.videos || []).map((vid: any, index: number) => (
                <Col xs={12} key={index}>
                  <div className="video-item p-4">
                    <div className="row align-items-center">
                      <Col md={2} className="mb-3 mb-md-0">
                        <div className="video-thumbnail">
                          <video
                            src={URL.createObjectURL(vid.videos)}
                            muted
                          />
                          <div className="video-thumbnail-overlay">
                            <button 
                              type="button"
                              className="play-button"
                              onClick={() => handlePreviewVideo(vid.videos)}
                            >
                              <FaPlay />
                            </button>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md={6} className="mb-3 mb-md-0">
                        <div>
                          <h6 className="fw-medium mb-1">{vid.videos.name}</h6>
                          <p className="small text-muted mb-2">{vid.description || 'No description provided'}</p>
                          <div className="video-meta">
                            {vid.caseStudy && (
                              <span className="badge bg-info bg-opacity-10 text-info badge-video">
                                <FaList className="me-1" /> Case Study
                              </span>
                            )}
                            <span className="badge bg-secondary bg-opacity-10 text-secondary badge-video">
                              {(vid.videos.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                            <span className="badge bg-success bg-opacity-10 text-success badge-video">
                              Video {index + 1}
                            </span>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md={4} className="text-md-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handlePreviewVideo(vid.videos)}
                          >
                            <FaPlay className="me-1" /> Preview
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                videos: (prev.videos || []).filter((_: any, i: number) => i !== index),
                              }))
                            }
                          >
                            <FaTimes className="me-1" /> Remove
                          </button>
                        </div>
                      </Col>
                    </div>
                    
                    {/* Case Study Details */}
                    {vid.caseStudy && (
                      <div className="mt-3 pt-3 border-top">
                        <h6 className="fw-medium mb-2">
                          <FaList className="me-2" />
                          Case Study: {vid.caseStudy.title}
                        </h6>
                        <Row>
                          <Col md={6}>
                            <p className="small mb-1">
                              <strong>Description:</strong> {vid.caseStudy.description}
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="small mb-1">
                              <strong>Input Example:</strong> {vid.caseStudy.inputExample}
                            </p>
                          </Col>
                          <Col md={3}>
                            <p className="small mb-1">
                              <strong>Expected Output:</strong> {vid.caseStudy.expectedOutput}
                            </p>
                          </Col>
                        </Row>
                        {vid.caseStudy.boilerplate && (
                          <div className="mt-2">
                            <p className="small mb-1">
                              <strong>Boilerplate Code:</strong>
                            </p>
                            <pre className="bg-light p-2 rounded small">
                              {vid.caseStudy.boilerplate}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Col>
              ))}
              
              {(formData.videos || []).length === 0 && (
                <Col xs={12}>
                  <div className="text-center py-5">
                    <FaVideo className="text-muted mb-3" size={48} />
                    <h5 className="fw-medium text-muted">No videos added yet</h5>
                    <p className="text-muted mb-0">Click "Add Videos" to select and upload multiple videos at once</p>
                  </div>
                </Col>
              )}
            </div>
          </div>
        </Col>
        
        {/* Navigation Buttons */}
        <div className="d-flex justify-content-between pt-4 border-top mt-2">
          <button 
            type="button" 
            className="btn btn-outline-secondary px-4 py-2"
            onClick={goToPreviousStep}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back: Course Details
          </button>
          <button 
            type="submit" 
            className="btn btn-primary px-4 py-2"
            disabled={(formData.videos || []).length === 0 && (formData.videoUrl || []).length === 0}
          >
            Next: Additional Info
            <i className="fas fa-arrow-right ms-2"></i>
          </button>
        </div>
      </Row>
    </form>
  )
}

export default Step2
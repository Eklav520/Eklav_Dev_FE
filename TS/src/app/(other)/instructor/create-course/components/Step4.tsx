import Stepper from 'bs-stepper'
import { FormEvent } from 'react'
import { Col, Row } from 'react-bootstrap'
import { FaEdit, FaTimes, FaCheck, FaExclamationTriangle, FaUpload, FaQuestionCircle, FaStar, FaFileExcel } from 'react-icons/fa'
import AddToQuestion from './AddToQuestion'
import FeatureInput from './FeatureInput'

const Step4 = ({
  stepperInstance,
  formData,
  setFormData,
  handleSubmit,
  retryFailedVideos,
  uploadProgress,
  uploadedVideoCount,
}: {
  stepperInstance: Stepper | undefined
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  handleSubmit: any
  retryFailedVideos: () => void
  uploadProgress: number
  uploadedVideoCount: number
}) => {
  const goToPreviousStep = () => {
    stepperInstance?.previous()
  }

  // Add this function to handle form submission
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // You can add validation here if needed
  }

  return (
    <form 
      id="step-4" 
      role="tabpanel" 
      className="content fade pt-4" 
      aria-labelledby="steppertrigger4"
      onSubmit={handleFormSubmit}
    >
      <style>
        {`
          .step4-form {
            background: #050505ff;
          }
          
          .step4-form .section-card {
            background: #ffffff;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #f0f0f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          
          .step4-form h3,
          .step4-form h5,
          .step4-form h6,
          .step4-form .form-label,
          .step4-form .text-dark,
          .step4-form .fw-bold,
          .step4-form .fw-medium,
          .step4-form .faq-item h6,
          .step4-form .feature-item span,
          .step4-form .alert strong {
            color: #1a1a1a !important;
          }
          
          .step4-form p,
          .step4-form .text-muted,
          .step4-form .alert,
          .step4-form .alert small,
          .step4-form .faq-item p,
          .step4-form .form-control {
            color: #6b7280 !important;
          }
          
          .step4-form .section-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          
          .step4-form .faq-item, .step4-form .feature-item {
            border: 1px solid #f1f3f4;
            border-radius: 0.75rem;
            padding: 1.25rem;
            margin-bottom: 1rem;
            background: #fafbfc;
            transition: all 0.3s ease;
          }
          
          .step4-form .faq-item:hover, .step4-form .feature-item:hover {
            border-color: #dee2e6;
            background: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          }
          
          .step4-form .upload-progress-card {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: none;
          }
          
          .step4-form .progress {
            height: 8px;
            border-radius: 4px;
            background-color: #e9ecef;
            overflow: hidden;
          }
          
          .step4-form .progress-bar {
            background: linear-gradient(90deg, #0d6efd, #0dcaf0);
            border-radius: 4px;
            transition: width 0.6s ease;
          }
          
          .step4-form .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .step4-form .btn-submit {
            background: linear-gradient(135deg, #198754 0%, #157347 100%);
            border: none;
            padding: 0.875rem 2.5rem;
            font-weight: 600;
            font-size: 1.05rem;
            border-radius: 0.75rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(25, 135, 84, 0.2);
            color: white !important;
          }
          
          .step4-form .btn-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(25, 135, 84, 0.3);
          }
          
          .step4-form .btn-submit:disabled {
            background: #6c757d;
            transform: none;
            box-shadow: none;
            cursor: not-allowed;
            opacity: 0.65;
          }
          
          .step4-form .preview-video-card {
            border-left: 4px solid #0dcaf0;
          }
          
          .step4-form .quiz-card {
            border-left: 4px solid #ffc107;
          }
          
          .step4-form .form-control {
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            background-color: #ffffff;
            color: #1a1a1a !important;
          }
          
          .step4-form .form-control::placeholder {
            color: #9ca3af !important;
          }
          
          .step4-form .form-control:focus {
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
          }

          /* Alert styles */
          .step4-form .alert {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            color: #6b7280 !important;
          }
          
          .step4-form .alert-info {
            background-color: rgba(13, 202, 240, 0.1);
            border-color: rgba(13, 202, 240, 0.2);
          }
          
          .step4-form .alert-success {
            background-color: rgba(25, 135, 84, 0.1);
            border-color: rgba(25, 135, 84, 0.2);
          }
          
          .step4-form .alert-light {
            background-color: #f8f9fa;
            border-color: #e9ecef;
          }
          
          .step4-form .alert-warning {
            background-color: rgba(255, 193, 7, 0.1);
            border-color: rgba(255, 193, 7, 0.2);
          }
          
          .step4-form .alert-danger {
            background-color: rgba(220, 53, 69, 0.1);
            border-color: rgba(220, 53, 69, 0.2);
          }

          /* Button styles */
          .step4-form .btn-outline-primary {
            color: #0d6efd !important;
            border-color: #0d6efd;
          }
          
          .step4-form .btn-outline-primary:hover {
            background-color: #0d6efd;
            color: white !important;
          }
          
          .step4-form .btn-outline-secondary {
            color: #6c757d !important;
            border-color: #6c757d;
          }
          
          .step4-form .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white !important;
          }
          
          .step4-form .btn-outline-danger {
            color: #dc3545 !important;
            border-color: #dc3545;
          }
          
          .step4-form .btn-outline-danger:hover {
            background-color: #dc3545;
            color: white !important;
          }
          
          .step4-form .btn-light {
            background-color: #f8f9fa;
            color: #1a1a1a !important;
            border-color: #dee2e6;
          }
          
          .step4-form .btn-light:hover {
            background-color: #e9ecef;
            color: #1a1a1a !important;
          }
          
          .step4-form .btn-warning {
            background-color: #ffc107;
            color: #1a1a1a !important;
            border-color: #ffc107;
          }
          
          .step4-form .btn-warning:hover {
            background-color: #ffca2c;
            color: #1a1a1a !important;
          }

          /* Badge styles */
          .step4-form .badge {
            font-weight: 500;
          }
          
          .step4-form .badge.bg-primary {
            background-color: #0d6efd !important;
            color: white !important;
          }
          
          .step4-form .badge.bg-light {
            background-color: #f8f9fa !important;
            color: #1a1a1a !important;
          }
          
          .step4-form .badge.bg-info {
            background-color: #0dcaf0 !important;
            color: white !important;
          }
          
          .step4-form .badge.bg-success {
            background-color: #198754 !important;
            color: white !important;
          }
          
          .step4-form .badge.bg-danger {
            background-color: #dc3545 !important;
            color: white !important;
          }
          
          .step4-form .badge.bg-primary.bg-opacity-10 {
            background-color: rgba(13, 110, 253, 0.1) !important;
            color: #0d6efd !important;
          }

          /* Text center placeholder styles */
          .step4-form .text-center h6,
          .step4-form .text-center p {
            color: #6b7280 !important;
          }
          
          .step4-form .border-top {
            border-color: #e9ecef !important;
          }
          
          /* Progress upload items */
          .step4-form .bg-white {
            background-color: #ffffff !important;
            color: #1a1a1a !important;
          }
          
          .step4-form .text-truncate {
            color: #1a1a1a !important;
          }

          /* Spinner animation for loading */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .fa-spinner {
            animation: spin 1s linear infinite;
            color: white !important;
          }
          
          /* Input group styles */
          .step4-form .input-group .btn {
            color: #6c757d !important;
            background-color: #f8f9fa;
            border-color: #dee2e6;
          }
          
          .step4-form .input-group .btn:hover {
            background-color: #e9ecef;
            color: #6c757d !important;
          }
        `}
      </style>
      
      <div className="mb-5">
        <h3 className="fw-bold text-dark mb-2">Additional Information</h3>
        <p className="text-dark mb-0 fs-8">Complete your course setup with FAQs, features, and additional content.</p>
      </div>
      
      <Row className="g-4 step4-form">
        {/* FAQs Section */}
        <Col xs={12}>
          <div className="section-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center">
                <FaQuestionCircle className="text-primary me-2" size={20} />
                <h5 className="mb-0">Frequently Asked Questions</h5>
              </div>
              <AddToQuestion
                onAddFAQ={(faq) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    addFAQ: [...(prev.addFAQ || []), faq],
                  }))
                }
              />
            </div>
            
            {(formData.addFAQ || []).length > 0 ? (
              <Row className="g-3">
                {(formData.addFAQ || []).map((faq: any, index: number) => (
                  <Col xs={12} key={index}>
                    <div className="faq-item">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h6 className="fw-medium mb-1 text-dark">Q: {faq.question}</h6>
                          <span className="badge bg-primary bg-opacity-10 text-primary">
                            FAQ #{index + 1}
                          </span>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              // Edit functionality would go here
                              console.log('Edit FAQ:', faq)
                            }}
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              setFormData((prev: any) => ({
                                ...prev,
                                addFAQ: (prev.addFAQ || []).filter((_: any, i: number) => i !== index),
                              }))
                            }
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="mb-0 text-muted">
                        <strong>A:</strong> {faq.answer}
                      </p>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-4">
                <FaQuestionCircle className="text-muted mb-3" size={48} />
                <h6 className="fw-medium text-muted">No FAQs added yet</h6>
                <p className="text-muted mb-0">Add common questions students might have about your course</p>
              </div>
            )}
          </div>
        </Col>
        
        {/* Features Section */}
        <Col xs={12}>
          <div className="section-card p-4">
            <div className="d-flex align-items-center mb-4">
              <FaStar className="text-warning me-2" size={20} />
              <h5 className="mb-0">Course Features & Benefits</h5>
            </div>
            <FeatureInput 
              onFeaturesChange={(features) => setFormData((prev: any) => ({ ...prev, features: features || [] }))} 
            />
            
            {(formData.features || []).length > 0 && (
              <div className="mt-4">
                <h6 className="fw-medium mb-3">Added Features ({(formData.features || []).length})</h6>
                <Row className="g-3">
                  {(formData.features || []).map((feature: string, index: number) => (
                    <Col md={6} key={index}>
                      <div className="feature-item">
                        <div className="d-flex align-items-start">
                          <FaCheck className="text-success mt-1 me-2 flex-shrink-0" size={16} />
                          <span className="text-dark">{feature}</span>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        </Col>
        
        {/* Preview Video */}
        <Col xs={12}>
          <div className="section-card preview-video-card p-4">
            <div className="d-flex align-items-center mb-3">
              <FaUpload className="text-info me-2" size={20} />
              <h5 className="mb-0">Course Preview Video</h5>
            </div>
            <p className="text-muted mb-4">
              This video will be shown on the course landing page to give students a preview of your teaching style.
            </p>
            
            <div className="mb-3">
              <label className="form-label fw-medium mb-2">Upload Preview Video</label>
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData((prev: any) => ({
                      ...prev,
                      previewVideo: file,
                    }))
                  }}
                />
                <button 
                  className="btn btn-outline-secondary" 
                  type="button"
                  onClick={() => {
                    const fileInput = document.querySelector('input[accept="video/*"]') as HTMLInputElement
                    fileInput?.click()
                  }}
                >
                  Browse
                </button>
              </div>
            </div>
            
            {formData.previewVideo && (
              <div className="alert alert-info d-flex align-items-center">
                <FaCheck className="me-2" />
                <div>
                  <strong>Selected:</strong> {formData.previewVideo.name}
                  <br />
                  <small>Size: {(formData.previewVideo.size / (1024 * 1024)).toFixed(2)} MB</small>
                </div>
              </div>
            )}
            
            {!formData.previewVideo && (
              <div className="alert alert-light">
                <small className="text-muted">
                  <strong>Recommendation:</strong> Upload a 2-3 minute preview that showcases the best parts of your course.
                  This helps increase enrollment rates.
                </small>
              </div>
            )}
          </div>
        </Col>
        
        {/* Quiz Section */}
        <Col xs={12}>
          <div className="section-card quiz-card p-4">
            <div className="d-flex align-items-center mb-3">
              <FaFileExcel className="text-warning me-2" size={20} />
              <h5 className="mb-0">Course Quiz/Assessment</h5>
            </div>
            <p className="text-muted mb-4">
              Upload quiz questions in Excel format to assess student learning.
            </p>
            
            <div className="mb-3">
              <label className="form-label fw-medium mb-2">Upload Quiz File</label>
              <div className="input-group">
                <input
                  className="form-control"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData((prev: any) => ({ ...prev, quizFile: file }))
                  }}
                />
                <button 
                  className="btn btn-outline-secondary" 
                  type="button"
                  onClick={() => {
                    const fileInput = document.querySelector('input[accept=".xlsx, .xls, .csv"]') as HTMLInputElement
                    fileInput?.click()
                  }}
                >
                  Browse
                </button>
              </div>
            </div>
            
            {formData.quizFile && (
              <div className="alert alert-success d-flex align-items-center">
                <FaCheck className="me-2" />
                <div>
                  <strong>File uploaded:</strong> {formData.quizFile.name}
                  <br />
                  <small>Format: {formData.quizFile.name.split('.').pop()?.toUpperCase()}</small>
                </div>
              </div>
            )}
            
            {!formData.quizFile && (
              <div className="alert alert-light">
                <small className="text-muted">
                  <strong>Format:</strong> Upload Excel (.xlsx, .xls) or CSV files with questions and answers.
                  Each row should contain a question, options, and correct answer.
                </small>
              </div>
            )}
          </div>
        </Col>
        
        {/* Upload Progress Section */}
        {uploadProgress > 0 && (
          <Col xs={12}>
            <div className="section-card upload-progress-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-1">Uploading Course Content</h5>
                  <p className="text-muted mb-0">
                    {uploadedVideoCount} of {(formData.videos || []).length} videos uploaded
                  </p>
                </div>
                <span className="badge bg-primary px-3 py-2 fs-6">{uploadProgress}%</span>
              </div>
              
              <div className="progress mb-4">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated" 
                  style={{ width: `${uploadProgress}%` }} 
                />
              </div>
              
              <div className="row g-3">
                {(formData.videos || []).map((v: any, i: number) => (
                  <Col md={6} key={i}>
                    <div className="d-flex align-items-center p-3 bg-white rounded">
                      <div className="me-3">
                        {v.status === 'pending' && (
                          <span className="status-badge bg-light text-white">Pending</span>
                        )}
                        {v.status === 'uploading' && (
                          <span className="status-badge bg-info text-white">
                            Uploading {v.progress}%
                          </span>
                        )}
                        {v.status === 'success' && (
                          <span className="status-badge bg-success text-white">
                            <FaCheck className="me-1" /> Done
                          </span>
                        )}
                        {v.status === 'failed' && (
                          <span className="status-badge bg-danger text-white">
                            <FaExclamationTriangle className="me-1" /> Failed
                          </span>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <small className="d-block text-truncate">
                          Video {i + 1}: {v.description || 'Untitled'}
                        </small>
                        <small className="text-muted">
                          Size: {(v.videos?.size / (1024 * 1024)).toFixed(2)} MB
                        </small>
                      </div>
                      {v.status === 'failed' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-warning ms-2"
                          onClick={() => retryFailedVideos()}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </Col>
                ))}
              </div>
            </div>
          </Col>
        )}
        
        {/* Action Buttons */}
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center pt-4 border-top">
            <div>
              <button 
                type="button" 
                className="btn btn-outline-secondary px-4 py-2 me-3"
                onClick={goToPreviousStep}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back: Course Media
              </button>
              <button 
                type="button" 
                className="btn btn-light text-dark px-4 py-2"
                onClick={() => {
                  // Preview functionality
                  console.log('Preview course')
                  // You can add navigation to preview page here
                }}
              >
                <i className="fas fa-eye me-2"></i>
                Preview Course
              </button>
            </div>
            
            <div className="text-end">
              <button 
                type="button"
                className="btn-submit"
                onClick={handleSubmit}
                disabled={uploadProgress > 0 && uploadProgress < 100}
              >
                {uploadProgress > 0 ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Submit Course for Review
                  </>
                )}
              </button>
              <p className="small text-muted mt-2 mb-0">
                Your course will be reviewed by our team before publication
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </form>
  )
}

export default Step4
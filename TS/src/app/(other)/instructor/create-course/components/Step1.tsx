import Stepper from 'bs-stepper'
import { FormEvent } from 'react'
import { Col, Row } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

const Step1 = ({
  stepperInstance,
  formData,
  setFormData
}: {
  stepperInstance: Stepper | undefined
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
}) => {
  const goToNextStep = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    stepperInstance?.next()
  }

  return (
    <form
      id="step-1"
      onSubmit={goToNextStep}
      role="tabpanel"
      className="content fade pt-4"
      aria-labelledby="steppertrigger1"
    >
      <style>
        {`
          .step1-form {
            background: #050505ff;
          }
          
          .step1-form .form-section {
            background: #ffffff;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            border: 1px solid #f0f0f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          
          .step1-form .form-section-title {
            color: #1a1a1a;
            font-weight: 600;
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #f0f0f0;
          }
          
          .step1-form .form-control, 
          .step1-form .form-select {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 0.875rem 1rem;
            font-size: 0.95rem;
            background: #ffffff;
            color: #1a1a1a; /* FIXED: Added dark text color */
            transition: all 0.2s ease;
          }
          
          .step1-form .form-control-lg {
            padding: 1rem 1.25rem;
            font-size: 1rem;
          }
          
          .step1-form .form-control:focus, 
          .step1-form .form-select:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            outline: none;
          }
          
          .step1-form .form-label {
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            display: block;
          }
          
          .step1-form .required-star {
            color: #ef4444;
            margin-left: 2px;
          }
          
          .step1-form .form-hint {
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 0.375rem;
            line-height: 1.4;
          }
          
          .step1-form .form-check-input {
            width: 1.25rem;
            height: 1.25rem;
            margin-top: 0.125rem;
          }
          
          .step1-form .form-check-input:checked {
            background-color: #3b82f6;
            border-color: #3b82f6;
          }
          
          /* ReactQuill Editor Styles - FIXED */
          .step1-form .ql-container {
            border-radius: 0 0 8px 8px;
            border-color: #e0e0e0;
            font-size: 0.95rem;
            font-family: inherit;
            height: 300px;
          }
          
          .step1-form .ql-container .ql-editor {
            color: #1a1a1a; /* FIXED: Editor text color */
            font-size: 0.95rem;
            line-height: 1.6;
            min-height: 300px;
          }
          
          .step1-form .ql-container .ql-editor.ql-blank::before {
            color: #9ca3af; /* Placeholder color */
            font-style: normal;
            font-size: 0.95rem;
          }
          
          .step1-form .ql-toolbar {
            border-radius: 8px 8px 0 0;
            border-color: #e0e0e0;
            background-color: #f9fafb;
          }
          
          .step1-form .ql-toolbar .ql-stroke {
            fill: none;
            stroke: #374151;
          }
          
          .step1-form .ql-toolbar .ql-fill {
            fill: #374151;
            stroke: none;
          }
          
          .step1-form .ql-toolbar .ql-picker {
            color: #374151;
          }
          
          .step1-form .ql-toolbar .ql-picker-options {
            background-color: #ffffff;
            border-color: #e0e0e0;
            border-radius: 8px;
          }
          
          .step1-form .ql-toolbar .ql-picker-item {
            color: #374151;
          }
          
          .step1-form .ql-toolbar .ql-picker-label {
            color: #374151;
          }
          
          .step1-form .ql-toolbar button:hover .ql-stroke,
          .step1-form .ql-toolbar button.ql-active .ql-stroke {
            stroke: #3b82f6;
          }
          
          .step1-form .ql-toolbar button:hover .ql-fill,
          .step1-form .ql-toolbar button.ql-active .ql-fill {
            fill: #3b82f6;
          }
          
          .step1-form .ql-toolbar button:hover,
          .step1-form .ql-toolbar button.ql-active {
            color: #3b82f6;
          }
          
          .step1-form .section-divider {
            margin: 2rem 0;
            border: none;
            height: 1px;
            background: linear-gradient(to right, transparent, #e0e0e0, transparent);
          }
          
          .step1-form .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            padding: 0.875rem 2.5rem;
            font-weight: 500;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-size: 1rem;
            color: #ffffff;
          }
          
          .step1-form .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          
          .step1-form .input-group .input-group-text {
            background-color: #f9fafb;
            border: 1px solid #e0e0e0;
            border-right: none;
            color: #6b7280;
            font-weight: 500;
          }
          
          .step1-form .input-group .form-control {
            border-left: none;
            color: #1a1a1a; /* FIXED: Added dark text color */
          }
          
          .step1-form .input-group .form-control:focus {
            border-left: 1px solid #3b82f6;
          }
          
          /* Feature toggle switch */
          .step1-form .featured-toggle-container {
            background: #f9fafb;
            border-radius: 8px;
            padding: 1.25rem;
            border: 1px solid #e5e7eb;
          }
          
          .step1-form .featured-toggle-label {
            font-weight: 500;
            color: #1f2937;
            font-size: 0.95rem;
          }
          
          .step1-form .featured-toggle-desc {
            color: #6b7280;
            font-size: 0.85rem;
            margin-top: 0.25rem;
          }
          
          /* Placeholder text color */
          .step1-form .form-control::placeholder,
          .step1-form .form-select:invalid {
            color: #9ca3af;
          }
          
          /* Textarea specific styles */
          .step1-form textarea.form-control {
            color: #1a1a1a;
            resize: vertical;
          }
          
          /* Number input specific styles */
          .step1-form input[type="number"] {
            color: #1a1a1a;
          }
          
          /* Select dropdown text color */
          .step1-form select.form-select option {
            color: #1a1a1a;
          }
          
          /* Quill editor content styles */
          .step1-form .ql-editor h1,
          .step1-form .ql-editor h2,
          .step1-form .ql-editor h3 {
            color: #1a1a1a;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          
          .step1-form .ql-editor p {
            color: #1a1a1a;
            margin-bottom: 1em;
          }
          
          .step1-form .ql-editor ul,
          .step1-form .ql-editor ol {
            color: #1a1a1a;
            padding-left: 1.5em;
            margin-bottom: 1em;
          }
          
          .step1-form .ql-editor li {
            color: #1a1a1a;
            margin-bottom: 0.5em;
          }
          
          .step1-form .ql-editor a {
            color: #3b82f6;
            text-decoration: underline;
          }
          
          .step1-form .ql-editor strong {
            color: #1a1a1a;
            font-weight: 600;
          }
          
          .step1-form .ql-editor em {
            color: #1a1a1a;
            font-style: italic;
          }
        `}
      </style>

      {/* Header Section */}
      <div className="mb-5">
        <h1 className="fw-bold text-dark mb-3" style={{ fontSize: '2.25rem' }}>
          Course Details
        </h1>
        <p className="text-dark mb-0 fs-8">
          Fill in the basic information about your course. Fields marked with <span className="text-danger">*</span> are required.
        </p>
      </div>

      <Row className="g-4 step1-form">

        {/* Section 1: Basic Course Information */}
        <Col xs={12}>
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>

            <Row className="g-4">
              {/* Course Title */}
              <Col xs={12}>
                <div className="mb-4">
                  <label className="form-label">
                    Course Title <span className="required-star">*</span>
                  </label>
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="e.g., Complete Web Development Bootcamp"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <div className="form-hint">
                    Choose a clear, descriptive title that captures attention
                  </div>
                </div>
              </Col>

              {/* Short Description */}
              <Col xs={12}>
                <div className="mb-4">
                  <label className="form-label">
                    Short Description <span className="required-star">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Briefly describe what students will learn in this course..."
                    required
                    value={formData.shortDescription || ''}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  />
                  <div className="form-hint">
                    This description appears in course cards and search results (150-250 characters recommended)
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Section 2: Course Classification */}
        <Col xs={12}>
          <div className="form-section">
            <h3 className="form-section-title">Course Classification</h3>

            <Row className="g-4">
              {/* Category */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">
                    Category <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    aria-label="Select category"
                    required
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="Information technology">Information Technology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Data Science">Data Science</option>
                  </select>
                </div>
              </Col>

              {/* Level */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">
                    Level <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    aria-label="Select course level"
                    required
                    value={formData.level || ''}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option value="">Select course level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </Col>

              {/* Language */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">
                    Language <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    aria-label="Select language"
                    required
                    value={formData.language || ''}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="">Select language</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </Col>

              {/* Featured Toggle */}
              <Col md={6}>
                <div className="featured-toggle-container h-100">
                  <div className="form-check form-switch d-flex align-items-center h-100">
                    <div>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="featuredToggle"
                        checked={formData.isFeatured || false}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        style={{ width: '3rem', height: '1.5rem' }}
                      />
                      <label className="form-check-label featured-toggle-label ms-3" htmlFor="featuredToggle">
                        Featured Course
                      </label>
                      <div className="featured-toggle-desc">
                        Featured courses appear prominently on the homepage
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Section 3: Course Structure */}
        <Col xs={12}>
          <div className="form-section">
            <h3 className="form-section-title">Course Structure</h3>

            <Row className="g-4">
              {/* Duration */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">Duration</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="e.g., 8 weeks, 30 hours total"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                  <div className="form-hint">Estimated time to complete the course</div>
                </div>
              </Col>

              {/* Total Lectures */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">Total Lectures</label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="e.g., 45"
                    min="1"
                    value={formData.totalLectures || ''}
                    onChange={(e) => setFormData({ ...formData, totalLectures: e.target.value })}
                  />
                  <div className="form-hint">Number of video lectures in this course</div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Section 4: Pricing */}
        <Col xs={12}>
          <div className="form-section">
            <h3 className="form-section-title">Pricing</h3>

            <Row className="g-4">
              {/* Price */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">
                    Price <span className="required-star">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="form-hint">Standard price for this course</div>
                </div>
              </Col>

              {/* Discount Price */}
              <Col md={6}>
                <div className="mb-4">
                  <label className="form-label">Discount Price</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      className="form-control"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.discountPrice || ''}
                      onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    />
                  </div>
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableDiscount"
                      checked={!!formData.discountPrice && formData.discountPrice !== '0' && formData.discountPrice !== 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, discountPrice: '0.00' })
                        } else {
                          setFormData({ ...formData, discountPrice: '' })
                        }
                      }}
                    />
                    <label className="form-check-label form-hint" htmlFor="enableDiscount">
                      Enable promotional discount
                    </label>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Section 5: Full Description */}
        <Col xs={12}>
          <div className="form-section">
            <h3 className="form-section-title">
              Full Description <span className="required-star">*</span>
            </h3>

            <div className="mb-4">
              <div className="border rounded overflow-hidden">
                <ReactQuill
                  theme="snow"
                  style={{ height: 350 }}
                  value={formData.description || ''}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                  placeholder="Write a detailed description of your course. Include learning objectives, prerequisites, and what students will achieve..."
                />
              </div>
              <div className="form-hint mt-2">
                Include learning objectives, prerequisites, and what students will achieve
              </div>
            </div>
          </div>
        </Col>

        {/* Navigation Button */}
        <Col xs={12}>
          <div className="d-flex justify-content-end pt-4 border-top mt-2">
            <button className="btn btn-primary px-5 py-2 fw-medium d-flex align-items-center">
              Next: Course Media
              <i className="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </Col>
      </Row>
    </form>
  )
}

export default Step1
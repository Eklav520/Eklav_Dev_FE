import React, { useState } from "react";
import { Form, Button, Row, Col, Card, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import { useAuthContext } from "@/context/useAuthContext";

// Types
interface FormData {
  title: string;
  description: string;
  highlights: string;
  category: string;
  skills: string[];
  experience: string;
  acceptanceCriteria: string;
  maxStudents: number;
  amount: number;
  deadline: string;
  startDate: string;
  githubLink: string;
  terms: string;
  ndaRequired: boolean;
  attachments: File[];
}

interface Step {
  id: number;
  title: string;
  icon: string;
  description: string;
}

// Constants
const STEPS: Step[] = [
  { id: 1, title: "Basic Info", icon: "📋", description: "Task title, description & highlights" },
  { id: 2, title: "Requirements", icon: "🎯", description: "Skills, criteria & timeline" },
  { id: 3, title: "Terms & Submit", icon: "⚖️", description: "Budget, terms & finalize" },
];

const CATEGORIES = [
  { value: "", label: "Select a category", icon: "📁" },
  { value: "web-development", label: "Web Development", icon: "🌐" },
  { value: "ai-ml", label: "AI/ML", icon: "🤖" },
  { value: "data-science", label: "Data Science", icon: "📊" },
  { value: "ui-ux", label: "UI/UX Design", icon: "🎨" },
  { value: "mobile-development", label: "Mobile Development", icon: "📱" },
  { value: "devops", label: "DevOps", icon: "⚙️" },
  { value: "cybersecurity", label: "Cybersecurity", icon: "🔒" },
  { value: "blockchain", label: "Blockchain", icon: "⛓️" },
  { value: "other", label: "Other", icon: "📌" },
];

const EXPERIENCE_LEVELS = [
  { value: "", label: "Select experience level", icon: "📌" },
  { value: "beginner", label: "Beginner (0-1 years)", icon: "🌱" },
  { value: "intermediate", label: "Intermediate (2-4 years)", icon: "📈" },
  { value: "advanced", label: "Advanced (5+ years)", icon: "🚀" },
  { value: "expert", label: "Expert (8+ years)", icon: "🏆" },
];

const MAX_STUDENTS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

// Quill toolbar configuration
const QUILL_MODULES = {
  toolbar: [
    [{ header: [false, 2, 3, 4] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    ['link', 'clean']
  ],
};

// Reusable Components
const StepIndicator: React.FC<{ currentStep: number; steps: Step[] }> = ({ currentStep, steps }) => (
  <div className="step-indicator">
    {steps.map((step, idx) => (
      <React.Fragment key={step.id}>
        <div className={`step-item ${currentStep === step.id ? "active" : currentStep > step.id ? "completed" : ""}`}>
          <div className="step-circle">
            {currentStep > step.id ? "✓" : step.icon}
          </div>
          <div className="step-content">
            <div className="step-title">{step.title}</div>
            <div className="step-description">{step.description}</div>
          </div>
        </div>
        {idx < steps.length - 1 && <div className="step-line" />}
      </React.Fragment>
    ))}
  </div>
);

const SkillBadge: React.FC<{ skill: string; onRemove: () => void }> = ({ skill, onRemove }) => (
  <Badge className="skill-badge" pill>
    {skill}
    <button type="button" className="skill-remove" onClick={onRemove}>×</button>
  </Badge>
);

const FileAttachment: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => (
  <div className="file-attachment">
    <span className="file-name">{file.name}</span>
    <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
    <button type="button" className="file-remove" onClick={onRemove}>Remove</button>
  </div>
);

const CreateTask = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const env = import.meta.env as Record<string, string | undefined>;
  const taskCreateEndpoint = env.VITE_FREELANCING_TASKS_ENDPOINT || `${baseURL}/api/institute/freelancing/tasks`;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    highlights: "",
    category: "",
    skills: [],
    experience: "",
    acceptanceCriteria: "",
    maxStudents: 1,
    amount: 0,
    deadline: "",
    startDate: "",
    githubLink: "",
    terms: "",
    ndaRequired: false,
    attachments: [],
  });
  
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...files]
      }));

      // Reset input so selecting the same file again still triggers onChange.
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const formatDateTime = (value: string) => {
    if (!value) return "?";
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? "?" : dt.toLocaleString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    if (!token) {
      setSubmitError("Unauthorized. Please login again.");
      setSubmitting(false);
      return;
    }
    
    try {
      const payload = new window.FormData();

      payload.append("title", formData.title.trim());
      payload.append("description", formData.description);
      payload.append("highlights", formData.highlights);
      payload.append("category", formData.category);
      payload.append("skills", JSON.stringify(formData.skills));
      payload.append("experience", formData.experience);
      payload.append("acceptanceCriteria", formData.acceptanceCriteria);
      payload.append("maxStudents", String(formData.maxStudents));
      payload.append("amount", String(formData.amount));
      payload.append("deadline", formData.deadline);
      payload.append("startDate", formData.startDate);
      payload.append("githubLink", formData.githubLink);
      payload.append("terms", formData.terms);
      payload.append("ndaRequired", String(formData.ndaRequired));

      formData.attachments.forEach((file) => {
        payload.append("attachments", file);
      });

      const response = await fetch(taskCreateEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        let errorMessage = "Failed to create task. Please try again.";

        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          // Response may be plain text; fall back to status text when possible.
          if (response.statusText) {
            errorMessage = response.statusText;
          }
        }

        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate("/institute/freelencing");
      }, 2000);
    } catch (error) {
      console.error("Error creating task:", error);
      const message = error instanceof Error ? error.message : "Failed to create task. Please try again.";
      setSubmitError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <>
      <Form.Group className="mb-4">
        <Form.Label>Task Title</Form.Label>
        <Form.Control
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Build an E-commerce Dashboard with React"
          className="form-control-lg"
        />
        <Form.Text className="text-muted">Be specific and descriptive (optional)</Form.Text>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Description</Form.Label>
        <div className="job-quill-editor">
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(value: any) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="Describe the task in detail. What needs to be done? What are the goals?"
            modules={QUILL_MODULES}
          />
        </div>
        <Form.Text className="text-muted">Include all relevant details (optional)</Form.Text>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Category</Form.Label>
        <Form.Select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="form-control-lg"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text className="text-muted">Select a category for your task (optional)</Form.Text>
      </Form.Group>
    </>
  );

  const renderStep2 = () => (
    <>
      <Form.Group className="mb-4">
        <Form.Label>Required Skills</Form.Label>
        <div className="skills-input-group">
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Type a skill and press Enter or click Add"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            />
            <Button variant="outline-orange" onClick={handleAddSkill}>
              Add Skill
            </Button>
          </div>
          <div className="skills-container mt-3">
            {formData.skills.map((skill, idx) => (
              <SkillBadge key={idx} skill={skill} onRemove={() => handleRemoveSkill(skill)} />
            ))}
            {formData.skills.length === 0 && (
              <small className="text-muted">No skills added yet. Add skills required for this task (optional)</small>
            )}
          </div>
        </div>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Experience Level</Form.Label>
            <Form.Select
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            >
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.icon} {level.label}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">Select the preferred experience level (optional)</Form.Text>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Team Size</Form.Label>
            <Form.Select
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleChange}
            >
              {MAX_STUDENTS_OPTIONS.map(num => (
                <option key={num} value={num}>{num} Student{num > 1 ? 's' : ''}</option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">Number of students who can work on this task</Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label>Acceptance Criteria</Form.Label>
        <div className="job-quill-editor">
          <ReactQuill
            theme="snow"
            value={formData.acceptanceCriteria}
            onChange={(value: any) => setFormData(prev => ({ ...prev, acceptanceCriteria: value }))}
            placeholder="List the criteria that must be met for task completion"
            modules={QUILL_MODULES}
          />
        </div>
        <Form.Text className="text-muted">Define clear, measurable deliverables (optional)</Form.Text>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">When should the task begin? (date and time) (optional)</Form.Text>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Deadline</Form.Label>
            <Form.Control
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">When is the task due? (date and time) (optional)</Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label>GitHub Repository</Form.Label>
        <Form.Control
          type="url"
          name="githubLink"
          value={formData.githubLink}
          onChange={handleChange}
          placeholder="https://github.com/username/repo"
        />
        <Form.Text className="text-muted">Link to starter code or template (optional)</Form.Text>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Attachments</Form.Label>
        <Form.Control
          type="file"
          multiple
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.webp,.gif"
        />
        <Form.Text className="text-muted">
          Upload documents, archives, or images (PDF, Word, ZIP/RAR, PNG, JPG, JPEG, WEBP, GIF) (optional)
        </Form.Text>

        {formData.attachments.length > 0 && (
          <div className="attachments-list mt-3">
            {formData.attachments.map((file, idx) => (
              <FileAttachment key={idx} file={file} onRemove={() => handleRemoveFile(idx)} />
            ))}
          </div>
        )}
      </Form.Group>
    </>
  );

  const renderStep3 = () => (
    <>
      <Form.Group className="mb-4">
        <Form.Label>Budget Amount (₹)</Form.Label>
        <Form.Control
          type="number"
          name="amount"
          value={formData.amount || ""}
          onChange={handleChange}
          placeholder="e.g., 5000"
          className="form-control-lg"
        />
        <Form.Text className="text-muted">Set a fair budget for the task (optional)</Form.Text>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Terms & Conditions</Form.Label>
        <div className="job-quill-editor">
          <ReactQuill
            theme="snow"
            value={formData.terms}
            onChange={(value: any) => setFormData(prev => ({ ...prev, terms: value }))}
            placeholder="Define the terms, deliverables, payment schedule, and expectations"
            modules={QUILL_MODULES}
          />
        </div>
        <Form.Text className="text-muted">Add any terms or conditions for this task (optional)</Form.Text>
      </Form.Group>

      <Form.Check
        type="checkbox"
        id="nda-required"
        label={
          <span>
            <strong>NDA Required</strong> - Non-Disclosure Agreement needed before starting
          </span>
        }
        name="ndaRequired"
        checked={formData.ndaRequired}
        onChange={handleCheckboxChange}
        className="mb-4"
      />

      <div className="summary-box">
        <h6 className="summary-title">Task Summary</h6>
        <div className="summary-item">
          <span className="summary-label">Title:</span>
          <span className="summary-value">{formData.title || "Not provided"}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Description:</span>
          <span className="summary-value">
            {formData.description ? (
              <div dangerouslySetInnerHTML={{ __html: formData.description.length > 100 ? formData.description.substring(0, 100) + "..." : formData.description }} />
            ) : "Not provided"}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Category:</span>
          <span className="summary-value">{CATEGORIES.find(c => c.value === formData.category)?.label || "Not selected"}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Skills:</span>
          <span className="summary-value">{formData.skills.join(", ") || "None"}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Experience Level:</span>
          <span className="summary-value">{EXPERIENCE_LEVELS.find(l => l.value === formData.experience)?.label || "Not selected"}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Acceptance Criteria:</span>
          <span className="summary-value">
            {formData.acceptanceCriteria ? (
              <div dangerouslySetInnerHTML={{ __html: formData.acceptanceCriteria.length > 100 ? formData.acceptanceCriteria.substring(0, 100) + "..." : formData.acceptanceCriteria }} />
            ) : "Not provided"}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Budget:</span>
          <span className="summary-value">{formData.amount ? `₹${formData.amount.toLocaleString()}` : "Not set"}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Timeline:</span>
          <span className="summary-value">
            {formData.startDate || formData.deadline ? (
              `${formData.startDate ? formatDateTime(formData.startDate) : "?"} → ${formData.deadline ? formatDateTime(formData.deadline) : "?"}`
            ) : "Not specified"}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Terms & Conditions:</span>
          <span className="summary-value">
            {formData.terms ? (
              <div dangerouslySetInnerHTML={{ __html: formData.terms.length > 100 ? formData.terms.substring(0, 100) + "..." : formData.terms }} />
            ) : "Not provided"}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">NDA Required:</span>
          <span className="summary-value">{formData.ndaRequired ? "Yes" : "No"}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="create-task-container">
      <div className="container py-4">
        {/* Header */}
        <div className="header-section mb-5">
          <h1 className="page-title">Create New Task</h1>
          <p className="page-subtitle">Post a freelance opportunity and find the perfect candidate</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        {/* Success Toast */}
        {submitSuccess && (
          <div className="toast-notification toast-success">
            <span className="toast-icon">🎉</span>
            <div className="toast-content">
              <h6>Task Created Successfully!</h6>
              <p>Your task has been posted. Redirecting...</p>
            </div>
            <button className="toast-close" onClick={() => setSubmitSuccess(false)}>×</button>
          </div>
        )}

        {/* Error Toast */}
        {submitError && (
          <div className="toast-notification toast-error">
            <span className="toast-icon">⚠️</span>
            <div className="toast-content">
              <h6>Task Creation Failed</h6>
              <p>{submitError}</p>
            </div>
            <button className="toast-close" onClick={() => setSubmitError("")}>×</button>
          </div>
        )}

        {/* Form Card */}
        <Card className="task-form-card">
          <Card.Body className="p-4 p-lg-5">
            <Form onSubmit={handleSubmit}>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="action-buttons">
                {currentStep > 1 && (
                  <Button variant="outline-orange" onClick={prevStep} disabled={submitting}>
                    ← Previous
                  </Button>
                )}
                
                {currentStep < 3 && (
                  <Button variant="orange" onClick={nextStep}>
                    Next Step →
                  </Button>
                )}
                
                {currentStep === 3 && (
                  <Button variant="orange" type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating Task...
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </Button>
                )}
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>

      <style>{`
        .create-task-container {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }

        /* Header Styles */
        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          color: #888888;
          font-size: 1.1rem;
        }

        /* Step Indicator */
        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3rem;
          padding: 0 1rem;
          position: relative;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          position: relative;
          z-index: 1;
        }

        .step-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px solid #333333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          transition: all 0.3s ease;
          color: #888888;
        }

        .step-item.active .step-circle {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #ffffff;
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
        }

        .step-item.completed .step-circle {
          background: #ff6b35;
          border-color: #ff6b35;
          color: #ffffff;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-weight: 600;
          font-size: 1rem;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .step-description {
          font-size: 0.8rem;
          color: #888888;
        }

        .step-item.active .step-title {
          color: #ff6b35;
        }

        .step-line {
          flex: 1;
          height: 2px;
          background: #333333;
          margin: 0 1rem;
          position: relative;
          z-index: 0;
        }

        /* Form Card */
        .task-form-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        /* Form Elements */
        .form-label {
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-control, .form-select {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          transition: all 0.3s ease;
        }

        .form-control:focus, .form-select:focus {
          background: #1a1a1a;
          border-color: #ff6b35;
          color: #ffffff;
          box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
        }

        .form-control::placeholder {
          color: #666666;
        }

        .form-text {
          color: #888888 !important;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        /* ReactQuill Editor */
        .job-quill-editor {
          background: #1a1a1a;
          border-radius: 8px;
          overflow: hidden;
        }

        .job-quill-editor .ql-toolbar {
          background: #0a0a0a;
          border-color: #333333;
        }

        .job-quill-editor .ql-container {
          min-height: 200px;
          font-size: 0.95rem;
        }

        .job-quill-editor .ql-editor {
          min-height: 180px;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #ffffff;
        }

        .job-quill-editor .ql-editor.ql-blank::before {
          color: #666666;
        }

        .job-quill-editor .ql-stroke {
          stroke: #ffffff;
        }

        .job-quill-editor .ql-fill {
          fill: #ffffff;
        }

        .job-quill-editor .ql-picker {
          color: #ffffff;
        }

        .job-quill-editor .ql-picker-options {
          background: #1a1a1a;
          border-color: #333333;
        }

        /* Skills */
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-badge {
          background: #ff6b35;
          color: #ffffff;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 8px;
        }

        .skill-remove {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .skill-remove:hover {
          opacity: 1;
        }

        /* File Attachments */
        .attachments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-attachment {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem;
          background: #1a1a1a;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .file-name {
          font-weight: 500;
          color: #ffffff;
        }

        .file-size {
          color: #888888;
          font-size: 0.8rem;
        }

        .file-remove {
          margin-left: auto;
          background: none;
          border: none;
          color: #ff6b35;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .file-remove:hover {
          background: #ff6b35;
          color: #ffffff;
        }

        /* Summary Box */
        .summary-box {
          background: #1a1a1a;
          border: 1px solid #333333;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .summary-title {
          color: #ff6b35;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #333333;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          color: #ffffff;
          border-bottom: 1px solid #222222;
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .summary-label {
          font-weight: 500;
          color: #888888;
          min-width: 140px;
        }

        .summary-value {
          color: #ffffff;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }

        .summary-value p {
          margin-bottom: 0;
        }

        /* Toast Notifications */
        .toast-notification {
          position: fixed;
          top: 1rem;
          right: 1.5rem;
          z-index: 99999;
          max-width: 340px;
          width: calc(100vw - 3rem);
          border-radius: 12px;
          padding: 1rem 1rem 1rem 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          animation: toastSlideIn 0.3s ease;
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .toast-success {
          background: rgba(40, 167, 69, 0.15);
          border: 1px solid #28a745;
        }

        .toast-error {
          background: rgba(220, 53, 69, 0.15);
          border: 1px solid #dc3545;
        }

        .toast-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .toast-content {
          flex: 1;
        }

        .toast-content h6 {
          margin-bottom: 0.2rem;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .toast-success .toast-content h6 { color: #28a745; }
        .toast-error   .toast-content h6 { color: #dc3545; }

        .toast-content p {
          color: #aaaaaa;
          margin: 0;
          font-size: 0.82rem;
          line-height: 1.4;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: #888888;
          font-size: 1.25rem;
          line-height: 1;
          cursor: pointer;
          padding: 0 0.25rem;
          flex-shrink: 0;
          margin-top: -0.1rem;
        }

        .toast-close:hover { color: #ffffff; }

        /* Buttons */
        .action-buttons {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #333333;
        }

        .btn-orange {
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border: none;
          color: #ffffff;
          padding: 0.75rem 2rem;
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .btn-orange:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
          background: linear-gradient(135deg, #ff7a4a 0%, #ffaa6c 100%);
        }

        .btn-outline-orange {
          background: transparent;
          border: 2px solid #ff6b35;
          color: #ff6b35;
          padding: 0.75rem 2rem;
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .btn-outline-orange:hover:not(:disabled) {
          background: #ff6b35;
          color: #ffffff;
          transform: translateY(-2px);
        }

        .btn-orange:disabled, .btn-outline-orange:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        ::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #ff9a5c;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .step-indicator {
            flex-direction: column;
            gap: 1rem;
          }
          
          .step-line {
            display: none;
          }
          
          .step-item {
            width: 100%;
          }
          
          .page-title {
            font-size: 1.8rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .action-buttons button {
            width: 100%;
          }
          
          .summary-item {
            flex-direction: column;
            gap: 0.25rem;
          }
          
          .summary-value {
            text-align: left;
            max-width: 100%;
          }
          
          .summary-label {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateTask;
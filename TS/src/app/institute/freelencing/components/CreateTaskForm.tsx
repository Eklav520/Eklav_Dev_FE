import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import {
  FaBriefcase, FaListUl, FaClipboardList, FaBullseye, FaBalanceScale, FaCheck, FaArrowLeft, FaArrowRight,
  FaPlus, FaTimes, FaCloudUploadAlt, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaGithub,
} from "react-icons/fa";
import type { IconType } from "react-icons";
import { useAuthContext } from "@/context/useAuthContext";
import { AdminPage, PageHeader, AdminSelect, type SelectOption } from "@/components/admin-ui";

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
  icon: IconType;
  description: string;
}

// Constants
const STEPS: Step[] = [
  { id: 1, title: "Basic Info", icon: FaClipboardList, description: "Title, description & category" },
  { id: 2, title: "Requirements", icon: FaBullseye, description: "Skills, criteria & timeline" },
  { id: 3, title: "Terms & Submit", icon: FaBalanceScale, description: "Budget, terms & review" },
];

const CATEGORIES: SelectOption[] = [
  { value: "", label: "Select a category" },
  { value: "web-development", label: "Web Development" },
  { value: "ai-ml", label: "AI/ML" },
  { value: "deep-learning", label: "Deep Learning" },
  { value: "data-science", label: "Data Science" },
  { value: "ui-ux", label: "UI/UX Design" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "devops", label: "DevOps" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "blockchain", label: "Blockchain" },
  { value: "other", label: "Other" },
];

const EXPERIENCE_LEVELS: SelectOption[] = [
  { value: "", label: "Select experience level" },
  { value: "beginner", label: "Beginner (0-1 years)" },
  { value: "intermediate", label: "Intermediate (2-4 years)" },
  { value: "advanced", label: "Advanced (5+ years)" },
  { value: "expert", label: "Expert (8+ years)" },
];

const MAX_STUDENTS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

// One-click skill suggestions for the chosen category
const SKILL_SUGGESTIONS: Record<string, string[]> = {
  "web-development": ["React", "Node.js", "JavaScript", "TypeScript", "HTML/CSS", "MongoDB"],
  "ai-ml": ["Python", "scikit-learn", "TensorFlow", "Pandas", "NumPy"],
  "deep-learning": ["Python", "PyTorch", "TensorFlow", "CNNs", "NLP"],
  "data-science": ["Python", "SQL", "Pandas", "Power BI", "Statistics"],
  "ui-ux": ["Figma", "Wireframing", "Prototyping", "User Research"],
  "mobile-development": ["React Native", "Flutter", "Kotlin", "Swift"],
  "devops": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
  "cybersecurity": ["Networking", "Linux", "OWASP", "Penetration Testing"],
  "blockchain": ["Solidity", "Ethereum", "Web3.js", "Smart Contracts"],
};

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

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const isEmptyHtml = (html: string) => stripHtml(html).length === 0;

// Reusable Components
const StepIndicator: React.FC<{ currentStep: number; steps: Step[]; onStepClick: (id: number) => void }> = ({ currentStep, steps, onStepClick }) => (
  <div className="ctf-steps">
    {steps.map((step, idx) => {
      const state = currentStep === step.id ? "is-active" : currentStep > step.id ? "is-done" : "";
      const Icon = step.icon;
      return (
        <React.Fragment key={step.id}>
          <button
            type="button"
            className={`ctf-step ${state}`}
            onClick={() => onStepClick(step.id)}
            disabled={step.id > currentStep}
          >
            <span className="ctf-step-circle">{currentStep > step.id ? <FaCheck /> : <Icon />}</span>
            <span className="ctf-step-text">
              <small>Step {step.id}</small>
              <strong>{step.title}</strong>
              <em>{step.description}</em>
            </span>
          </button>
          {/* Connector — level with the circles, orange once the step before it is done */}
          {idx < steps.length - 1 && <span className={`ctf-step-line${currentStep > step.id ? " is-done" : ""}`} aria-hidden="true" />}
        </React.Fragment>
      );
    })}
  </div>
);

const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode; optional?: boolean }> = ({ htmlFor, children, optional = true }) => (
  <label className="aui-label" htmlFor={htmlFor}>
    {children}
    {optional && <span className="aui-optional">Optional</span>}
  </label>
);

const SummaryRow: React.FC<{ label: string; value: React.ReactNode; empty?: boolean }> = ({ label, value, empty }) => (
  <div className="ctf-summary-row">
    <span>{label}</span>
    <strong className={empty ? "is-empty" : ""}>{value}</strong>
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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deadline must come after the start date when both are set
  const dateError = formData.startDate && formData.deadline && new Date(formData.deadline) <= new Date(formData.startDate)
    ? "Deadline must be after the start date"
    : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const setField = <K extends keyof FormData>(name: K, value: FormData[K]) =>
    setFormData(prev => ({ ...prev, [name]: value }));

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const addSkill = (raw: string) => {
    const skill = raw.trim();
    if (skill && !formData.skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const handleAddSkill = () => {
    addSkill(skillInput);
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addFiles = (files: File[]) => {
    if (files.length) setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      // Reset input so selecting the same file again still triggers onChange.
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (currentStep === 2 && dateError) return;
    goToStep(currentStep + 1);
  };

  const prevStep = () => goToStep(currentStep - 1);

  const formatDateTime = (value: string) => {
    if (!value) return "?";
    const dt = new Date(value);
    return Number.isNaN(dt.getTime())
      ? "?"
      : dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Only ever called from the Create Task button — never from the form's implicit submit
  const handleSubmit = async () => {
    if (currentStep !== STEPS.length || submitting) return;
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
      // Go to the task list (previously this reloaded the same route, leaving the filled form on screen)
      setTimeout(() => {
        navigate("/institute/freelencing/tasks");
      }, 1500);
    } catch (error) {
      console.error("Error creating task:", error);
      const message = error instanceof Error ? error.message : "Failed to create task. Please try again.";
      setSubmitError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const suggestions = (SKILL_SUGGESTIONS[formData.category] || [])
    .filter(s => !formData.skills.some(x => x.toLowerCase() === s.toLowerCase()));

  const renderStep1 = () => (
    <>
      <div className="aui-field">
        <FieldLabel htmlFor="task-title">Task Title</FieldLabel>
        <input
          id="task-title"
          className="aui-input"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Build an E-commerce Dashboard with React"
        />
        <p className="aui-hint">Be specific — students see this first.</p>
      </div>

      <div className="aui-field">
        <FieldLabel>Category</FieldLabel>
        <AdminSelect label="Category" value={formData.category} options={CATEGORIES} onChange={value => setField("category", value)} />
        <p className="aui-hint">Helps students find the task and suggests relevant skills.</p>
      </div>

      <div className="aui-field">
        <FieldLabel>Description</FieldLabel>
        <div className="ctf-quill">
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={(value: any) => setField("description", value)}
            placeholder="Describe the task in detail. What needs to be done? What are the goals?"
            modules={QUILL_MODULES}
          />
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="aui-field">
        <FieldLabel htmlFor="task-skill">Required Skills</FieldLabel>
        <div className="ctf-skill-input">
          <input
            id="task-skill"
            className="aui-input"
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Type a skill and press Enter"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
          />
          <button type="button" className="aui-btn aui-btn-soft" onClick={handleAddSkill} disabled={!skillInput.trim()}>
            <FaPlus size={10} /> Add
          </button>
        </div>
        {formData.skills.length > 0 && (
          <div className="ctf-chips">
            {formData.skills.map(skill => (
              <span key={skill} className="ctf-chip">
                {skill}
                <button type="button" onClick={() => handleRemoveSkill(skill)} aria-label={`Remove ${skill}`}><FaTimes /></button>
              </span>
            ))}
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="ctf-suggest">
            <span>Suggested:</span>
            {suggestions.map(s => (
              <button key={s} type="button" onClick={() => addSkill(s)}><FaPlus size={8} /> {s}</button>
            ))}
          </div>
        )}
      </div>

      <div className="aui-field-row">
        <div className="aui-field">
          <FieldLabel>Experience Level</FieldLabel>
          <AdminSelect label="Experience level" value={formData.experience} options={EXPERIENCE_LEVELS} onChange={value => setField("experience", value)} />
        </div>
        <div className="aui-field">
          <FieldLabel optional={false}>Team Size</FieldLabel>
          <AdminSelect
            label="Team size"
            value={String(formData.maxStudents)}
            options={MAX_STUDENTS_OPTIONS.map(num => ({ value: String(num), label: `${num} Student${num > 1 ? 's' : ''}` }))}
            onChange={value => setField("maxStudents", Number(value))}
          />
          <p className="aui-hint">How many students can work on this task.</p>
        </div>
      </div>

      <div className="aui-field">
        <FieldLabel>Acceptance Criteria</FieldLabel>
        <div className="ctf-quill">
          <ReactQuill
            theme="snow"
            value={formData.acceptanceCriteria}
            onChange={(value: any) => setField("acceptanceCriteria", value)}
            placeholder="List the criteria that must be met for task completion"
            modules={QUILL_MODULES}
          />
        </div>
        <p className="aui-hint">Define clear, measurable deliverables.</p>
      </div>

      <div className="aui-field-row">
        <div className="aui-field">
          <FieldLabel htmlFor="task-start">Start Date</FieldLabel>
          <input id="task-start" className="aui-input" type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} />
        </div>
        <div className="aui-field">
          <FieldLabel htmlFor="task-deadline">Deadline</FieldLabel>
          <input
            id="task-deadline"
            className={`aui-input${dateError ? " is-invalid" : ""}`}
            type="datetime-local"
            name="deadline"
            value={formData.deadline}
            min={formData.startDate || undefined}
            onChange={handleChange}
          />
          {dateError && <p className="aui-error">{dateError}</p>}
        </div>
      </div>

      <div className="aui-field">
        <FieldLabel htmlFor="task-github">GitHub Repository</FieldLabel>
        <div className="aui-input-group">
          <FaGithub className="aui-input-prefix" />
          <input id="task-github" className="aui-input" type="url" name="githubLink" value={formData.githubLink} onChange={handleChange} placeholder="https://github.com/username/repo" />
        </div>
        <p className="aui-hint">Link to starter code or a template.</p>
      </div>

      <div className="aui-field">
        <FieldLabel>Attachments</FieldLabel>
        <div
          className={`ctf-dropzone${dragOver ? " is-over" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
        >
          <FaCloudUploadAlt className="ctf-dropzone-icon" />
          <strong>Drop files here or <span>browse</span></strong>
          <small>PDF, Word, ZIP/RAR, PNG, JPG, WEBP, GIF</small>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg,.webp,.gif"
          />
        </div>
        {formData.attachments.length > 0 && (
          <div className="ctf-files">
            {formData.attachments.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="ctf-file">
                <FaFileAlt className="ctf-file-icon" />
                <span className="ctf-file-name">{file.name}</span>
                <span className="ctf-file-size">{(file.size / 1024).toFixed(0)} KB</span>
                <button type="button" className="aui-icon-btn" onClick={() => handleRemoveFile(idx)} aria-label={`Remove ${file.name}`}><FaTimes size={11} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="aui-field">
        <FieldLabel htmlFor="task-amount">Budget Amount</FieldLabel>
        <div className="aui-input-group">
          <span className="aui-input-prefix">₹</span>
          <input
            id="task-amount"
            className="aui-input"
            type="number"
            min={0}
            name="amount"
            value={formData.amount || ""}
            onChange={handleChange}
            placeholder="e.g., 5000"
          />
        </div>
        <p className="aui-hint">Leave empty for an unpaid task.</p>
      </div>

      <div className="aui-field">
        <FieldLabel>Terms & Conditions</FieldLabel>
        <div className="ctf-quill">
          <ReactQuill
            theme="snow"
            value={formData.terms}
            onChange={(value: any) => setField("terms", value)}
            placeholder="Define the terms, deliverables, payment schedule, and expectations"
            modules={QUILL_MODULES}
          />
        </div>
      </div>

      <label className="aui-toggle" htmlFor="nda-required">
        <input type="checkbox" id="nda-required" name="ndaRequired" checked={formData.ndaRequired} onChange={handleCheckboxChange} />
        <span className="aui-toggle-track" />
        <span>
          <strong>NDA Required</strong>
          <small>Students must accept a Non-Disclosure Agreement before starting.</small>
        </span>
      </label>
    </>
  );

  const step = STEPS[currentStep - 1];
  const StepIcon = step.icon;
  const categoryLabel = CATEGORIES.find(c => c.value === formData.category && c.value)?.label;
  const experienceLabel = EXPERIENCE_LEVELS.find(l => l.value === formData.experience && l.value)?.label;

  return (
    <AdminPage>
      <PageHeader
        icon={FaBriefcase}
        title="Create Internship Task"
        subtitle="Post a task for students — fill in the details in three short steps"
        actions={<Link to="/institute/freelencing/tasks" className="aui-btn"><FaListUl size={11} /> View Task List</Link>}
      />

      {/* Toasts */}
      {submitSuccess && (
        <div className="ctf-toast is-success" role="status">
          <FaCheckCircle className="ctf-toast-icon" />
          <div>
            <strong>Task created successfully</strong>
            <span>Taking you to the task list…</span>
          </div>
          <button type="button" onClick={() => setSubmitSuccess(false)} aria-label="Dismiss"><FaTimes /></button>
        </div>
      )}
      {submitError && (
        <div className="ctf-toast is-error" role="alert">
          <FaExclamationTriangle className="ctf-toast-icon" />
          <div>
            <strong>Task creation failed</strong>
            <span>{submitError}</span>
          </div>
          <button type="button" onClick={() => setSubmitError("")} aria-label="Dismiss"><FaTimes /></button>
        </div>
      )}

      <StepIndicator currentStep={currentStep} steps={STEPS} onStepClick={goToStep} />

      <div className="ctf-layout">
        {/* Form */}
        {/* Implicit submission (Enter key, or a button React re-uses as type="submit") must never create a task */}
        <form className="aui-card ctf-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="aui-toolbar">
            <div className="aui-toolbar-title ctf-form-title">
              <span className="aui-heading-icon ctf-form-icon"><StepIcon /></span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
            <span className="aui-count">Step {currentStep} of {STEPS.length}</span>
          </div>

          <div className="ctf-form-body">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          <div className="ctf-actions">
            {currentStep > 1 ? (
              <button key="prev" type="button" className="aui-btn" onClick={prevStep} disabled={submitting}>
                <FaArrowLeft size={10} /> Previous
              </button>
            ) : <span />}

            {currentStep < STEPS.length ? (
              <button key="next" type="button" className="aui-btn aui-btn-primary" onClick={nextStep} disabled={currentStep === 2 && !!dateError}>
                Next Step <FaArrowRight size={10} />
              </button>
            ) : (
              <button key="create" type="button" className="aui-btn aui-btn-primary" onClick={handleSubmit} disabled={submitting || !!dateError}>
                {submitting ? <><FaSpinner className="aui-spin" style={{ color: '#fff' }} /> Creating Task…</> : <><FaCheck size={11} /> Create Task</>}
              </button>
            )}
          </div>
        </form>

        {/* Live summary */}
        <aside className="aui-card ctf-summary">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">
              <h3>Task Summary</h3>
              <p>Updates as you fill in the form</p>
            </div>
          </div>
          <div className="ctf-summary-body">
            <div className="ctf-summary-title">{formData.title || <span className="is-empty">Untitled task</span>}</div>
            {categoryLabel && <span className="aui-badge aui-badge-orange">{categoryLabel}</span>}
            {!isEmptyHtml(formData.description) && (
              <p className="ctf-summary-desc">{stripHtml(formData.description).slice(0, 160)}{stripHtml(formData.description).length > 160 ? "…" : ""}</p>
            )}

            <SummaryRow label="Experience" value={experienceLabel || "Not selected"} empty={!experienceLabel} />
            <SummaryRow label="Team size" value={`${formData.maxStudents} student${formData.maxStudents > 1 ? 's' : ''}`} />
            <SummaryRow label="Budget" value={formData.amount ? `₹${formData.amount.toLocaleString('en-IN')}` : "Not set"} empty={!formData.amount} />
            <SummaryRow label="Starts" value={formData.startDate ? formatDateTime(formData.startDate) : "Not set"} empty={!formData.startDate} />
            <SummaryRow label="Deadline" value={formData.deadline ? formatDateTime(formData.deadline) : "Not set"} empty={!formData.deadline} />
            <SummaryRow label="Acceptance criteria" value={isEmptyHtml(formData.acceptanceCriteria) ? "Not provided" : "Added"} empty={isEmptyHtml(formData.acceptanceCriteria)} />
            <SummaryRow label="Terms" value={isEmptyHtml(formData.terms) ? "Not provided" : "Added"} empty={isEmptyHtml(formData.terms)} />
            <SummaryRow label="Attachments" value={formData.attachments.length ? `${formData.attachments.length} file${formData.attachments.length > 1 ? 's' : ''}` : "None"} empty={!formData.attachments.length} />
            <SummaryRow label="NDA" value={formData.ndaRequired ? "Required" : "Not required"} />

            <div className="ctf-summary-skills">
              <span>Skills</span>
              {formData.skills.length
                ? <div className="ctf-chips">{formData.skills.map(s => <span key={s} className="aui-badge aui-badge-muted">{s}</span>)}</div>
                : <strong className="is-empty">None added</strong>}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        /* Stepper */
        .ctf-steps { display: flex; align-items: flex-start; gap: 1rem; margin: 1.25rem 0; padding: 1rem 1.25rem; border: 1px solid #25282b; border-radius: 12px; background: #0e1012; }
        .ctf-step-line { flex: 1 1 auto; min-width: 24px; height: 2px; margin-top: 19px; border-radius: 2px; background: #2a2e33; transition: background 0.3s ease; }
        .ctf-step-line.is-done { background: #ff7a00; }
        .ctf-step { display: flex; flex: 0 0 auto; align-items: flex-start; gap: 0.75rem; padding: 0; border: 0; background: none; text-align: left; cursor: pointer; }
        .ctf-step:disabled { cursor: default; }
        .ctf-step-circle { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border: 2px solid #34383d; border-radius: 50%; background: #111315; color: #858a90; font-size: 0.9rem; transition: all 0.2s; }
        .ctf-step.is-active .ctf-step-circle { border-color: #ff7a00; background: rgba(255,122,0,0.14); color: #ff9a3c; box-shadow: 0 0 0 4px rgba(255,122,0,0.1); }
        .ctf-step.is-done .ctf-step-circle { border-color: #ff7a00; background: #ff7a00; color: #fff; }
        .ctf-step-text { display: flex; flex-direction: column; gap: 1px; padding-top: 1px; }
        .ctf-step-text small { color: #6b7280; font-size: 0.64rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .ctf-step-text strong { color: #9ca3af; font-size: 0.86rem; }
        .ctf-step-text em { color: #6b7280; font-size: 0.72rem; font-style: normal; }
        .ctf-step.is-active .ctf-step-text strong, .ctf-step.is-done .ctf-step-text strong { color: #fff; }
        .ctf-step.is-done:hover .ctf-step-text strong { color: #ff9a3c; }

        /* Layout */
        .ctf-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1rem; align-items: start; }
        .ctf-layout > .aui-card { margin-top: 0; }
        .ctf-form-title { display: flex; align-items: center; gap: 12px; }
        .ctf-form-icon { width: 36px; height: 36px; flex-basis: 36px; font-size: 0.9rem; }
        .ctf-form-body { padding: 1.25rem 1.25rem 0.25rem; }
        .ctf-actions { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.85rem 1.25rem; border-top: 1px solid #25282b; }

        /* Quill (dark) */
        .ctf-quill { overflow: hidden; border: 1px solid #34383d; border-radius: 8px; background: #17191c; }
        .ctf-quill:focus-within { border-color: rgba(255,122,0,0.75); box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
        .ctf-quill .ql-toolbar { border: 0; border-bottom: 1px solid #2a2e33; background: #111315; }
        .ctf-quill .ql-container { border: 0; font-family: inherit; font-size: 0.88rem; }
        .ctf-quill .ql-editor { min-height: 150px; color: #f1f5f9; line-height: 1.6; }
        .ctf-quill .ql-editor.ql-blank::before { color: #5b616a; font-style: normal; }
        .ctf-quill .ql-stroke { stroke: #cbd5e1; }
        .ctf-quill .ql-fill { fill: #cbd5e1; }
        .ctf-quill .ql-picker { color: #cbd5e1; }
        .ctf-quill .ql-picker-options { background: #17191c; border-color: #34383d !important; }
        .ctf-quill button:hover .ql-stroke, .ctf-quill .ql-active .ql-stroke { stroke: #ff9a3c; }
        .ctf-quill button:hover .ql-fill, .ctf-quill .ql-active .ql-fill { fill: #ff9a3c; }

        /* Skills */
        .ctf-skill-input { display: flex; gap: 0.5rem; }
        .ctf-skill-input .aui-btn { height: 40px; }
        .ctf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .ctf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; border: 1px solid rgba(255,122,0,0.35); border-radius: 99px; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.76rem; font-weight: 600; }
        .ctf-chip button { display: grid; place-items: center; width: 16px; height: 16px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,122,0,0.2); color: #ffb15e; font-size: 0.55rem; cursor: pointer; }
        .ctf-chip button:hover { background: #ff7a00; color: #fff; }
        .ctf-suggest { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .ctf-suggest > span { color: #6b7280; font-size: 0.72rem; }
        .ctf-suggest button { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border: 1px dashed #3a3e43; border-radius: 99px; background: none; color: #9ca3af; font-size: 0.72rem; cursor: pointer; }
        .ctf-suggest button:hover { border-color: rgba(255,122,0,0.6); color: #ff9a3c; }

        /* Attachments */
        .ctf-dropzone { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 1.4rem 1rem; border: 1.5px dashed #34383d; border-radius: 10px; background: #111315; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .ctf-dropzone:hover, .ctf-dropzone:focus-visible, .ctf-dropzone.is-over { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.05); outline: none; }
        .ctf-dropzone-icon { color: #ff7a00; font-size: 1.6rem; }
        .ctf-dropzone strong { color: #e5e7eb; font-size: 0.82rem; }
        .ctf-dropzone strong span { color: #ff9a3c; text-decoration: underline; }
        .ctf-dropzone small { color: #6b7280; font-size: 0.7rem; }
        .ctf-files { display: flex; flex-direction: column; gap: 6px; }
        .ctf-file { display: flex; align-items: center; gap: 10px; padding: 0.45rem 0.5rem 0.45rem 0.75rem; border: 1px solid #25282b; border-radius: 8px; background: #111315; }
        .ctf-file-icon { color: #ff9a3c; flex-shrink: 0; }
        .ctf-file-name { min-width: 0; overflow: hidden; color: #e5e7eb; font-size: 0.8rem; text-overflow: ellipsis; white-space: nowrap; }
        .ctf-file-size { margin-left: auto; color: #6b7280; font-size: 0.72rem; white-space: nowrap; }

        /* Summary */
        .ctf-summary { position: sticky; top: 0; }
        .ctf-summary-body { display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; }
        .ctf-summary-title { color: #fff; font-size: 0.95rem; font-weight: 700; line-height: 1.35; word-break: break-word; }
        .ctf-summary-body > .aui-badge { align-self: flex-start; }
        .ctf-summary-desc { margin: 0 0 0.25rem; color: #9ca3af; font-size: 0.76rem; line-height: 1.5; }
        .ctf-summary-row { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.4rem 0; border-top: 1px solid #1d2023; font-size: 0.76rem; }
        .ctf-summary-row > span { color: #858a90; white-space: nowrap; }
        .ctf-summary-row > strong { color: #e5e7eb; font-weight: 600; text-align: right; }
        .ctf-summary-skills { display: flex; flex-direction: column; gap: 6px; padding-top: 0.45rem; border-top: 1px solid #1d2023; font-size: 0.76rem; }
        .ctf-summary-skills > span { color: #858a90; }
        .ctf-summary .is-empty, .ctf-summary-title .is-empty { color: #5b616a; font-weight: 500; }

        /* Toasts */
        .ctf-toast { position: fixed; top: 80px; right: 1.5rem; z-index: 2000; display: flex; align-items: flex-start; gap: 0.75rem; width: min(360px, calc(100vw - 3rem)); padding: 0.9rem 1rem; border: 1px solid; border-radius: 12px; background: #111315; box-shadow: 0 12px 32px rgba(0,0,0,0.55); animation: ctf-toast-in 0.25s ease; }
        .ctf-toast.is-success { border-color: rgba(49,216,102,0.4); }
        .ctf-toast.is-error { border-color: rgba(251,95,103,0.45); }
        .ctf-toast-icon { flex-shrink: 0; margin-top: 2px; font-size: 1.1rem; }
        .ctf-toast.is-success .ctf-toast-icon { color: #45dd75; }
        .ctf-toast.is-error .ctf-toast-icon { color: #fb737a; }
        .ctf-toast > div { flex: 1; }
        .ctf-toast strong { display: block; color: #fff; font-size: 0.86rem; }
        .ctf-toast span { display: block; margin-top: 2px; color: #9ca3af; font-size: 0.78rem; }
        .ctf-toast > button { padding: 2px; border: 0; background: none; color: #6b7280; cursor: pointer; }
        .ctf-toast > button:hover { color: #fff; }
        @keyframes ctf-toast-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }

        @media (max-width: 1199.98px) {
          .ctf-layout { grid-template-columns: 1fr; }
          .ctf-summary { position: static; }
        }
        @media (max-width: 767.98px) {
          .ctf-steps { flex-direction: column; gap: 0.75rem; }
          .ctf-step-line { display: none; }
          .ctf-step-text em { display: none; }
        }
      `}</style>
    </AdminPage>
  );
};

export default CreateTask;

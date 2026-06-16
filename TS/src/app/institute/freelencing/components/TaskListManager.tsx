import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';

type Attachment = {
  fileName?: string;
  fileUrl?: string;
  s3Key?: string;
};

type FreelancingTask = {
  _id: string;
  title: string;
  description?: string;
  highlights?: string;
  category?: string;
  skills?: string[];
  experience?: string;
  acceptanceCriteria?: string;
  maxStudents?: number;
  amount?: number;
  deadline?: string;
  startDate?: string;
  githubLink?: string;
  terms?: string;
  ndaRequired?: boolean;
  attachments?: Attachment[];
  enrolledStudents?: Array<string | { _id?: string; name?: string; email?: string }>;
  enrolledStudentsDetails?: Array<{ studentId?: string; name?: string; email?: string }>;
  enrolledCount?: number;
  spotsLeft?: number;
  createdAt?: string;
};

type AiCriterion = {
  criterion: string;
  met: boolean;
  score: number;
  maxScore: number;
  feedback: string;
};

type AiAnnotation = {
  issue: string;
  severity: 'critical' | 'major' | 'minor';
  location: string;
  suggestion: string;
};

type AiFacultyReport = {
  technicalDepth: string;
  effortEstimate: string;
  overallAssessment: string;
  keyFindings: string[];
  recommendations: string[];
};

type AiEvaluation = {
  score: number | null;
  grade: string | null;
  summary: string;
  relevanceCheck?: { isRelevant: boolean; relevanceScore: number; reason: string };
  criteriaEvaluation: AiCriterion[];
  codeAnnotations?: AiAnnotation[];
  facultyReport?: AiFacultyReport;
  strengths: string[];
  improvements: string[];
  evaluatedAt?: string;
  verifiedByAdmin?: boolean;
  adminFinalScore?: number | null;
};

type TaskSubmission = {
  _id: string;
  taskId?: string;
  studentId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  codeLink?: string;
  codeDescription?: string;
  attachments?: Attachment[];
  status?: "pending" | "completed";
  adminReviewStatus?: "pending" | "approved" | "rejected";
  adminFeedback?: string;
  updatedAt?: string;
  aiEvaluation?: AiEvaluation | null;
};

type AllSubmission = {
  _id: string;
  taskId?: string;
  status?: "pending" | "completed";
  adminReviewStatus?: "pending" | "approved" | "rejected";
  adminFeedback?: string;
  codeLink?: string;
  codeDescription?: string;
  updatedAt?: string;
  studentId?: { _id?: string; name?: string; email?: string } | null;
  task?: {
    _id?: string;
    title?: string;
    category?: string;
    skills?: string[];
    deadline?: string;
    amount?: number;
  } | null;
};

type EditFormState = {
  title: string;
  category: string;
  experience: string;
  amount: number;
  maxStudents: number;
  deadline: string;
  startDate: string;
  githubLink: string;
  skills: string;
  description: string;
  highlights: string;
  acceptanceCriteria: string;
  terms: string;
  ndaRequired: boolean;
  replaceAttachments: boolean;
};

const defaultEditState: EditFormState = {
  title: "",
  category: "",
  experience: "",
  amount: 0,
  maxStudents: 1,
  deadline: "",
  startDate: "",
  githubLink: "",
  skills: "",
  description: "",
  highlights: "",
  acceptanceCriteria: "",
  terms: "",
  ndaRequired: false,
  replaceAttachments: false,
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

const CATEGORIES = [
  { value: "web-development", label: "Web Development", icon: "🌐" },
  { value: "ai-ml", label: "AI/ML", icon: "🤖" },
  { value: "data-science", label: "Data Science", icon: "📊" },
  { value: "ui-ux", label: "UI/UX Design", icon: "🎨" },
  { value: "mobile-development", label: "Mobile Development", icon: "📱" },
  { value: "devops", label: "DevOps", icon: "⚙️" },
  { value: "cybersecurity", label: "Cybersecurity", icon: "🔒" },
  { value: "blockchain", label: "Blockchain", icon: "⛓️" },
];

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner (0-1 years)", icon: "🌱" },
  { value: "intermediate", label: "Intermediate (2-4 years)", icon: "📈" },
  { value: "advanced", label: "Advanced (5+ years)", icon: "🚀" },
  { value: "expert", label: "Expert (8+ years)", icon: "🏆" },
];

const toDateTimeLocalValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const localDateTimeToUTC = (localDateTimeString: string): string => {
  if (!localDateTimeString) return "";
  const [datePart, timePart] = localDateTimeString.split('T');
  if (!datePart || !timePart) return "";
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return localDate.toISOString();
};

const TaskListManager = () => {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const env = import.meta.env as Record<string, string | undefined>;
  const tasksEndpoint = env.VITE_FREELANCING_TASKS_ENDPOINT || `${baseURL}/api/institute/freelancing/tasks`;

  const [tasks, setTasks] = useState<FreelancingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<FreelancingTask | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(defaultEditState);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [deletedAttachmentKeys, setDeletedAttachmentKeys] = useState<string[]>([]);

  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsSavingId, setSubmissionsSavingId] = useState<string | null>(null);
  const [selectedSubmissionTask, setSelectedSubmissionTask] = useState<FreelancingTask | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<"pending" | "all" | "approved" | "rejected">("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "full" | "deadline-passed">("all");
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { adminReviewStatus: "pending" | "approved" | "rejected"; adminFeedback: string }>
  >({});

  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [adminFinalScores, setAdminFinalScores] = useState<Record<string, string>>({});
  const [expandedEval, setExpandedEval] = useState<Record<string, boolean>>({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<FreelancingTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Board view
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [boardSubmissions, setBoardSubmissions] = useState<AllSubmission[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [tasks]
  );

  const filteredSubmissions = useMemo(() => {
    if (submissionFilter === "all") return submissions;
    if (submissionFilter === "pending") {
      return submissions.filter((submission) => (submission.adminReviewStatus || "pending") === "pending");
    }
    return submissions.filter((submission) => (submission.adminReviewStatus || "pending") === submissionFilter);
  }, [submissions, submissionFilter]);

  const fetchTasks = async () => {
    if (!token) {
      setErrorMessage("Unauthorized. Please login again.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(tasksEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch tasks error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardSubmissions = async () => {
    if (!token) return;
    setBoardLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${baseURL}/api/institute/freelancing/submissions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to fetch board submissions");
      }
      const data = await res.json();
      setBoardSubmissions(Array.isArray(data.submissions) ? data.submissions : []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to fetch board");
    } finally {
      setBoardLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  useEffect(() => {
    if (viewMode === 'board') {
      fetchTasks();
      fetchBoardSubmissions();
    }
  }, [viewMode, token]);

  const openEditModal = (task: FreelancingTask) => {
    setSelectedTask(task);
    setNewAttachments([]);
    setDeletedAttachmentKeys([]);
    setEditForm({
      title: task.title || "",
      category: task.category || "",
      experience: task.experience || "",
      amount: task.amount || 0,
      maxStudents: task.maxStudents || 1,
      deadline: toDateTimeLocalValue(task.deadline),
      startDate: toDateTimeLocalValue(task.startDate),
      githubLink: task.githubLink || "",
      skills: (task.skills || []).join(", "),
      description: task.description || "",
      highlights: task.highlights || "",
      acceptanceCriteria: task.acceptanceCriteria || "",
      terms: task.terms || "",
      ndaRequired: !!task.ndaRequired,
      replaceAttachments: false,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    setEditForm(defaultEditState);
    setNewAttachments([]);
    setDeletedAttachmentKeys([]);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleEditCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleRichTextChange = (field: keyof EditFormState, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttachmentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTask?._id) return;
    if (!token) {
      setErrorMessage("Unauthorized. Please login again.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = new FormData();
      payload.append("title", editForm.title.trim());
      payload.append("category", editForm.category);
      payload.append("experience", editForm.experience);
      payload.append("amount", String(editForm.amount));
      payload.append("maxStudents", String(editForm.maxStudents));
      payload.append("deadline", localDateTimeToUTC(editForm.deadline));
      payload.append("startDate", localDateTimeToUTC(editForm.startDate));
      payload.append("githubLink", editForm.githubLink);
      payload.append("description", editForm.description);
      payload.append("highlights", editForm.highlights);
      payload.append("acceptanceCriteria", editForm.acceptanceCriteria);
      payload.append("terms", editForm.terms);
      payload.append("ndaRequired", String(editForm.ndaRequired));
      payload.append("replaceAttachments", String(editForm.replaceAttachments));
      payload.append("deletedAttachmentKeys", JSON.stringify(deletedAttachmentKeys));

      const parsedSkills = editForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
      payload.append("skills", JSON.stringify(parsedSkills));

      newAttachments.forEach((file) => payload.append("attachments", file));

      const response = await fetch(`${tasksEndpoint}/${selectedTask._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        let message = "Failed to update task";
        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch {
          // keep fallback message
        }
        throw new Error(message);
      }

      setSuccessMessage("Task updated successfully.");
      closeEditModal();
      fetchTasks();
    } catch (error) {
      console.error("Update task error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const openSubmissionsModal = async (task: FreelancingTask) => {
    if (!token) {
      setErrorMessage("Unauthorized. Please login again.");
      return;
    }

    setSelectedSubmissionTask(task);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    setSubmissionFilter("all");
    setReviewDrafts({});

    try {
      const response = await fetch(`${tasksEndpoint}/${task._id}/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = "Failed to fetch submissions";
        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch {
          // keep fallback
        }
        throw new Error(message);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setSubmissions(list);

      const draftMap: Record<string, { adminReviewStatus: "pending" | "approved" | "rejected"; adminFeedback: string }> = {};
      list.forEach((submission: TaskSubmission) => {
        draftMap[submission._id] = {
          adminReviewStatus:
            submission.adminReviewStatus === "approved"
              ? "approved"
              : submission.adminReviewStatus === "rejected"
                ? "rejected"
                : "pending",
          adminFeedback: submission.adminFeedback || "",
        };
      });
      setReviewDrafts(draftMap);
    } catch (error) {
      console.error("Fetch task submissions error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch submissions");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleReviewDraftChange = (
    submissionId: string,
    field: "adminReviewStatus" | "adminFeedback",
    value: string
  ) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [submissionId]: {
        adminReviewStatus:
          field === "adminReviewStatus"
            ? (value as "pending" | "approved" | "rejected")
            : prev[submissionId]?.adminReviewStatus || "pending",
        adminFeedback:
          field === "adminFeedback"
            ? value
            : prev[submissionId]?.adminFeedback || "",
      },
    }));
  };

  const handleSubmitReview = async (submissionId: string) => {
    if (!token) {
      setErrorMessage("Unauthorized. Please login again.");
      return;
    }

    const draft = reviewDrafts[submissionId];
    if (!draft) return;
    if (draft.adminReviewStatus === "pending") {
      setErrorMessage("Please select Approved or Rejected before saving review.");
      return;
    }

    setSubmissionsSavingId(submissionId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${baseURL}/api/institute/freelancing/submissions/${submissionId}/review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminReviewStatus: draft.adminReviewStatus,
            adminFeedback: draft.adminFeedback,
          }),
        }
      );

      if (!response.ok) {
        let message = "Failed to review submission";
        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch {
          // keep fallback
        }
        throw new Error(message);
      }

      setSuccessMessage("Submission review updated successfully.");

      if (selectedSubmissionTask) {
        await openSubmissionsModal(selectedSubmissionTask);
      }
    } catch (error) {
      console.error("Review submission error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to review submission");
    } finally {
      setSubmissionsSavingId(null);
    }
  };

  const handleAiEvaluate = async (submissionId: string) => {
    if (!token) return;
    setEvaluatingId(submissionId);
    setErrorMessage("");
    try {
      const res = await fetch(
        `${baseURL}/api/institute/freelancing/submissions/${submissionId}/ai-evaluate`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI evaluation failed");
      // Update local submissions state with the returned evaluation
      setSubmissions((prev) =>
        prev.map((s) => s._id === submissionId ? { ...s, aiEvaluation: data.evaluation } : s)
      );
      setExpandedEval((prev) => ({ ...prev, [submissionId]: true }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "AI evaluation failed");
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleAiVerify = async (submissionId: string) => {
    if (!token) return;
    setVerifyingId(submissionId);
    setErrorMessage("");
    try {
      const finalScore = adminFinalScores[submissionId];
      const res = await fetch(
        `${baseURL}/api/institute/freelancing/submissions/${submissionId}/ai-verify`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ adminFinalScore: finalScore !== undefined ? Number(finalScore) : null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Verify failed");
      setSubmissions((prev) =>
        prev.map((s) => s._id === submissionId ? { ...s, aiEvaluation: data.evaluation } : s)
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const openDeleteModal = (task: FreelancingTask) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete?._id || !token) return;
    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`${tasksEndpoint}/${taskToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let message = "Failed to delete task";
        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch { /* keep fallback */ }
        throw new Error(message);
      }
      setSuccessMessage(`Task "${taskToDelete.title}" deleted successfully.`);
      closeDeleteModal();
      fetchTasks();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value || "-";
  };

  const getCategoryIcon = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.icon || "📁";
  };

  const getExperienceLabel = (value: string) => {
    return EXPERIENCE_LEVELS.find(l => l.value === value)?.label || value || "-";
  };

  const getExperienceIcon = (value: string) => {
    return EXPERIENCE_LEVELS.find(l => l.value === value)?.icon || "📌";
  };

  const getTaskMetrics = (task: FreelancingTask) => {
    const enrolledStudentsDetails = task.enrolledStudentsDetails || [];
    const enrolledCount =
      typeof task.enrolledCount === "number"
        ? task.enrolledCount
        : task.enrolledStudents?.length || enrolledStudentsDetails.length || 0;
    const spotsLeft =
      typeof task.spotsLeft === "number"
        ? task.spotsLeft
        : Math.max(0, (task.maxStudents || 1) - enrolledCount);
    const deadlineTs = task.deadline ? new Date(task.deadline).getTime() : null;
    const isDeadlinePassed = deadlineTs ? deadlineTs < Date.now() : false;

    const status: "open" | "full" | "deadline-passed" = isDeadlinePassed
      ? "deadline-passed"
      : spotsLeft <= 0
        ? "full"
        : "open";

    return {
      enrolledStudentsDetails,
      enrolledCount,
      spotsLeft,
      status,
    };
  };

  const filteredTasks = useMemo(() => {
    const search = taskSearch.trim().toLowerCase();

    return sortedTasks.filter((task) => {
      const { status } = getTaskMetrics(task);

      const matchesSearch =
        !search ||
        (task.title || "").toLowerCase().includes(search) ||
        (task.skills || []).join(" ").toLowerCase().includes(search) ||
        (task.description || "").toLowerCase().includes(search);

      const matchesCategory = taskCategoryFilter === "all" || (task.category || "") === taskCategoryFilter;
      const matchesStatus = taskStatusFilter === "all" || status === taskStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [sortedTasks, taskSearch, taskCategoryFilter, taskStatusFilter]);

  return (
    <div className="task-manager-container">
      <Card className="task-manager-card">
        <Card.Body className="p-0">
          <div className="header-section">
            <div>
              <h3 className="page-title">Task Management</h3>
              <p className="page-subtitle">Manage and edit your freelance tasks</p>
            </div>
            <div className="header-actions">
              {/* View toggle */}
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  ☰ List
                </button>
                <button
                  className={`view-toggle-btn${viewMode === 'board' ? ' active' : ''}`}
                  onClick={() => setViewMode('board')}
                  title="Board view"
                >
                  ⊞ Board
                </button>
              </div>

              {viewMode === 'list' && (
                <div className="task-filters">
                  <Form.Control
                    placeholder="Search tasks"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="filter-control filter-search"
                  />
                  <Form.Select
                    value={taskCategoryFilter}
                    onChange={(e) => setTaskCategoryFilter(e.target.value)}
                    className="filter-control"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value as "all" | "open" | "full" | "deadline-passed")}
                    className="filter-control"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="full">Full</option>
                    <option value="deadline-passed">Deadline Passed</option>
                  </Form.Select>
                  <Button
                    variant="outline-orange"
                    className="filter-clear-btn"
                    onClick={() => {
                      setTaskSearch("");
                      setTaskCategoryFilter("all");
                      setTaskStatusFilter("all");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}

              <Button
                variant="outline-orange"
                onClick={() => viewMode === 'board' ? fetchBoardSubmissions() : fetchTasks()}
                disabled={loading || boardLoading}
                className="refresh-btn"
              >
                {(loading || boardLoading) ? <Spinner animation="border" size="sm" /> : "↻ Refresh"}
              </Button>
            </div>
          </div>

          {successMessage && (
            <Alert variant="success" className="success-alert">
              <span className="alert-icon">✓</span>
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="danger" className="error-alert">
              <span className="alert-icon">⚠</span>
              {errorMessage}
            </Alert>
          )}

          {viewMode === 'board' ? (
            boardLoading || loading ? (
              <div className="loading-state">
                <Spinner animation="border" variant="orange" />
                <p>Loading board...</p>
              </div>
            ) : (() => {
              const formatDate = (d?: string) => {
                if (!d) return '—';
                const dt = new Date(d);
                return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              };

              // Deduplicate submissions by _id
              const seen = new Set<string>();
              const uniqueSubs = boardSubmissions.filter(s => {
                if (seen.has(s._id)) return false;
                seen.add(s._id);
                return true;
              });

              // Group submissions by task → each card = one task with its student list
              type SubGroup = { task: AllSubmission['task']; subs: AllSubmission[] };
              const taskGroups: Record<string, SubGroup> = {};
              uniqueSubs.forEach(s => {
                const tid = String(s.taskId || s.task?._id || s._id);
                if (!taskGroups[tid]) taskGroups[tid] = { task: s.task, subs: [] };
                taskGroups[tid].subs.push(s);
              });

              type ColKey = 'todo' | 'inreview' | 'approved' | 'revision';

              // Count submissions per task
              const subCountByTask: Record<string, number> = {};
              uniqueSubs.forEach(s => {
                const tid = String(s.taskId || '');
                subCountByTask[tid] = (subCountByTask[tid] || 0) + 1;
              });

              // TO DO: tasks where enrolled students > submissions (some haven't submitted)
              const todoTasks = tasks.filter(t => {
                const { enrolledCount } = getTaskMetrics(t);
                const submitted = subCountByTask[String(t._id)] || 0;
                return enrolledCount > 0 && enrolledCount > submitted;
              });

              // Classify group by most-urgent student status
              // Priority: any pending → inreview; any rejected (no pending) → revision; all approved → approved
              const classifyGroup = (group: SubGroup): ColKey => {
                const statuses = group.subs.map(s => s.adminReviewStatus || 'pending');
                if (statuses.some(s => s === 'pending')) return 'inreview';
                if (statuses.some(s => s === 'rejected')) return 'revision';
                return 'approved';
              };

              const groups = Object.values(taskGroups);
              const buckets: Record<ColKey, (SubGroup | FreelancingTask)[]> = {
                todo: todoTasks,
                inreview: groups.filter(g => classifyGroup(g) === 'inreview'),
                approved: groups.filter(g => classifyGroup(g) === 'approved'),
                revision: groups.filter(g => classifyGroup(g) === 'revision'),
              };

              const BOARD_COLS = [
                { key: 'todo' as ColKey,     label: 'TO DO',           color: '#6b778c', desc: 'Enrolled, not yet submitted' },
                { key: 'inreview' as ColKey,  label: 'IN REVIEW',       color: '#0052cc', desc: 'Awaiting your review' },
                { key: 'approved' as ColKey,  label: 'APPROVED',         color: '#36b37e', desc: 'Work approved' },
                { key: 'revision' as ColKey,  label: 'REVISION NEEDED',  color: '#de350b', desc: 'Sent back for revision' },
              ];

              return (
                <div>
                  {/* Stat row */}
                  <div className="admin-board-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {BOARD_COLS.map(col => (
                      <div key={col.key} className="admin-board-stat">
                        <span className="abs-dot" style={{ background: col.color }} />
                        <span className="abs-label" style={{ color: col.color }}>{col.label}</span>
                        <span className="abs-count" style={{ color: col.color }}>{buckets[col.key].length}</span>
                        <span className="abs-desc">{col.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Kanban columns */}
                  <div className="admin-kanban-board" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {BOARD_COLS.map(col => {
                      const colItems = buckets[col.key];
                      return (
                        <div key={col.key} className="admin-kanban-col">
                          <div className="admin-kanban-header" style={{ borderTop: `3px solid ${col.color}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                              <span className="admin-kanban-label" style={{ color: col.color }}>{col.label}</span>
                            </div>
                            <span className="admin-kanban-count"
                              style={{ background: `${col.color}20`, color: col.color, border: `1px solid ${col.color}44` }}>
                              {colItems.length}
                            </span>
                          </div>

                          <div className="admin-kanban-cards">
                            {colItems.length === 0 ? (
                              <div className="admin-kanban-empty">No items here</div>
                            ) : col.key === 'todo' ? (
                              // TO DO cards — task level (no submission yet)
                              (colItems as FreelancingTask[]).map(task => {
                                const { enrolledCount } = getTaskMetrics(task);
                                return (
                                  <div key={task._id} className="admin-kanban-card">
                                    <div className="admin-card-task-title">{task.title || 'Untitled'}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                      {task.category && (
                                        <span className="admin-card-cat">{getCategoryLabel(task.category)}</span>
                                      )}
                                      {task.deadline && (
                                        <span style={{ fontSize: '0.68rem', color: '#555' }}>Due: {formatDate(task.deadline)}</span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                      <span style={{ fontSize: '0.7rem', color: '#6b778c' }}>
                                        👥 {enrolledCount} enrolled — awaiting submission
                                      </span>
                                      {task.amount ? (
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ff6b35' }}>
                                          ₹{task.amount.toLocaleString()}
                                        </span>
                                      ) : null}
                                    </div>
                                    <button
                                      className="admin-view-subs-btn"
                                      onClick={() => openSubmissionsModal(task)}
                                    >
                                      View Submissions
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              // Review columns — one card per task, students listed inside
                              (colItems as SubGroup[]).map(group => {
                                const taskInfo = group.task;
                                const fullTask = tasks.find(t => String(t._id) === String(taskInfo?._id));
                                const { enrolledCount } = fullTask ? getTaskMetrics(fullTask) : { enrolledCount: 0 };
                                const pendingCount = enrolledCount - group.subs.length;
                                return (
                                  <div key={String(taskInfo?._id || group.subs[0]._id)} className="admin-kanban-card">
                                    {/* Task title */}
                                    <div className="admin-card-task-title">{taskInfo?.title || 'Untitled Task'}</div>

                                    {/* Category + deadline */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                      {taskInfo?.category && (
                                        <span className="admin-card-cat">{getCategoryLabel(taskInfo.category)}</span>
                                      )}
                                      {taskInfo?.deadline && (
                                        <span style={{ fontSize: '0.68rem', color: '#555' }}>Due: {formatDate(taskInfo.deadline)}</span>
                                      )}
                                    </div>

                                    {/* Student list with individual status badges */}
                                    <div style={{ marginTop: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      {group.subs.map(sub => {
                                        const student = sub.studentId;
                                        const subStatus = sub.adminReviewStatus || 'pending';
                                        const subStatusCfg = {
                                          approved: { label: 'Approved',  color: '#36b37e' },
                                          rejected: { label: 'Revision',  color: '#de350b' },
                                          pending:  { label: 'Pending',   color: '#0052cc' },
                                        }[subStatus] ?? { label: 'Pending', color: '#0052cc' };
                                        return (
                                          <div key={sub._id} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.45rem',
                                            background: '#0a0a0a',
                                            border: `1px solid ${subStatusCfg.color}33`,
                                            borderLeft: `3px solid ${subStatusCfg.color}`,
                                            borderRadius: '5px', padding: '0.4rem 0.55rem',
                                          }}>
                                            <span className="admin-card-avatar" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                                              {(student?.name || student?.email || 'S')[0].toUpperCase()}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {student?.name || 'Student'}
                                              </div>
                                              <div style={{ fontSize: '0.62rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {student?.email || ''}
                                              </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', flexShrink: 0 }}>
                                              <span style={{
                                                fontSize: '0.6rem', fontWeight: 700,
                                                color: subStatusCfg.color,
                                                background: `${subStatusCfg.color}18`,
                                                border: `1px solid ${subStatusCfg.color}44`,
                                                borderRadius: '20px', padding: '0.1rem 0.4rem',
                                              }}>
                                                {subStatusCfg.label}
                                              </span>
                                              <span style={{ fontSize: '0.58rem', color: '#444' }}>
                                                {formatDate(sub.updatedAt)}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Pending students note */}
                                    {pendingCount > 0 && (
                                      <div style={{ fontSize: '0.68rem', color: '#6b778c', marginTop: '0.4rem' }}>
                                        + {pendingCount} student{pendingCount > 1 ? 's' : ''} yet to submit
                                      </div>
                                    )}

                                    {/* Single View Submissions button */}
                                    <button
                                      className="admin-view-subs-btn"
                                      onClick={() => { if (fullTask) openSubmissionsModal(fullTask); }}
                                      disabled={!fullTask}
                                    >
                                      View Submissions ({group.subs.length})
                                    </button>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : loading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="orange" />
              <p>Loading tasks...</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const { enrolledStudentsDetails, enrolledCount, spotsLeft } = getTaskMetrics(task);

                  return (
                    <Card key={task._id} className="task-card">
                      <Card.Body>
                        {/* Task Header */}
                        <div className="task-header">
                          <div className="task-title-section">
                            <Badge className="category-badge">
                              {getCategoryLabel(task.category || "")}
                            </Badge>
                            <h4 className="task-title">{task.title || "Untitled Task"}</h4>
                          </div>
                          <div className="task-actions">
                            <Button
                              variant="outline-orange"
                              size="sm"
                              onClick={() => openEditModal(task)}
                              className="action-btn"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="orange"
                              size="sm"
                              onClick={() => openSubmissionsModal(task)}
                              className="action-btn"
                            >
                              View
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openDeleteModal(task)}
                              className="action-btn"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                      {/* Meta line */}
                      <div className="task-meta">
                        {task.amount ? `₹${task.amount.toLocaleString()}` : "No budget"}
                        <span className="meta-sep">·</span>
                        {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : "No deadline"}
                        <span className="meta-sep">·</span>
                        {enrolledCount}/{task.maxStudents || 1} enrolled
                        {task.attachments && task.attachments.length > 0 && (
                          <><span className="meta-sep">·</span>{task.attachments.length} file{task.attachments.length !== 1 ? "s" : ""}</>
                        )}
                      </div>

                      {/* Combined pills row: emails + skills + spots */}
                      <div className="task-pills">
                        {enrolledStudentsDetails.length > 0
                          ? enrolledStudentsDetails.map((student, idx) => (
                              <span key={`${task._id}-e-${idx}`} className="task-pill pill-email" title={student.email || student.name}>
                                {(student.email || student.name || "").split("@")[0]}
                              </span>
                            ))
                          : <span className="task-pill pill-empty">No students yet</span>
                        }
                        {(task.skills || []).slice(0, 3).map((skill) => (
                          <span key={`${task._id}-s-${skill}`} className="task-pill pill-skill" title={skill}>
                            {skill.length > 15 ? skill.slice(0, 15) + "…" : skill}
                          </span>
                        ))}
                        {(task.skills || []).length > 3 && (
                          <span className="task-pill pill-more" title={(task.skills || []).slice(3).join(", ")}>
                            +{(task.skills || []).length - 3}
                          </span>
                        )}
                        {spotsLeft > 0 && (
                          <span className="task-pill pill-spots">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
                        )}
                      </div>

                        {/* Task Footer */}
                        <div className="task-footer">
                          <div className="experience-info">
                            <span>{getExperienceIcon(task.experience || "")}</span>
                            <span>{getExperienceLabel(task.experience || "")}</span>
                          </div>
                          <div className="task-date">
                            Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-state-content">
                    <span className="empty-icon">📋</span>
                    <p>{sortedTasks.length > 0 ? "No tasks match the selected filters." : "No tasks created yet."}</p>
                    <small>{sortedTasks.length > 0 ? "Try changing search/category/status filters." : "Create your first task to get started"}</small>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered size="sm" className="task-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="modal-icon">🗑️</span>
            Delete Task
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ color: "#ccc", marginBottom: "0.5rem" }}>
            Are you sure you want to delete:
          </p>
          <p style={{ color: "#fff", fontWeight: 600 }}>"{taskToDelete?.title}"</p>
          <p style={{ color: "#ff6b6b", fontSize: "0.82rem", marginBottom: 0 }}>
            ⚠️ This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTask} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" /> : "🗑️ Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={closeEditModal} fullscreen={true} centered className="task-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="modal-icon">✏️</span>
            Edit Task
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateTask}>
          <Modal.Body>
            <div className="modal-form">
              <Row className="g-4">
                {/* Basic Information */}
                <Col xs={12}>
                  <div className="form-section">
                    <h6 className="section-title">
                      <span className="section-icon">📋</span>
                      Basic Information
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Task Title</Form.Label>
                          <Form.Control
                            name="title"
                            value={editForm.title}
                            onChange={handleEditChange}
                            placeholder="Enter task title"
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Category</Form.Label>
                          <Form.Select
                            name="category"
                            value={editForm.category}
                            onChange={handleEditChange}
                            className="form-control-modern"
                          >
                            <option value="">Select category</option>
                            {CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Experience Level</Form.Label>
                          <Form.Select
                            name="experience"
                            value={editForm.experience}
                            onChange={handleEditChange}
                            className="form-control-modern"
                          >
                            <option value="">Select experience</option>
                            {EXPERIENCE_LEVELS.map(exp => (
                              <option key={exp.value} value={exp.value}>
                                {exp.icon} {exp.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Skills (comma separated)</Form.Label>
                          <Form.Control
                            name="skills"
                            value={editForm.skills}
                            onChange={handleEditChange}
                            placeholder="React, Node.js, MongoDB"
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* Budget & Timeline */}
                <Col xs={12}>
                  <div className="form-section">
                    <h6 className="section-title">
                      <span className="section-icon">💰</span>
                      Budget & Timeline
                    </h6>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Budget Amount (₹)</Form.Label>
                          <Form.Control
                            type="number"
                            name="amount"
                            value={editForm.amount}
                            onChange={handleEditChange}
                            placeholder="e.g., 5000"
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Max Students</Form.Label>
                          <Form.Control
                            type="number"
                            name="maxStudents"
                            value={editForm.maxStudents}
                            onChange={handleEditChange}
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>GitHub Link</Form.Label>
                          <Form.Control
                            name="githubLink"
                            value={editForm.githubLink}
                            onChange={handleEditChange}
                            placeholder="https://github.com/..."
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Start Date & Time</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="startDate"
                            value={editForm.startDate}
                            onChange={handleEditChange}
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Deadline & Time</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="deadline"
                            value={editForm.deadline}
                            onChange={handleEditChange}
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* Rich Text Fields */}
                <Col xs={12}>
                  <div className="form-section">
                    <h6 className="section-title">
                      <span className="section-icon">📝</span>
                      Description & Details
                    </h6>
                    <Row className="g-3">
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <div className="rich-editor">
                            <ReactQuill
                              theme="snow"
                              value={editForm.description}
                              onChange={(value) => handleRichTextChange('description', value)}
                              placeholder="Describe the task in detail..."
                              modules={QUILL_MODULES}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Key Highlights</Form.Label>
                          <div className="rich-editor">
                            <ReactQuill
                              theme="snow"
                              value={editForm.highlights}
                              onChange={(value) => handleRichTextChange('highlights', value)}
                              placeholder="Highlight important aspects of the task..."
                              modules={QUILL_MODULES}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Acceptance Criteria</Form.Label>
                          <div className="rich-editor">
                            <ReactQuill
                              theme="snow"
                              value={editForm.acceptanceCriteria}
                              onChange={(value) => handleRichTextChange('acceptanceCriteria', value)}
                              placeholder="List the criteria that must be met..."
                              modules={QUILL_MODULES}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs={12}>
                        <Form.Group>
                          <Form.Label>Terms & Conditions</Form.Label>
                          <div className="rich-editor">
                            <ReactQuill
                              theme="snow"
                              value={editForm.terms}
                              onChange={(value) => handleRichTextChange('terms', value)}
                              placeholder="Define terms, deliverables, and expectations..."
                              modules={QUILL_MODULES}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* Options & Attachments */}
                <Col xs={12}>
                  <div className="form-section">
                    <h6 className="section-title">
                      <span className="section-icon">⚙️</span>
                      Options & Attachments
                    </h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Check
                          id="edit-nda"
                          name="ndaRequired"
                          checked={editForm.ndaRequired}
                          onChange={handleEditCheckbox}
                          label="NDA Required"
                          className="custom-checkbox"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          id="replace-attachments"
                          name="replaceAttachments"
                          checked={editForm.replaceAttachments}
                          onChange={handleEditCheckbox}
                          label="Replace existing attachments"
                          className="custom-checkbox"
                        />
                      </Col>
                      <Col xs={12}>
                        {/* Existing attachments */}
                        {selectedTask?.attachments && selectedTask.attachments.length > 0 && (
                          <div style={{ marginBottom: '1rem' }}>
                            <Form.Label style={{ color: '#aaa', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'block' }}>
                              Existing Attachments
                            </Form.Label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {selectedTask.attachments.map((att, idx) => {
                                const key = att.s3Key || att.fileUrl || String(idx)
                                const isDeleted = deletedAttachmentKeys.includes(key)
                                if (isDeleted) return null
                                return (
                                  <div key={key} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                                    padding: '0.3rem 0.6rem', fontSize: '0.78rem', color: '#e0e0e0',
                                  }}>
                                    <span>📄</span>
                                    <a href={att.fileUrl} target="_blank" rel="noreferrer"
                                      style={{ color: '#ff9a5c', textDecoration: 'none', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                      title={att.fileName || `Attachment ${idx + 1}`}>
                                      {att.fileName || `Attachment ${idx + 1}`}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => setDeletedAttachmentKeys(prev => [...prev, key])}
                                      style={{
                                        background: 'none', border: 'none', color: '#ef4444',
                                        cursor: 'pointer', padding: '0 2px', fontSize: '0.85rem',
                                        lineHeight: 1, display: 'flex', alignItems: 'center',
                                      }}
                                      title="Remove attachment"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )
                              })}
                              {selectedTask.attachments.every(
                                (att, idx) => deletedAttachmentKeys.includes(att.s3Key || att.fileUrl || String(idx))
                              ) && (
                                <span style={{ color: '#666', fontSize: '0.78rem' }}>All existing attachments removed</span>
                              )}
                            </div>
                          </div>
                        )}

                        <Form.Group>
                          <Form.Label>Add Attachments</Form.Label>
                          <Form.Control
                            type="file"
                            multiple
                            onChange={handleAttachmentInput}
                            className="file-input"
                          />
                          <Form.Text className="text-muted">
                            {(selectedTask?.attachments?.length || 0) - deletedAttachmentKeys.length} existing attachment(s) kept.
                            Max file size: 10MB per file
                          </Form.Text>
                          {newAttachments.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <div style={{ color: '#aaa', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                                {newAttachments.length} new file{newAttachments.length > 1 ? 's' : ''} queued for upload:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {newAttachments.map((file, idx) => (
                                  <div key={`${file.name}-${idx}`} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.3)',
                                    borderRadius: '8px', padding: '0.3rem 0.6rem',
                                    fontSize: '0.78rem', color: '#ff9a5c',
                                  }}>
                                    <span>📎</span>
                                    <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                      title={file.name}>
                                      {file.name}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '0.7rem' }}>
                                      ({(file.size / 1024).toFixed(0)} KB)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeNewAttachment(idx)}
                                      style={{
                                        background: 'none', border: 'none', color: '#ef4444',
                                        cursor: 'pointer', padding: '0 2px', fontSize: '0.85rem',
                                        lineHeight: 1, display: 'flex', alignItems: 'center',
                                      }}
                                      title="Remove file"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-orange" onClick={closeEditModal} disabled={saving}>
              Cancel
            </Button>
            <Button variant="orange" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                "Update Task"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        show={showSubmissionsModal}
        onHide={() => setShowSubmissionsModal(false)}
        fullscreen={true}
        className="task-modal submissions-modal"
      >
        <Modal.Header closeButton style={{ borderBottom: '1px solid #1f1f1f', padding: '1rem 1.5rem' }}>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
            <span style={{ color: '#ff6b35', marginRight: '0.5rem' }}>📋</span>
            {selectedSubmissionTask?.title || 'Task'} — Submissions
          </Modal.Title>
          {/* Status pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'pending', label: 'Pending', color: '#0052cc', count: submissions.filter(s => (s.adminReviewStatus || 'pending') === 'pending').length },
              { key: 'approved', label: 'Approved', color: '#36b37e', count: submissions.filter(s => s.adminReviewStatus === 'approved').length },
              { key: 'rejected', label: 'Revision', color: '#de350b', count: submissions.filter(s => s.adminReviewStatus === 'rejected').length },
              { key: 'all', label: 'All', color: '#888', count: submissions.length },
            ].map(f => (
              <button key={f.key}
                onClick={() => setSubmissionFilter(f.key as typeof submissionFilter)}
                style={{
                  background: submissionFilter === f.key ? f.color : 'transparent',
                  border: `1px solid ${f.color}`,
                  color: submissionFilter === f.key ? '#fff' : f.color,
                  borderRadius: '20px', padding: '0.2rem 0.75rem',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label} <span style={{ opacity: 0.8 }}>{f.count}</span>
              </button>
            ))}
          </div>
        </Modal.Header>

        <Modal.Body style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {submissionsLoading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="orange" />
              <p>Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#444' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📭</div>
              <div style={{ fontSize: '0.9rem' }}>No submissions in this category.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSubmissions.map((submission) => {
                const draft = reviewDrafts[submission._id] || { adminReviewStatus: "pending" as const, adminFeedback: "" };
                const reviewStatus = submission.adminReviewStatus || 'pending';
                const isLocked = reviewStatus === 'approved';

                const statusConfig = {
                  approved: { label: 'Approved', color: '#36b37e', bg: '#36b37e18' },
                  rejected: { label: 'Revision Needed', color: '#de350b', bg: '#de350b18' },
                  pending:  { label: 'Pending Review', color: '#0052cc', bg: '#0052cc18' },
                }[reviewStatus] ?? { label: 'Pending Review', color: '#0052cc', bg: '#0052cc18' };

                return (
                  <div key={submission._id} style={{
                    background: '#0d0d0d',
                    border: `1px solid ${isLocked ? '#36b37e33' : '#1f1f1f'}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}>
                    {/* ── Top bar: student info + status ── */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.85rem',
                      padding: '0.85rem 1.1rem',
                      borderBottom: '1px solid #1a1a1a',
                      background: '#111',
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#ff6b3522', border: '2px solid #ff6b3544',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 700, color: '#ff6b35', flexShrink: 0,
                      }}>
                        {(submission.studentId?.name || submission.studentId?.email || 'S')[0].toUpperCase()}
                      </div>

                      {/* Name + email */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                          {submission.studentId?.name || 'Anonymous Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {submission.studentId?.email || '—'}
                        </div>
                      </div>

                      {/* Submitted date */}
                      {submission.updatedAt && (
                        <div style={{ fontSize: '0.72rem', color: '#555', textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ color: '#444', marginBottom: '0.1rem' }}>Submitted</div>
                          {new Date(submission.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}

                      {/* Status badge */}
                      <span style={{
                        background: statusConfig.bg, color: statusConfig.color,
                        border: `1px solid ${statusConfig.color}44`,
                        borderRadius: '20px', padding: '0.22rem 0.75rem',
                        fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* ── Body: submission details + review side by side ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 0 }}>

                      {/* Left: submission content */}
                      <div style={{ padding: '1rem 1.1rem', borderRight: '1px solid #1a1a1a' }}>
                        {submission.codeLink && (
                          <div style={{ marginBottom: '0.85rem' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                              Code / Repository Link
                            </div>
                            <a href={submission.codeLink} target="_blank" rel="noreferrer"
                              style={{ fontSize: '0.82rem', color: '#ff6b35', wordBreak: 'break-all' }}>
                              {submission.codeLink}
                            </a>
                          </div>
                        )}

                        {submission.codeDescription && (
                          <div style={{ marginBottom: '0.85rem' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                              Submission Notes
                            </div>
                            <div style={{ fontSize: '0.83rem', color: '#ccc', lineHeight: 1.6 }}
                              dangerouslySetInnerHTML={{ __html: submission.codeDescription }} />
                          </div>
                        )}

                        {submission.attachments && submission.attachments.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                              Attachments ({submission.attachments.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {submission.attachments.map((att, idx) => (
                                <a key={idx} href={att.fileUrl} target="_blank" rel="noreferrer"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                                    borderRadius: '6px', padding: '0.3rem 0.6rem',
                                    fontSize: '0.75rem', color: '#ff6b35', textDecoration: 'none',
                                  }}>
                                  📄 {att.fileName || `File ${idx + 1}`}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {!submission.codeLink && !submission.codeDescription && (!submission.attachments || submission.attachments.length === 0) && (
                          <div style={{ color: '#333', fontSize: '0.82rem' }}>No submission content provided.</div>
                        )}

                        {/* ── AI Evaluation Panel ── */}
                        <div style={{ marginTop: '1rem', borderTop: '1px solid #1a1a1a', paddingTop: '1rem' }}>
                          {/* Header row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Evaluation</span>
                              {submission.aiEvaluation?.evaluatedAt && (
                                <span style={{ fontSize: '0.62rem', color: '#444' }}>· {new Date(submission.aiEvaluation.evaluatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              )}
                              {submission.aiEvaluation?.verifiedByAdmin && (
                                <span style={{ fontSize: '0.62rem', color: '#36b37e', background: '#36b37e18', border: '1px solid #36b37e44', borderRadius: '20px', padding: '0.05rem 0.4rem', fontWeight: 700 }}>✓ Verified</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {submission.aiEvaluation && (
                                <>
                                  <button
                                    onClick={() => {
                                      const ai = submission.aiEvaluation!;
                                      const studentName = submission.studentId?.name || submission.studentId?.email || 'Student';
                                      const taskTitle = selectedTask?.title || 'Task';
                                      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI Evaluation Report</title><style>
                                        body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#111;line-height:1.6}
                                        h1{color:#7c3aed;font-size:22px;border-bottom:2px solid #7c3aed;padding-bottom:8px}
                                        h2{color:#444;font-size:16px;margin-top:24px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
                                        h3{font-size:14px;margin:0}
                                        .score-box{background:#f4f4ff;border:2px solid #7c3aed;border-radius:12px;padding:16px 24px;display:flex;align-items:center;gap:20px;margin:16px 0}
                                        .score-num{font-size:48px;font-weight:900;color:#7c3aed;line-height:1}
                                        .grade{background:#7c3aed;color:#fff;font-size:18px;font-weight:700;padding:4px 14px;border-radius:6px}
                                        .relevance{padding:10px 14px;border-radius:8px;margin:12px 0;font-size:13px}
                                        .relevance.ok{background:#e8faf2;border-left:4px solid #36b37e;color:#1a6b44}
                                        .relevance.warn{background:#fff5f5;border-left:4px solid #de350b;color:#a00}
                                        .criterion{display:flex;gap:10px;align-items:flex-start;padding:8px 12px;border-radius:6px;margin-bottom:6px;border:1px solid #eee}
                                        .criterion.met{background:#f0faf4;border-left:3px solid #36b37e}
                                        .criterion.fail{background:#fff5f5;border-left:3px solid #de350b}
                                        .ann{padding:8px 12px;border-radius:6px;margin-bottom:6px;font-size:13px}
                                        .ann.critical{background:#fff0f0;border-left:3px solid #c00}
                                        .ann.major{background:#fff8f0;border-left:3px solid #e67e22}
                                        .ann.minor{background:#f8f8f8;border-left:3px solid #888}
                                        .tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;margin-right:6px;text-transform:uppercase}
                                        .tag.critical{background:#c00;color:#fff}
                                        .tag.major{background:#e67e22;color:#fff}
                                        .tag.minor{background:#888;color:#fff}
                                        .col2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
                                        ul{padding-left:20px;margin:6px 0}
                                        li{margin-bottom:4px;font-size:13px}
                                        .faculty-box{background:#f9f9ff;border:1px solid #d0c4ff;border-radius:8px;padding:14px 18px;margin:12px 0}
                                        .footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:11px;color:#999}
                                      </style></head><body>
                                        <h1>AI Evaluation Report</h1>
                                        <p><strong>Student:</strong> ${studentName} &nbsp;&nbsp; <strong>Task:</strong> ${taskTitle}</p>
                                        <p><strong>Evaluated:</strong> ${ai.evaluatedAt ? new Date(ai.evaluatedAt).toLocaleString('en-IN') : '—'} ${ai.verifiedByAdmin ? '&nbsp; <span style="color:#36b37e;font-weight:700">✓ Verified by Admin</span>' : ''}</p>
                                        <div class="score-box">
                                          <div class="score-num">${ai.adminFinalScore ?? ai.score ?? 0}</div>
                                          <div>
                                            <div style="font-size:13px;color:#555;margin-bottom:4px">out of 100 ${ai.adminFinalScore != null ? '(Admin Adjusted)' : '(AI Score)'}</div>
                                            <span class="grade">${ai.grade ?? '—'}</span>
                                          </div>
                                        </div>
                                        ${ai.relevanceCheck ? `<div class="relevance ${ai.relevanceCheck.isRelevant ? 'ok' : 'warn'}">
                                          <strong>${ai.relevanceCheck.isRelevant ? '✓ Submission is relevant to the task' : '⚠ Submission does not match the task'}</strong><br/>
                                          Relevance Score: ${ai.relevanceCheck.relevanceScore}/100 — ${ai.relevanceCheck.reason}
                                        </div>` : ''}
                                        ${ai.summary ? `<p style="font-style:italic;color:#444;background:#f7f7f7;padding:10px 14px;border-radius:6px;border-left:3px solid #7c3aed">${ai.summary}</p>` : ''}
                                        ${ai.facultyReport?.overallAssessment ? `<h2>Faculty Report</h2><div class="faculty-box">
                                          <p>${ai.facultyReport.overallAssessment}</p>
                                          <p><strong>Technical Depth:</strong> ${ai.facultyReport.technicalDepth} &nbsp; <strong>Effort Level:</strong> ${ai.facultyReport.effortEstimate}</p>
                                          ${ai.facultyReport.keyFindings?.length ? `<strong>Key Findings:</strong><ul>${ai.facultyReport.keyFindings.map(f=>`<li>${f}</li>`).join('')}</ul>` : ''}
                                          ${ai.facultyReport.recommendations?.length ? `<strong>Recommendations:</strong><ul>${ai.facultyReport.recommendations.map(r=>`<li>${r}</li>`).join('')}</ul>` : ''}
                                        </div>` : ''}
                                        ${ai.criteriaEvaluation?.length ? `<h2>Criteria Evaluation</h2>${ai.criteriaEvaluation.map(c=>`<div class="criterion ${c.met?'met':'fail'}"><span style="font-size:16px;color:${c.met?'#36b37e':'#de350b'};flex-shrink:0">${c.met?'✓':'✕'}</span><div style="flex:1"><h3>${c.criterion}</h3><p style="font-size:13px;color:#555;margin:2px 0">${c.feedback}</p></div><span style="font-weight:700;color:${c.met?'#36b37e':'#de350b'}">${c.score}/${c.maxScore}</span></div>`).join('')}` : ''}
                                        ${ai.codeAnnotations?.length ? `<h2>Code Annotations</h2>${ai.codeAnnotations.map(a=>`<div class="ann ${a.severity}"><span class="tag ${a.severity}">${a.severity}</span><strong>${a.issue}</strong><br/><span style="color:#666;font-size:12px">📍 ${a.location}</span><br/><span style="color:#444;font-size:12px">→ ${a.suggestion}</span></div>`).join('')}` : ''}
                                        <div class="col2">
                                          ${ai.strengths?.length ? `<div><h2 style="color:#36b37e">Strengths</h2><ul>${ai.strengths.map(s=>`<li>${s}</li>`).join('')}</ul></div>` : ''}
                                          ${ai.improvements?.length ? `<div><h2 style="color:#e67e22">Areas for Improvement</h2><ul>${ai.improvements.map(s=>`<li>${s}</li>`).join('')}</ul></div>` : ''}
                                        </div>
                                        <div class="footer">Generated by Eklav AI Evaluation System · ${new Date().toLocaleString('en-IN')}</div>
                                      </body></html>`;
                                      const w = window.open('', '_blank');
                                      if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
                                    }}
                                    style={{ background: 'none', border: '1px solid #2a2a2a', color: '#888', borderRadius: '5px', padding: '0.2rem 0.55rem', fontSize: '0.68rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                  >
                                    📄 PDF
                                  </button>
                                  <button
                                    onClick={() => setExpandedEval(prev => ({ ...prev, [submission._id]: !prev[submission._id] }))}
                                    style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', borderRadius: '5px', padding: '0.2rem 0.55rem', fontSize: '0.7rem', cursor: 'pointer' }}
                                  >
                                    {expandedEval[submission._id] ? 'Collapse' : 'Expand'}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleAiEvaluate(submission._id)}
                                disabled={evaluatingId === submission._id}
                                style={{
                                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                  border: 'none', color: '#fff', borderRadius: '6px',
                                  padding: '0.28rem 0.75rem', fontSize: '0.72rem', fontWeight: 700,
                                  cursor: evaluatingId === submission._id ? 'default' : 'pointer',
                                  opacity: evaluatingId === submission._id ? 0.65 : 1,
                                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                                }}
                              >
                                {evaluatingId === submission._id ? <><Spinner animation="border" size="sm" /> Evaluating...</> : submission.aiEvaluation ? '↺ Re-Evaluate' : '✦ AI Evaluate'}
                              </button>
                            </div>
                          </div>

                          {/* Score + relevance (always visible when eval exists) */}
                          {submission.aiEvaluation && submission.aiEvaluation.score !== null && (
                            <div>
                              {/* Relevance warning banner */}
                              {submission.aiEvaluation.relevanceCheck && !submission.aiEvaluation.relevanceCheck.isRelevant && (
                                <div style={{ background: '#de350b12', border: '1px solid #de350b44', borderLeft: '3px solid #de350b', borderRadius: '6px', padding: '0.5rem 0.7rem', marginBottom: '0.6rem', fontSize: '0.72rem', color: '#ff7070' }}>
                                  <strong>⚠ Submission not relevant to task</strong> · Relevance Score: {submission.aiEvaluation.relevanceCheck.relevanceScore}/100
                                  <div style={{ color: '#cc5555', marginTop: '0.2rem' }}>{submission.aiEvaluation.relevanceCheck.reason}</div>
                                </div>
                              )}
                              {submission.aiEvaluation.relevanceCheck?.isRelevant && (
                                <div style={{ background: '#36b37e0a', border: '1px solid #36b37e33', borderRadius: '6px', padding: '0.35rem 0.7rem', marginBottom: '0.6rem', fontSize: '0.68rem', color: '#36b37e' }}>
                                  ✓ Relevant to task · {submission.aiEvaluation.relevanceCheck.relevanceScore}/100 relevance
                                </div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: expandedEval[submission._id] ? '0.85rem' : 0 }}>
                                <div style={{
                                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                                  background: `conic-gradient(${
                                    (submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score) >= 75 ? '#36b37e' :
                                    (submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score) >= 50 ? '#ff9a5c' : '#de350b'
                                  } ${(submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score) * 3.6}deg, #1a1a1a 0deg)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                      {submission.aiEvaluation.adminFinalScore ?? submission.aiEvaluation.score}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff' }}>
                                      {submission.aiEvaluation.adminFinalScore != null ? `${submission.aiEvaluation.adminFinalScore}/100` : `${submission.aiEvaluation.score}/100`}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#7c3aed22', color: '#a78bfa', border: '1px solid #7c3aed44', borderRadius: '4px', padding: '0.05rem 0.4rem' }}>
                                      {submission.aiEvaluation.grade}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: '#666', marginTop: '0.1rem' }}>
                                    {submission.aiEvaluation.adminFinalScore != null ? 'Admin Adjusted Score' : 'AI Score'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Expanded details */}
                          {submission.aiEvaluation && expandedEval[submission._id] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                              {/* Summary */}
                              {submission.aiEvaluation.summary && (
                                <div style={{ fontSize: '0.78rem', color: '#bbb', lineHeight: 1.55, background: '#111', borderRadius: '6px', padding: '0.6rem 0.75rem', borderLeft: '2px solid #7c3aed' }}>
                                  {submission.aiEvaluation.summary}
                                </div>
                              )}

                              {/* Faculty Report */}
                              {submission.aiEvaluation.facultyReport?.overallAssessment && (
                                <div>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Faculty Report</div>
                                  <div style={{ background: '#0d0a1f', border: '1px solid #2d1f5a', borderRadius: '6px', padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.6rem' }}>
                                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Technical Depth: <strong style={{ color: '#a78bfa' }}>{submission.aiEvaluation.facultyReport.technicalDepth}</strong></span>
                                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Effort: <strong style={{ color: '#a78bfa' }}>{submission.aiEvaluation.facultyReport.effortEstimate}</strong></span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#bbb', lineHeight: 1.6, marginBottom: '0.6rem' }}>{submission.aiEvaluation.facultyReport.overallAssessment}</div>
                                    {submission.aiEvaluation.facultyReport.keyFindings?.length > 0 && (
                                      <div style={{ marginBottom: '0.4rem' }}>
                                        <div style={{ fontSize: '0.63rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Key Findings</div>
                                        {submission.aiEvaluation.facultyReport.keyFindings.map((f, i) => (
                                          <div key={i} style={{ fontSize: '0.72rem', color: '#999', display: 'flex', gap: '0.3rem', marginBottom: '0.15rem' }}>
                                            <span style={{ color: '#7c3aed', flexShrink: 0 }}>▸</span>{f}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {submission.aiEvaluation.facultyReport.recommendations?.length > 0 && (
                                      <div>
                                        <div style={{ fontSize: '0.63rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recommendations</div>
                                        {submission.aiEvaluation.facultyReport.recommendations.map((r, i) => (
                                          <div key={i} style={{ fontSize: '0.72rem', color: '#999', display: 'flex', gap: '0.3rem', marginBottom: '0.15rem' }}>
                                            <span style={{ color: '#ff9a5c', flexShrink: 0 }}>→</span>{r}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Criteria checklist */}
                              {submission.aiEvaluation.criteriaEvaluation?.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Criteria Evaluation</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {submission.aiEvaluation.criteriaEvaluation.map((c, i) => (
                                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: '#0a0a0a', borderRadius: '5px', padding: '0.45rem 0.55rem', border: `1px solid ${c.met ? '#36b37e22' : '#de350b22'}`, borderLeft: `2px solid ${c.met ? '#36b37e' : '#de350b'}` }}>
                                        <span style={{ flexShrink: 0, marginTop: '0.05rem', color: c.met ? '#36b37e' : '#de350b', fontSize: '0.8rem' }}>{c.met ? '✓' : '✕'}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ccc' }}>{c.criterion}</div>
                                          <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.15rem' }}>{c.feedback}</div>
                                        </div>
                                        <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: c.met ? '#36b37e' : '#de350b' }}>{c.score}/{c.maxScore}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Code Annotations */}
                              {submission.aiEvaluation.codeAnnotations && submission.aiEvaluation.codeAnnotations.length > 0 && (
                                <div>
                                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Code Annotations</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {submission.aiEvaluation.codeAnnotations.map((a, i) => {
                                      const sevColor = a.severity === 'critical' ? '#de350b' : a.severity === 'major' ? '#ff9a5c' : '#888';
                                      return (
                                        <div key={i} style={{ background: '#0a0a0a', borderRadius: '5px', padding: '0.5rem 0.65rem', borderLeft: `2px solid ${sevColor}`, border: `1px solid ${sevColor}22` }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, background: `${sevColor}22`, color: sevColor, border: `1px solid ${sevColor}44`, borderRadius: '4px', padding: '0.05rem 0.4rem', textTransform: 'uppercase' }}>{a.severity}</span>
                                            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#ccc' }}>{a.issue}</span>
                                          </div>
                                          <div style={{ fontSize: '0.68rem', color: '#666', marginBottom: '0.2rem' }}>📍 {a.location}</div>
                                          <div style={{ fontSize: '0.68rem', color: '#888' }}>→ {a.suggestion}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Strengths + Improvements */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                                {submission.aiEvaluation.strengths?.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#36b37e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Strengths</div>
                                    {submission.aiEvaluation.strengths.map((s, i) => (
                                      <div key={i} style={{ fontSize: '0.72rem', color: '#aaa', display: 'flex', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                        <span style={{ color: '#36b37e', flexShrink: 0 }}>+</span>{s}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {submission.aiEvaluation.improvements?.length > 0 && (
                                  <div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ff9a5c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Improvements</div>
                                    {submission.aiEvaluation.improvements.map((s, i) => (
                                      <div key={i} style={{ fontSize: '0.72rem', color: '#aaa', display: 'flex', gap: '0.35rem', marginBottom: '0.2rem' }}>
                                        <span style={{ color: '#ff9a5c', flexShrink: 0 }}>→</span>{s}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Admin score override + verify */}
                              {!submission.aiEvaluation.verifiedByAdmin && (
                                <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '0.65rem 0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <div style={{ fontSize: '0.7rem', color: '#888', flexShrink: 0 }}>Adjust Score:</div>
                                  <input
                                    type="number" min={0} max={100}
                                    placeholder={String(submission.aiEvaluation.score ?? '')}
                                    value={adminFinalScores[submission._id] ?? ''}
                                    onChange={e => setAdminFinalScores(prev => ({ ...prev, [submission._id]: e.target.value }))}
                                    style={{ width: 64, background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '5px', padding: '0.2rem 0.4rem', fontSize: '0.8rem', outline: 'none' }}
                                  />
                                  <span style={{ fontSize: '0.7rem', color: '#555' }}>/100</span>
                                  <button
                                    onClick={() => handleAiVerify(submission._id)}
                                    disabled={verifyingId === submission._id}
                                    style={{ marginLeft: 'auto', background: '#36b37e', border: 'none', color: '#fff', borderRadius: '5px', padding: '0.28rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, cursor: verifyingId === submission._id ? 'default' : 'pointer', opacity: verifyingId === submission._id ? 0.65 : 1 }}
                                  >
                                    {verifyingId === submission._id ? '...' : '✓ Verify & Save'}
                                  </button>
                                </div>
                              )}
                              {submission.aiEvaluation.verifiedByAdmin && (
                                <div style={{ fontSize: '0.72rem', color: '#36b37e', background: '#36b37e0d', border: '1px solid #36b37e33', borderRadius: '6px', padding: '0.45rem 0.7rem' }}>
                                  ✓ AI evaluation verified by admin{submission.aiEvaluation.adminFinalScore != null ? ` · Final Score: ${submission.aiEvaluation.adminFinalScore}/100` : ''}
                                </div>
                              )}
                            </div>
                          )}

                          {!submission.aiEvaluation && (
                            <div style={{ fontSize: '0.75rem', color: '#444', fontStyle: 'italic' }}>
                              Click "AI Evaluate" to get a detailed evaluation report with relevance check, code annotations, and faculty report.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: review panel */}
                      <div style={{ padding: '1rem 1.1rem', background: '#0a0a0a', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ff6b35', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Admin Review
                        </div>

                        {/* Previous feedback display */}
                        {submission.adminFeedback && (
                          <div style={{
                            background: `${statusConfig.color}10`,
                            border: `1px solid ${statusConfig.color}30`,
                            borderRadius: '6px', padding: '0.6rem 0.75rem',
                          }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: statusConfig.color, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                              Previous Feedback
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{submission.adminFeedback}</div>
                          </div>
                        )}

                        {/* Decision buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleReviewDraftChange(submission._id, 'adminReviewStatus', 'approved')}
                            disabled={isLocked}
                            style={{
                              flex: 1, padding: '0.5rem',
                              borderRadius: '6px', border: `2px solid #36b37e`,
                              background: draft.adminReviewStatus === 'approved' ? '#36b37e' : 'transparent',
                              color: draft.adminReviewStatus === 'approved' ? '#fff' : '#36b37e',
                              fontSize: '0.78rem', fontWeight: 700, cursor: isLocked ? 'default' : 'pointer',
                              transition: 'all 0.15s', opacity: isLocked ? 0.5 : 1,
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReviewDraftChange(submission._id, 'adminReviewStatus', 'rejected')}
                            disabled={isLocked}
                            style={{
                              flex: 1, padding: '0.5rem',
                              borderRadius: '6px', border: `2px solid #de350b`,
                              background: draft.adminReviewStatus === 'rejected' ? '#de350b' : 'transparent',
                              color: draft.adminReviewStatus === 'rejected' ? '#fff' : '#de350b',
                              fontSize: '0.78rem', fontWeight: 700, cursor: isLocked ? 'default' : 'pointer',
                              transition: 'all 0.15s', opacity: isLocked ? 0.5 : 1,
                            }}
                          >
                            ✕ Revision
                          </button>
                        </div>

                        {/* Feedback textarea */}
                        <textarea
                          value={draft.adminFeedback}
                          onChange={e => handleReviewDraftChange(submission._id, 'adminFeedback', e.target.value)}
                          placeholder="Write feedback for the student (optional)..."
                          disabled={isLocked}
                          rows={4}
                          style={{
                            width: '100%', background: '#111', border: '1px solid #2a2a2a',
                            borderRadius: '6px', color: '#ccc', padding: '0.6rem 0.75rem',
                            fontSize: '0.8rem', lineHeight: 1.5, resize: 'vertical',
                            outline: 'none', opacity: isLocked ? 0.5 : 1,
                          }}
                        />

                        {/* Save button */}
                        <button
                          onClick={() => handleSubmitReview(submission._id)}
                          disabled={submissionsSavingId === submission._id || isLocked || draft.adminReviewStatus === 'pending'}
                          style={{
                            width: '100%', padding: '0.55rem',
                            background: draft.adminReviewStatus === 'approved' ? '#36b37e'
                              : draft.adminReviewStatus === 'rejected' ? '#de350b' : '#333',
                            border: 'none', borderRadius: '6px',
                            color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                            cursor: (isLocked || draft.adminReviewStatus === 'pending') ? 'default' : 'pointer',
                            opacity: (isLocked || draft.adminReviewStatus === 'pending') ? 0.45 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          {submissionsSavingId === submission._id ? (
                            <span><Spinner animation="border" size="sm" /> Saving...</span>
                          ) : isLocked ? '✓ Review Saved'
                            : draft.adminReviewStatus === 'pending' ? 'Select Approve or Revision first'
                            : `Save ${draft.adminReviewStatus === 'approved' ? 'Approval' : 'Revision'}`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>

      </Modal>

      <style>{`
        .task-manager-container {
          background: #000000;
          min-height: 100vh;
          padding: 2rem;
        }

        .modal-backdrop {
          z-index: 1059 !important;
        }

        .task-manager-card {
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: nowrap;
          margin-bottom: 1.25rem;
          padding: 0;
        }

        .tasks-grid, .header-section {
          padding: 0 0.25rem;
        }

        /* ── View toggle ── */
        .view-toggle {
          display: flex;
          gap: 0;
          border: 1px solid #333;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          height: 36px;
        }
        .view-toggle-btn {
          background: #111;
          border: none;
          color: #666;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0 0.85rem;
          height: 100%;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          line-height: 36px;
        }
        .view-toggle-btn:first-child { border-right: 1px solid #333; }
        .view-toggle-btn:hover { background: #1a1a1a; color: #ccc; }
        .view-toggle-btn.active { background: #ff6b35; color: #fff; }

        /* ── Admin board stats ── */
        .admin-board-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 768px) {
          .admin-board-stats { grid-template-columns: repeat(2, 1fr); }
        }

        .admin-board-stat {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 0.55rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .abs-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .abs-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          flex: 1;
        }
        .abs-count {
          font-size: 1.3rem;
          font-weight: 800;
          line-height: 1;
        }
        .abs-desc { display: none; }

        /* ── Admin Kanban board ── */
        .admin-kanban-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .admin-kanban-board { grid-template-columns: 1fr; }
        }

        .admin-kanban-col {
          background: #111;
          border-radius: 8px;
          overflow: hidden;
        }

        .admin-kanban-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: #111;
          border-bottom: 1px solid #1a1a1a;
        }

        .admin-kanban-label {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.6px;
        }

        .admin-kanban-count {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.12rem 0.45rem;
          border-radius: 20px;
        }

        .admin-kanban-cards {
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 80px;
        }

        .admin-kanban-empty {
          text-align: center;
          padding: 2rem 0;
          color: #333;
          font-size: 0.75rem;
        }

        .admin-kanban-card {
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 6px;
          padding: 0.8rem;
          transition: border-color 0.18s;
        }
        .admin-kanban-card:hover { border-color: #333; }

        .admin-card-task-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ddd;
          line-height: 1.4;
          margin-bottom: 0.55rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .admin-card-student {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0;
          border-top: 1px solid #1a1a1a;
          border-bottom: 1px solid #1a1a1a;
          margin-bottom: 0.1rem;
        }

        .admin-card-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ff6b3522;
          border: 1px solid #ff6b3544;
          color: #ff6b35;
          font-size: 0.72rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-card-cat {
          font-size: 0.66rem;
          font-weight: 700;
          background: rgba(255,107,53,0.1);
          color: #ff6b35;
          border: 1px solid rgba(255,107,53,0.25);
          padding: 0.12rem 0.4rem;
          border-radius: 4px;
        }

        .admin-card-feedback {
          font-size: 0.72rem;
          color: #de350b;
          background: rgba(222,53,11,0.08);
          border: 1px solid rgba(222,53,11,0.2);
          border-radius: 4px;
          padding: 0.35rem 0.5rem;
          margin-top: 0.4rem;
        }

        .admin-review-btn {
          flex: 1;
          padding: 0.32rem 0.5rem;
          border-radius: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
          border: none;
        }
        .admin-review-btn:hover { opacity: 0.8; }
        .admin-review-btn.approve { background: #36b37e; color: #fff; }
        .admin-review-btn.reject  { background: transparent; border: 1px solid #de350b; color: #de350b; }

        .admin-view-subs-btn {
          display: block;
          width: 100%;
          margin-top: 0.65rem;
          padding: 0.38rem 0.5rem;
          background: transparent;
          border: 1px solid #ff6b35;
          color: #ff6b35;
          border-radius: 5px;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-align: center;
        }
        .admin-view-subs-btn:hover { background: #ff6b35; color: #fff; }
        .admin-view-subs-btn:disabled { opacity: 0.4; cursor: default; }

        .page-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 0.25rem;
          white-space: nowrap;
        }

        .page-subtitle {
          color: #888888;
          font-size: 0.82rem;
          margin: 0;
        }

        .refresh-btn {
          height: 36px !important;
          padding: 0 0.9rem !important;
          font-size: 0.8rem !important;
          white-space: nowrap;
          flex-shrink: 0;
          line-height: 1 !important;
        }

        .header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.6rem;
          width: auto;
          min-width: 0;
        }

        .task-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: nowrap;
          min-width: 0;
        }

        .filter-control {
          background: #121212 !important;
          border: 1px solid #333333 !important;
          color: #ffffff !important;
          min-width: 110px;
          max-width: 150px;
          font-size: 0.8rem !important;
          height: 36px !important;
          padding: 0 0.7rem !important;
          border-radius: 6px !important;
        }

        .filter-search {
          min-width: 180px;
          max-width: 220px;
        }

        .filter-control:focus {
          background: #121212 !important;
          color: #ffffff !important;
          border-color: #ff6b35 !important;
          box-shadow: 0 0 0 0.15rem rgba(255, 107, 53, 0.2) !important;
        }

        .filter-clear-btn {
          height: 36px !important;
          padding: 0 0.8rem !important;
          font-size: 0.8rem !important;
          white-space: nowrap;
          flex-shrink: 0;
          line-height: 1 !important;
        }

        /* Alerts */
        .success-alert, .error-alert {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          border-radius: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
        }

        .error-alert {
          background: rgba(220, 53, 69, 0.1);
          border-color: #dc3545;
        }

        .alert-icon {
          font-size: 1.2rem;
          font-weight: bold;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #888888;
        }

        .loading-state .spinner-border {
          color: #ff6b35;
          margin-bottom: 1rem;
        }

        /* Tasks Grid */
        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 1rem;
        }

        .task-card {
          background: #111;
          border: none;
          border-radius: 10px;
          transition: background 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }

        .task-card:hover {
          background: #161616;
          box-shadow: 0 2px 16px rgba(0,0,0,0.5);
        }

        .task-card .card-body {
          padding: 1rem 1.1rem !important;
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.55rem;
        }

        .task-title-section {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .task-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: #e8e8e8;
          margin: 0;
          line-height: 1.35;
        }

        .category-badge {
          background: transparent !important;
          color: #888 !important;
          border: 1px solid #2a2a2a !important;
          padding: 0.15rem 0.5rem !important;
          border-radius: 4px !important;
          font-weight: 500 !important;
          font-size: 0.67rem !important;
          width: fit-content;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        .task-actions {
          display: flex;
          gap: 0.25rem;
          flex-shrink: 0;
        }

        .action-btn {
          padding: 0.18rem 0.55rem !important;
          font-size: 0.67rem !important;
          white-space: nowrap;
          line-height: 1.3;
          border-radius: 5px !important;
        }

        /* Meta line — single text row below title */
        .task-meta {
          font-size: 0.72rem;
          color: #666;
          margin: 0.45rem 0 0.5rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.2rem;
          line-height: 1.4;
        }

        .meta-sep {
          color: #333;
          margin: 0 0.15rem;
        }

        /* Combined pills row */
        .task-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          margin-bottom: 0.5rem;
        }

        .task-pill {
          display: inline-block;
          font-size: 0.67rem;
          padding: 0.13rem 0.5rem;
          border-radius: 4px;
          white-space: nowrap;
          line-height: 1.5;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pill-email {
          background: transparent;
          border: 1px solid #1e1e1e;
          color: #888;
        }

        .pill-skill {
          background: transparent;
          border: 1px solid #222;
          color: #777;
          font-weight: 500;
        }

        .pill-more {
          background: transparent;
          border: 1px dashed #2a2a2a;
          color: #555;
        }

        .pill-spots {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #ff6b35;
          font-weight: 500;
          margin-left: auto;
        }

        .pill-empty {
          background: transparent;
          color: #444;
          font-style: italic;
          border: none;
          padding-left: 0;
        }

        /* Task Footer */
        .task-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.35rem;
          font-size: 0.67rem;
          color: #4a4a4a;
        }

        .experience-info {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Empty State */
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-icon {
          font-size: 3rem;
          opacity: 0.5;
        }

        .empty-state-content p {
          margin: 0;
          color: #888888;
        }

        .empty-state-content small {
          color: #666666;
        }

        /* Modal Styles */
        .task-modal .modal-content {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 20px;
        }

        .task-modal .modal-fullscreen .modal-content,
        .task-modal .modal-fullscreen .modal-body,
        .task-modal .modal-fullscreen .modal-header,
        .task-modal .modal-fullscreen .modal-footer {
          background: #0a0a0a;
        }

        .task-modal .modal-fullscreen .modal-content {
          border-radius: 0;
          border: none;
        }

        .task-modal.modal {
          z-index: 1060 !important;
        }

        .task-modal .modal-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #111 100%);
          border-bottom: 2px solid #ff6b35;
          padding: 1.5rem;
        }

        .task-modal .modal-title {
          color: #ff6b35;
          font-size: 1.5rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-icon {
          font-size: 1.5rem;
        }

        .task-modal .modal-body {
          padding: 2rem;
        }

        .task-modal .modal-footer {
          border-top: 1px solid #333333;
          padding: 1.5rem;
          gap: 1rem;
        }

        /* Form Styles */
        .modal-form {
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .modal-form::-webkit-scrollbar {
          width: 6px;
        }

        .modal-form::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }

        .modal-form::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 3px;
        }

        .form-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #222222;
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-title {
          color: #ff6b35;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-icon {
          font-size: 1rem;
        }

        .form-label {
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-control-modern,
        .form-select {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          border-radius: 10px;
          padding: 0.6rem 1rem;
          transition: all 0.3s ease;
        }

        .form-control-modern:focus,
        .form-select:focus {
          background: #1a1a1a;
          border-color: #ff6b35;
          color: #ffffff;
          box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
        }

        /* Rich Editor */
        .rich-editor {
          background: #1a1a1a;
          border-radius: 10px;
          overflow: hidden;
        }

        .rich-editor .ql-toolbar {
          background: #0a0a0a;
          border-color: #333333;
        }

        .rich-editor .ql-container {
          min-height: 150px;
        }

        .rich-editor .ql-editor {
          min-height: 130px;
          color: #ffffff;
        }

        .rich-editor .ql-editor.ql-blank::before {
          color: #666666;
        }

        .rich-editor .ql-stroke {
          stroke: #ffffff;
        }

        .rich-editor .ql-fill {
          fill: #ffffff;
        }

        .rich-editor .ql-picker {
          color: #ffffff;
        }

        .rich-editor .ql-picker-options {
          background: #1a1a1a;
          border-color: #333333;
        }

        /* Checkbox */
        .custom-checkbox {
          color: #ffffff;
        }

        .custom-checkbox .form-check-input {
          background-color: #1a1a1a;
          border-color: #333333;
        }

        .custom-checkbox .form-check-input:checked {
          background-color: #ff6b35;
          border-color: #ff6b35;
        }

        /* File Input */
        .file-input {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 10px;
        }

        .file-input::-webkit-file-upload-button {
          background: #ff6b35;
          border: none;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .file-input::-webkit-file-upload-button:hover {
          background: #ff9a5c;
        }

        .text-muted {
          color: #888888 !important;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        /* Submissions Modal — fullscreen, covers sidebar */
        .submissions-modal.modal { z-index: 1060 !important; }
        .submissions-modal .modal-fullscreen { background: #070707; }
        .submissions-modal .modal-fullscreen .modal-content,
        .submissions-modal .modal-fullscreen .modal-header,
        .submissions-modal .modal-fullscreen .modal-body,
        .submissions-modal .modal-fullscreen .modal-footer {
          background: #070707;
        }
        .submissions-modal .modal-fullscreen .modal-content {
          border-radius: 0;
          border: none;
        }
        .submissions-modal .modal-fullscreen .modal-header {
          border-bottom: 1px solid #1a1a1a;
        }
        .submissions-modal .modal-fullscreen .modal-footer {
          border-top: 1px solid #1a1a1a;
        }

        /* Submissions Modal */
        .submissions-filters {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .submissions-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .submission-card {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .submission-card:hover {
          border-color: #ff6b35;
        }

        .submission-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #222222;
        }

        .student-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-icon {
          font-size: 1.5rem;
        }

        .student-details {
          flex: 1;
        }

        .student-name {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem 0;
        }

        .student-email {
          font-size: 0.75rem;
          color: #888888;
        }

        .submission-badges {
          display: flex;
          gap: 0.5rem;
        }

        .status-badge, .review-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          font-size: 0.7rem;
        }

        .status-badge.completed {
          background: rgba(40, 167, 69, 0.15);
          color: #28a745;
        }

        .status-badge.pending {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }

        .review-badge.approved {
          background: rgba(40, 167, 69, 0.15);
          color: #28a745;
        }

        .review-badge.rejected {
          background: rgba(220, 53, 69, 0.15);
          color: #dc3545;
        }

        .review-badge.pending {
          background: rgba(255, 193, 7, 0.15);
          color: #ffc107;
        }

        .submission-field {
          margin-bottom: 1rem;
        }

        .field-label {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          color: #888888;
          margin-bottom: 0.25rem;
        }

        .field-link {
          color: #ff9a5c;
          text-decoration: none;
          word-break: break-all;
        }

        .field-link:hover {
          text-decoration: underline;
        }

        .field-content {
          color: #e0e0e0;
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .field-content.rich-text p {
          margin: 0 0 0.5rem;
        }

        .attachments-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .attachment-link {
          color: #ff9a5c;
          text-decoration: none;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .attachment-link:hover {
          text-decoration: underline;
        }

        .review-section {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #222222;
        }

        .review-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #ff6b35;
          margin-bottom: 1rem;
        }

        .existing-feedback {
          background: rgba(255, 107, 53, 0.05);
          border-left: 3px solid #ff6b35;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 8px;
        }

        .feedback-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #ff6b35;
          margin-bottom: 0.25rem;
        }

        .feedback-content {
          font-size: 0.85rem;
          color: #e0e0e0;
        }

        .review-form {
          margin-top: 1rem;
        }

        .review-select {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          font-size: 0.85rem;
        }

        .review-feedback-input {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          font-size: 0.85rem;
        }

        .review-feedback-input:focus {
          border-color: #ff6b35;
          box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
        }

        .invisible-label {
          visibility: hidden;
          margin-bottom: 0;
        }

        .save-review-btn {
          width: 100%;
          font-size: 0.85rem;
          padding: 0.5rem;
        }

        /* Buttons */
        .btn-orange {
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border: none;
          color: #ffffff;
          font-weight: 600;
          padding: 0.6rem 1.5rem;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .btn-orange:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .btn-outline-orange {
          background: transparent;
          border: 2px solid #ff6b35;
          color: #ff6b35;
          font-weight: 600;
          padding: 0.6rem 1.5rem;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .btn-outline-orange:hover:not(:disabled) {
          background: #ff6b35;
          color: #ffffff;
          transform: translateY(-2px);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .task-manager-container {
            padding: 1rem;
          }

          .header-section {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .task-filters {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .filter-control {
            max-width: 100%;
            min-width: 0;
          }

          .tasks-grid {
            grid-template-columns: 1fr;
          }

          .task-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .submission-header {
            flex-direction: column;
            text-align: center;
          }

          .submission-badges {
            justify-content: center;
          }

          .modal-form {
            max-height: 60vh;
          }
        }
      `}</style>
    </div>
  );
};

export default TaskListManager;
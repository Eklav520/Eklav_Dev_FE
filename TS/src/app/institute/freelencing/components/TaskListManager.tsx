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

  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsSavingId, setSubmissionsSavingId] = useState<string | null>(null);
  const [selectedSubmissionTask, setSelectedSubmissionTask] = useState<FreelancingTask | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<"pending" | "all" | "approved" | "rejected">("pending");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "full" | "deadline-passed">("all");
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { adminReviewStatus: "pending" | "approved" | "rejected"; adminFeedback: string }>
  >({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<FreelancingTask | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const openEditModal = (task: FreelancingTask) => {
    setSelectedTask(task);
    setNewAttachments([]);
    setEditForm({
      title: task.title || "",
      category: task.category || "",
      experience: task.experience || "",
      amount: task.amount || 0,
      maxStudents: task.maxStudents || 1,
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      startDate: task.startDate ? task.startDate.slice(0, 10) : "",
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
    setNewAttachments(files);
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
      payload.append("deadline", editForm.deadline);
      payload.append("startDate", editForm.startDate);
      payload.append("githubLink", editForm.githubLink);
      payload.append("description", editForm.description);
      payload.append("highlights", editForm.highlights);
      payload.append("acceptanceCriteria", editForm.acceptanceCriteria);
      payload.append("terms", editForm.terms);
      payload.append("ndaRequired", String(editForm.ndaRequired));
      payload.append("replaceAttachments", String(editForm.replaceAttachments));

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
    setSubmissionFilter("pending");
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
        <Card.Body className="p-4">
          <div className="header-section">
            <div>
              <h3 className="page-title">Task Management</h3>
              <p className="page-subtitle">Manage and edit your freelance tasks</p>
            </div>
            <div className="header-actions">
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
              <Button variant="outline-orange" onClick={fetchTasks} disabled={loading} className="refresh-btn">
                {loading ? <Spinner animation="border" size="sm" /> : "↻ Refresh"}
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

          {loading ? (
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
                          <h4 className="task-title">{task.title || "Untitled Task"}</h4>
                          <Badge className="category-badge">
                            {getCategoryIcon(task.category || "")} {getCategoryLabel(task.category || "")}
                          </Badge>
                        </div>
                        <div className="task-actions">
                          <Button 
                            variant="outline-orange" 
                            size="sm" 
                            onClick={() => openEditModal(task)}
                            className="action-btn"
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="orange"
                            size="sm"
                            onClick={() => openSubmissionsModal(task)}
                            className="action-btn"
                          >
                            📋 View
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openDeleteModal(task)}
                            className="action-btn"
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>

                      {/* Task Stats */}
                      <div className="task-stats">
                        <div className="stat-item">
                          <span className="stat-icon">💰</span>
                          <div className="stat-info">
                            <label>Budget</label>
                            <strong>{task.amount ? `₹${task.amount.toLocaleString()}` : "—"}</strong>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">⏰</span>
                          <div className="stat-info">
                            <label>Deadline</label>
                            <strong>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "—"}</strong>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">👥</span>
                          <div className="stat-info">
                            <label>Team Size</label>
                            <strong>{enrolledCount}/{task.maxStudents || 1}</strong>
                          </div>
                        </div>
                        <div className="stat-item">
                          <span className="stat-icon">📎</span>
                          <div className="stat-info">
                            <label>Attachments</label>
                            <strong>{task.attachments?.length || 0}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="enrollment-box">
                        <div className="enrollment-head">
                          <span className="enrollment-title">Enrolled Students</span>
                          <Badge className="enrollment-left-badge">{spotsLeft} left</Badge>
                        </div>
                        {enrolledStudentsDetails.length > 0 ? (
                          <div className="enrollment-emails">
                            {enrolledStudentsDetails.map((student, idx) => (
                              <span key={`${task._id}-${student.studentId || idx}`} className="enrollment-email-pill">
                                {student.email || student.name || "No email"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <small className="enrollment-empty">No students enrolled yet.</small>
                        )}
                      </div>

                      {/* Skills */}
                      {task.skills && task.skills.length > 0 && (
                        <div className="skills-section">
                          <div className="skills-wrapper">
                            {task.skills.slice(0, 4).map((skill) => (
                              <Badge key={`${task._id}-${skill}`} className="skill-badge">
                                {skill}
                              </Badge>
                            ))}
                            {task.skills.length > 4 && (
                              <Badge className="skill-badge-more">
                                +{task.skills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

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
      <Modal show={showEditModal} onHide={closeEditModal} size="xl" centered className="task-modal">
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
                          <Form.Label>Start Date</Form.Label>
                          <Form.Control 
                            type="date" 
                            name="startDate" 
                            value={editForm.startDate} 
                            onChange={handleEditChange}
                            className="form-control-modern"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Deadline</Form.Label>
                          <Form.Control 
                            type="date" 
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
                        <Form.Group>
                          <Form.Label>Add Attachments</Form.Label>
                          <Form.Control 
                            type="file" 
                            multiple 
                            onChange={handleAttachmentInput}
                            className="file-input"
                          />
                          <Form.Text className="text-muted">
                            {selectedTask?.attachments?.length || 0} existing attachment(s). 
                            Max file size: 10MB per file
                          </Form.Text>
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
        centered
        className="task-modal submissions-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="modal-icon">🧾</span>
            Submissions - {selectedSubmissionTask?.title || "Task"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="submissions-filters">
            <Button
              variant={submissionFilter === "pending" ? "orange" : "outline-orange"}
              onClick={() => setSubmissionFilter("pending")}
              className="filter-btn"
            >
              ⏳ Pending ({submissions.filter((s) => (s.adminReviewStatus || "pending") === "pending").length})
            </Button>
            <Button
              variant={submissionFilter === "approved" ? "orange" : "outline-orange"}
              onClick={() => setSubmissionFilter("approved")}
              className="filter-btn"
            >
              ✅ Approved ({submissions.filter((s) => s.adminReviewStatus === "approved").length})
            </Button>
            <Button
              variant={submissionFilter === "rejected" ? "orange" : "outline-orange"}
              onClick={() => setSubmissionFilter("rejected")}
              className="filter-btn"
            >
              ❌ Rejected ({submissions.filter((s) => s.adminReviewStatus === "rejected").length})
            </Button>
            <Button
              variant={submissionFilter === "all" ? "orange" : "outline-orange"}
              onClick={() => setSubmissionFilter("all")}
              className="filter-btn"
            >
              📋 All ({submissions.length})
            </Button>
          </div>

          {submissionsLoading ? (
            <div className="loading-state">
              <Spinner animation="border" variant="orange" />
              <p>Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-content">
                <span className="empty-icon">📭</span>
                <p>No submissions yet.</p>
                <small>Students will appear here after uploading their work.</small>
              </div>
            </div>
          ) : (
            <div className="submissions-grid">
              {filteredSubmissions.map((submission) => {
                const draft = reviewDrafts[submission._id] || {
                  adminReviewStatus: "pending" as const,
                  adminFeedback: "",
                };
                const isApprovedAndLocked = submission.adminReviewStatus === "approved";

                return (
                  <Card key={submission._id} className="submission-card">
                    <Card.Body>
                      {/* Student Header */}
                      <div className="submission-header">
                        <div className="student-avatar">
                          <span className="avatar-icon">👨‍🎓</span>
                        </div>
                        <div className="student-details">
                          <h5 className="student-name">{submission.studentId?.name || "Anonymous Student"}</h5>
                          <div className="student-email">{submission.studentId?.email || "No email provided"}</div>
                        </div>
                        <div className="submission-badges">
                          <Badge className={`status-badge ${submission.status === "completed" ? "completed" : "pending"}`}>
                            {submission.status === "completed" ? "✓ Submitted" : "⏳ Pending"}
                          </Badge>
                          <Badge className={`review-badge ${submission.adminReviewStatus || "pending"}`}>
                            {submission.adminReviewStatus === "approved" && "✓ Approved"}
                            {submission.adminReviewStatus === "rejected" && "✗ Rejected"}
                            {(!submission.adminReviewStatus || submission.adminReviewStatus === "pending") && "⏳ Pending Review"}
                          </Badge>
                        </div>
                      </div>

                      {/* Submission Content */}
                      {submission.codeLink && (
                        <div className="submission-field">
                          <div className="field-label">🔗 Code Repository</div>
                          <a href={submission.codeLink} target="_blank" rel="noreferrer" className="field-link">
                            {submission.codeLink}
                          </a>
                        </div>
                      )}

                      {submission.codeDescription && (
                        <div className="submission-field">
                          <div className="field-label">📝 Submission Notes</div>
                          <div
                            className="field-content rich-text"
                            dangerouslySetInnerHTML={{ __html: submission.codeDescription }}
                          />
                        </div>
                      )}

                      {submission.attachments && submission.attachments.length > 0 && (
                        <div className="submission-field">
                          <div className="field-label">📎 Attachments</div>
                          <div className="attachments-list">
                            {submission.attachments.map((att, idx) => (
                              <a key={idx} href={att.fileUrl} target="_blank" rel="noreferrer" className="attachment-link">
                                📄 {att.fileName || `Attachment ${idx + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Section */}
                      <div className="review-section">
                        <div className="review-section-title">Admin Review</div>
                        
                        {isApprovedAndLocked && submission.adminFeedback && (
                          <div className="existing-feedback">
                            <div className="feedback-label">Previous Feedback:</div>
                            <div className="feedback-content">{submission.adminFeedback}</div>
                          </div>
                        )}

                        <div className="review-form">
                          <Row className="g-2">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Review Status</Form.Label>
                                <Form.Select
                                  value={draft.adminReviewStatus === "pending" ? "" : draft.adminReviewStatus}
                                  onChange={(e) =>
                                    handleReviewDraftChange(
                                      submission._id,
                                      "adminReviewStatus",
                                      e.target.value
                                    )
                                  }
                                  disabled={isApprovedAndLocked}
                                  className="review-select"
                                >
                                  <option value="" disabled>
                                    Select status
                                  </option>
                                  <option value="approved">✅ Approved</option>
                                  <option value="rejected">❌ Rejected</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Feedback</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={draft.adminFeedback}
                                  onChange={(e) =>
                                    handleReviewDraftChange(
                                      submission._id,
                                      "adminFeedback",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Provide feedback for the student..."
                                  disabled={isApprovedAndLocked}
                                  className="review-feedback-input"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={2}>
                              <Form.Group>
                                <Form.Label className="invisible-label">Action</Form.Label>
                                <Button
                                  variant="orange"
                                  className="save-review-btn"
                                  onClick={() => handleSubmitReview(submission._id)}
                                  disabled={
                                    submissionsSavingId === submission._id ||
                                    isApprovedAndLocked ||
                                    draft.adminReviewStatus === "pending"
                                  }
                                >
                                  {submissionsSavingId === submission._id ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : isApprovedAndLocked ? (
                                    "✓ Approved"
                                  ) : (
                                    "Save Review"
                                  )}
                                </Button>
                              </Form.Group>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-orange" onClick={() => setShowSubmissionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .task-manager-container {
          background: #000000;
          min-height: 100vh;
          padding: 2rem;
        }

        .task-manager-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: nowrap;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #333333;
        }

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
          padding: 0.4rem 0.9rem;
          font-size: 0.82rem;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
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
          background: #121212;
          border: 1px solid #333333;
          color: #ffffff;
          min-width: 110px;
          max-width: 150px;
          font-size: 0.8rem;
          padding-top: 0.4rem;
          padding-bottom: 0.4rem;
        }

        .filter-search {
          min-width: 180px;
          max-width: 240px;
        }

        .filter-control:focus {
          background: #121212;
          color: #ffffff;
          border-color: #ff6b35;
          box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.2);
        }

        .filter-clear-btn {
          white-space: nowrap;
          flex-shrink: 0;
          padding: 0.4rem 0.8rem;
          font-size: 0.8rem;
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
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
        }

        .task-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .task-card:hover {
          transform: translateY(-4px);
          border-color: #ff6b35;
          box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15);
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .task-title-section {
          flex: 1;
        }

        .task-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }

        .category-badge {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.75rem;
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
        }

        /* Task Stats */
        .task-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin: 1rem 0;
          padding: 0.75rem;
          background: #0d0d0d;
          border-radius: 12px;
        }

        .enrollment-box {
          margin-top: 0.75rem;
          padding: 0.7rem 0.85rem;
          background: #0d0d0d;
          border: 1px solid #1f1f1f;
          border-radius: 10px;
        }

        .enrollment-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
          gap: 0.5rem;
        }

        .enrollment-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          color: #a0a0a0;
        }

        .enrollment-left-badge {
          background: rgba(255, 107, 53, 0.15);
          color: #ff9a5c;
          border: 1px solid rgba(255, 107, 53, 0.35);
          font-weight: 600;
          font-size: 0.7rem;
          padding: 0.25rem 0.45rem;
        }

        .enrollment-emails {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .enrollment-email-pill {
          background: #171717;
          border: 1px solid #2e2e2e;
          color: #d2d2d2;
          font-size: 0.72rem;
          border-radius: 999px;
          padding: 0.2rem 0.55rem;
          max-width: 100%;
          word-break: break-all;
        }

        .enrollment-empty {
          color: #747474;
          font-size: 0.76rem;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-icon {
          font-size: 1.1rem;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .stat-info label {
          font-size: 0.65rem;
          color: #888888;
          margin: 0;
        }

        .stat-info strong {
          font-size: 0.85rem;
          color: #ffffff;
          font-weight: 600;
        }

        /* Skills Section */
        .skills-section {
          margin: 1rem 0;
        }

        .skills-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-badge {
          background: #1a1a1a;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.75rem;
          border: 1px solid #333333;
        }

        .skill-badge-more {
          background: #333333;
          color: #ffffff;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
        }

        /* Task Footer */
        .task-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #222222;
          font-size: 0.7rem;
          color: #888888;
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
          max-height: 70vh;
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
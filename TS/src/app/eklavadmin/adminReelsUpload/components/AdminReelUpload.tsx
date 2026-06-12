import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Modal,
  Spinner,
  Table,
  Badge,

} from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import {
  FaVideo,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaArrowUp,
  FaArrowDown,
  FaUpload,
  FaSave,
  FaTimes,
  FaSpinner,
  FaInfoCircle,

  FaSearch,
  FaCalendarAlt,
  FaPlay,
  FaList,
  FaGripVertical,
} from "react-icons/fa";
import { MdVideoLibrary, MdDescription, MdTitle, MdDateRange } from "react-icons/md";

type ReelSection = {
  _id: string;
  courseName: string;
  shortDescription: string;
  isActive: boolean;
  reelCount: number;
  createdAt: string;
  reels?: {
    _id: string;
    title: string;
    videoUrl: string;
    order?: number;
  }[];
};

type ReelInput = {
  _id?: string;
  title: string;
  video: File | null;
  videoUrl?: string;
  order?: number;
};

// Professional Pagination Component
const ReelPagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="reel-pagination">
      <div className="pagination-info">
        <FaInfoCircle className="me-1" size={12} />
        Page {currentPage} of {totalPages}
      </div>
      <div className="pagination-controls">
        <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>«</button>
        <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
        {getPageNumbers().map((page, idx) => (
          page === '...' ? <span key={`dots-${idx}`} className="pagination-dots">...</span> :
          <button key={idx} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page as number)}>{page}</button>
        ))}
        <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
        <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>»</button>
      </div>
      <div className="pagination-stats">
        Showing {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalPages * 10)} of {totalPages * 10}+ Sections
      </div>
    </div>
  );
};

// Reel Card Component for Grid View
const ReelCard: React.FC<{ reel: { title: string; videoUrl: string; order?: number }; index: number; onMoveUp?: () => void; onMoveDown?: () => void; onRemove?: () => void; canMoveUp: boolean; canMoveDown: boolean }> = ({
  reel, index, onMoveUp, onMoveDown, onRemove, canMoveUp, canMoveDown
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="reel-card">
      <div className="reel-card-header">
        <div className="reel-order">
          <FaGripVertical className="text-muted" />
          <span className="order-number">#{index + 1}</span>
        </div>
        <div className="reel-actions">
          <Button variant="link" size="sm" onClick={() => setShowPreview(!showPreview)} title="Preview Video">
            <FaPlay />
          </Button>
          {onMoveUp && (
            <Button variant="link" size="sm" onClick={onMoveUp} disabled={!canMoveUp} title="Move Up">
              <FaArrowUp />
            </Button>
          )}
          {onMoveDown && (
            <Button variant="link" size="sm" onClick={onMoveDown} disabled={!canMoveDown} title="Move Down">
              <FaArrowDown />
            </Button>
          )}
          {onRemove && (
            <Button variant="link" size="sm" onClick={onRemove} className="text-danger" title="Remove Reel">
              <FaTrash />
            </Button>
          )}
        </div>
      </div>
      <div className="reel-card-body">
        <h6 className="reel-title">{reel.title || "Untitled Reel"}</h6>
        {showPreview && reel.videoUrl && (
          <video src={reel.videoUrl} controls className="reel-preview" />
        )}
        {!showPreview && reel.videoUrl && (
          <div className="video-placeholder" onClick={() => setShowPreview(true)}>
            <FaPlay className="play-icon" />
            <span>Click to preview</span>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminReels: React.FC = () => {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [sections, setSections] = useState<ReelSection[]>([]);
  const [filteredSections, setFilteredSections] = useState<ReelSection[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [courseName, setCourseName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [reels, setReels] = useState<ReelInput[]>([{ title: "", video: null }]);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ReelSection | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletedReelIds, setDeletedReelIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sectionsPerPage = 10;

  const fetchSections = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get(`${baseURL}/api/adminSideReels/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.sections || [];
      setSections(data);
      setFilteredSections(data);
    } catch (err) {
      console.error("Fetch sections error:", err);
      setError("Failed to fetch reel sections");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSections();
  }, [token]);

  // Filter sections
  useEffect(() => {
    let filtered = [...sections];
    
    if (searchTerm) {
      filtered = filtered.filter(section =>
        section.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(section =>
        statusFilter === "active" ? section.isActive : !section.isActive
      );
    }
    
    setFilteredSections(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sections]);

  const addReelField = () => {
    setReels([...reels, { title: "", video: null, order: reels.length }]);
  };

  const removeReelField = (index: number) => {
    const reel = reels[index];
    if (reel._id) {
      setDeletedReelIds((prev) => [...prev, reel._id!]);
    }
    setReels(reels.filter((_, i) => i !== index));
  };

  const handleReelChange = (index: number, field: "title" | "video", value: any) => {
    const updated = [...reels];
    updated[index][field] = value;
    setReels(updated);
  };

  const moveReel = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= reels.length) return;
    const updated = [...reels];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setReels(updated);
  };

  const handleEdit = (section: ReelSection) => {
    setEditMode(true);
    setEditId(section._id);
    setCourseName(section.courseName);
    setSectionDescription(section.shortDescription);
    
    if (section.reels && section.reels.length > 0) {
      setReels(section.reels.map((r, index) => ({
        _id: r._id,
        title: r.title,
        video: null,
        videoUrl: r.videoUrl,
        order: index,
      })));
    } else {
      setReels([{ title: "", video: null }]);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Unauthorized. Please login again.");
      return;
    }
    if (!courseName || !sectionDescription) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append("courseName", courseName);
      data.append("shortDescription", sectionDescription);
      
      deletedReelIds.forEach((id) => data.append("deletedReels", id));
      
      reels.forEach((reel) => {
        if (reel.video) {
          data.append("titles", reel.title);
          data.append("videos", reel.video);
        }
      });
      
      const reelOrder = reels
        .filter((r) => r._id)
        .map((r, index) => ({ reelId: r._id, order: index }));
      data.append("reelOrder", JSON.stringify(reelOrder));

      if (editMode && editId) {
        await axios.put(`${baseURL}/api/adminSideReels/section/${editId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage("Reel section updated successfully!");
      } else {
        await axios.post(`${baseURL}/api/adminSideReels/upload-multiple-reels`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage("Reel section created successfully!");
      }
      
      resetForm();
      fetchSections();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Operation failed. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCourseName("");
    setSectionDescription("");
    setReels([{ title: "", video: null }]);
    setDeletedReelIds([]);
    setShowModal(false);
    setEditMode(false);
    setEditId(null);
  };

  const toggleStatus = async (id: string) => {
    if (!token) return;
    try {
      await axios.patch(`${baseURL}/api/adminSideReels/toggle-section/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("Status updated successfully!");
      fetchSections();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Failed to update status");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await axios.delete(`${baseURL}/api/adminSideReels/section/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage("Reel section deleted successfully!");
      setShowDeleteConfirm(null);
      fetchSections();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete reel section");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredSections.length / sectionsPerPage);
  const paginatedSections = filteredSections.slice(
    (currentPage - 1) * sectionsPerPage,
    currentPage * sectionsPerPage
  );

  const totalReels = sections.reduce((acc, section) => acc + section.reelCount, 0);
  const activeSections = sections.filter(s => s.isActive).length;

  return (
    <>
      <div className="reel-admin-dashboard">

        {/* ── Compact top bar ── */}
        <div className="ra-topbar">
          <div className="ra-topbar-left">
            <div className="ra-topbar-icon"><FaVideo size={14} /></div>
            <span className="ra-topbar-title">Reel Management</span>
            <div className="ra-pill"><FaList size={10} /><b>{sections.length}</b><span>Sections</span></div>
            <div className="ra-pill succ"><MdVideoLibrary size={10} /><b>{totalReels}</b><span>Reels</span></div>
            <div className="ra-pill info"><FaEye size={10} /><b>{activeSections}</b><span>Active</span></div>
            {sections.length - activeSections > 0 && (
              <div className="ra-pill muted"><FaEyeSlash size={10} /><b>{sections.length - activeSections}</b><span>Inactive</span></div>
            )}
          </div>

          {/* Search + status filter + view toggle inline */}
          <div className="ra-search-wrap">
            <FaSearch size={11} className="ra-search-icon" />
            <input
              className="ra-search"
              placeholder="Search course name or description…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="ra-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={10} /></button>
            )}
          </div>

          <select className="ra-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="ra-view-toggle">
            <button className={`ra-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><FaList size={12} /> Table</button>
            <button className={`ra-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><FaGripVertical size={12} /> Grid</button>
          </div>

          <button className="ra-add-btn" onClick={() => { resetForm(); setShowModal(true); }}>
            <FaPlus size={11} /> Create Section
          </button>
        </div>

        {/* Toast messages */}
        {successMessage && (
          <div className="ra-toast ra-toast-success"><FaSave className="me-2" />{successMessage}</div>
        )}
        {error && (
          <div className="ra-toast ra-toast-error"><FaTimes className="me-2" />{error}</div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <Spinner animation="border" variant="orange" />
            <p className="mt-2 text-muted">Loading reel sections...</p>
          </div>
        )}

        {/* Sections List */}
        {!loading && viewMode === "table" && (
          <Card className="bg-dark border-secondary">
            <div className="table-responsive">
              <table className="reel-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Reels</th>
                    <th>Created</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSections.length > 0 ? (
                    paginatedSections.map((section) => (
                      <tr key={section._id}>
                        <td>
                          <div className="course-name">
                            <FaVideo className="text-orange me-2" size={14} />
                            <strong>{section.courseName}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="course-description">{section.shortDescription}</div>
                        </td>
                        <td>
                          <Badge
                            bg={section.isActive ? "success" : "secondary"}
                            className="status-badge"
                            onClick={() => toggleStatus(section._id)}
                            style={{ cursor: "pointer" }}
                          >
                            {section.isActive ? <FaEye className="me-1" size={10} /> : <FaEyeSlash className="me-1" size={10} />}
                            {section.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="info" className="reel-count">
                            <MdVideoLibrary className="me-1" />
                            {section.reelCount} Reels
                          </Badge>
                        </td>
                        <td>
                          <div className="created-date">
                            <FaCalendarAlt className="text-muted me-1" size={10} />
                            <small>{new Date(section.createdAt).toLocaleDateString()}</small>
                          </div>
                        </td>
                        <td className="action-buttons">
                          <Button
                            variant="outline-orange"
                            size="sm"
                            onClick={() => handleEdit(section)}
                            title="Edit Section"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(section)}
                            title="Delete Section"
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        <div className="empty-state-content">
                          <FaVideo size={48} className="text-muted mb-3" />
                          <h5>No Reel Sections Found</h5>
                          <p className="text-muted">Get started by creating your first reel section</p>
                          <Button variant="orange" onClick={() => { resetForm(); setShowModal(true); }}>
                            <FaPlus className="me-2" />
                            Create Section
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <ReelPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </Card>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && (
          <Row className="g-3">
            {paginatedSections.length > 0 ? (
              paginatedSections.map((section) => (
                <Col key={section._id} md={6} lg={4}>
                  <Card className="section-grid-card bg-dark-lighter border-secondary">
                    <Card.Body>
                      <div className="section-grid-header">
                        <h5 className="text-white mb-2">{section.courseName}</h5>
                        <Badge
                          bg={section.isActive ? "success" : "secondary"}
                          className="status-badge-sm"
                          onClick={() => toggleStatus(section._id)}
                          style={{ cursor: "pointer" }}
                        >
                          {section.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-muted small mb-3">{section.shortDescription}</p>
                      <div className="section-stats mb-3">
                        <Badge bg="info" className="me-2">
                          <MdVideoLibrary className="me-1" />
                          {section.reelCount} Reels
                        </Badge>
                        <small className="text-muted">
                          <FaCalendarAlt className="me-1" />
                          {new Date(section.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="section-grid-actions">
                        <Button variant="outline-orange" size="sm" onClick={() => handleEdit(section)}>
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteConfirm(section)}>
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="empty-state">
                  <div className="empty-state-content">
                    <FaVideo size={48} className="text-muted mb-3" />
                    <h5>No Reel Sections Found</h5>
                    <p className="text-muted">Get started by creating your first reel section</p>
                    <Button variant="orange" onClick={() => { resetForm(); setShowModal(true); }}>
                      <FaPlus className="me-2" />
                      Create Section
                    </Button>
                  </div>
                </div>
              </Col>
            )}
          </Row>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={resetForm} size="xl" centered className="reel-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              {editMode ? <FaEdit className="text-orange" /> : <FaPlus className="text-orange" />}
              <span>{editMode ? "Update Reel Section" : "Create New Reel Section"}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="section-info mb-4">
              <h6 className="text-orange mb-3">Basic Information</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label className="text-muted">Course Name</Form.Label>
                  <div className="input-with-icon">
                    <MdTitle className="input-icon" />
                    <Form.Control
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Enter course name"
                      required
                      className="bg-dark-lighter border-secondary text-white"
                    />
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label className="text-muted">Short Description</Form.Label>
                  <div className="input-with-icon">
                    <MdDescription className="input-icon" />
                    <Form.Control
                      value={sectionDescription}
                      onChange={(e) => setSectionDescription(e.target.value)}
                      placeholder="Brief description of the course"
                      required
                      className="bg-dark-lighter border-secondary text-white"
                    />
                  </div>
                </Col>
              </Row>
            </div>

            <hr className="border-secondary" />

            {/* Reels Section */}
            <div className="reels-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="text-orange mb-0">Reels</h6>
                <Button variant="outline-orange" size="sm" onClick={addReelField}>
                  <FaPlus className="me-1" size={12} /> Add Reel
                </Button>
              </div>

              <div className="reels-list">
                {reels.map((reel, index) => (
                  <div key={index} className="reel-form-card">
                    <div className="reel-form-header">
                      <Badge bg="orange" className="reel-number">Reel #{index + 1}</Badge>
                      <div className="reel-form-actions">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => moveReel(index, -1)}
                          disabled={index === 0}
                          className="text-muted"
                        >
                          <FaArrowUp />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => moveReel(index, 1)}
                          disabled={index === reels.length - 1}
                          className="text-muted"
                        >
                          <FaArrowDown />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => removeReelField(index)}
                          className="text-danger"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                    <Row className="g-3 mt-2">
                      <Col md={4}>
                        <Form.Control
                          placeholder="Reel Title"
                          value={reel.title}
                          onChange={(e) => handleReelChange(index, "title", e.target.value)}
                          className="bg-dark-lighter border-secondary text-white"
                        />
                      </Col>
                      <Col md={8}>
                        <Form.Control
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = (e.target as HTMLInputElement).files?.[0] || null;
                            handleReelChange(index, "video", file);
                          }}
                          className="bg-dark-lighter border-secondary text-white"
                        />
                        {reel.videoUrl && !reel.video && (
                          <div className="existing-video mt-2">
                            <video src={reel.videoUrl} controls className="video-preview" />
                          </div>
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions mt-4">
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" variant="orange" disabled={loading}>
                {loading ? <FaSpinner className="spinning me-1" /> : (editMode ? <FaSave className="me-1" /> : <FaUpload className="me-1" />)}
                {loading ? "Processing..." : (editMode ? "Update Section" : "Create Section")}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!showDeleteConfirm} onHide={() => setShowDeleteConfirm(null)} centered className="delete-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="text-center py-3">
            <FaTrash size={48} className="text-danger mb-3" />
            <h5>Are you sure?</h5>
            <p className="text-muted">
              You are about to delete <strong>{showDeleteConfirm?.courseName}</strong> and all its associated reels. This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm._id)}>
            Delete Section
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Global Styles */}
      <style>{`
        .reel-admin-dashboard { padding: 0; display: flex; flex-direction: column; gap: 10px; }

        /* ── Compact top bar ── */
        .ra-topbar {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          background: #141414; border: 1px solid #222; border-radius: 12px;
          padding: 8px 14px;
        }
        .ra-topbar-left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ra-topbar-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,140,0,.12); display: flex; align-items: center;
          justify-content: center; color: #ff8c00; flex-shrink: 0;
        }
        .ra-topbar-title { color: #fff; font-weight: 700; font-size: .9rem; white-space: nowrap; }
        .ra-pill {
          display: flex; align-items: center; gap: 4px;
          background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 20px;
          padding: 3px 10px; font-size: .72rem; color: #888; white-space: nowrap;
        }
        .ra-pill b { color: #ccc; }
        .ra-pill.succ  { border-color: #22c55e33; } .ra-pill.succ b  { color: #22c55e; }
        .ra-pill.info  { border-color: #38bdf833; } .ra-pill.info b  { color: #38bdf8; }
        .ra-pill.muted { border-color: #44444466; } .ra-pill.muted b { color: #888; }

        .ra-search-wrap {
          flex: 1; min-width: 180px; position: relative;
          display: flex; align-items: center;
        }
        .ra-search-icon { position: absolute; left: 10px; color: #555; pointer-events: none; }
        .ra-search {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
          color: #ccc; font-size: .8rem; padding: 6px 28px 6px 28px; outline: none;
          transition: border-color .15s;
        }
        .ra-search:focus { border-color: #ff8c00; }
        .ra-search-clear {
          position: absolute; right: 8px;
          background: none; border: none; color: #555; cursor: pointer; padding: 0;
        }
        .ra-search-clear:hover { color: #ff8c00; }

        .ra-select {
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
          color: #ccc; font-size: .8rem; padding: 6px 10px; outline: none;
          cursor: pointer; transition: border-color .15s; flex-shrink: 0;
        }
        .ra-select:focus { border-color: #ff8c00; }

        .ra-view-toggle { display: flex; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
        .ra-view-btn {
          background: #1a1a1a; border: none; color: #666; font-size: .75rem;
          padding: 5px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px;
          transition: all .15s;
        }
        .ra-view-btn:hover { background: #222; color: #ccc; }
        .ra-view-btn.active { background: #ff8c00; color: #fff; }

        .ra-add-btn {
          background: #ff8c00; border: none; color: #fff; border-radius: 8px;
          padding: 6px 14px; font-size: .8rem; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          transition: background .15s; flex-shrink: 0;
        }
        .ra-add-btn:hover { background: #e67e00; }

        /* Toast */
        .ra-toast {
          padding: 8px 16px; border-radius: 8px; font-size: .82rem;
          display: flex; align-items: center;
        }
        .ra-toast-success { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); color: #22c55e; }
        .ra-toast-error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.25);  color: #ef4444; }

        .bg-orange { background-color: #ff8c00; }
        .bg-dark-lighter { background-color: #2a2a2a; }
        .text-orange { color: #ff8c00; }
        .border-orange { border-color: #ff8c00; }
        .btn-orange { background-color: #ff8c00; border-color: #ff8c00; color: white; }
        .btn-orange:hover { background-color: #e67e00; border-color: #e67e00; }
        .btn-outline-orange { border-color: #ff8c00; color: #ff8c00; }
        .btn-outline-orange:hover { background-color: #ff8c00; color: white; }

        .reel-table {
          width: 100%;
          border-collapse: collapse;
        }
        .reel-table thead th {
          padding: 1rem;
          text-align: left;
          color: #6c757d;
          font-weight: 500;
          border-bottom: 1px solid #3a3a3a;
        }
        .reel-table tbody tr {
          border-bottom: 1px solid #2a2a2a;
          transition: background 0.2s;
        }
        .reel-table tbody tr:hover { background: rgba(255, 140, 0, 0.05); }
        .reel-table td { padding: 1rem; }
        
        .course-name { color: white; font-weight: 500; }
        .course-description { color: #adb5bd; font-size: 0.875rem; max-width: 250px; }
        
        .status-badge, .reel-count { cursor: pointer; padding: 0.5rem 1rem; font-weight: 500; }
        .status-badge:hover { opacity: 0.8; }
        
        .created-date { color: #6c757d; font-size: 0.75rem; }
        
        .action-buttons { display: flex; gap: 0.5rem; justify-content: center; }
        .action-buttons button { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        
        .section-grid-card { transition: transform 0.2s, box-shadow 0.2s; }
        .section-grid-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(255, 140, 0, 0.15); }
        
        .section-grid-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .section-grid-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        
        .empty-state { text-align: center; padding: 3rem !important; }
        .empty-state-content { display: flex; flex-direction: column; align-items: center; }
        
        .input-with-icon { position: relative; }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        .input-with-icon input,
        .input-with-icon textarea { padding-left: 2.5rem; }
        
        .reel-form-card {
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        .reel-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .reel-form-actions { display: flex; gap: 0.25rem; }
        .reel-form-actions button { padding: 0.25rem 0.5rem; }
        
        .video-preview { max-width: 200px; max-height: 120px; border-radius: 8px; margin-top: 0.5rem; }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #3a3a3a;
        }
        
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-container { text-align: center; padding: 3rem; }
        
        .reel-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #1e1e1e;
          border-radius: 12px;
          border-top: 1px solid #3a3a3a;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .pagination-btn {
          min-width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          color: #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .pagination-btn.active {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination-dots { color: #6c757d; padding: 0 0.5rem; }
        
        .custom-alert { border-radius: 12px; border: none; }
        
        .modal-content { background-color: #1a1a1a; }
        .modal-header { border-bottom-color: #2a2a2a; }
        .modal-footer { border-top-color: #2a2a2a; }
        
        .form-control:focus, .form-select:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
        }
        
        .filter-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
      `}</style>
    </>
  );
};

export default AdminReels;
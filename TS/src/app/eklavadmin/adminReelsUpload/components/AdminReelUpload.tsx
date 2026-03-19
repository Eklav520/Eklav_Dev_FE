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
  }[];
};

type ReelInput = {
  _id?: string;
  title: string;
  video: File | null;
  videoUrl?: string;
  order?: number; // ✅ ADD
};

const AdminReels: React.FC = () => {
  const { user } = useAuthContext();
  const token = user?.token;

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [sections, setSections] = useState<ReelSection[]>([]);
  const [courseName, setCourseName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [reels, setReels] = useState<ReelInput[]>([
    { title: "", video: null },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletedReelIds, setDeletedReelIds] = useState<string[]>([]);

  // ✅ NEW STATES
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  /* ---------------- Fetch Sections ---------------- */
  const fetchSections = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${baseURL}/api/adminSideReels/sections`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSections(res.data.sections || []);
    } catch (err) {
      console.error("Fetch sections error:", err);
    }
  };

  useEffect(() => {
    if (token) fetchSections();
  }, [token]);

  /* ---------------- Add Reel Field ---------------- */
  const addReelField = () => {
    setReels([...reels, { title: "", video: null }]);
  };

  const removeReelField = (index: number) => {
    const reel = reels[index];

    // ✅ If existing reel → mark for deletion
    if (reel._id) {
      setDeletedReelIds((prev) => [...prev, reel._id!]);
    }

    setReels(reels.filter((_, i) => i !== index));
  };

  const handleReelChange = (
    index: number,
    field: "title" | "video",
    value: any
  ) => {
    const updated = [...reels];
    updated[index][field] = value;
    setReels(updated);
  };

  /* ---------------- EDIT FUNCTION ---------------- */
  const handleEdit = (section: ReelSection) => {
    setEditMode(true);
    setEditId(section._id);

    setCourseName(section.courseName);
    setSectionDescription(section.shortDescription);

    // ✅ Load existing reels
    if (section.reels && section.reels.length > 0) {
      setReels(
        section.reels.map((r, index) => ({
          _id: r._id,
          title: r.title,
          video: null,
          videoUrl: r.videoUrl,
          order: index, // ✅ important
        }))
      );
    } else {
      setReels([{ title: "", video: null }]);
    }

    setShowModal(true);
  };

  /* ---------------- SUBMIT (CREATE + UPDATE) ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("Unauthorized. Please login again.");
      return;
    }

    if (!courseName || !sectionDescription) {
      alert("Fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("courseName", courseName);
      data.append("shortDescription", sectionDescription);
      deletedReelIds.forEach((id) => {
        data.append("deletedReels", id);
      });

      reels.forEach((reel) => {
        if (reel.video) {
          data.append("titles", reel.title);
          data.append("videos", reel.video);
        }
      });

      // ✅ NEW: send reel order
      const reelOrder = reels
        .filter((r) => r._id)
        .map((r, index) => ({
          reelId: r._id,
          order: index,
        }));

      data.append("reelOrder", JSON.stringify(reelOrder));

      if (editMode && editId) {
        // ✅ UPDATE API
        await axios.put(
          `${baseURL}/api/adminSideReels/section/${editId}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // ✅ CREATE API
        await axios.post(
          `${baseURL}/api/adminSideReels/upload-multiple-reels`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Reset
      resetForm();
      fetchSections();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    setCourseName("");
    setSectionDescription("");
    setReels([{ title: "", video: null }]);
    setDeletedReelIds([]); // ✅ ADD THIS
    setShowModal(false);
    setEditMode(false);
    setEditId(null);
  };

  /* ---------------- Toggle Active ---------------- */
  const toggleStatus = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Change section status?")) return;

    try {
      await axios.patch(
        `${baseURL}/api/adminSideReels/toggle-section/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSections();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  /* ---------------- Delete Section ---------------- */
  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this reel section?")) return;

    try {
      await axios.delete(
        `${baseURL}/api/adminSideReels/section/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchSections();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // 🔽 ADD THIS FUNCTION ABOVE return()
  const moveReel = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= reels.length) return;

    const updated = [...reels];
    [updated[index], updated[newIndex]] = [
      updated[newIndex],
      updated[index],
    ];

    setReels(updated);
  };

  return (
    <Card className="p-4 shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🎬 Reel Management</h4>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          ➕ Create Reel Section
        </Button>
      </div>

      {/* TABLE VIEW */}
      <Table bordered hover responsive>
        <thead className="table-light">
          <tr>
            <th>Course</th>
            <th>Description</th>
            <th>Status</th>
            <th>Reels</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <tr key={section._id}>
              <td>{section.courseName}</td>
              <td>{section.shortDescription}</td>
              <td>
                <Badge
                  bg={section.isActive ? "success" : "secondary"}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleStatus(section._id)}
                >
                  {section.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td>
                <Badge bg="info">{section.reelCount} Reels</Badge>
              </td>
              <td>
                {new Date(section.createdAt).toLocaleDateString()}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleEdit(section)}
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDelete(section._id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* MODAL */}
      <Modal show={showModal} onHide={resetForm} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? "Update Reel Section" : "Create Reel Section"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Label>Course Name</Form.Label>
                <Form.Control
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />
              </Col>

              <Col md={6}>
                <Form.Label>Short Description</Form.Label>
                <Form.Control
                  value={sectionDescription}
                  onChange={(e) =>
                    setSectionDescription(e.target.value)
                  }
                  required
                />
              </Col>
            </Row>

            <hr />

            {reels.map((reel, index) => (
              <Row key={index} className="mb-3">
                <Col md={4}>
                  <Form.Control
                    placeholder="Reel Title"
                    value={reel.title}
                    onChange={(e) =>
                      handleReelChange(index, "title", e.target.value)
                    }
                  />
                </Col>
                <Col md={6}>
                  <Form.Control
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file =
                        (e.target as HTMLInputElement).files?.[0] || null;
                      handleReelChange(index, "video", file);
                    }}
                  />

                  {/* ✅ SHOW EXISTING VIDEO */}
                  {reel.videoUrl && !reel.video && (
                    <video
                      src={reel.videoUrl}
                      controls
                      style={{ width: "100%", marginTop: "8px", borderRadius: "8px" }}
                    />
                  )}
                </Col>

                <Col md={2} className="d-flex flex-column gap-1">
                  {/* ✅ NEW: Move Up */}
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => moveReel(index, -1)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>

                  {/* ✅ NEW: Move Down */}
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => moveReel(index, 1)}
                    disabled={index === reels.length - 1}
                  >
                    ↓
                  </Button>

                  {/* EXISTING */}
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => removeReelField(index)}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}

            <Button
              variant="outline-primary"
              onClick={addReelField}
              className="mb-3"
            >
              + Add Reel
            </Button>

            <div className="text-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Spinner size="sm" />
                ) : editMode ? (
                  "Update"
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default AdminReels;
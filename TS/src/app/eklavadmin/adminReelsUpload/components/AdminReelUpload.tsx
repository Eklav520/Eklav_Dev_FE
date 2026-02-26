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
};

type ReelInput = {
  title: string;
  video: File | null;
};

const AdminReels: React.FC = () => {
  const { user } = useAuthContext();
  const token = user?.token;

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [sections, setSections] = useState<ReelSection[]>([]);
  const [courseName, setCourseName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [reels, setReels] = useState<ReelInput[]>(([
    { title: "", video: null },
  ]));

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- Fetch Sections ---------------- */
  const fetchSections = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        `${baseURL}/api/adminSideReels/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  /* ---------------- Upload Section ---------------- */
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

    for (const reel of reels) {
      if (!reel.title || !reel.video) {
        alert("Each reel must have title and video.");
        return;
      }
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("courseName", courseName);
      data.append("shortDescription", sectionDescription);

      reels.forEach((reel) => {
        data.append("titles", reel.title);
        if (reel.video) data.append("videos", reel.video);
      });

      await axios.post(
        `${baseURL}/api/adminSideReels/upload-multiple-reels`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Reset
      setCourseName("");
      setSectionDescription("");
      setReels([{ title: "", video: null }]);
      setShowModal(false);

      fetchSections();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload reels.");
    } finally {
      setLoading(false);
    }
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchSections();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <Card className="p-4 shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>🎬 Reel Management</h4>
        <Button variant="primary" onClick={() => setShowModal(true)}>
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
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleDelete(section._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* FULLSCREEN MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Create Reel Section</Modal.Title>
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
                    required
                  />
                </Col>

                <Col md={6}>
                  <Form.Control
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file =
                        (e.target as HTMLInputElement).files?.[0] ||
                        null;
                      handleReelChange(index, "video", file);
                    }}
                    required
                  />
                </Col>

                <Col md={2}>
                  <Button
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
                {loading ? <Spinner size="sm" /> : "Upload"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default AdminReels;
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Alert,
  Badge,
  ListGroup,
  Modal,
} from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";

type MatchType = "trimmed" | "exact" | "regex";

type TestCase = {
  input: string;
  expectedOutput: string;
  points: number;
  matchType: MatchType;
};

type TestSpec = {
  type: string;
  entry: string;
  command: string;
  timeoutSeconds: number;
  positiveTests: TestCase[];
  negativeTests: TestCase[];
};

type Challenge = {
  _id?: string;
  eventId: string; // This is the examId
  title: string;
  slug: string;
  description: string;
  timeLimitSeconds: number;
  maxScore: number;
  testSpec: TestSpec;
  visibility?: string;
  instituteId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Message = {
  type: "error" | "success";
  text: string;
};

export default function AdminCreateProblem() {
  const [examId, setExamId] = useState<string>("");
  const [exams, setExams] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuthContext();

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [positiveTests, setPositiveTests] = useState<TestCase[]>([
    { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
  ]);
  const [negativeTests, setNegativeTests] = useState<TestCase[]>([]);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/assessment/admin/exams`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setExams(res.data.exams || []);
      } catch (err) {
        console.error("Failed to fetch exams", err);
        setExams([]);
      }
    };
    fetchExams();
  }, []);

  // Fetch challenges when exam is selected
  useEffect(() => {
    if (examId) {
      fetchChallenges();
    }
  }, [examId]);

  const fetchChallenges = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/events/${examId}/codechallenges`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setChallenges(res.data.challenges || []);
    } catch (err) {
      console.error("Failed to fetch challenges", err);
      setChallenges([]);
    }
  };

  // Auto-generate slug
  useEffect(() => {
    const s = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
  }, [title]);

  // Test case helpers
  const addPositive = () => {
    setPositiveTests((p) => [
      ...p,
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
  };

  const removePositive = (i: number) => {
    setPositiveTests((p) => p.filter((_, idx) => idx !== i));
  };

  const updatePositive = (i: number, key: keyof TestCase, value: string | number) => {
    setPositiveTests((p) =>
      p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );
  };

  const addNegative = () => {
    setNegativeTests((p) => [
      ...p,
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
  };

  const removeNegative = (i: number) => {
    setNegativeTests((p) => p.filter((_, idx) => idx !== i));
  };

  const updateNegative = (i: number, key: keyof TestCase, value: string | number) => {
    setNegativeTests((p) =>
      p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );
  };

  const buildTestSpec = (): TestSpec => {
    return {
      type: "node",
      entry: "index.js",
      command: "node index.js",
      timeoutSeconds: 5,
      positiveTests,
      negativeTests,
    };
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (positiveTests.length === 0) return "Add at least one positive test";
    for (const t of [...positiveTests, ...negativeTests]) {
      if (typeof t.points !== "number" || isNaN(t.points) || t.points <= 0)
        return "All tests must have positive numeric points";
    }
    return null;
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setTimeLimitMinutes(60);
    setMaxScore(100);
    setPositiveTests([{ input: "", expectedOutput: "", points: 1, matchType: "trimmed" }]);
    setNegativeTests([]);
    setEditingChallenge(null);
    setShowJsonPreview(false);
  };

  const handleOpenModal = (challenge?: Challenge) => {
    if (challenge) {
      // Edit mode
      setEditingChallenge(challenge);
      setTitle(challenge.title);
      setSlug(challenge.slug);
      setDescription(challenge.description);
      setTimeLimitMinutes(Math.floor(challenge.timeLimitSeconds / 60));
      setMaxScore(challenge.maxScore);
      setPositiveTests(challenge.testSpec.positiveTests || []);
      setNegativeTests(challenge.testSpec.negativeTests || []);
    } else {
      // Create new mode
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveChallenge = async () => {
    if (!examId) {
      setMessage({ type: "error", text: "Please select an exam first" });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug || undefined,
      description: description.trim(),
      timeLimitSeconds: Math.max(10, Math.floor(Number(timeLimitMinutes) * 60)),
      maxScore: Math.max(1, Number(maxScore) || 100),
      testSpec: buildTestSpec(),
    };

    setLoading(true);
    setMessage(null);

    try {
      if (editingChallenge?._id) {
        // Update existing challenge
        await axios.put(`${baseURL}/api/codechallenges/${editingChallenge._id}`, payload, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setMessage({ type: "success", text: "Challenge updated successfully!" });
      } else {
        // Create new challenge - this automatically links to the selected exam via eventId
        await axios.post(`${baseURL}/api/events/${examId}/codechallenges`, payload, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setMessage({ type: "success", text: "Challenge created successfully for this exam!" });
      }

      // Refresh the list
      await fetchChallenges();
      handleCloseModal();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.response?.data?.error || err.message || "Failed to save challenge",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete) return;

    try {
      await axios.delete(`${baseURL}/api/codechallenges/${challengeToDelete}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setMessage({ type: "success", text: "Challenge deleted successfully!" });
      await fetchChallenges();
      setShowDeleteModal(false);
      setChallengeToDelete(null);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.response?.data?.error || "Failed to delete challenge",
      });
    }
  };

  const copyJsonToClipboard = async () => {
    const txt = JSON.stringify(buildTestSpec(), null, 2);
    await navigator.clipboard.writeText(txt);
    setMessage({ type: "success", text: "Test spec copied to clipboard" });
  };

  // Get exam title by ID
  const getExamTitle = (examId: string) => {
    const exam = exams.find(e => e._id === examId);
    return exam?.title || "Unknown Exam";
  };

  return (
    <Container className="my-4" style={{ maxWidth: "1200px" }}>
      <h2 className="mb-4" style={{ color: "#ff6b35" }}>
        Manage Coding Challenges
      </h2>

      {message && (
        <Alert
          variant={message.type === "error" ? "danger" : "success"}
          dismissible
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={8}>
          <Form.Group>
            <Form.Label>Select Exam</Form.Label>
            <Form.Control
              as="select"
              value={examId}
              onChange={(e) => {
                setExamId(e.target.value);
                setChallenges([]);
              }}
              style={{ background: "#222", color: "#fff", borderColor: "#444" }}
            >
              <option value="">-- Select an exam --</option>
              {exams.map((exam: any) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-end">
          <Button
            onClick={() => handleOpenModal()}
            disabled={!examId}
            style={{
              background: "#ff6b35",
              border: "none",
              width: "100%",
            }}
          >
            + Add New Challenge
          </Button>
        </Col>
      </Row>

      {/* Challenges List */}
      {examId && (
        <Card style={{ background: "#111", borderColor: "#333" }}>
          <Card.Header
            style={{
              background: "#0a0a0a",
              color: "#ff6b35",
              borderBottom: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>Coding Challenges for: {getExamTitle(examId)}</strong>
              <Badge style={{ background: "#ff6b35", marginLeft: "12px" }}>
                Total: {challenges.length}
              </Badge>
            </div>
            <Badge style={{ background: "#28a745" }}>
              Exam ID: {examId}
            </Badge>
          </Card.Header>
          <Card.Body>
            {challenges.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                <p>No challenges added yet for this exam.</p>
                <p>Click "Add New Challenge" to create your first coding problem.</p>
                <p style={{ fontSize: "12px", marginTop: "16px" }}>
                  Challenges will be linked to exam ID: <strong>{examId}</strong>
                </p>
              </div>
            ) : (
              <ListGroup variant="flush">
                {challenges.map((challenge, idx) => (
                  <ListGroup.Item
                    key={idx}
                    style={{
                      background: "#111",
                      color: "#fff",
                      borderBottom: "1px solid #333",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <strong style={{ color: "#ff6b35", fontSize: "16px" }}>
                          {challenge.title}
                        </strong>
                        <Badge style={{ background: "#28a745" }}>
                          {challenge.maxScore} pts
                        </Badge>
                        <Badge style={{ background: "#17a2b8" }}>
                          {Math.floor(challenge.timeLimitSeconds / 60)} min
                        </Badge>
                        {challenge.visibility && (
                          <Badge style={{ background: "#6c757d" }}>
                            {challenge.visibility}
                          </Badge>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        <span>📝 Tests: {challenge.testSpec?.positiveTests?.length || 0} positive</span>
                        <span style={{ marginLeft: "16px" }}>⚠️ Negative: {challenge.testSpec?.negativeTests?.length || 0}</span>
                        <span style={{ marginLeft: "16px" }}>🔗 Exam ID: {challenge.eventId}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        Slug: {challenge.slug}
                      </div>
                      {challenge.createdAt && (
                        <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>
                          Created: {new Date(challenge.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleOpenModal(challenge)}
                        style={{
                          marginRight: "8px",
                          background: "#ff6b35",
                          border: "none",
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setChallengeToDelete(challenge._id!);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Create/Edit Challenge Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header
          closeButton
          style={{
            background: "#111",
            color: "#fff",
            borderBottom: "1px solid #333",
          }}
        >
          <Modal.Title style={{ color: "#ff6b35" }}>
            {editingChallenge ? "Edit Challenge" : "Create New Challenge"}
          </Modal.Title>
          {examId && !editingChallenge && (
            <Badge style={{ background: "#ff6b35", marginLeft: "12px" }}>
              Exam: {getExamTitle(examId)}
            </Badge>
          )}
        </Modal.Header>
        <Modal.Body
          style={{
            background: "#0a0a0a",
            color: "#fff",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <Form>
            {examId && !editingChallenge && (
              <Alert variant="info" style={{ background: "#1a2a3a", color: "#fff", borderColor: "#ff6b35" }}>
                <strong>📌 This challenge will be linked to exam:</strong> {getExamTitle(examId)} (ID: {examId})
              </Alert>
            )}

            <Row className="mb-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label style={{ color: "#fff" }}>Title *</Form.Label>
                  <Form.Control
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Two Sum Problem"
                    style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={{ color: "#fff" }}>Slug</Form.Label>
                  <Form.Control
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated"
                    style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#fff" }}>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem, input/output format, constraints, examples..."
                style={{ background: "#222", color: "#fff", borderColor: "#444" }}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: "#fff" }}>Time limit (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={{ color: "#fff" }}>Max Score</Form.Label>
                  <Form.Control
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Positive Tests */}
            <Card className="mb-3" style={{ background: "#111", borderColor: "#333" }}>
              <Card.Header
                className="d-flex justify-content-between"
                style={{ background: "#0a0a0a", color: "#ff6b35" }}
              >
                <strong>✅ Positive Tests (Should Pass)</strong>
                <Button size="sm" onClick={addPositive} style={{ background: "#ff6b35", border: "none" }}>
                  + Add Test
                </Button>
              </Card.Header>
              <Card.Body>
                {positiveTests.map((t, i) => (
                  <div key={i} className="mb-3 p-3" style={{ background: "#0a0a0a", borderRadius: "8px" }}>
                    <div className="d-flex justify-content-between mb-2">
                      <strong style={{ color: "#ff6b35" }}>Test #{i + 1}</strong>
                      <Button size="sm" variant="danger" onClick={() => removePositive(i)}>
                        Remove
                      </Button>
                    </div>
                    <Form.Group className="mb-2">
                      <Form.Label style={{ color: "#888" }}>Input</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={t.input}
                        onChange={(e) => updatePositive(i, "input", e.target.value)}
                        style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label style={{ color: "#888" }}>Expected Output</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={t.expectedOutput}
                        onChange={(e) => updatePositive(i, "expectedOutput", e.target.value)}
                        style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                      />
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ color: "#888" }}>Points</Form.Label>
                          <Form.Control
                            type="number"
                            value={t.points}
                            onChange={(e) => updatePositive(i, "points", Number(e.target.value))}
                            style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ color: "#888" }}>Match Type</Form.Label>
                          <Form.Select
                            value={t.matchType}
                            onChange={(e) =>
                              updatePositive(i, "matchType", e.target.value as MatchType)
                            }
                            style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                          >
                            <option value="trimmed">Trimmed</option>
                            <option value="exact">Exact</option>
                            <option value="regex">Regex</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>

            {/* Negative Tests */}
            <Card className="mb-3" style={{ background: "#111", borderColor: "#333" }}>
              <Card.Header
                className="d-flex justify-content-between"
                style={{ background: "#0a0a0a", color: "#ff6b35" }}
              >
                <strong>❌ Negative Tests (Should Fail/Edge Cases)</strong>
                <Button size="sm" onClick={addNegative} style={{ background: "#ff6b35", border: "none" }}>
                  + Add Test
                </Button>
              </Card.Header>
              <Card.Body>
                {negativeTests.map((t, i) => (
                  <div key={i} className="mb-3 p-3" style={{ background: "#0a0a0a", borderRadius: "8px" }}>
                    <div className="d-flex justify-content-between mb-2">
                      <strong style={{ color: "#ff6b35" }}>Test #{i + 1}</strong>
                      <Button size="sm" variant="danger" onClick={() => removeNegative(i)}>
                        Remove
                      </Button>
                    </div>
                    <Form.Group className="mb-2">
                      <Form.Label style={{ color: "#888" }}>Input</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={t.input}
                        onChange={(e) => updateNegative(i, "input", e.target.value)}
                        style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label style={{ color: "#888" }}>Expected Output</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={t.expectedOutput}
                        onChange={(e) => updateNegative(i, "expectedOutput", e.target.value)}
                        style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                      />
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ color: "#888" }}>Points</Form.Label>
                          <Form.Control
                            type="number"
                            value={t.points}
                            onChange={(e) => updateNegative(i, "points", Number(e.target.value))}
                            style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={{ color: "#888" }}>Match Type</Form.Label>
                          <Form.Select
                            value={t.matchType}
                            onChange={(e) =>
                              updateNegative(i, "matchType", e.target.value as MatchType)
                            }
                            style={{ background: "#222", color: "#fff", borderColor: "#444" }}
                          >
                            <option value="trimmed">Trimmed</option>
                            <option value="exact">Exact</option>
                            <option value="regex">Regex</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                ))}
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <Button
                variant="secondary"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                style={{ background: "#333", border: "none" }}
              >
                {showJsonPreview ? "Hide" : "Preview"} JSON
              </Button>
              <Button
                variant="outline-secondary"
                onClick={copyJsonToClipboard}
                style={{ color: "#fff", borderColor: "#444" }}
              >
                Copy Test Spec
              </Button>
            </div>

            {showJsonPreview && (
              <pre
                style={{
                  background: "#111",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  marginTop: "12px",
                  overflow: "auto",
                  maxHeight: "200px",
                  color: "#e2e8f0",
                }}
              >
                {JSON.stringify(buildTestSpec(), null, 2)}
              </pre>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ background: "#111", borderTop: "1px solid #333" }}>
          <Button variant="secondary" onClick={handleCloseModal} style={{ background: "#333", border: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChallenge}
            disabled={loading}
            style={{ background: "#ff6b35", border: "none" }}
          >
            {loading ? "Saving..." : editingChallenge ? "Update" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={{ background: "#111", color: "#fff", borderBottom: "1px solid #333" }}>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#0a0a0a", color: "#fff" }}>
          Are you sure you want to delete this challenge? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer style={{ background: "#111", borderTop: "1px solid #333" }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ background: "#333", border: "none" }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteChallenge} style={{ background: "#dc3545", border: "none" }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
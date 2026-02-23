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
  Spinner,
  Modal,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom"; // adapt if you're using Next.js routing

// Types
type MatchType = "trimmed" | "exact" | "regex";

type TestCase = {
  _id?: string;
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
  _id: string;
  eventId?: string;
  title: string;
  slug: string;
  description: string;
  timeLimitSeconds: number;
  maxScore: number;
  testSpec: TestSpec;
  createdAt?: string;
  updatedAt?: string;
};

export default function AdminChallengeDetail() {
  const { id } = useParams<{ id: string }>();// expects react-router
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Fetch challenge
  useEffect(() => {
    if (!id) return;
    const fetchChallenge = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${baseURL}/api/codechallenges/${id}`);
        setChallenge(res.data);
      } catch (err: any) {
        setMessage({ type: "error", text: err?.response?.data?.error || "Failed to load challenge" });
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [id, baseURL]);

  // Helpers to update top-level fields
  function updateField<K extends keyof Challenge>(key: K, value: Challenge[K]) {
    setChallenge((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  // Test helpers
  function addTest(which: "positiveTests" | "negativeTests") {
    const newTest: TestCase = { input: "", expectedOutput: "", points: 1, matchType: "trimmed" };
    setChallenge((prev) =>
      prev ? { ...prev, testSpec: { ...prev.testSpec, [which]: [...prev.testSpec[which], newTest] } } : prev
    );
  }
  function removeTest(which: "positiveTests" | "negativeTests", index: number) {
    setChallenge((prev) =>
      prev
        ? { ...prev, testSpec: { ...prev.testSpec, [which]: prev.testSpec[which].filter((_, i) => i !== index) } }
        : prev
    );
  }
  function updateTest(
    which: "positiveTests" | "negativeTests",
    index: number,
    key: keyof TestCase,
    value: string | number
  ) {
    setChallenge((prev) =>
      prev
        ? {
            ...prev,
            testSpec: {
              ...prev.testSpec,
              [which]: prev.testSpec[which].map((t, i) => (i === index ? { ...t, [key]: value } : t)),
            },
          }
        : prev
    );
  }

  // Save (PUT)
  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!challenge) return;
    setMessage(null);

    // Basic validation
    if (!challenge.title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }
    if (!challenge.testSpec || !Array.isArray(challenge.testSpec.positiveTests) || challenge.testSpec.positiveTests.length === 0) {
      setMessage({ type: "error", text: "At least one positive test is required" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...challenge,
        // optionally strip _id from nested testcases to avoid accidental updates that rely on server logic
      };
      const res = await axios.put(`${baseURL}/api/codechallenges/${challenge._id}`, payload);
      setChallenge(res.data);
      setMessage({ type: "success", text: "Challenge updated" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.error || "Failed to save challenge" });
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDeleteConfirmed() {
    if (!challenge) return;
    setDeleting(true);
    try {
      await axios.delete(`${baseURL}/api/codechallenges/${challenge._id}`);
      setMessage({ type: "success", text: "Challenge deleted" });
      setShowDeleteConfirm(false);
      // navigate back to list after a brief pause so admin sees message
      setTimeout(() => navigate("/admin/challenges"), 600);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.response?.data?.error || "Failed to delete challenge" });
    } finally {
      setDeleting(false);
    }
  }

  function copyJsonToClipboard() {
    if (!challenge) return;
    const txt = JSON.stringify(challenge.testSpec, null, 2);
    navigator.clipboard.writeText(txt);
    setMessage({ type: "success", text: "Test spec copied to clipboard" });
  }

  // Render
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!challenge) {
    return (
      <Container className="py-5">
        {message ? <Alert variant={message.type === "error" ? "danger" : "success"}>{message.text}</Alert> : null}
        <Alert variant="info">No challenge loaded.</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h2>Challenge — Edit</h2>

      {message && <Alert variant={message.type === "error" ? "danger" : "success"}>{message.text}</Alert>}

      <Form onSubmit={handleSave}>
        <Card className="mb-3">
          <Card.Body>
            <Row className="mb-2">
              <Col md={8}>
                <Form.Group className="mb-2">
                  <Form.Label>Title</Form.Label>
                  <Form.Control value={challenge.title} onChange={(e) => updateField("title", e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Slug</Form.Label>
                  <Form.Control value={challenge.slug} onChange={(e) => updateField("slug", e.target.value)} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={4} value={challenge.description} onChange={(e) => updateField("description", e.target.value)} />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Time limit (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={Math.floor(challenge.timeLimitSeconds / 60)}
                    onChange={(e) => updateField("timeLimitSeconds", Math.max(1, Number(e.target.value) || 1) * 60)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Max score</Form.Label>
                  <Form.Control type="number" value={challenge.maxScore} onChange={(e) => updateField("maxScore", Math.max(1, Number(e.target.value) || 1))} />
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end gap-2 justify-content-end">
                <Button variant="secondary" onClick={() => setShowJsonPreview((s) => !s)}>
                  {showJsonPreview ? "Hide" : "Preview"} Test Spec
                </Button>
                <Button variant="outline-secondary" onClick={copyJsonToClipboard}>
                  Copy JSON
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* TestSpec editing */}
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <strong>Test Spec</strong>
            <div>
              <small className="text-muted me-3">Runner: {challenge.testSpec.type}</small>
              <small className="text-muted">Entry: {challenge.testSpec.entry}</small>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h5>Positive Tests</h5>
                {challenge.testSpec.positiveTests.map((t, i) => (
                  <Card className="mb-2" key={t._id ?? i}>
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <strong>Test #{i + 1}</strong>
                        <Button size="sm" variant="danger" onClick={() => removeTest("positiveTests", i)}>
                          Remove
                        </Button>
                      </div>

                      <Form.Group className="mt-2">
                        <Form.Label>Input</Form.Label>
                        <Form.Control as="textarea" rows={2} value={t.input} onChange={(e) => updateTest("positiveTests", i, "input", e.target.value)} />
                      </Form.Group>

                      <Form.Group className="mt-2">
                        <Form.Label>Expected Output</Form.Label>
                        <Form.Control as="textarea" rows={1} value={t.expectedOutput} onChange={(e) => updateTest("positiveTests", i, "expectedOutput", e.target.value)} />
                      </Form.Group>

                      <Row className="mt-2">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Points</Form.Label>
                            <Form.Control type="number" value={t.points} onChange={(e) => updateTest("positiveTests", i, "points", Number(e.target.value) || 0)} />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Match</Form.Label>
                            <Form.Select value={t.matchType} onChange={(e) => updateTest("positiveTests", i, "matchType", e.target.value)}>
                              <option value="trimmed">Trimmed</option>
                              <option value="exact">Exact</option>
                              <option value="regex">Regex</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                <div className="d-grid">
                  <Button variant="outline-primary" onClick={() => addTest("positiveTests")}>
                    + Add Positive Test
                  </Button>
                </div>
              </Col>

              <Col md={6}>
                <h5>Negative Tests</h5>
                {challenge.testSpec.negativeTests.map((t, i) => (
                  <Card className="mb-2" key={t._id ?? i}>
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <strong>Test #{i + 1}</strong>
                        <Button size="sm" variant="danger" onClick={() => removeTest("negativeTests", i)}>
                          Remove
                        </Button>
                      </div>

                      <Form.Group className="mt-2">
                        <Form.Label>Input</Form.Label>
                        <Form.Control as="textarea" rows={2} value={t.input} onChange={(e) => updateTest("negativeTests", i, "input", e.target.value)} />
                      </Form.Group>

                      <Form.Group className="mt-2">
                        <Form.Label>Expected Output</Form.Label>
                        <Form.Control as="textarea" rows={1} value={t.expectedOutput} onChange={(e) => updateTest("negativeTests", i, "expectedOutput", e.target.value)} />
                      </Form.Group>

                      <Row className="mt-2">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Points</Form.Label>
                            <Form.Control type="number" value={t.points} onChange={(e) => updateTest("negativeTests", i, "points", Number(e.target.value) || 0)} />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Match</Form.Label>
                            <Form.Select value={t.matchType} onChange={(e) => updateTest("negativeTests", i, "matchType", e.target.value)}>
                              <option value="trimmed">Trimmed</option>
                              <option value="exact">Exact</option>
                              <option value="regex">Regex</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                <div className="d-grid">
                  <Button variant="outline-primary" onClick={() => addTest("negativeTests")}>
                    + Add Negative Test
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {showJsonPreview && (
          <Card className="mb-3">
            <Card.Body>
              <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(challenge.testSpec, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}

        <div className="d-flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>

          <Button variant="secondary" onClick={() => resetToLatest()}>
            Reset
          </Button>

          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete
          </Button>
        </div>
      </Form>

      {/* Delete Confirm Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to permanently delete this challenge?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );

  // helper: reset local state to latest server copy
  function resetToLatest() {
    if (!id) return;
    setMessage(null);
    setLoading(true);
    axios
      .get(`${baseURL}/api/codechallenges/${id}`)
      .then((res) => setChallenge(res.data))
      .catch((err: any) => setMessage({ type: "error", text: err?.response?.data?.error || "Failed to reload" }))
      .finally(() => setLoading(false));
  }
}

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
} from "react-bootstrap";

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

type Message = {
  type: "error" | "success";
  text: string;
};

type Props = {
  eventId?: string;
  onCreated?: (challenge: any) => void;
};

export default function AdminCreateProblem({
  eventId = "demoEventId",
  onCreated = () => {},
}: Props) {
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60);
  const [maxScore, setMaxScore] = useState<number>(100);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [positiveTests, setPositiveTests] = useState<TestCase[]>([]);
  const [negativeTests, setNegativeTests] = useState<TestCase[]>([]);


  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  // auto-generate slug
  useEffect(() => {
    const s = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
  }, [title]);

  // helpers
  function addPositive() {
    setPositiveTests((p) => [
      ...p,
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
  }
  function removePositive(i: number) {
    setPositiveTests((p) => p.filter((_, idx) => idx !== i));
  }
  function updatePositive(i: number, key: keyof TestCase, value: string | number) {
    setPositiveTests((p) =>
      p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );
  }

  function addNegative() {
    setNegativeTests((p) => [
      ...p,
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
  }
  function removeNegative(i: number) {
    setNegativeTests((p) => p.filter((_, idx) => idx !== i));
  }
  function updateNegative(i: number, key: keyof TestCase, value: string | number) {
    setNegativeTests((p) =>
      p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );
  }

  function buildTestSpec(): TestSpec {
    return {
      type: "node",
      entry: "index.js",
      command: "node index.js",
      timeoutSeconds: 5,
      positiveTests,
      negativeTests,
    };
  }

  function validateForm(): string | null {
    if (!title.trim()) return "Title is required";
    if (positiveTests.length === 0) return "Add at least one positive test";
    for (const t of [...positiveTests, ...negativeTests]) {
      if (typeof t.points !== "number" || isNaN(t.points) || t.points <= 0)
        return "All tests must have positive numeric points";
    }
    return null;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);

    const v = validateForm();
    if (v) {
      setMessage({ type: "error", text: v });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug || undefined,
      description: description.trim(),
      timeLimitSeconds: Math.max(
        10,
        Math.floor(Number(timeLimitMinutes) * 60)
      ),
      maxScore: Math.max(1, Number(maxScore) || 100),
      testSpec: buildTestSpec(),
    };

    setLoading(true);
    try {
      const url = `${baseURL}/api/events/${eventId}/codechallenges`;
      const res = await axios.post(url, payload);
      setMessage({ type: "success", text: "Challenge created successfully." });
      setLoading(false);
      onCreated && onCreated(res.data);
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      setMessage({
        type: "error",
        text:
          err?.response?.data?.error ||
          err.message ||
          "Failed to create challenge",
      });
    }
  }

  function resetForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setTimeLimitMinutes(60);
    setMaxScore(100);
    setPositiveTests([
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
    setNegativeTests([]);
    setMessage(null);
  }

  async function copyJsonToClipboard() {
    const txt = JSON.stringify(buildTestSpec(), null, 2);
    await navigator.clipboard.writeText(txt);
    setMessage({ type: "success", text: "Test spec copied to clipboard" });
  }

  return (
    <Container className="my-4">
      <h2>Create Problem / Challenge</h2>

      {message && (
        <Alert variant={message.type === "error" ? "danger" : "success"}>
          {message.text}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={8}>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short title for the problem"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Slug (auto)</Form.Label>
              <Form.Control
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem, input/output format, constraints, examples..."
          />
        </Form.Group>

        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Time limit (minutes)</Form.Label>
              <Form.Control
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Max Score</Form.Label>
              <Form.Control
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
              />
            </Form.Group>
          </Col>
          <Col md={4} className="d-flex align-items-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowJsonPreview((s) => !s)}
            >
              {showJsonPreview ? "Hide" : "Preview"} Test Spec
            </Button>
            <Button variant="outline-secondary" onClick={copyJsonToClipboard}>
              Copy JSON
            </Button>
          </Col>
        </Row>

        {/* Positive Tests */}
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between">
            <strong>Positive Tests (Correct behavior)</strong>
            <Button size="sm" onClick={addPositive}>
              + Add
            </Button>
          </Card.Header>
          <Card.Body>
            {positiveTests.map((t, i) => (
              <Card className="mb-3" key={i}>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <strong>Test #{i + 1}</strong>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removePositive(i)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Form.Group className="mt-2">
                    <Form.Label>Input</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={t.input}
                      onChange={(e) =>
                        updatePositive(i, "input", e.target.value)
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>Expected Output</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={t.expectedOutput}
                      onChange={(e) =>
                        updatePositive(i, "expectedOutput", e.target.value)
                      }
                    />
                  </Form.Group>
                  <Row className="mt-2">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Points</Form.Label>
                        <Form.Control
                          type="number"
                          value={t.points}
                          onChange={(e) =>
                            updatePositive(i, "points", Number(e.target.value))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Match</Form.Label>
                        <Form.Select
                          value={t.matchType}
                          onChange={(e) =>
                            updatePositive(
                              i,
                              "matchType",
                              e.target.value as MatchType
                            )
                          }
                        >
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
          </Card.Body>
        </Card>

        {/* Negative Tests */}
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between">
            <strong>Negative Tests (Invalid inputs / edge-cases)</strong>
            <Button size="sm" onClick={addNegative}>
              + Add
            </Button>
          </Card.Header>
          <Card.Body>
            {negativeTests.map((t, i) => (
              <Card className="mb-3" key={i}>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <strong>Test #{i + 1}</strong>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => removeNegative(i)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Form.Group className="mt-2">
                    <Form.Label>Input</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={t.input}
                      onChange={(e) =>
                        updateNegative(i, "input", e.target.value)
                      }
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>Expected Output</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={t.expectedOutput}
                      onChange={(e) =>
                        updateNegative(i, "expectedOutput", e.target.value)
                      }
                    />
                  </Form.Group>
                  <Row className="mt-2">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Points</Form.Label>
                        <Form.Control
                          type="number"
                          value={t.points}
                          onChange={(e) =>
                            updateNegative(i, "points", Number(e.target.value))
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Match</Form.Label>
                        <Form.Select
                          value={t.matchType}
                          onChange={(e) =>
                            updateNegative(
                              i,
                              "matchType",
                              e.target.value as MatchType
                            )
                          }
                        >
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
          </Card.Body>
        </Card>

        {showJsonPreview && (
          <Card className="mb-3">
            <Card.Body>
              <pre>{JSON.stringify(buildTestSpec(), null, 2)}</pre>
            </Card.Body>
          </Card>
        )}

        <div className="d-flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Create Challenge"}
          </Button>
          <Button variant="secondary" onClick={resetForm}>
            Reset
          </Button>
        </div>
      </Form>
    </Container>
  );
}

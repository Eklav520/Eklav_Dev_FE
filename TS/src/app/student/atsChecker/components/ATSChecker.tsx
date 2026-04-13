import React, { useState } from "react";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  ProgressBar,
  Spinner,
} from "react-bootstrap";

interface ATSResult {
  score: number;
  missing_keywords: string[];
  suggestions: string[];
  section_feedback: {
    skills: string;
    experience: string;
    projects: string;
  };
}

const ATSChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState<string>("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!file) {
      alert("Please upload a resume");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jd", jd);

    try {
      setLoading(true);

      const res = await fetch("/api/resume/check-ats", {
        method: "POST",
        body: formData,
      });

      const data: ATSResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error analyzing resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVariant = (score: number): string => {
    if (score > 80) return "success";
    if (score > 60) return "warning";
    return "danger";
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold">🚀 AI ATS Resume Checker</h2>

      {/* Upload Section */}
      <Card className="p-4 mb-4 shadow-sm">
        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Upload Resume</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Job Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Paste job description..."
                value={jd}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setJd(e.target.value)
                }
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="mt-3 text-end">
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size="sm" /> : "Analyze Resume"}
          </Button>
        </div>
      </Card>

      {/* Result Section */}
      {result && (
        <Row>
          {/* Score */}
          <Col md={4}>
            <Card className="p-4 shadow-sm text-center">
              <h5>ATS Score</h5>
              <h1 className={`fw-bold text-${getVariant(result.score)}`}>
                {result.score}%
              </h1>
              <ProgressBar
                now={result.score}
                label={`${result.score}%`}
                variant={getVariant(result.score)}
              />
            </Card>
          </Col>

          {/* Missing Keywords */}
          <Col md={4}>
            <Card className="p-4 shadow-sm">
              <h5>Missing Keywords</h5>
              <ul>
                {result.missing_keywords?.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </Card>
          </Col>

          {/* Suggestions */}
          <Col md={4}>
            <Card className="p-4 shadow-sm">
              <h5>Suggestions</h5>
              <ul>
                {result.suggestions?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
          </Col>

          {/* Section Feedback */}
          <Col md={12} className="mt-4">
            <Card className="p-4 shadow-sm">
              <h5>Section Feedback</h5>

              <Row>
                <Col md={4}>
                  <h6>Skills</h6>
                  <p>{result.section_feedback?.skills}</p>
                </Col>

                <Col md={4}>
                  <h6>Experience</h6>
                  <p>{result.section_feedback?.experience}</p>
                </Col>

                <Col md={4}>
                  <h6>Projects</h6>
                  <p>{result.section_feedback?.projects}</p>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ATSChecker;
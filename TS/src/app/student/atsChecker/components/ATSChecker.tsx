import { useAuthContext } from "@/context/useAuthContext";
import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  ProgressBar,
  Spinner,
  Alert,
  Badge,
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
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  positive_points?: string[];
  negative_points?: string[];
  resume_text?: string;
  relevant_jobs?: string[];
  average_package_lpa?: string;
  next_level_changes?: string[];
  expert_package_lpa?: string;
  expert_track_roles?: string[];
}

const ATSChecker: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuthContext();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result) {
      setAnimatedScore(0);
      return;
    }

    const target = result.score;
    const duration = 1200;
    const start = performance.now();
    let frameId = 0;

    setAnimatedScore(0);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setAnimatedScore(target * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [result?.score]);

  const handleSubmit = async (): Promise<void> => {
    if (!file) {
      setError("Please upload a resume");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await fetch(`${baseURL}/api/resume/check-ats`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to analyze resume");
      }

      const data: ATSResult = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error analyzing resume:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const getVariant = (score: number): string => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "danger";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 40) return "Needs Improvement";
    return "Poor";
  };

  const getScoreCategory = (score: number): string => {
    if (score >= 80) return "A+";
    if (score >= 70) return "A";
    if (score >= 60) return "B+";
    if (score >= 50) return "B";
    if (score >= 40) return "C";
    return "D";
  };

  return (
    <div className="ats-checker-container">
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="header-section mb-4">
          <h1 className="page-title">
            <span className="title-icon"></span>
            AI Resume Analyzer
          </h1>
          <p className="page-subtitle">
            Get a comprehensive ATS score analysis with detailed insights to optimize your resume
          </p>
        </div>

        {/* Top Section: Upload, Analyze & Score Card */}
        <Row className="g-4 mb-4">
          <Col lg={8}>
            <Card className="upload-card">
              <Card.Body className="p-4">
                <div className="upload-area">
                  <div className="upload-icon">📄</div>
                  <h5>Upload Your Resume</h5>
                  <p className="text-muted-modern">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                  <div className="file-input-wrapper">
                    <Form.Control
                      type="file"
                      accept=".pdf,.doc,.docx"
                      ref={fileInputRef}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                          setError("");
                        }
                      }}
                      className="file-input-modern"
                    />
                    {file && (
                      <div className="file-info mt-3">
                        <span className="file-icon">📎</span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    )}
                  </div>
                  
                  {error && (
                    <Alert variant="danger" className="error-alert mt-3">
                      <span className="alert-icon">⚠️</span>
                      {error}
                    </Alert>
                  )}

                  <Button 
                    className="analyze-btn mt-3" 
                    onClick={handleSubmit} 
                    disabled={loading || !file}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">🔍</span>
                        Analyze Resume
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className={`score-card score-${getVariant(result?.score || 0)}`}>
              <Card.Body className="p-4 text-center">
                {result ? (
                  <>
                    <div className="score-ring-wrap" style={{ ["--score" as string]: animatedScore } as React.CSSProperties}>
                      <div className="score-circle">
                        <div className="score-number">{Math.round(animatedScore)}%</div>
                        <div className="score-category">{getScoreCategory(result.score)}</div>
                      </div>
                    </div>
                    <div className="score-label-text">{getScoreLabel(result.score)}</div>
                    <div className="score-description">
                      {result.score >= 80 && "Your resume is highly optimized for ATS!"}
                      {result.score >= 60 && result.score < 80 && "Good score! Minor improvements needed."}
                      {result.score >= 40 && result.score < 60 && "Fair score. Consider the suggestions below."}
                      {result.score < 40 && "Low score. Major improvements recommended."}
                    </div>
                    <ProgressBar
                      now={animatedScore}
                      variant={getVariant(result.score)}
                      className="score-progress mt-3"
                    />
                  </>
                ) : (
                  <>
                    <div className="score-placeholder">
                      <div className="placeholder-mark">ATS</div>
                      <p>Your ATS Score will appear here</p>
                      <small>Upload and analyze your resume to get started</small>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content: ATS Analysis */}
        {result && (
          <div className="results-section">
            <Row className="g-4 align-items-start">
              <Col lg={6}>
                <Card className="analysis-card positive-card">
                  <Card.Header className="analysis-header positive">
                    <span className="header-icon">✅</span>
                    <h5 className="mb-0">Positive Resume Points</h5>
                    <span className="badge-count">{result.positive_points?.length || result.strengths?.length || 0} points</span>
                  </Card.Header>
                  <Card.Body>
                    {result.positive_points && result.positive_points.length > 0 ? (
                      <ul className="positive-list">
                        {result.positive_points.map((point, i) => (
                          <li key={i}>
                            <span className="list-icon">✓</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : result.strengths && result.strengths.length > 0 ? (
                      <ul className="positive-list">
                        {result.strengths.map((strength, i) => (
                          <li key={i}>
                            <span className="list-icon">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-modern">No positive points identified yet</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={6}>
                <Row className="g-4">
                  <Col xs={12}>
                    <Card className="analysis-card negative-card">
                      <Card.Header className="analysis-header negative">
                        <span className="header-icon">⚠️</span>
                        <h5 className="mb-0">Negative / Improvements</h5>
                        <span className="badge-count">{result.negative_points?.length || result.improvements?.length || 0} areas</span>
                      </Card.Header>
                      <Card.Body>
                        {result.negative_points && result.negative_points.length > 0 ? (
                          <ul className="negative-list">
                            {result.negative_points.map((point, i) => (
                              <li key={i}>
                                <span className="list-icon">!</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        ) : result.improvements && result.improvements.length > 0 ? (
                          <ul className="negative-list">
                            {result.improvements.map((improvement, i) => (
                              <li key={i}>
                                <span className="list-icon">!</span>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-modern">No improvement areas identified</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col xs={12}>
                    <Card className="analysis-card suggestions-card">
                      <Card.Header className="analysis-header suggestions">
                        <span className="header-icon">🛠️</span>
                        <h5 className="mb-0">What You Should Provide / Add</h5>
                      </Card.Header>
                      <Card.Body>
                        {result.missing_keywords && result.missing_keywords.length > 0 && (
                          <>
                            <p className="keywords-description mb-2">Add these missing keywords:</p>
                            <div className="keywords-list mb-3">
                              {result.missing_keywords.map((k, i) => (
                                <span key={i} className="keyword-badge">{k}</span>
                              ))}
                            </div>
                          </>
                        )}

                        {result.suggestions && result.suggestions.length > 0 ? (
                          <ul className="suggestions-list">
                            {result.suggestions.map((s, i) => (
                              <li key={i}>
                                <span className="suggestion-bullet">→</span>
                                {s}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-modern mb-0">No additional suggestions available</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row className="g-4 mt-1">
              <Col xs={12}>
                <Card className="analysis-card career-card">
                  <Card.Header className="analysis-header career">
                    <span className="header-icon">💼</span>
                    <h5 className="mb-0">Career Roadmap</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="career-mini-card">
                          <div className="career-mini-title">Relevant Jobs</div>
                          {result.relevant_jobs && result.relevant_jobs.length > 0 ? (
                            <div className="career-chip-wrap">
                              {result.relevant_jobs.map((job, i) => (
                                <span key={i} className="career-chip">{job}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-modern mb-0">No job matches available</p>
                          )}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="career-mini-card">
                          <div className="career-mini-title">Approx Average Package</div>
                          <div className="package-value">{result.average_package_lpa || "--"}</div>
                          <small className="text-muted-modern">Based on your current ATS readiness</small>
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="career-mini-card">
                          <div className="career-mini-title">For More Package: What to Learn</div>
                          {result.next_level_changes && result.next_level_changes.length > 0 ? (
                            <ul className="career-list">
                              {result.next_level_changes.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-modern mb-0">No learning roadmap available</p>
                          )}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="career-mini-card">
                          <div className="career-mini-title">Expert-Level Package</div>
                          <div className="package-value expert">{result.expert_package_lpa || "--"}</div>
                          {result.expert_track_roles && result.expert_track_roles.length > 0 && (
                            <div className="career-track">
                              Track roles: {result.expert_track_roles.join(", ")}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </div>

      <style>{`
        .ats-checker-container {
          background: #000000;
          min-height: 100vh;
          color: #ffffff;
        }

        /* Header Styles */
        .header-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #ff6b35;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .title-icon {
          font-size: 2rem;
        }

        .page-subtitle {
          color: #888888;
          font-size: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Upload Card */
        .upload-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          height: 100%;
        }

        .upload-area {
          text-align: center;
          padding: 1rem;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-area h5 {
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .file-input-wrapper {
          max-width: 400px;
          margin: 0 auto;
        }

        .file-input-modern {
          background: #1a1a1a;
          border: 1px solid #333333;
          color: #ffffff;
          border-radius: 12px;
          padding: 0.75rem;
        }

        .file-input-modern::-webkit-file-upload-button {
          background: #ff6b35;
          border: none;
          color: #ffffff;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-right: 1rem;
        }

        .file-input-modern::-webkit-file-upload-button:hover {
          background: #ff9a5c;
        }

        .file-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #0d0d0d;
          border-radius: 8px;
        }

        .file-name {
          color: #ff6b35;
          font-weight: 500;
        }

        .file-size {
          color: #888888;
          font-size: 0.75rem;
        }

        /* Score Card - CIBIL Style */
        .score-card {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border: 1px solid #333333;
          border-radius: 20px;
          height: 100%;
          text-align: center;
        }

        .score-card.score-success {
          border-top: 4px solid #28a745;
        }

        .score-card.score-warning {
          border-top: 4px solid #ffc107;
        }

        .score-card.score-danger {
          border-top: 4px solid #dc3545;
        }

        .score-circle {
          width: 180px;
          height: 180px;
          margin: 0;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px solid #ff6b35;
          box-shadow: 0 0 30px rgba(255, 107, 53, 0.2);
          position: relative;
          z-index: 1;
        }

        .score-ring-wrap {
          --score: 0;
          width: 198px;
          height: 198px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          background: conic-gradient(
            #ff6b35 calc(var(--score) * 1%),
            rgba(255, 255, 255, 0.08) calc(var(--score) * 1%)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 1.2s ease;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 28px rgba(255, 107, 53, 0.18);
        }

        .score-number {
          font-size: 3rem;
          font-weight: 800;
          color: #ff6b35;
        }

        .score-category {
          font-size: 1rem;
          color: #888888;
        }

        .score-label-text {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.5rem 0;
        }

        .score-description {
          font-size: 0.8rem;
          color: #888888;
          margin-bottom: 1rem;
        }

        .score-placeholder {
          padding: 2rem;
        }

        .placeholder-mark {
          width: 72px;
          height: 72px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          border: 2px solid rgba(255, 107, 53, 0.45);
          background: radial-gradient(circle at 35% 35%, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.05));
          color: #ffb08f;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .score-placeholder p {
          color: #888888;
          margin-bottom: 0.5rem;
        }

        .score-placeholder small {
          color: #666666;
        }

        .score-progress {
          height: 8px;
          border-radius: 4px;
        }

        /* Analysis Cards */
        .analysis-card {
          background: #0a0a0a;
          border: 1px solid #333333;
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .analysis-card:hover {
          transform: translateY(-2px);
          border-color: #ff6b35;
        }

        .analysis-header {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-bottom: 1px solid #333333;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .analysis-header.positive {
          border-left: 4px solid #28a745;
        }

        .analysis-header.negative {
          border-left: 4px solid #dc3545;
        }

        .analysis-header.keywords {
          border-left: 4px solid #ff6b35;
        }

        .analysis-header.suggestions {
          border-left: 4px solid #17a2b8;
        }

        .analysis-header.feedback {
          border-left: 4px solid #6f42c1;
        }

        .analysis-header.career {
          border-left: 4px solid #20c997;
        }

        .header-icon {
          font-size: 1.25rem;
        }

        .analysis-header h5 {
          flex: 1;
          color: #ffffff;
        }

        .badge-count {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
        }

        /* Lists */
        .positive-list, .negative-list, .suggestions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .positive-list li, .negative-list li, .suggestions-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: #e0e0e0;
          font-size: 0.9rem;
          border-bottom: 1px solid #222222;
        }

        .positive-list li:last-child, .negative-list li:last-child, .suggestions-list li:last-child {
          border-bottom: none;
        }

        .list-icon {
          font-size: 1rem;
          font-weight: bold;
        }

        .positive-list .list-icon {
          color: #28a745;
        }

        .negative-list .list-icon {
          color: #dc3545;
        }

        .suggestion-bullet {
          color: #17a2b8;
          font-weight: bold;
        }

        /* Keywords */
        .keywords-description {
          color: #888888;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .keyword-badge {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid rgba(255, 107, 53, 0.3);
        }

        .success-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(40, 167, 69, 0.1);
          border-radius: 12px;
          border: 1px solid #28a745;
        }

        .success-icon {
          font-size: 1.5rem;
        }

        .success-message p {
          margin: 0;
          color: #28a745;
        }

        /* Feedback Sections */
        .feedback-section {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .feedback-section:hover {
          border-color: #ff6b35;
        }

        .feedback-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #333333;
        }

        .feedback-icon {
          font-size: 1rem;
        }

        .feedback-header h6 {
          color: #ff6b35;
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
        }

        .feedback-text {
          color: #e0e0e0;
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 0;
        }

        .career-mini-card {
          background: #0d0d0d;
          border: 1px solid #222222;
          border-radius: 12px;
          padding: 0.9rem;
          height: 100%;
        }

        .career-mini-title {
          color: #20c997;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.6rem;
        }

        .career-chip-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .career-chip {
          background: rgba(32, 201, 151, 0.12);
          color: #20c997;
          border: 1px solid rgba(32, 201, 151, 0.32);
          border-radius: 8px;
          padding: 0.3rem 0.55rem;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .package-value {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffd166;
          margin-bottom: 0.25rem;
        }

        .package-value.expert {
          color: #20c997;
        }

        .career-list {
          margin: 0;
          padding-left: 1rem;
          color: #e0e0e0;
          font-size: 0.86rem;
        }

        .career-list li {
          margin-bottom: 0.35rem;
          line-height: 1.35;
        }

        .career-track {
          margin-top: 0.4rem;
          color: #9ad9c8;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        /* Buttons */
        .analyze-btn {
          background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
          border: none;
          color: #ffffff;
          font-weight: 600;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .analyze-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .analyze-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Error Alert */
        .error-alert {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          border-radius: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .alert-icon {
          font-size: 1.2rem;
        }

        .text-muted-modern {
          color: #888888 !important;
        }

        /* Scrollbar */
        /* Animations */
        .results-section {
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 992px) {
          .results-section .analysis-card {
            margin-bottom: 0.25rem;
          }
        }

        @media (max-width: 768px) {
          .ats-checker-container {
            padding: 0.5rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .score-circle {
            width: 140px;
            height: 140px;
          }

          .score-number {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ATSChecker;
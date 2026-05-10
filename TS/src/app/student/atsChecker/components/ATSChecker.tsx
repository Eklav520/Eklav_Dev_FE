import { useAuthContext } from "@/context/useAuthContext";
import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Form, Row, Col, ProgressBar, Spinner, Alert, Modal } from "react-bootstrap";
import { TEMPLATES, parseResume, downloadResumePdf, downloadResumeDocx } from "./resumeTemplates";
import ResumePreview from "./ResumePreview";

interface SectionStatus {
  contact: boolean; summary: boolean; education: boolean; skills: boolean;
  experience: boolean; projects: boolean; certifications: boolean; achievements: boolean;
}

interface ATSResult {
  score: number;
  missing_keywords: string[];
  suggestions: string[];
  section_feedback: { skills: string; experience: string; projects: string };
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
  company_name?: string | null;
  jd_match_score?: number | null;
  jd_matched_keywords?: string[];
  jd_missing_keywords?: string[];
}

interface ImproveResult {
  improved_summary: string;
  improved_skills: string;
  experience_improvements: string[];
  project_suggestion: string;
  keywords_added: string[];
  full_improved_resume: string;
  changes_made: string[];
}

const SECTION_DEFS = [
  { key: "contact" as keyof SectionStatus, label: "Contact Info", icon: "👤", regex: /email|phone|mobile|linkedin|github|portfolio/, missingMsg: "Add email, phone, LinkedIn URL", presentMsg: "Contact details found" },
  { key: "summary" as keyof SectionStatus, label: "Summary / Objective", icon: "📋", regex: /summary|objective|profile|about me|about myself/, missingMsg: "Add a 2-3 line professional summary at the top", presentMsg: "Profile summary present" },
  { key: "education" as keyof SectionStatus, label: "Education", icon: "🎓", regex: /education|degree|bachelor|master|university|college|b\.tech|m\.tech|b\.e|m\.e|bsc|msc|graduated/, missingMsg: "Add education with degree & graduation year", presentMsg: "Education section found" },
  { key: "skills" as keyof SectionStatus, label: "Technical Skills", icon: "⚙️", regex: /skills|technical skills|tools|technologies|proficient|expertise|stack/, missingMsg: "Add a dedicated technical skills section", presentMsg: "Skills section present" },
  { key: "experience" as keyof SectionStatus, label: "Work Experience", icon: "💼", regex: /experience|work experience|employment|internship|worked at|position|role at/, missingMsg: "Add internships, jobs or freelance experience", presentMsg: "Experience section present" },
  { key: "projects" as keyof SectionStatus, label: "Projects", icon: "🛠️", regex: /project|portfolio|case study|built|developed|created/, missingMsg: "Add 2-3 projects with tech stack and outcomes", presentMsg: "Projects section present" },
  { key: "certifications" as keyof SectionStatus, label: "Certifications", icon: "🏅", regex: /certificate|certification|certified|course completion|credential/, missingMsg: "Consider adding relevant certifications", presentMsg: "Certifications listed" },
  { key: "achievements" as keyof SectionStatus, label: "Achievements", icon: "🏆", regex: /achievement|award|honor|winner|recognition|rank|hackathon|competition/, missingMsg: "Add awards, rankings or notable achievements", presentMsg: "Achievements mentioned" },
];

const detectSections = (text: string): SectionStatus =>
  SECTION_DEFS.reduce((acc, def) => { acc[def.key] = def.regex.test(text.toLowerCase()); return acc; }, {} as SectionStatus);


const ATSChecker: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuthContext();
  const [file, setFile] = useState<File | null>(null);
  const [fileObjectUrl, setFileObjectUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [animatedScore, setAnimatedScore] = useState(0);

  // Resume viewer modal
  const [showResumeModal, setShowResumeModal] = useState(false);

  // AI improve
  const [improving, setImproving] = useState(false);
  const [improveResult, setImproveResult] = useState<ImproveResult | null>(null);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [previewMode, setPreviewMode] = useState<"preview" | "raw">("preview");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => { if (fileObjectUrl) URL.revokeObjectURL(fileObjectUrl); };
  }, [fileObjectUrl]);

  useEffect(() => {
    if (!result) { setAnimatedScore(0); return; }
    const target = result.score;
    const duration = 1200; const start = performance.now(); let fid = 0;
    setAnimatedScore(0);
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setAnimatedScore(target * ease(p));
      if (p < 1) fid = requestAnimationFrame(animate);
    };
    fid = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(fid);
  }, [result?.score]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (fileObjectUrl) URL.revokeObjectURL(fileObjectUrl);
    setFile(f);
    setFileObjectUrl(URL.createObjectURL(f));
    setError("");
    setResult(null);
    setImproveResult(null);
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please upload a resume"); return; }
    const formData = new FormData();
    formData.append("resume", file);
    if (companyName.trim()) formData.append("company_name", companyName.trim());
    if (jobDescription.trim()) formData.append("job_description", jobDescription.trim());
    try {
      setLoading(true); setError(""); setResult(null); setImproveResult(null);
      const res = await fetch(`${baseURL}/api/resume/check-ats`, {
        method: "POST", headers: { Authorization: `Bearer ${user?.token}` }, body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze resume");
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
    } finally { setLoading(false); }
  };

  const handleImprove = async () => {
    if (!result?.resume_text) return;
    try {
      setImproving(true);
      const res = await fetch(`${baseURL}/api/resume/ai-improve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          resume_text: result.resume_text,
          missing_keywords: result.missing_keywords,
          jd_missing_keywords: result.jd_missing_keywords,
          section_feedback: result.section_feedback,
          job_description: jobDescription,
          company_name: companyName,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate improvements");
      const data = await res.json();
      setImproveResult(data);
      setPreviewMode("preview");
      setShowImproveModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate improvements");
    } finally { setImproving(false); }
  };

  const handleCopy = () => {
    if (improveResult?.full_improved_resume) {
      navigator.clipboard.writeText(improveResult.full_improved_resume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fileName = `improved_resume${companyName ? `_${companyName.replace(/\s+/g, "_")}` : ""}`;

  const handleDownloadPdf = () => {
    if (!improveResult?.full_improved_resume) return;
    downloadResumePdf(parseResume(improveResult.full_improved_resume), selectedTemplate, fileName);
  };

  const handleDownloadDocx = async () => {
    if (!improveResult?.full_improved_resume) return;
    await downloadResumeDocx(parseResume(improveResult.full_improved_resume), selectedTemplate, fileName);
  };

  const variant = (s: number) => s >= 80 ? "success" : s >= 60 ? "warning" : "danger";
  const scoreLabel = (s: number) => s >= 80 ? "Excellent" : s >= 70 ? "Very Good" : s >= 60 ? "Good" : s >= 50 ? "Fair" : s >= 40 ? "Needs Work" : "Poor";
  const scoreGrade = (s: number) => s >= 80 ? "A+" : s >= 70 ? "A" : s >= 60 ? "B+" : s >= 50 ? "B" : s >= 40 ? "C" : "D";
  const isPDF = file?.type === "application/pdf";

  const sections = result?.resume_text ? detectSections(result.resume_text) : null;
  const presentCount = sections ? Object.values(sections).filter(Boolean).length : 0;

  return (
    <div className="ats-root">
      <div className="container-fluid py-4">

        {/* Header */}
        <div className="ats-header mb-4">
          <div className="ats-header-badge">AI-Powered</div>
          <h1 className="ats-title">Resume ATS Analyzer</h1>
          <p className="ats-subtitle">Upload your resume and paste a job description for a tailored ATS score with AI-powered improvements</p>
        </div>

        {/* Input + Score Row */}
        <Row className="g-4 mb-4">
          <Col lg={8}>
            <Card className="ats-card">
              <Card.Body className="p-4">
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="ats-label">Company Name <span className="tag-optional">optional</span></Form.Label>
                      <Form.Control className="ats-input" type="text" placeholder="e.g. Google, Infosys, Amazon" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="ats-label">Upload Resume <span className="tag-required">*</span></Form.Label>
                      <Form.Control ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="ats-file-input" onChange={handleFileSelect} />
                      {file && (
                        <div className="ats-file-info mt-1">
                          <span>📎 {file.name}</span>
                          <span className="ats-file-size">{(file.size / 1024).toFixed(0)} KB</span>
                        </div>
                      )}
                      <Form.Text className="ats-hint">PDF, DOC, DOCX — max 5MB</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label className="ats-label">
                        Job Description
                        <span className="tag-recommended">recommended for accurate scoring</span>
                      </Form.Label>
                      <Form.Control as="textarea" rows={5} className="ats-input" placeholder="Paste the job description here. We'll extract keywords and match them against your resume for a company-specific ATS score..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
                      <Form.Text className="ats-hint">Providing a JD enables role-specific keyword matching and AI-powered resume improvements</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {error && <Alert variant="danger" className="ats-error mt-3">⚠️ {error}</Alert>}

                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <Button className="ats-btn-primary" onClick={handleSubmit} disabled={loading || !file}>
                    {loading ? <><Spinner animation="border" size="sm" className="me-2" />Analyzing...</> : "🔍 Analyze Resume"}
                  </Button>
                  {result && file && (
                    <Button className="ats-btn-secondary" onClick={() => setShowResumeModal(true)}>
                      📄 View Resume
                    </Button>
                  )}
                  {result && (
                    <Button className="ats-btn-improve" onClick={handleImprove} disabled={improving}>
                      {improving ? <><Spinner animation="border" size="sm" className="me-2" />Improving...</> : "✨ AI Improve Resume"}
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className={`ats-score-card score-border-${variant(result?.score || 0)}`}>
              <Card.Body className="p-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 340 }}>
                {result ? (
                  <>
                    <div className="ats-ring" style={{ ["--score" as string]: animatedScore } as React.CSSProperties}>
                      <div className="ats-ring-inner">
                        <div className="ats-score-num">{Math.round(animatedScore)}%</div>
                        <div className="ats-score-grade">{scoreGrade(result.score)}</div>
                      </div>
                    </div>
                    <div className="ats-score-label mt-2">{scoreLabel(result.score)}</div>
                    {result.company_name && <div className="ats-company-pill mt-2">🏢 {result.company_name}</div>}
                    {result.jd_match_score != null && (
                      <div className="ats-jd-pill mt-2">
                        <span>JD Match</span><strong>{result.jd_match_score}%</strong>
                      </div>
                    )}
                    <div className="ats-score-desc mt-2">
                      {result.score >= 80 ? "Highly optimized for ATS!" : result.score >= 60 ? "Good foundation. Minor improvements needed." : result.score >= 40 ? "Fair score. Use AI Improve below." : "Major improvements recommended."}
                    </div>
                    <ProgressBar now={animatedScore} variant={variant(result.score)} className="ats-bar mt-3 w-100" />
                    <div className="ats-sections-mini mt-3 w-100">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="ats-muted">Sections found</small>
                        <small className="ats-muted">{presentCount}/{SECTION_DEFS.length}</small>
                      </div>
                      <ProgressBar now={(presentCount / SECTION_DEFS.length) * 100} variant="info" style={{ height: 5, borderRadius: 3 }} />
                    </div>
                  </>
                ) : (
                  <div className="ats-placeholder">
                    <div className="ats-placeholder-ring">ATS</div>
                    <p>Your ATS score appears here</p>
                    <small>Upload a resume to get started</small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Results */}
        {result && (
          <div className="ats-results">

            {/* Section Status Breakdown */}
            {sections && (
              <Card className="ats-card mb-4">
                <Card.Header className="ats-card-header" style={{ borderLeft: "4px solid #6f42c1" }}>
                  <span>📊</span>
                  <h5 className="mb-0">Resume Section Analysis</h5>
                  <span className="ats-badge ms-auto">{presentCount}/{SECTION_DEFS.length} sections found</span>
                </Card.Header>
                <Card.Body className="p-3">
                  <Row className="g-2">
                    {SECTION_DEFS.map(def => {
                      const present = sections[def.key];
                      const fb = def.key === "skills" ? result.section_feedback.skills : def.key === "experience" ? result.section_feedback.experience : def.key === "projects" ? result.section_feedback.projects : null;
                      const hasIssue = fb && (fb.includes("missing") || fb.includes("limited") || fb.includes("weak"));
                      const status = !present ? "miss" : hasIssue ? "warn" : "ok";
                      return (
                        <Col sm={6} lg={3} key={def.key}>
                          <div className={`ats-section-card ats-section-${status}`}>
                            <div className="ats-section-top">
                              <span className="ats-section-icon">{def.icon}</span>
                              <span className="ats-section-name">{def.label}</span>
                              <span className={`ats-section-dot dot-${status}`}>{status === "ok" ? "✓" : status === "warn" ? "!" : "✕"}</span>
                            </div>
                            <p className="ats-section-msg">{status === "miss" ? def.missingMsg : fb ? fb : def.presentMsg}</p>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* JD Match Panel */}
            {result.jd_match_score != null && (
              <Card className="ats-card mb-4">
                <Card.Header className="ats-card-header" style={{ borderLeft: "4px solid #ffd166" }}>
                  <span>🎯</span>
                  <h5 className="mb-0">Job Description Match{result.company_name ? ` — ${result.company_name}` : ""}</h5>
                  <span className="ats-badge ms-auto" style={{ background: "rgba(255,209,102,0.15)", color: "#ffd166", border: "1px solid rgba(255,209,102,0.3)" }}>{result.jd_match_score}% match</span>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={6}>
                      <p className="ats-kw-label">✅ Keywords matched in your resume</p>
                      <div className="ats-kw-wrap">
                        {result.jd_matched_keywords?.length ? result.jd_matched_keywords.map((k, i) => <span key={i} className="ats-kw ats-kw-green">{k}</span>) : <span className="ats-muted">No JD keywords matched</span>}
                      </div>
                    </Col>
                    <Col md={6}>
                      <p className="ats-kw-label">❌ JD keywords missing from your resume</p>
                      <div className="ats-kw-wrap">
                        {result.jd_missing_keywords?.length ? result.jd_missing_keywords.map((k, i) => <span key={i} className="ats-kw ats-kw-red">{k}</span>) : <span style={{ color: "#28a745", fontSize: "0.82rem" }}>All JD keywords matched! 🎉</span>}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Strengths + Improvements */}
            <Row className="g-4 mb-4">
              <Col lg={6}>
                <Card className="ats-card h-100">
                  <Card.Header className="ats-card-header" style={{ borderLeft: "4px solid #28a745" }}>
                    <span>✅</span><h5 className="mb-0">Strengths</h5>
                    <span className="ats-badge ms-auto">{result.positive_points?.length || 0} points</span>
                  </Card.Header>
                  <Card.Body>
                    {result.positive_points?.length ? (
                      <ul className="ats-list">{result.positive_points.map((p, i) => <li key={i}><span className="ats-list-dot green">✓</span>{p}</li>)}</ul>
                    ) : <p className="ats-muted">No strengths identified</p>}
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={6}>
                <Card className="ats-card h-100">
                  <Card.Header className="ats-card-header" style={{ borderLeft: "4px solid #dc3545" }}>
                    <span>⚠️</span><h5 className="mb-0">Areas to Improve</h5>
                    <span className="ats-badge ms-auto">{result.negative_points?.length || 0} areas</span>
                  </Card.Header>
                  <Card.Body>
                    {result.negative_points?.length ? (
                      <ul className="ats-list">{result.negative_points.map((p, i) => <li key={i}><span className="ats-list-dot red">!</span>{p}</li>)}</ul>
                    ) : <p className="ats-muted">No issues found</p>}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Missing Keywords + Suggestions */}
            <Card className="ats-card mb-4">
              <Card.Header className="ats-card-header" style={{ borderLeft: "4px solid #17a2b8" }}>
                <span>🛠️</span><h5 className="mb-0">Missing ATS Keywords & Suggestions</h5>
              </Card.Header>
              <Card.Body>
                {result.missing_keywords?.length ? (
                  <>
                    <p className="ats-kw-label mb-2">Add these keywords naturally to your resume:</p>
                    <div className="ats-kw-wrap mb-3">{result.missing_keywords.map((k, i) => <span key={i} className="ats-kw ats-kw-orange">{k}</span>)}</div>
                  </>
                ) : null}
                {result.suggestions?.length ? (
                  <ul className="ats-list">{result.suggestions.map((s, i) => <li key={i}><span className="ats-list-dot cyan">→</span>{s}</li>)}</ul>
                ) : null}
              </Card.Body>
            </Card>

            {/* Career Roadmap */}
            <Card className="ats-card mb-4">
              <Card.Header className="ats-card-header" style={{ borderLeft: "4px solid #20c997" }}>
                <span>💼</span><h5 className="mb-0">Career Roadmap</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={6}><div className="ats-career-box">
                    <div className="ats-career-title">Relevant Job Roles</div>
                    <div className="ats-kw-wrap mt-2">{result.relevant_jobs?.length ? result.relevant_jobs.map((j, i) => <span key={i} className="ats-kw ats-kw-teal">{j}</span>) : <span className="ats-muted">No matches found</span>}</div>
                  </div></Col>
                  <Col md={6}><div className="ats-career-box">
                    <div className="ats-career-title">Average Package (Current Level)</div>
                    <div className="ats-pkg-value">{result.average_package_lpa || "--"}</div>
                    <small className="ats-muted">Based on current ATS readiness</small>
                  </div></Col>
                  <Col md={6}><div className="ats-career-box">
                    <div className="ats-career-title">To Unlock Higher Package</div>
                    {result.next_level_changes?.length ? <ul className="ats-career-list">{result.next_level_changes.map((item, i) => <li key={i}>{item}</li>)}</ul> : <span className="ats-muted">No data</span>}
                  </div></Col>
                  <Col md={6}><div className="ats-career-box">
                    <div className="ats-career-title">Expert-Level Package</div>
                    <div className="ats-pkg-value expert">{result.expert_package_lpa || "--"}</div>
                    {result.expert_track_roles?.length && <div className="ats-track-roles">Roles: {result.expert_track_roles.join(", ")}</div>}
                  </div></Col>
                </Row>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>

      {/* ===== View Resume Modal ===== */}
      <Modal show={showResumeModal} onHide={() => setShowResumeModal(false)} size="xl" centered dialogClassName="ats-modal-dark">
        <Modal.Header closeButton className="ats-modal-header">
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#f0f0f0" }}>
            📄 {file?.name}
            <span style={{ fontSize: "0.72rem", color: "#666", marginLeft: 10 }}>{file ? (file.size / 1024).toFixed(0) + " KB" : ""}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ats-modal-body" style={{ padding: 0 }}>
          {isPDF && fileObjectUrl ? (
            <iframe
              src={fileObjectUrl}
              title="Resume PDF"
              style={{ width: "100%", height: "82vh", border: "none", background: "#fff" }}
            />
          ) : (
            <div style={{ padding: "1.5rem" }}>
              <div className="ats-resume-section-view">
                {result?.resume_text ? (
                  SECTION_DEFS.map(def => {
                    const present = result.resume_text && def.regex.test(result.resume_text.toLowerCase());
                    return (
                      <div key={def.key} className={`ats-resume-sec ${present ? "sec-present" : "sec-missing"}`}>
                        <div className="ats-resume-sec-header">
                          <span>{def.icon}</span>
                          <span>{def.label}</span>
                          <span className={`sec-status-dot ${present ? "dot-ok" : "dot-miss"}`}>{present ? "✓" : "✕ Missing"}</span>
                        </div>
                      </div>
                    );
                  })
                ) : null}
              </div>
              <pre className="ats-resume-text mt-3">{result?.resume_text || "Resume text not available"}</pre>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ===== AI Improve Resume Modal ===== */}
      <Modal show={showImproveModal} onHide={() => setShowImproveModal(false)} size="xl" centered dialogClassName="ats-modal-dark">
        <Modal.Header closeButton className="ats-modal-header">
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700, color: "#f0f0f0" }}>
            ✨ AI-Improved Resume{companyName ? ` — Tailored for ${companyName}` : ""}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ats-modal-body">
          {improveResult && (
            <Row className="g-4">
              {/* Left: Diff summary + section fixes */}
              {/* Left: What changed */}
              <Col lg={4}>
                <div className="ats-improve-sidebar">
                  {improveResult.changes_made?.length ? (
                    <div className="ats-improve-section mb-3">
                      <div className="ats-improve-section-title">🔄 Changes Made</div>
                      <ul className="ats-improve-list">
                        {improveResult.changes_made.map((c, i) => <li key={i}><span className="dot-ok-sm">✓</span>{c}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {improveResult.keywords_added?.length ? (
                    <div className="ats-improve-section mb-3">
                      <div className="ats-improve-section-title">🔑 Keywords Added</div>
                      <div className="ats-kw-wrap mt-2">
                        {improveResult.keywords_added.map((k, i) => <span key={i} className="ats-kw ats-kw-green">{k}</span>)}
                      </div>
                    </div>
                  ) : null}

                  {/* Template Selector */}
                  <div className="ats-improve-section mb-3">
                    <div className="ats-improve-section-title">🎨 Choose Template</div>
                    <div className="ats-template-grid">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          className={`ats-tpl-card ${selectedTemplate === t.id ? "ats-tpl-selected" : ""}`}
                          onClick={() => setSelectedTemplate(t.id)}
                        >
                          <div className="ats-tpl-preview" data-preview={t.preview} style={{ "--tpl-accent": t.accent } as React.CSSProperties}>
                            <div className="tpl-header-bar" />
                            <div className="tpl-line tpl-line-name" />
                            <div className="tpl-line tpl-line-contact" />
                            <div className="tpl-section-bar" />
                            <div className="tpl-line tpl-line-body" />
                            <div className="tpl-line tpl-line-body tpl-line-short" />
                            <div className="tpl-section-bar" />
                            <div className="tpl-line tpl-line-body" />
                          </div>
                          <div className="ats-tpl-meta">
                            <span className="ats-tpl-name">{t.name}</span>
                            <span className="ats-tpl-desc">{t.desc}</span>
                          </div>
                          {selectedTemplate === t.id && <span className="ats-tpl-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Download buttons */}
                  <div className="ats-download-box mt-2">
                    <div className="ats-improve-section-title mb-2">⬇️ Download Updated Resume</div>
                    <div className="d-flex flex-column gap-2">
                      <Button className="ats-btn-docx w-100" onClick={handleDownloadDocx}>
                        <span className="ats-btn-icon">📝</span>
                        <span>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Download Word</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>.docx — editable in MS Word</div>
                        </span>
                      </Button>
                      <Button className="ats-btn-pdf w-100" onClick={handleDownloadPdf}>
                        <span className="ats-btn-icon">📄</span>
                        <span>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Download PDF</div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.75 }}>.pdf — ready to submit</div>
                        </span>
                      </Button>
                      <Button className="ats-btn-copy w-100" onClick={handleCopy}>
                        {copied ? "✅ Copied to clipboard!" : "📋 Copy to Clipboard"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Right: Live preview or raw text */}
              <Col lg={8}>
                <div className="ats-improve-resume-wrap">
                  <div className="ats-improve-resume-header">
                    <span className="ats-improve-resume-title">AI-Updated Resume</span>
                    <div className="ats-preview-toggle">
                      <button
                        className={`ats-toggle-btn ${previewMode === "preview" ? "active" : ""}`}
                        onClick={() => setPreviewMode("preview")}
                      >
                        👁 Preview
                      </button>
                      <button
                        className={`ats-toggle-btn ${previewMode === "raw" ? "active" : ""}`}
                        onClick={() => setPreviewMode("raw")}
                      >
                        📝 Raw Text
                      </button>
                    </div>
                  </div>
                  <div className="ats-improve-resume-body">
                    {previewMode === "preview" ? (
                      <ResumePreview
                        parsed={parseResume(improveResult.full_improved_resume)}
                        templateId={selectedTemplate}
                      />
                    ) : (
                      <pre className="ats-improved-resume-text">{improveResult.full_improved_resume}</pre>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .ats-root { background: #060608; min-height: 100vh; color: #f0f0f0; }

        .ats-header { text-align: center; }
        .ats-header-badge { display: inline-block; background: rgba(255,107,53,0.12); color: #ff6b35; border: 1px solid rgba(255,107,53,0.3); border-radius: 20px; padding: 0.25rem 0.9rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.75rem; }
        .ats-title { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
        .ats-subtitle { color: #666; font-size: 0.9rem; max-width: 580px; margin: 0 auto; }

        .ats-card { background: #0d0d0f; border: 1px solid #1e1e24; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
        .ats-card-header { background: #111116; border-bottom: 1px solid #1e1e24; border-radius: 16px 16px 0 0; padding: 0.9rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; }
        .ats-card-header h5 { color: #f0f0f0; font-size: 0.95rem; font-weight: 700; }
        .ats-badge { background: rgba(255,107,53,0.12); color: #ff6b35; border: 1px solid rgba(255,107,53,0.2); border-radius: 20px; padding: 0.2rem 0.7rem; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }

        .ats-label { color: #ccc; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem; display: block; }
        .tag-optional { background: rgba(255,255,255,0.06); color: #777; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.68rem; font-weight: 500; margin-left: 6px; }
        .tag-required { color: #ff6b35; margin-left: 4px; }
        .tag-recommended { background: rgba(32,201,151,0.1); color: #20c997; border-radius: 4px; padding: 0.1rem 0.45rem; font-size: 0.68rem; font-weight: 600; margin-left: 6px; }
        .ats-input { background: #111116 !important; border: 1px solid #2a2a32 !important; color: #f0f0f0 !important; border-radius: 10px !important; font-size: 0.88rem; }
        .ats-input:focus { border-color: #ff6b35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.12) !important; background: #111116 !important; color: #f0f0f0 !important; }
        .ats-input::placeholder { color: #444 !important; }
        .ats-file-input { background: #111116 !important; border: 1px dashed #2a2a32 !important; color: #ccc !important; border-radius: 10px !important; font-size: 0.85rem; }
        .ats-file-input::-webkit-file-upload-button { background: #ff6b35; border: none; color: #fff; padding: 0.4rem 1rem; border-radius: 7px; cursor: pointer; font-size: 0.8rem; margin-right: 0.75rem; }
        .ats-file-info { display: flex; align-items: center; justify-content: space-between; color: #ff6b35; font-size: 0.78rem; font-weight: 500; }
        .ats-file-size { color: #666; }
        .ats-hint { color: #555 !important; font-size: 0.75rem; }

        .ats-btn-primary { background: linear-gradient(135deg, #ff6b35, #ff9a5c); border: none; color: #fff; font-weight: 700; padding: 0.65rem 1.75rem; border-radius: 10px; font-size: 0.9rem; transition: all 0.25s; }
        .ats-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,107,53,0.4); }
        .ats-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .ats-btn-secondary { background: transparent; border: 1px solid #2a2a32; color: #aaa; font-weight: 600; padding: 0.65rem 1.25rem; border-radius: 10px; font-size: 0.85rem; transition: all 0.2s; }
        .ats-btn-secondary:hover { border-color: #6f42c1; color: #9b6fd4; background: rgba(111,66,193,0.08); }
        .ats-btn-improve { background: linear-gradient(135deg, #6f42c1, #9b6fd4); border: none; color: #fff; font-weight: 700; padding: 0.65rem 1.5rem; border-radius: 10px; font-size: 0.85rem; transition: all 0.25s; }
        .ats-btn-improve:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(111,66,193,0.4); }
        .ats-btn-improve:disabled { opacity: 0.5; cursor: not-allowed; }
        .ats-btn-copy { background: rgba(40,167,69,0.12); border: 1px solid rgba(40,167,69,0.3); color: #4caf72; font-size: 0.82rem; padding: 0.6rem 1rem; border-radius: 10px; font-weight: 600; transition: all 0.2s; text-align: left; }
        .ats-btn-copy:hover { background: rgba(40,167,69,0.22); color: #4caf72; border-color: rgba(40,167,69,0.5); }
        .ats-btn-docx { background: rgba(23,105,255,0.12); border: 1px solid rgba(23,105,255,0.3); color: #6699ff; padding: 0.65rem 1rem; border-radius: 10px; transition: all 0.2s; display: flex; align-items: center; gap: 0.75rem; text-align: left; }
        .ats-btn-docx:hover { background: rgba(23,105,255,0.2); color: #6699ff; border-color: rgba(23,105,255,0.5); }
        .ats-btn-pdf { background: rgba(220,53,69,0.12); border: 1px solid rgba(220,53,69,0.3); color: #e06c75; padding: 0.65rem 1rem; border-radius: 10px; transition: all 0.2s; display: flex; align-items: center; gap: 0.75rem; text-align: left; }
        .ats-btn-pdf:hover { background: rgba(220,53,69,0.22); color: #e06c75; border-color: rgba(220,53,69,0.5); }
        .ats-btn-icon { font-size: 1.4rem; flex-shrink: 0; }
        .ats-download-box { background: #111116; border: 1px solid #1e1e24; border-radius: 12px; padding: 1rem; }

        .ats-score-card { background: linear-gradient(160deg, #0a0a0e, #0e0e14); border: 1px solid #1e1e24; border-radius: 16px; }
        .score-border-success { border-top: 3px solid #28a745; }
        .score-border-warning { border-top: 3px solid #ffc107; }
        .score-border-danger { border-top: 3px solid #dc3545; }
        .ats-ring { --score: 0; width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(#ff6b35 calc(var(--score) * 1%), rgba(255,255,255,0.05) calc(var(--score) * 1%)); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24px rgba(255,107,53,0.15); }
        .ats-ring-inner { width: 152px; height: 152px; border-radius: 50%; background: linear-gradient(135deg, #0e0e14, #0a0a0e); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid rgba(255,107,53,0.25); }
        .ats-score-num { font-size: 2.6rem; font-weight: 900; color: #ff6b35; line-height: 1; }
        .ats-score-grade { font-size: 0.9rem; color: #888; font-weight: 600; }
        .ats-score-label { font-size: 1.05rem; font-weight: 700; color: #f0f0f0; }
        .ats-score-desc { font-size: 0.78rem; color: #666; max-width: 200px; line-height: 1.4; }
        .ats-company-pill { background: rgba(255,255,255,0.05); border: 1px solid #2a2a32; border-radius: 20px; padding: 0.3rem 0.9rem; font-size: 0.78rem; color: #ccc; }
        .ats-jd-pill { display: flex; align-items: center; gap: 0.5rem; background: rgba(255,209,102,0.1); border: 1px solid rgba(255,209,102,0.25); border-radius: 20px; padding: 0.3rem 0.9rem; font-size: 0.78rem; color: #ffd166; }
        .ats-jd-pill strong { font-size: 0.9rem; }
        .ats-bar { height: 7px; border-radius: 4px; }
        .ats-muted { color: #555; font-size: 0.78rem; }
        .ats-placeholder { padding: 1.5rem 0; }
        .ats-placeholder-ring { width: 80px; height: 80px; border-radius: 50%; border: 2px solid rgba(255,107,53,0.3); background: radial-gradient(circle at 35% 35%, rgba(255,107,53,0.12), transparent); color: #ff6b35; font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; letter-spacing: 1px; }
        .ats-placeholder p { color: #666; font-size: 0.85rem; margin-bottom: 0.35rem; }
        .ats-placeholder small { color: #444; font-size: 0.75rem; }

        .ats-section-card { border-radius: 10px; padding: 0.85rem; border: 1px solid transparent; height: 100%; }
        .ats-section-ok { background: rgba(40,167,69,0.06); border-color: rgba(40,167,69,0.2); }
        .ats-section-warn { background: rgba(255,193,7,0.06); border-color: rgba(255,193,7,0.2); }
        .ats-section-miss { background: rgba(220,53,69,0.06); border-color: rgba(220,53,69,0.2); }
        .ats-section-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .ats-section-icon { font-size: 1rem; }
        .ats-section-name { font-size: 0.8rem; font-weight: 700; color: #ddd; flex: 1; }
        .ats-section-dot { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 800; flex-shrink: 0; }
        .dot-ok { background: rgba(40,167,69,0.2); color: #28a745; border: 1px solid rgba(40,167,69,0.4); }
        .dot-warn { background: rgba(255,193,7,0.2); color: #ffc107; border: 1px solid rgba(255,193,7,0.4); }
        .dot-miss { background: rgba(220,53,69,0.2); color: #dc3545; border: 1px solid rgba(220,53,69,0.4); }
        .ats-section-msg { font-size: 0.72rem; color: #888; line-height: 1.45; margin: 0; }

        .ats-kw-label { color: #888; font-size: 0.8rem; margin-bottom: 0.5rem; }
        .ats-kw-wrap { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ats-kw { padding: 0.28rem 0.65rem; border-radius: 7px; font-size: 0.78rem; font-weight: 600; border: 1px solid transparent; }
        .ats-kw-green { background: rgba(40,167,69,0.12); color: #4caf72; border-color: rgba(40,167,69,0.25); }
        .ats-kw-red { background: rgba(220,53,69,0.12); color: #e06c75; border-color: rgba(220,53,69,0.25); }
        .ats-kw-orange { background: rgba(255,107,53,0.12); color: #ff8c5a; border-color: rgba(255,107,53,0.25); }
        .ats-kw-teal { background: rgba(32,201,151,0.12); color: #20c997; border-color: rgba(32,201,151,0.25); }

        .ats-list { list-style: none; padding: 0; margin: 0; }
        .ats-list li { display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.65rem 0; font-size: 0.86rem; color: #ccc; border-bottom: 1px solid #181820; line-height: 1.45; }
        .ats-list li:last-child { border-bottom: none; }
        .ats-list-dot { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 800; flex-shrink: 0; margin-top: 1px; }
        .ats-list-dot.green { background: rgba(40,167,69,0.15); color: #28a745; }
        .ats-list-dot.red { background: rgba(220,53,69,0.15); color: #dc3545; }
        .ats-list-dot.cyan { background: rgba(23,162,184,0.15); color: #17a2b8; }

        .ats-career-box { background: #0a0a0e; border: 1px solid #1e1e24; border-radius: 12px; padding: 1rem; height: 100%; }
        .ats-career-title { color: #20c997; font-weight: 700; font-size: 0.82rem; margin-bottom: 0.5rem; }
        .ats-pkg-value { font-size: 1.4rem; font-weight: 800; color: #ffd166; }
        .ats-pkg-value.expert { color: #20c997; }
        .ats-career-list { margin: 0.4rem 0 0; padding-left: 1.1rem; color: #ccc; font-size: 0.82rem; line-height: 1.5; }
        .ats-career-list li { margin-bottom: 0.3rem; }
        .ats-track-roles { color: #9ad9c8; font-size: 0.76rem; margin-top: 0.35rem; }

        .ats-error { background: rgba(220,53,69,0.08); border: 1px solid rgba(220,53,69,0.3); border-radius: 10px; color: #e06c75; font-size: 0.85rem; padding: 0.75rem 1rem; }

        /* Modals */
        .ats-modal-dark .modal-content { background: #0d0d0f; border: 1px solid #1e1e24; border-radius: 16px; color: #f0f0f0; }
        .ats-modal-header { background: #111116; border-bottom: 1px solid #1e1e24; border-radius: 16px 16px 0 0; padding: 1rem 1.25rem; }
        .ats-modal-header .btn-close { filter: invert(1) brightness(0.6); }
        .ats-modal-body { background: #0d0d0f; padding: 1.5rem; border-radius: 0 0 16px 16px; }

        /* Resume viewer */
        .ats-resume-text { background: #0a0a0e; border: 1px solid #1e1e24; border-radius: 10px; padding: 1.25rem; color: #aaa; font-size: 0.78rem; line-height: 1.7; white-space: pre-wrap; word-break: break-word; max-height: 65vh; overflow-y: auto; font-family: 'Courier New', monospace; }
        .ats-resume-text::-webkit-scrollbar { width: 5px; }
        .ats-resume-text::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 3px; }
        .ats-resume-section-view { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
        .ats-resume-sec { border-radius: 8px; padding: 0.5rem 0.75rem; border: 1px solid transparent; }
        .sec-present { background: rgba(40,167,69,0.08); border-color: rgba(40,167,69,0.2); }
        .sec-missing { background: rgba(220,53,69,0.08); border-color: rgba(220,53,69,0.2); }
        .ats-resume-sec-header { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 600; color: #ccc; }
        .sec-status-dot { font-size: 0.7rem; }

        /* AI Improve Modal */
        .ats-improve-sidebar { height: 75vh; overflow-y: auto; padding-right: 0.5rem; }
        .ats-improve-sidebar::-webkit-scrollbar { width: 4px; }
        .ats-improve-sidebar::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 3px; }
        .ats-improve-section { background: #111116; border: 1px solid #1e1e24; border-radius: 10px; padding: 0.9rem; }
        .ats-improve-section-title { font-size: 0.8rem; font-weight: 700; color: #ff6b35; margin-bottom: 0.6rem; }
        .ats-improve-text { font-size: 0.82rem; color: #ccc; line-height: 1.55; margin: 0; }
        .ats-improve-list { list-style: none; padding: 0; margin: 0; }
        .ats-improve-list li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.8rem; color: #ccc; padding: 0.3rem 0; line-height: 1.4; }
        .dot-ok-sm { color: #28a745; font-size: 0.7rem; flex-shrink: 0; margin-top: 2px; }
        .dot-tip { color: #17a2b8; flex-shrink: 0; }
        .ats-improve-resume-wrap { display: flex; flex-direction: column; height: 100%; }
        .ats-improve-resume-header { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; background: #111116; border: 1px solid #1e1e24; border-radius: 10px 10px 0 0; gap: 0.75rem; }
        .ats-improve-resume-title { font-size: 0.85rem; font-weight: 700; color: #f0f0f0; flex: 1; }
        .ats-preview-toggle { display: flex; gap: 4px; background: #0a0a0e; border: 1px solid #2a2a32; border-radius: 8px; padding: 3px; }
        .ats-toggle-btn { background: transparent; border: none; color: #666; font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 6px; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
        .ats-toggle-btn.active { background: #ff6b35; color: #fff; }
        .ats-toggle-btn:not(.active):hover { color: #ccc; background: #1e1e24; }
        .ats-improve-resume-body { border: 1px solid #1e1e24; border-top: none; border-radius: 0 0 10px 10px; overflow-y: auto; max-height: 72vh; background: #fff; }
        .ats-improve-resume-body::-webkit-scrollbar { width: 5px; }
        .ats-improve-resume-body::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 3px; }
        .ats-improved-resume-text { background: #0a0a0e; border: none; border-radius: 0; padding: 1.25rem; color: #d4d4d4; font-size: 0.82rem; line-height: 1.75; white-space: pre-wrap; word-break: break-word; overflow-y: auto; font-family: 'Courier New', monospace; margin: 0; min-height: 60vh; }

        /* Template selector */
        .ats-template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem; }
        .ats-tpl-card { position: relative; background: #0a0a0e; border: 1.5px solid #1e1e24; border-radius: 10px; padding: 0.6rem; cursor: pointer; transition: all 0.2s; text-align: left; display: flex; flex-direction: column; gap: 0.4rem; }
        .ats-tpl-card:hover { border-color: #3a3a46; background: #111116; }
        .ats-tpl-selected { border-color: #ff6b35 !important; background: rgba(255,107,53,0.06) !important; box-shadow: 0 0 0 2px rgba(255,107,53,0.18); }
        .ats-tpl-check { position: absolute; top: 6px; right: 8px; color: #ff6b35; font-size: 0.7rem; font-weight: 800; }
        .ats-tpl-meta { display: flex; flex-direction: column; gap: 1px; }
        .ats-tpl-name { font-size: 0.72rem; font-weight: 700; color: #e0e0e0; }
        .ats-tpl-desc { font-size: 0.62rem; color: #555; line-height: 1.3; }

        /* Template mini-preview */
        .ats-tpl-preview { background: #fff; border-radius: 5px; padding: 5px 6px; display: flex; flex-direction: column; gap: 2.5px; overflow: hidden; height: 62px; }
        .tpl-header-bar { height: 10px; border-radius: 2px; background: var(--tpl-accent, #1a1a1a); margin-bottom: 1px; }
        .tpl-line { height: 3.5px; border-radius: 2px; background: #ccc; }
        .tpl-line-name { width: 55%; background: #888; height: 4px; }
        .tpl-line-contact { width: 80%; background: #ddd; }
        .tpl-section-bar { height: 3px; border-radius: 1px; background: var(--tpl-accent, #1a1a1a); opacity: 0.7; margin-top: 1px; }
        .tpl-line-body { width: 90%; }
        .tpl-line-short { width: 65%; }

        /* Per-template preview tweaks */
        [data-preview="classic"] .tpl-header-bar { background: transparent; border-bottom: 1.5px solid #1a1a1a; height: 6px; }
        [data-preview="minimal"] .tpl-header-bar { background: transparent; border-bottom: 1px solid #ccc; height: 6px; }
        [data-preview="minimal"] .tpl-section-bar { background: #999; opacity: 0.4; }
        [data-preview="executive"] .ats-tpl-preview, [data-preview="creative"] .ats-tpl-preview { padding-top: 0; }

        .ats-results { animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) {
          .ats-title { font-size: 1.5rem; }
          .ats-ring { width: 140px; height: 140px; }
          .ats-ring-inner { width: 116px; height: 116px; }
          .ats-score-num { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default ATSChecker;

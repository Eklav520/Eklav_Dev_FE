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
  jd_keywords_added: string[];
  full_improved_resume: string;
  changes_made: string[];
  estimated_ats_score?: number;
  estimated_jd_score?: number | null;
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


interface UsageInfo {
  usageCount: number
  isSubscribed: boolean
  remaining: number
  limit: number
  canUse: boolean
}

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
  const [animatedJd, setAnimatedJd] = useState(0);

  // Usage gate
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

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

  useEffect(() => {
    if (!result || result.jd_match_score == null) { setAnimatedJd(0); return; }
    const target = result.jd_match_score;
    const duration = 1400; const start = performance.now(); let fid = 0;
    setAnimatedJd(0);
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setAnimatedJd(target * ease(p));
      if (p < 1) fid = requestAnimationFrame(animate);
    };
    fid = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(fid);
  }, [result?.jd_match_score]);

  // Fetch usage count; subscription is determined by user.status === 'approved'
  useEffect(() => {
    if (!user?.token) return
    const isSubscribed = (user as any)?.status?.toLowerCase() === 'approved'
    fetch(`${baseURL}/api/resume/ats-usage`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(data => {
        // Override isSubscribed from backend with the reliable user.status field
        const MAX = 20
        const count = data.usageCount || 0
        setUsage({
          usageCount: count,
          isSubscribed,
          remaining: isSubscribed ? Math.max(0, MAX - count) : count === 0 ? 1 : 0,
          limit: MAX,
          canUse: count === 0 || (isSubscribed && count < MAX),
        })
      })
      .catch(() => {})
  }, [user?.token])

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

    // Pre-flight usage gate
    if (usage && !usage.canUse) {
      setShowPaywall(true);
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    if (companyName.trim()) formData.append("company_name", companyName.trim());
    if (jobDescription.trim()) formData.append("job_description", jobDescription.trim());
    try {
      setLoading(true); setError(""); setResult(null); setImproveResult(null);
      const res = await fetch(`${baseURL}/api/resume/check-ats`, {
        method: "POST", headers: { Authorization: `Bearer ${user?.token}` }, body: formData,
      });
      if (res.status === 403) {
        setShowPaywall(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to analyze resume");
      const data = await res.json();
      setResult(data);
      // Update usage count after successful check
      setUsage(prev => {
        if (!prev) return prev
        const newCount = prev.usageCount + 1
        const newRemaining = Math.max(0, prev.remaining - 1)
        return { ...prev, usageCount: newCount, remaining: newRemaining, canUse: prev.isSubscribed ? newRemaining > 0 : false }
      })
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
          jd_matched_keywords: result.jd_matched_keywords,
          section_feedback: result.section_feedback,
          job_description: jobDescription,
          company_name: companyName,
          current_ats_score: result.score,
          current_jd_score: result.jd_match_score ?? null,
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

          {/* Usage counter */}
          {usage && (
            <div className="ats-usage-bar">
              {usage.isSubscribed ? (
                <>
                  <span className="ats-usage-dot subscribed" />
                  <span className="ats-usage-label">Subscribed</span>
                  <span className="ats-usage-count">{usage.usageCount} / {usage.limit} checks used</span>
                  <div className="ats-usage-track">
                    <div className="ats-usage-fill" style={{ width: `${(usage.usageCount / usage.limit) * 100}%`, background: usage.usageCount >= 45 ? '#ef4444' : '#ff7a00' }} />
                  </div>
                  <span className="ats-usage-left" style={{ color: usage.remaining <= 5 ? '#ef4444' : '#22c55e' }}>{usage.remaining} remaining</span>
                </>
              ) : usage.usageCount === 0 ? (
                <>
                  <span className="ats-usage-dot free" />
                  <span className="ats-usage-label" style={{ color: '#22c55e' }}>1 Free Check Available</span>
                  <span className="ats-usage-hint">Subscribe for up to 20 checks</span>
                </>
              ) : (
                <>
                  <span className="ats-usage-dot locked" />
                  <span className="ats-usage-label" style={{ color: '#ef4444' }}>Free limit reached</span>
                  <button className="ats-upgrade-pill" onClick={() => setShowPaywall(true)}>🔓 Subscribe to continue</button>
                </>
              )}
            </div>
          )}
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
            {!result && (
              <Card className="ats-score-card h-100">
                <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 340 }}>
                  <div className="ats-placeholder">
                    <div className="ats-placeholder-ring">ATS</div>
                    <p>Your scores appear here</p>
                    <small>Upload a resume to get started</small>
                  </div>
                </Card.Body>
              </Card>
            )}
            {result && result.company_name && (
              <Card className="ats-score-card h-100">
                <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center">
                  <div className="ats-company-pill">🏢 {result.company_name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 8, textAlign: 'center' }}>Scores calculated for this company's JD</div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* 3-box Score Row — shown only when results available */}
        {result && (
          <Row className="g-4 mb-4">
            {/* Box 1 — JD Match (Primary) */}
            <Col md={4}>
              <Card className="ats-sbox ats-sbox-jd h-100">
                <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                  <div className="ats-sbox-label">
                    Job Match Score
                    <span className="ats-primary-badge ms-2">Most Important</span>
                  </div>
                  {result.jd_match_score != null ? (
                    <>
                      <div style={{ position: 'relative', display: 'inline-block', margin: '16px 0 10px' }}>
                        <div className="ats-ring ats-ring-jd" style={{ ["--score" as string]: animatedJd } as React.CSSProperties}>
                          <div className="ats-ring-inner ats-ring-inner-jd">
                            <div className="ats-score-num" style={{ color: animatedJd >= 70 ? '#22c55e' : animatedJd >= 40 ? '#f59e0b' : '#ef4444' }}>
                              {Math.round(animatedJd)}%
                            </div>
                            <div className="ats-score-grade">{animatedJd >= 70 ? 'Strong' : animatedJd >= 40 ? 'Moderate' : 'Low'}</div>
                          </div>
                        </div>
                        <div className="ats-info-anchor" style={{ position: 'absolute', top: 4, right: -4 }}>
                          <span className="ats-info-icon">ℹ</span>
                          <div className="ats-info-tip">
                            <strong>JD Match Score — Most Important</strong>
                            <p>How many keywords from the Job Description are found in your resume. This is exactly what company ATS software checks first.</p>
                            <ul>
                              <li><strong>70%+</strong> — Strong match for this role</li>
                              <li><strong>40–69%</strong> — Moderate: add more JD keywords</li>
                              <li><strong>Below 40%</strong> — Low: high risk of rejection</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <ProgressBar now={animatedJd} style={{ height: 6, borderRadius: 4, width: '100%', background: '#111', ['--bs-progress-bar-bg' as string]: animatedJd >= 70 ? '#22c55e' : animatedJd >= 40 ? '#f59e0b' : '#ef4444' }} className="ats-bar mb-2" />
                      <div className="ats-sbox-verdict">
                        {animatedJd >= 70 ? '✅ Likely to pass ATS for this role' : animatedJd >= 40 ? '⚠️ Add more JD keywords to improve' : '❌ Resume may be auto-rejected'}
                      </div>
                    </>
                  ) : (
                    <div className="ats-no-jd-hint mt-3">
                      💡 Paste a Job Description above to unlock your <strong>JD Match score</strong> — the #1 metric companies check
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Box 2 — ATS / Resume Quality Score */}
            <Col md={4}>
              <Card className="ats-sbox ats-sbox-ats h-100">
                <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
                  <div className="ats-sbox-label">
                    Resume Quality Score
                    <span className="ats-secondary-badge ms-2">General</span>
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block', margin: '16px 0 10px' }}>
                    <div className="ats-ring" style={{ ["--score" as string]: animatedScore } as React.CSSProperties}>
                      <div className="ats-ring-inner">
                        <div className="ats-score-num">{Math.round(animatedScore)}%</div>
                        <div className="ats-score-grade">{scoreGrade(result.score)}</div>
                      </div>
                    </div>
                    <div className="ats-info-anchor" style={{ position: 'absolute', top: 4, right: -4 }}>
                      <span className="ats-info-icon">ℹ</span>
                      <div className="ats-info-tip">
                        <strong>ATS Score</strong>
                        <p>Generic resume quality — keyword density, sections, formatting. Same score regardless of which job you apply to.</p>
                        <ul>
                          <li><strong>80%+</strong> — Excellent</li>
                          <li><strong>60–79%</strong> — Good</li>
                          <li><strong>40–59%</strong> — Fair</li>
                          <li><strong>Below 40%</strong> — At risk</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <ProgressBar now={animatedScore} variant={variant(result.score)} className="ats-bar mb-2 w-100" style={{ height: 6, borderRadius: 4 }} />
                  <div className="ats-sbox-verdict">
                    {result.score >= 80 ? '✅ Highly optimized for ATS' : result.score >= 60 ? '⚠️ Good foundation, minor gaps' : result.score >= 40 ? '⚠️ Fair — use AI Improve below' : '❌ Major improvements recommended'}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Box 3 — Resume Health */}
            <Col md={4}>
              <Card className="ats-sbox ats-sbox-health h-100">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="ats-sbox-label mb-3">Resume Health</div>

                  {/* Sections progress */}
                  <div className="ats-health-row mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="ats-health-key">Sections Detected</span>
                      <span className="ats-health-val" style={{ color: presentCount >= 6 ? '#22c55e' : presentCount >= 4 ? '#f59e0b' : '#ef4444' }}>{presentCount}/{SECTION_DEFS.length}</span>
                    </div>
                    <ProgressBar now={(presentCount / SECTION_DEFS.length) * 100} variant={presentCount >= 6 ? 'success' : presentCount >= 4 ? 'warning' : 'danger'} style={{ height: 6, borderRadius: 4 }} />
                  </div>

                  {/* Key metrics list */}
                  {[
                    { label: 'Overall Grade', value: scoreGrade(result.score), color: result.score >= 80 ? '#22c55e' : result.score >= 60 ? '#f59e0b' : '#ef4444' },
                    { label: 'ATS Readability', value: result.score >= 60 ? 'Good' : 'Needs work', color: result.score >= 60 ? '#22c55e' : '#ef4444' },
                    ...(result.jd_match_score != null ? [{ label: 'JD Keyword Match', value: `${result.jd_match_score}%`, color: result.jd_match_score >= 70 ? '#22c55e' : result.jd_match_score >= 40 ? '#f59e0b' : '#ef4444' }] : []),
                    ...(result.company_name ? [{ label: 'Company', value: result.company_name, color: '#74c0fc' }] : []),
                  ].map((item, i) => (
                    <div key={i} className="ats-health-item">
                      <span className="ats-health-key">{item.label}</span>
                      <span className="ats-health-val" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}

                  <div className="mt-auto pt-3">
                    <div className="ats-sbox-verdict">
                      {presentCount >= 6 ? '✅ Resume structure looks complete' : `⚠️ ${SECTION_DEFS.length - presentCount} sections missing — add them to improve score`}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

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

            {/* How Companies Use ATS */}
            <Card className="ats-card mb-4">
              <Card.Header className="ats-card-header" style={{ borderLeft: '4px solid #ff7a00' }}>
                <span>🏢</span>
                <h5 className="mb-0">How Companies Filter Resumes</h5>
                {result.jd_match_score != null && (
                  <span className="ats-badge ms-auto" style={{ background: 'rgba(255,122,0,0.15)', color: '#ff7a00', border: '1px solid rgba(255,122,0,0.3)' }}>
                    JD Match is the key factor
                  </span>
                )}
              </Card.Header>
              <Card.Body className="p-4">

                {/* Our checker note */}
                <div className="ats-process-note mb-4">
                  <span className="ats-process-note-icon">✅</span>
                  <div>
                    <strong>Our ATS checker follows the same process</strong>
                    <p>The <strong>JD Match %</strong> and <strong>ATS Score</strong> you see above are calculated exactly the way real company ATS software works — keyword scanning, section detection, and match scoring against the job description you provided.</p>
                  </div>
                </div>

                {/* Hiring funnel */}
                <div className="ats-funnel">
                  {[
                    { step: '1', icon: '📋', title: 'Job Posted', desc: 'Company posts a job. 500–5,000 applications arrive within days.', color: '#6f42c1' },
                    { step: '2', icon: '🤖', title: 'ATS Auto-Scan', desc: 'ATS software (Workday, Taleo, Greenhouse) scans every resume for JD keywords, required skills, and qualifications.', color: '#0d6efd', highlight: true },
                    { step: '3', icon: '📊', title: 'Score & Rank', desc: 'Each resume gets a match score. Only top 20–30% move forward. Low-scoring resumes are auto-rejected — no human sees them.', color: '#dc3545', highlight: true },
                    { step: '4', icon: '👁️', title: 'HR Reviews Top Resumes', desc: 'A recruiter manually reads only the shortlisted resumes (usually 20–50 out of thousands).', color: '#fd7e14' },
                    { step: '5', icon: '📞', title: 'Interview Call', desc: 'Candidates who pass ATS + HR review get called for an interview.', color: '#20c997' },
                  ].map((item, i, arr) => (
                    <div key={i} className="ats-funnel-step">
                      <div className="ats-funnel-icon" style={{ background: `${item.color}22`, border: `1.5px solid ${item.color}55`, color: item.color }}>
                        {item.icon}
                      </div>
                      <div className={`ats-funnel-body${item.highlight ? ' ats-funnel-highlight' : ''}`} style={item.highlight ? { borderColor: item.color } : {}}>
                        <div className="ats-funnel-title" style={{ color: item.color }}>
                          <span className="ats-funnel-num" style={{ background: item.color, color: '#000' }}>{item.step}</span> {item.title}
                        </div>
                        <div className="ats-funnel-desc">{item.desc}</div>
                      </div>
                      {i < arr.length - 1 && <div className="ats-funnel-arrow">↓</div>}
                    </div>
                  ))}
                </div>

                {/* Key insight box */}
                <div className="ats-insight-box mt-4">
                  <div className="ats-insight-title">💡 What this means for your resume</div>
                  <div className="ats-insight-grid">
                    <div className="ats-insight-item">
                      <span className="ats-insight-icon" style={{ color: '#ffd166' }}>🎯</span>
                      <div>
                        <strong>JD Match score matters most</strong>
                        <p>When applying to a specific role, the JD Match % is more important than your overall ATS score. Companies configure their ATS with keywords from their exact job description.</p>
                      </div>
                    </div>
                    <div className="ats-insight-item">
                      <span className="ats-insight-icon" style={{ color: '#ff6b6b' }}>⚠️</span>
                      <div>
                        <strong>Tailor resume per job</strong>
                        <p>One generic resume won't work. For each job, add the specific skills and tools mentioned in that job's description to increase your JD match score.</p>
                      </div>
                    </div>
                    <div className="ats-insight-item">
                      <span className="ats-insight-icon" style={{ color: '#51cf66' }}>✅</span>
                      <div>
                        <strong>Use simple formatting</strong>
                        <p>ATS cannot read tables, columns, headers/footers, or images. Use a clean single-column layout with standard section headings.</p>
                      </div>
                    </div>
                    <div className="ats-insight-item">
                      <span className="ats-insight-icon" style={{ color: '#74c0fc' }}>🔑</span>
                      <div>
                        <strong>Keywords must be exact</strong>
                        <p>ATS does exact keyword matching. Write "React.js" if the JD says "React.js" — not just "React". Include both acronyms and full forms (e.g., "ML" and "Machine Learning").</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score guide */}
                {result.jd_match_score != null && (
                  <div className="ats-jd-guide mt-4">
                    <div className="ats-insight-title mb-3">📈 Your JD Match: {result.jd_match_score}% — What it means</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { range: '70–100%', label: 'Strong', desc: 'Likely to pass ATS', color: '#22c55e', active: result.jd_match_score >= 70 },
                        { range: '40–69%', label: 'Moderate', desc: 'Add more JD keywords', color: '#f59e0b', active: result.jd_match_score >= 40 && result.jd_match_score < 70 },
                        { range: '0–39%', label: 'Low', desc: 'High risk of rejection', color: '#ef4444', active: result.jd_match_score < 40 },
                      ].map(b => (
                        <div key={b.range} style={{
                          flex: 1, minWidth: 120, padding: '10px 14px', borderRadius: 8,
                          background: b.active ? `${b.color}18` : '#111',
                          border: `1.5px solid ${b.active ? b.color : '#222'}`,
                        }}>
                          <div style={{ fontSize: '0.7rem', color: b.active ? b.color : '#444', fontWeight: 700 }}>{b.range}</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: b.active ? b.color : '#333' }}>{b.label}</div>
                          <div style={{ fontSize: '0.72rem', color: b.active ? '#aaa' : '#333' }}>{b.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </Card.Body>
            </Card>

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

                  {/* Before / After Score Comparison */}
                  <div className="ats-improve-section mb-3">
                    <div className="ats-improve-section-title">📊 Score Improvement</div>
                    <div className="ats-score-compare mt-2">
                      {/* ATS Score */}
                      <div className="ats-compare-row">
                        <span className="ats-compare-label">Resume Quality</span>
                        <div className="ats-compare-bars">
                          <div className="ats-compare-bar-wrap">
                            <span className="ats-compare-tag">Before</span>
                            <div className="ats-compare-bar">
                              <div className="ats-compare-fill" style={{ width: `${result?.score ?? 0}%`, background: '#ff6b35' }} />
                            </div>
                            <span className="ats-compare-pct" style={{ color: '#ff6b35' }}>{result?.score ?? '—'}%</span>
                          </div>
                          <div className="ats-compare-bar-wrap">
                            <span className="ats-compare-tag">After</span>
                            <div className="ats-compare-bar">
                              <div className="ats-compare-fill" style={{ width: `${improveResult.estimated_ats_score ?? 0}%`, background: '#22c55e' }} />
                            </div>
                            <span className="ats-compare-pct" style={{ color: '#22c55e' }}>
                              {improveResult.estimated_ats_score != null ? `${improveResult.estimated_ats_score}%` : '—'}
                              {improveResult.estimated_ats_score != null && result?.score != null && (
                                <span className="ats-compare-delta">+{Math.max(0, improveResult.estimated_ats_score - result.score)}%</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* JD Match Score */}
                      {result?.jd_match_score != null && (
                        <div className="ats-compare-row mt-2">
                          <span className="ats-compare-label">JD Match</span>
                          <div className="ats-compare-bars">
                            <div className="ats-compare-bar-wrap">
                              <span className="ats-compare-tag">Before</span>
                              <div className="ats-compare-bar">
                                <div className="ats-compare-fill" style={{ width: `${result.jd_match_score}%`, background: result.jd_match_score >= 70 ? '#22c55e' : result.jd_match_score >= 40 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                              <span className="ats-compare-pct" style={{ color: '#f59e0b' }}>{result.jd_match_score}%</span>
                            </div>
                            <div className="ats-compare-bar-wrap">
                              <span className="ats-compare-tag">After</span>
                              <div className="ats-compare-bar">
                                <div className="ats-compare-fill" style={{ width: `${improveResult.estimated_jd_score ?? 0}%`, background: '#22c55e' }} />
                              </div>
                              <span className="ats-compare-pct" style={{ color: '#22c55e' }}>
                                {improveResult.estimated_jd_score != null ? `${improveResult.estimated_jd_score}%` : '—'}
                                {improveResult.estimated_jd_score != null && (
                                  <span className="ats-compare-delta">+{Math.max(0, improveResult.estimated_jd_score - result.jd_match_score)}%</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="ats-compare-note mt-2">* Estimates based on keywords added. Re-run ATS check to see exact scores.</p>
                    </div>
                  </div>

                  {improveResult.changes_made?.length ? (
                    <div className="ats-improve-section mb-3">
                      <div className="ats-improve-section-title">🔄 Changes Made</div>
                      <ul className="ats-improve-list">
                        {improveResult.changes_made.map((c, i) => <li key={i}><span className="dot-ok-sm">✓</span>{c}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {(improveResult.jd_keywords_added?.length || improveResult.keywords_added?.length) ? (
                    <div className="ats-improve-section mb-3">
                      <div className="ats-improve-section-title">🔑 Keywords Added</div>
                      {improveResult.jd_keywords_added?.length ? (
                        <>
                          <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700, marginBottom: 4, marginTop: 6 }}>JD Keywords (boost match score)</div>
                          <div className="ats-kw-wrap mb-2">
                            {improveResult.jd_keywords_added.map((k, i) => <span key={i} className="ats-kw ats-kw-green">{k}</span>)}
                          </div>
                        </>
                      ) : null}
                      {improveResult.keywords_added?.length ? (
                        <>
                          <div style={{ fontSize: '0.7rem', color: '#ff6b35', fontWeight: 700, marginBottom: 4, marginTop: 6 }}>ATS Keywords (boost quality score)</div>
                          <div className="ats-kw-wrap">
                            {improveResult.keywords_added.map((k, i) => <span key={i} className="ats-kw ats-kw-orange">{k}</span>)}
                          </div>
                        </>
                      ) : null}
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

      {/* ===== Paywall Modal ===== */}
      <Modal show={showPaywall} onHide={() => setShowPaywall(false)} centered dialogClassName="ats-modal-dark">
        <Modal.Body style={{ padding: 0 }}>
          <div style={{ background: 'linear-gradient(160deg,#0d0d0f,#111116)', borderRadius: 16, padding: '36px 28px', textAlign: 'center' }}>
            {/* Icon */}
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>
              {usage?.isSubscribed && (usage?.remaining ?? 0) <= 0 ? '🔒' : '⭐'}
            </div>

            {usage?.isSubscribed && (usage?.remaining ?? 0) <= 0 ? (
              <>
                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Limit Reached</div>
                <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 20 }}>
                  You have used all <strong style={{ color: '#fff' }}>20</strong> ATS checks included in your subscription.
                  <br />Please contact support for assistance.
                </p>
                <Button style={{ background: '#ff7a00', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700 }} onClick={() => setShowPaywall(false)}>
                  Close
                </Button>
              </>
            ) : (
              <>
                <div style={{ color: '#ff7a00', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Subscribe to Continue</div>
                <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 6 }}>
                  You've used your <strong style={{ color: '#fff' }}>1 free ATS check</strong>.
                </p>
                <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 24 }}>
                  Subscribe to get <strong style={{ color: '#ff7a00' }}>20 ATS checks</strong>, AI resume improvements,<br />
                  career roadmap insights and more.
                </p>

                {/* Feature list */}
                <div style={{ background: '#0a0a0e', border: '1px solid #1e1e24', borderRadius: 12, padding: '14px 18px', marginBottom: 22, textAlign: 'left' }}>
                  {[
                    '✅ 20 ATS resume checks',
                    '✅ AI-powered resume improvements',
                    '✅ Job description keyword matching',
                    '✅ Career roadmap & package insights',
                    '✅ PDF & DOCX resume download',
                  ].map((f, i) => (
                    <div key={i} style={{ color: '#ccc', fontSize: '0.82rem', padding: '4px 0', borderBottom: i < 4 ? '1px solid #1e1e24' : 'none' }}>{f}</div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Button
                    style={{ background: 'linear-gradient(135deg,#ff7a00,#ff9a3c)', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: '0.95rem' }}
                    onClick={() => { setShowPaywall(false); window.location.href = '/student/subscription'; }}
                  >
                    🔓 View Plans
                  </Button>
                  <Button
                    style={{ background: 'transparent', border: '1px solid #2a2a32', borderRadius: 10, padding: '10px 20px', color: '#888', fontWeight: 600, fontSize: '0.85rem' }}
                    onClick={() => setShowPaywall(false)}
                  >
                    Maybe Later
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <style>{`
        .ats-root { background: #060608; min-height: 100vh; color: #f0f0f0; }

        .ats-header { text-align: center; }
        .ats-usage-bar { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,122,0,0.06); border: 1px solid rgba(255,122,0,0.18); border-radius: 30px; padding: 7px 18px; margin-top: 14px; font-size: 0.78rem; flex-wrap: wrap; justify-content: center; }
        .ats-usage-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ats-usage-dot.subscribed { background: #ff7a00; box-shadow: 0 0 6px #ff7a0066; }
        .ats-usage-dot.free { background: #22c55e; box-shadow: 0 0 6px #22c55e66; }
        .ats-usage-dot.locked { background: #ef4444; box-shadow: 0 0 6px #ef444466; }
        .ats-usage-label { font-weight: 700; color: #ff7a00; }
        .ats-usage-count { color: #888; }
        .ats-usage-track { width: 80px; height: 5px; background: #1e1e24; border-radius: 3px; overflow: hidden; }
        .ats-usage-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
        .ats-usage-left { font-weight: 700; }
        .ats-usage-hint { color: #555; font-size: 0.72rem; }
        .ats-upgrade-pill { background: linear-gradient(135deg,#ff7a00,#ff9a3c); border: none; border-radius: 20px; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 4px 14px; cursor: pointer; white-space: nowrap; }
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

        /* 3-box score row */
        .ats-sbox { background: linear-gradient(160deg, #0a0a0e, #0e0e14); border: 1px solid #1e1e24; border-radius: 14px; }
        .ats-sbox-jd { border-top: 3px solid #22c55e; }
        .ats-sbox-ats { border-top: 3px solid #ff6b35; }
        .ats-sbox-health { border-top: 3px solid #74c0fc; }
        .ats-sbox-label { font-size: 0.72rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .ats-sbox-verdict { font-size: 0.75rem; color: #888; line-height: 1.5; }
        .ats-health-row { }
        .ats-health-item { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #13131a; }
        .ats-health-item:last-child { border-bottom: none; }
        .ats-health-key { font-size: 0.78rem; color: #666; }
        .ats-health-val { font-size: 0.82rem; font-weight: 700; }

        /* Primary JD ring */
        .ats-primary-label { font-size: 0.72rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .ats-primary-badge { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); border-radius: 20px; padding: 1px 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .ats-ring { --score: 0; width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(#ff6b35 calc(var(--score) * 1%), rgba(255,255,255,0.05) calc(var(--score) * 1%)); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 24px rgba(255,107,53,0.15); }
        .ats-ring-inner { width: 152px; height: 152px; border-radius: 50%; background: linear-gradient(135deg, #0e0e14, #0a0a0e); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid rgba(255,107,53,0.25); }
        .ats-ring-jd { background: conic-gradient(#22c55e calc(var(--score) * 1%), rgba(255,255,255,0.04) calc(var(--score) * 1%)); box-shadow: 0 0 28px rgba(34,197,94,0.18); }
        .ats-ring-inner-jd { border-color: rgba(34,197,94,0.2); }
        .ats-score-num { font-size: 2.6rem; font-weight: 900; color: #ff6b35; line-height: 1; }
        .ats-score-grade { font-size: 0.9rem; color: #888; font-weight: 600; }
        .ats-score-label { font-size: 1.05rem; font-weight: 700; color: #f0f0f0; }
        .ats-score-desc { font-size: 0.78rem; color: #666; max-width: 200px; line-height: 1.4; }
        .ats-jd-verdict { font-size: 0.75rem; color: #888; text-align: center; line-height: 1.4; }
        .ats-score-divider { height: 1px; background: linear-gradient(90deg, transparent, #2a2a36, transparent); }

        /* Secondary ATS mini ring */
        .ats-secondary-label { font-size: 0.7rem; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .ats-secondary-badge { background: rgba(255,107,53,0.1); color: #ff6b35; border: 1px solid rgba(255,107,53,0.25); border-radius: 20px; padding: 1px 8px; font-size: 0.62rem; font-weight: 700; text-transform: uppercase; }
        .ats-mini-ring-row { display: flex; align-items: center; gap: 14px; width: 100%; }
        .ats-ring-mini { width: 90px; height: 90px; flex-shrink: 0; background: conic-gradient(#ff6b35 calc(var(--score) * 1%), rgba(255,255,255,0.04) calc(var(--score) * 1%)); box-shadow: 0 0 14px rgba(255,107,53,0.1); }
        .ats-ring-inner-mini { width: 74px; height: 74px; border-color: rgba(255,107,53,0.2); }
        .ats-score-num-mini { font-size: 1.4rem; font-weight: 900; color: #ff6b35; line-height: 1; }
        .ats-mini-ring-info { flex: 1; text-align: left; }
        .ats-no-jd-hint { background: rgba(255,209,102,0.06); border: 1px solid rgba(255,209,102,0.15); border-radius: 8px; padding: 0.55rem 0.85rem; font-size: 0.75rem; color: #9a8a50; line-height: 1.5; text-align: center; }
        .ats-no-jd-hint strong { color: #ffd166; }
        .ats-company-pill { background: rgba(255,255,255,0.05); border: 1px solid #2a2a32; border-radius: 20px; padding: 0.3rem 0.9rem; font-size: 0.78rem; color: #ccc; }

        /* Info tooltip */
        .ats-info-anchor { position: relative; display: inline-flex; align-items: center; }
        .ats-info-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 16px; height: 16px; border-radius: 50%;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2);
          color: #aaa; font-size: 0.7rem; font-weight: 700; cursor: pointer;
          font-style: normal; line-height: 1; user-select: none;
        }
        .ats-info-tip {
          display: none; position: absolute; left: 50%; top: 1.8rem;
          transform: translateX(-50%); z-index: 200;
          background: #1a1a24; border: 1px solid #2a2a36;
          border-radius: 10px; padding: 12px 14px;
          width: 260px; text-align: left;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          color: #ccc; font-size: 0.75rem; line-height: 1.5;
        }
        .ats-info-tip strong { color: #fff; font-size: 0.82rem; display: block; margin-bottom: 6px; }
        .ats-info-tip p { margin: 0 0 6px; }
        .ats-info-tip ul { margin: 6px 0 0; padding-left: 14px; }
        .ats-info-tip ul li { margin-bottom: 3px; }
        .ats-info-anchor:hover .ats-info-tip { display: block; }
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

        /* Company ATS process note */
        .ats-process-note { display: flex; gap: 0.75rem; align-items: flex-start; background: rgba(34,197,94,0.07); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; padding: 0.9rem 1rem; }
        .ats-process-note-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .ats-process-note strong { font-size: 0.85rem; color: #22c55e; display: block; margin-bottom: 4px; }
        .ats-process-note p { font-size: 0.78rem; color: #888; line-height: 1.55; margin: 0; }
        .ats-process-note p strong { display: inline; font-size: inherit; color: #ccc; }

        /* Company ATS funnel */
        .ats-funnel { display: flex; flex-direction: column; gap: 0; }
        .ats-funnel-step { display: flex; flex-direction: column; align-items: center; }
        .ats-funnel-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; margin-bottom: 8px; }
        .ats-funnel-body { width: 100%; background: #0d0d14; border: 1px solid #1e1e2e; border-radius: 10px; padding: 12px 16px; margin-bottom: 2px; }
        .ats-funnel-highlight { background: #0d0d1a; border-color: rgba(13,110,253,0.3); }
        .ats-funnel-title { font-size: 0.88rem; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .ats-funnel-num { width: 20px; height: 20px; border-radius: 50%; font-size: 0.68rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ats-funnel-desc { font-size: 0.78rem; color: #888; line-height: 1.5; }
        .ats-funnel-arrow { font-size: 1.1rem; color: #333; margin: 3px 0; }
        .ats-insight-box { background: #080810; border: 1px solid #1a1a28; border-radius: 12px; padding: 1.25rem; }
        .ats-insight-title { font-size: 0.85rem; font-weight: 700; color: #ddd; margin-bottom: 1rem; }
        .ats-insight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
        @media (max-width: 600px) { .ats-insight-grid { grid-template-columns: 1fr; } }
        .ats-insight-item { display: flex; gap: 0.6rem; align-items: flex-start; }
        .ats-insight-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
        .ats-insight-item strong { font-size: 0.82rem; color: #ddd; display: block; margin-bottom: 3px; }
        .ats-insight-item p { font-size: 0.75rem; color: #777; line-height: 1.5; margin: 0; }
        .ats-jd-guide { background: #080810; border: 1px solid #1a1a28; border-radius: 12px; padding: 1.25rem; }

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
        .ats-score-compare { }
        .ats-compare-row { }
        .ats-compare-label { font-size: 0.72rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 5px; }
        .ats-compare-bars { display: flex; flex-direction: column; gap: 5px; }
        .ats-compare-bar-wrap { display: flex; align-items: center; gap: 6px; }
        .ats-compare-tag { font-size: 0.65rem; color: #555; width: 32px; flex-shrink: 0; }
        .ats-compare-bar { flex: 1; height: 8px; background: #111; border-radius: 4px; overflow: hidden; }
        .ats-compare-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .ats-compare-pct { font-size: 0.72rem; font-weight: 700; min-width: 36px; display: flex; align-items: center; gap: 3px; }
        .ats-compare-delta { font-size: 0.62rem; background: rgba(34,197,94,0.15); color: #22c55e; border-radius: 4px; padding: 1px 4px; font-weight: 700; }
        .ats-compare-note { font-size: 0.65rem; color: #444; font-style: italic; margin: 0; }
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
          .ats-ring-mini { width: 72px; height: 72px; }
          .ats-ring-inner-mini { width: 58px; height: 58px; }
          .ats-score-num-mini { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
};

export default ATSChecker;

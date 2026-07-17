import { useAuthContext } from "@/context/useAuthContext";
import React, { useState, useRef, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { TEMPLATES, parseResume, downloadResumePdf, downloadResumeDocx } from "./resumeTemplates";
import ResumePreview from "./ResumePreview";
import {
  Upload, CheckCircle, Building2, FileText, BarChart3, Trophy,
  Shield, ArrowRight, Target, Trash2, AlertCircle, Sparkles, Eye,
  Check, ChevronRight,
} from 'lucide-react';

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

interface RecentAnalysis {
  company: string;
  score: number;
  jdScore: number | null;
  date: string;
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
  usageCount: number; isSubscribed: boolean; remaining: number; limit: number; canUse: boolean;
}

const ORANGE = '#f97316';
const BORDER = 'var(--dash-border, #e5e7eb)';
const GRAY = 'var(--dash-gray, #6b7280)';
const BG = 'var(--dash-page-bg, #f8fafc)';
const CARD_BG = 'var(--dash-card-bg, #ffffff)';
const TEXT = 'var(--dash-text, #0f172a)';

const ATS_STEPS = [
  { label: 'Upload Resume',    sub: 'Upload your resume' },
  { label: 'Add Company & JD', sub: 'Add company and job description' },
  { label: 'AI Analysis',      sub: 'We analyze your resume' },
  { label: 'Get Report',       sub: 'View detailed report' },
];

const HOW_WORKS = [
  { icon: <Upload size={15} color={ORANGE} />, title: 'Upload Resume', desc: 'Upload your PDF or DOC resume file' },
  { icon: <Building2 size={15} color={ORANGE} />, title: 'Add Company & JD', desc: 'Optionally add company name and job description' },
  { icon: <BarChart3 size={15} color={ORANGE} />, title: 'AI Analysis', desc: 'Our AI scans your resume against ATS criteria' },
  { icon: <Trophy size={15} color={ORANGE} />, title: 'Get Detailed Report', desc: 'Receive score, feedback and improvement tips' },
];

const TIPS = [
  { icon: <Check size={13} color={ORANGE} />, text: 'Use standard section headings like "Experience" and "Skills"' },
  { icon: <Check size={13} color={ORANGE} />, text: 'Include keywords from the job description naturally' },
  { icon: <Check size={13} color={ORANGE} />, text: 'Avoid tables, columns, and graphics in your resume' },
  { icon: <Check size={13} color={ORANGE} />, text: 'Save your resume as PDF before uploading' },
];

const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626';
const scoreLabel = (s: number) => s >= 70 ? 'Good Match' : s >= 40 ? 'Average Match' : 'Low Match';
const scoreBg = (s: number) => s >= 70 ? '#f0fdf4' : s >= 40 ? '#fffbeb' : '#fef2f2';
const scoreBorder = (s: number) => s >= 70 ? '#bbf7d0' : s >= 40 ? '#fde68a' : '#fecaca';

const CircleScore: React.FC<{ score: number; size?: number }> = ({ score, size = 44 }) => {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BORDER} strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={size/2} y={size/2 + 4} textAnchor="middle" fontSize={size < 44 ? 9 : 11} fontWeight="800" fill={color}>{score}%</text>
    </svg>
  );
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const [improving, setImproving] = useState(false);
  const [improveResult, setImproveResult] = useState<ImproveResult | null>(null);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(1);
  const [previewMode, setPreviewMode] = useState<"preview" | "raw">("preview");

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!user?.token) return;
    const isSubscribed = (user as any)?.status?.toLowerCase() === 'approved';
    fetch(`${baseURL}/api/resume/ats-usage`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.json())
      .then(data => {
        const MAX = 20; const count = data.usageCount || 0;
        setUsage({
          usageCount: count, isSubscribed,
          remaining: isSubscribed ? Math.max(0, MAX - count) : count === 0 ? 1 : 0,
          limit: MAX, canUse: count === 0 || (isSubscribed && count < MAX),
        });
      }).catch(() => {});
  }, [user?.token]);

  const applyFile = (f: File) => {
    if (fileObjectUrl) URL.revokeObjectURL(fileObjectUrl);
    setFile(f);
    setFileObjectUrl(URL.createObjectURL(f));
    setError(""); setResult(null); setImproveResult(null); setCurrentStep(1);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; applyFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files?.[0]; if (!f) return; applyFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please upload a resume"); return; }
    if (usage && !usage.canUse) { setShowPaywall(true); return; }
    const fd = new FormData();
    fd.append("resume", file);
    if (companyName.trim()) fd.append("company_name", companyName.trim());
    if (jobDescription.trim()) fd.append("job_description", jobDescription.trim());
    try {
      setLoading(true); setError(""); setResult(null); setImproveResult(null);
      setCurrentStep(3);
      const res = await fetch(`${baseURL}/api/resume/check-ats`, {
        method: "POST", headers: { Authorization: `Bearer ${user?.token}` }, body: fd,
      });
      if (res.status === 403) { setShowPaywall(true); return; }
      if (!res.ok) throw new Error("Failed to analyze resume");
      const data = await res.json();
      setResult(data);
      setCurrentStep(4);
      setRecentAnalyses(prev => [{
        company: companyName.trim() || 'General',
        score: data.score,
        jdScore: data.jd_match_score ?? null,
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      }, ...prev].slice(0, 3));
      setUsage(prev => {
        if (!prev) return prev;
        const newCount = prev.usageCount + 1;
        const newRemaining = Math.max(0, prev.remaining - 1);
        return { ...prev, usageCount: newCount, remaining: newRemaining, canUse: prev.isSubscribed ? newRemaining > 0 : false };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume");
      setCurrentStep(2);
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
          resume_text: result.resume_text, missing_keywords: result.missing_keywords,
          jd_missing_keywords: result.jd_missing_keywords, jd_matched_keywords: result.jd_matched_keywords,
          section_feedback: result.section_feedback, job_description: jobDescription,
          company_name: companyName, current_ats_score: result.score,
          current_jd_score: result.jd_match_score ?? null,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate improvements");
      const data = await res.json();
      setImproveResult(data); setPreviewMode("preview"); setShowImproveModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate improvements");
    } finally { setImproving(false); }
  };

  const handleCopy = () => {
    if (improveResult?.full_improved_resume) {
      navigator.clipboard.writeText(improveResult.full_improved_resume);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const fileName = `improved_resume${companyName ? `_${companyName.replace(/\s+/g, "_")}` : ""}`;
  const handleDownloadPdf = () => { if (improveResult?.full_improved_resume) downloadResumePdf(parseResume(improveResult.full_improved_resume), selectedTemplate, fileName); };
  const handleDownloadDocx = async () => { if (improveResult?.full_improved_resume) await downloadResumeDocx(parseResume(improveResult.full_improved_resume), selectedTemplate, fileName); };

  const isPDF = file?.type === "application/pdf";
  const sections = result?.resume_text ? detectSections(result.resume_text) : null;
  const presentCount = sections ? Object.values(sections).filter(Boolean).length : 0;
  const activeStep = currentStep === 1 ? 0 : currentStep === 2 ? 1 : currentStep === 3 ? 2 : 3;

  const scoreGrade = (s: number) => s >= 80 ? 'A+' : s >= 70 ? 'A' : s >= 60 ? 'B+' : s >= 50 ? 'B' : s >= 40 ? 'C' : 'D';

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}`, padding: '16px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Target size={20} color={ORANGE} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, lineHeight: 1.2 }}>ATS Resume Checker</h1>
            <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>Get an AI-powered ATS score with keyword analysis and improvement tips</p>
          </div>

          {usage && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: BG, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '6px 14px', fontSize: 12, flexShrink: 0 }}>
              {usage.isSubscribed ? (
                <>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: ORANGE }} />
                  <span style={{ fontWeight: 700, color: ORANGE }}>Subscribed</span>
                  <span style={{ color: GRAY }}>{usage.usageCount}/{usage.limit} used</span>
                  <span style={{ color: usage.remaining <= 5 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{usage.remaining} left</span>
                </>
              ) : usage.usageCount === 0 ? (
                <>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>1 Free Check Available</span>
                </>
              ) : (
                <>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626' }} />
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>Free limit reached</span>
                  <button onClick={() => setShowPaywall(true)} style={{ background: ORANGE, border: 'none', color: '#fff', borderRadius: 12, padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Subscribe</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2-column body */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 310px', gap: 20, alignItems: 'flex-start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 4-step progress bar */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {ATS_STEPS.map((s, i) => {
                const isDone = i < activeStep;
                const isActive = i === activeStep;
                const labelColor = isActive ? ORANGE : GRAY;
                const subColor = isActive ? ORANGE : GRAY;
                return (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: (isDone || isActive) ? ORANGE : CARD_BG,
                        border: (isDone || isActive) ? 'none' : `2px solid ${BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: (isDone || isActive) ? '#fff' : GRAY,
                        fontSize: 13, fontWeight: 800, boxSizing: 'border-box',
                        boxShadow: (isDone || isActive) ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
                      }}>
                        {isDone ? <Check size={14} /> : i + 1}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: labelColor, lineHeight: 1.3 }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: subColor, marginTop: 2, lineHeight: 1.3 }}>{s.sub}</div>
                      </div>
                    </div>
                    {i < ATS_STEPS.length - 1 && (
                      <div style={{ flexShrink: 0, margin: '0 8px', color: i < activeStep ? ORANGE : BORDER, fontSize: 18, lineHeight: 1 }}>→</div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── STEP 1: Upload Resume ── */}
          {currentStep === 1 && (
            <>
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: file ? '#f0fdf4' : '#fff7ed', border: `1.5px solid ${file ? '#bbf7d0' : '#fed7aa'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {file ? <Check size={13} color="#16a34a" /> : <span style={{ fontSize: 11, fontWeight: 800, color: ORANGE }}>1</span>}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Upload Your Resume</h3>
                </div>

                {/* Drag & drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? ORANGE : file ? '#bbf7d0' : BORDER}`,
                    borderRadius: 12, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                    background: isDragging ? '#fff7ed' : file ? '#f0fdf4' : BG, transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: file ? '#dcfce7' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    {file ? <CheckCircle size={24} color="#16a34a" /> : <Upload size={24} color={ORANGE} />}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: GRAY, marginBottom: 4 }}>
                    {file ? file.name : 'Drag & drop your resume here'}
                  </div>
                  <div style={{ fontSize: 12, color: GRAY, marginBottom: 12 }}>
                    {file ? `${(file.size / 1024).toFixed(0)} KB — ready to analyze` : 'or'}
                  </div>
                  {!file && (
                    <div style={{ display: 'inline-block', background: CARD_BG, border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: '8px 22px', fontSize: 13, fontWeight: 600, color: GRAY }}>
                      Choose File
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />
                </div>

                {/* File preview row */}
                {file && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} color="#dc2626" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: GRAY }}>{(file.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                    <button onClick={e => { e.stopPropagation(); setFile(null); setFileObjectUrl(null); setResult(null); setCurrentStep(1); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: GRAY, padding: 4, display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
                <div style={{ fontSize: 11, color: GRAY, marginTop: 8 }}>Supported formats: PDF, DOC, DOCX — max 5MB</div>
              </div>

              {/* Tips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {TIPS.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{tip.icon}</div>
                    <span style={{ fontSize: 11, color: GRAY, lineHeight: 1.5 }}>{tip.text}</span>
                  </div>
                ))}
              </div>

              {/* Next button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  disabled={!file}
                  onClick={() => { setCurrentStep(2); setError(''); }}
                  style={{
                    background: file ? ORANGE : BORDER, color: file ? '#fff' : GRAY,
                    border: 'none', borderRadius: 10, padding: '12px 32px',
                    fontSize: 14, fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: file ? '0 2px 10px rgba(249,115,22,0.35)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Company + JD ── */}
          {currentStep === 2 && (
            <>
              {/* Company Details */}
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: ORANGE }}>2</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Company Details</h3>
                  <span style={{ fontSize: 11, background: BG, color: GRAY, borderRadius: 10, padding: '2px 8px', fontWeight: 500 }}>Optional</span>
                </div>
                <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, display: 'block', marginBottom: 6 }}>Company Name</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={15} color={GRAY} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text" placeholder="e.g. Google, Infosys, Amazon"
                    value={companyName} onChange={e => setCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 34px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: GRAY, background: CARD_BG, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = ORANGE}
                    onBlur={e => e.target.style.borderColor = BORDER}
                  />
                </div>
              </div>

              {/* Job Description */}
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: ORANGE }}>3</span>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Job Description</h3>
                  <span style={{ fontSize: 11, background: '#fff7ed', color: ORANGE, borderRadius: 10, padding: '2px 8px', fontWeight: 600, border: `1px solid #fed7aa` }}>Recommended</span>
                </div>
                <label style={{ fontSize: 12, fontWeight: 600, color: GRAY, display: 'block', marginBottom: 6 }}>Paste Job Description</label>
                <textarea
                  rows={6}
                  placeholder="Paste the job description here. We'll extract keywords and match them against your resume for a company-specific ATS score..."
                  value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`, borderRadius: 9, fontSize: 13, color: GRAY, background: CARD_BG, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = ORANGE}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <div style={{ fontSize: 11, color: GRAY, marginTop: 6 }}>Providing a JD enables role-specific keyword matching and AI-powered improvements</div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              {/* Security notice */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: GRAY }}>
                <Shield size={13} color="#16a34a" />
                <span>Your data is secure and confidential. We never store your resume content.</span>
              </div>

              {/* Back + Analyze buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  style={{ background: CARD_BG, border: `1.5px solid ${BORDER}`, color: GRAY, borderRadius: 10, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ background: ORANGE, border: 'none', color: '#fff', borderRadius: 10, padding: '12px 32px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 10px rgba(249,115,22,0.35)', opacity: loading ? 0.8 : 1 }}
                >
                  Analyze Now <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Loading / AI Analysis ── */}
          {currentStep === 3 && (
            <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 20px' }}>
                <svg width="72" height="72" style={{ position: 'absolute', inset: 0 }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke={BORDER} strokeWidth="5" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={ORANGE} strokeWidth="5"
                    strokeDasharray="60 130" strokeLinecap="round"
                    style={{ transformOrigin: '50% 50%', animation: 'atsSpin 1.2s linear infinite' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={24} color={ORANGE} />
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Analyzing your resume...</div>
              <div style={{ fontSize: 13, color: GRAY, marginBottom: 4 }}>AI is scanning keywords, sections and matching job description</div>
              <div style={{ fontSize: 12, color: GRAY }}>This may take 20–30 seconds</div>
            </div>
          )}

          {/* ── STEP 4: Results ── */}
          {currentStep === 4 && result && (
            <>
              {/* Top action bar */}
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <CheckCircle size={16} color="#16a34a" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Analysis Complete!</span>
                  {result.company_name && <span style={{ fontSize: 12, color: GRAY }}>— {result.company_name}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setCurrentStep(2)}
                    style={{ background: CARD_BG, border: `1px solid ${BORDER}`, color: GRAY, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    ← Edit Details
                  </button>
                  <button onClick={() => setShowResumeModal(true)}
                    style={{ background: BG, border: `1px solid ${BORDER}`, color: GRAY, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Eye size={13} /> View Resume
                  </button>
                  <button onClick={handleImprove} disabled={improving}
                    style={{ background: ORANGE, border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: improving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: improving ? 0.7 : 1 }}>
                    {improving
                      ? <><span style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'atsSpin 0.7s linear infinite', display: 'inline-block' }} /> Improving...</>
                      : <><Sparkles size={13} /> AI Improve</>}
                  </button>
                </div>
              </div>

              {/* Error (if any) */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}
            </>
          )}

          {/* ── Results content (step 4) ── */}
          {currentStep === 4 && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'atsFadeUp 0.4s ease-out' }}>

              {/* Score cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {/* JD Match */}
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center', borderTop: `3px solid #16a34a` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Job Match Score <span style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 10, padding: '1px 7px', border: '1px solid #bbf7d0', fontSize: 9, marginLeft: 4 }}>Most Important</span>
                  </div>
                  {result.jd_match_score != null ? (
                    <>
                      <div style={{ margin: '8px 0' }}>
                        <CircleScore score={Math.round(animatedJd)} size={80} />
                      </div>
                      <div style={{ fontSize: 12, color: scoreColor(result.jd_match_score), fontWeight: 600 }}>
                        {result.jd_match_score >= 70 ? '✅ Likely to pass ATS' : result.jd_match_score >= 40 ? '⚠️ Add more JD keywords' : '❌ High rejection risk'}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#92400e', marginTop: 8 }}>
                      💡 Paste a Job Description to unlock your JD Match score
                    </div>
                  )}
                </div>

                {/* ATS Quality Score */}
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center', borderTop: `3px solid ${ORANGE}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Resume Quality Score <span style={{ background: '#fff7ed', color: ORANGE, borderRadius: 10, padding: '1px 7px', border: '1px solid #fed7aa', fontSize: 9, marginLeft: 4 }}>General</span>
                  </div>
                  <div style={{ margin: '8px 0' }}>
                    <CircleScore score={Math.round(animatedScore)} size={80} />
                  </div>
                  <div style={{ fontSize: 12, color: scoreColor(result.score), fontWeight: 600 }}>
                    Grade: {scoreGrade(result.score)}
                  </div>
                </div>

                {/* Resume Health */}
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 16px', borderTop: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Resume Health</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, marginBottom: 8 }}>Sections Detected</div>
                  <div style={{ background: BORDER, borderRadius: 4, height: 6, marginBottom: 4 }}>
                    <div style={{ width: `${(presentCount / SECTION_DEFS.length) * 100}%`, background: presentCount >= 6 ? '#16a34a' : presentCount >= 4 ? '#d97706' : '#dc2626', height: '100%', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: GRAY, marginBottom: 8 }}>{presentCount} of {SECTION_DEFS.length} sections found</div>
                  {[
                    { label: 'Overall Grade', value: scoreGrade(result.score), color: scoreColor(result.score) },
                    { label: 'ATS Readability', value: result.score >= 60 ? 'Good' : 'Needs work', color: result.score >= 60 ? '#16a34a' : '#dc2626' },
                    ...(result.jd_match_score != null ? [{ label: 'JD Match', value: `${result.jd_match_score}%`, color: scoreColor(result.jd_match_score) }] : []),
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${BORDER}`, fontSize: 11 }}>
                      <span style={{ color: GRAY }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Status */}
              {sections && (
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, borderLeft: '4px solid #7c3aed' }}>
                    <span>📊</span>
                    <h5 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>Resume Section Analysis</h5>
                    <span style={{ marginLeft: 'auto', background: BG, color: GRAY, borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{presentCount}/{SECTION_DEFS.length} found</span>
                  </div>
                  <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {SECTION_DEFS.map(def => {
                      const present = sections[def.key];
                      const fb = def.key === "skills" ? result.section_feedback.skills : def.key === "experience" ? result.section_feedback.experience : def.key === "projects" ? result.section_feedback.projects : null;
                      const hasIssue = fb && (fb.includes("missing") || fb.includes("limited") || fb.includes("weak"));
                      const status = !present ? "miss" : hasIssue ? "warn" : "ok";
                      const colors = { ok: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', dotBg: '#dcfce7', sym: '✓', text: '#166534' }, warn: { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', dotBg: '#fef3c7', sym: '!', text: '#92400e' }, miss: { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', dotBg: '#fee2e2', sym: '✕', text: '#991b1b' } };
                      const c = colors[status];
                      return (
                        <div key={def.key} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{def.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c.text, flex: 1 }}>{def.label}</span>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.dotBg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: c.dot, flexShrink: 0 }}>{c.sym}</span>
                          </div>
                          <p style={{ fontSize: 10, color: c.text, margin: 0, lineHeight: 1.4 }}>{status === "miss" ? def.missingMsg : fb ? fb : def.presentMsg}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* JD Match Panel */}
              {result.jd_match_score != null && (
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, borderLeft: '4px solid #d97706' }}>
                    <span>🎯</span>
                    <h5 style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0 }}>JD Match{result.company_name ? ` — ${result.company_name}` : ''}</h5>
                    <span style={{ marginLeft: 'auto', background: '#fffbeb', color: '#d97706', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700, border: '1px solid #fde68a' }}>{result.jd_match_score}% match</span>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 8 }}>✅ Keywords matched in your resume</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {result.jd_matched_keywords?.length ? result.jd_matched_keywords.map((k, i) => <span key={i} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{k}</span>) : <span style={{ fontSize: 11, color: GRAY }}>No JD keywords matched</span>}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>❌ JD keywords missing from your resume</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {result.jd_missing_keywords?.length ? result.jd_missing_keywords.map((k, i) => <span key={i} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{k}</span>) : <span style={{ color: '#16a34a', fontSize: 11 }}>All JD keywords matched! 🎉</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths + Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, borderLeft: '4px solid #16a34a' }}>
                    <span>✅</span><h5 style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>Strengths</h5>
                    <span style={{ marginLeft: 'auto', background: '#f0fdf4', color: '#16a34a', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{result.positive_points?.length || 0}</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    {result.positive_points?.length ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {result.positive_points.map((p, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < result.positive_points!.length - 1 ? `1px solid ${BORDER}` : 'none', fontSize: 12, color: GRAY, lineHeight: 1.5 }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>{p}
                          </li>
                        ))}
                      </ul>
                    ) : <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>No strengths identified</p>}
                  </div>
                </div>
                <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, borderLeft: '4px solid #dc2626' }}>
                    <span>⚠️</span><h5 style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>Areas to Improve</h5>
                    <span style={{ marginLeft: 'auto', background: '#fef2f2', color: '#dc2626', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{result.negative_points?.length || 0}</span>
                  </div>
                  <div style={{ padding: 14 }}>
                    {result.negative_points?.length ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {result.negative_points.map((p, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < result.negative_points!.length - 1 ? `1px solid ${BORDER}` : 'none', fontSize: 12, color: GRAY, lineHeight: 1.5 }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>!</span>{p}
                          </li>
                        ))}
                      </ul>
                    ) : <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>No issues found</p>}
                  </div>
                </div>
              </div>

              {/* Missing Keywords & Suggestions */}
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, borderLeft: '4px solid #0891b2' }}>
                  <span>🛠️</span><h5 style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>Missing Keywords & Suggestions</h5>
                </div>
                <div style={{ padding: 16 }}>
                  {result.missing_keywords?.length ? (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 700, color: GRAY, marginBottom: 8 }}>Add these keywords naturally to your resume:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                        {result.missing_keywords.map((k, i) => <span key={i} style={{ background: '#fff7ed', color: ORANGE, border: '1px solid #fed7aa', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{k}</span>)}
                      </div>
                    </>
                  ) : null}
                  {result.suggestions?.length ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {result.suggestions.map((s, i) => (
                        <li key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < result.suggestions.length - 1 ? `1px solid ${BORDER}` : 'none', fontSize: 12, color: GRAY, lineHeight: 1.5 }}>
                          <span style={{ color: '#0891b2', fontWeight: 700, flexShrink: 0 }}>→</span>{s}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              {/* Career Roadmap */}
              <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, borderLeft: '4px solid #059669' }}>
                  <span>💼</span><h5 style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0 }}>Career Roadmap</h5>
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { title: 'Relevant Job Roles', content: result.relevant_jobs?.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>{result.relevant_jobs.map((j, i) => <span key={i} style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{j}</span>)}</div> : <span style={{ fontSize: 11, color: GRAY }}>No matches found</span> },
                    { title: 'Average Package (Current Level)', content: <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{result.average_package_lpa || '--'}</div> },
                    { title: 'To Unlock Higher Package', content: result.next_level_changes?.length ? <ul style={{ margin: '6px 0 0', paddingLeft: 16, color: GRAY, fontSize: 12, lineHeight: 1.6 }}>{result.next_level_changes.map((item, i) => <li key={i}>{item}</li>)}</ul> : <span style={{ fontSize: 11, color: GRAY }}>No data</span> },
                    { title: 'Expert-Level Package', content: <><div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 4 }}>{result.expert_package_lpa || '--'}</div>{result.expert_track_roles?.length && <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>{result.expert_track_roles.join(', ')}</div>}</> },
                  ].map((box, i) => (
                    <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', marginBottom: 4 }}>{box.title}</div>
                      {box.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

          {/* How ATS Checker Works */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 14px' }}>How ATS Checker Works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {HOW_WORKS.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff7ed', border: `1px solid #fed7aa`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{i + 1}. {s.title}</div>
                    <div style={{ fontSize: 10, color: GRAY, lineHeight: 1.4 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why ATS Score Matters */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 12px' }}>Why ATS Score Matters?</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'radial-gradient(circle, #fff7ed, #fff)', border: `2px solid #fed7aa`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={30} color={ORANGE} />
              </div>
            </div>
            {[
              { pct: '75%', text: 'of resumes are rejected by ATS before a human sees them' },
              { pct: '70%+', text: 'JD match score needed to pass most ATS filters' },
              { pct: '3x', text: 'more interview calls with a well-optimized resume' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: ORANGE, flexShrink: 0, minWidth: 36 }}>{item.pct}</span>
                <span style={{ fontSize: 11, color: GRAY, lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Recent Analyses */}
          <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: TEXT, margin: '0 0 12px' }}>Recent Analyses</h3>
            {recentAnalyses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: GRAY }}>
                <BarChart3 size={28} color={BORDER} style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 12 }}>No analyses yet</div>
                <div style={{ fontSize: 11, color: GRAY, marginTop: 2 }}>Your recent checks will appear here</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentAnalyses.map((a, i) => {
                  const mainScore = a.jdScore ?? a.score;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < recentAnalyses.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      <CircleScore score={mainScore} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.company}</div>
                        <div style={{ fontSize: 10, color: GRAY }}>{a.date}</div>
                      </div>
                      <span style={{ background: scoreBg(mainScore), color: scoreColor(mainScore), border: `1px solid ${scoreBorder(mainScore)}`, borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {scoreLabel(mainScore)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {recentAnalyses.length > 0 && (
              <button style={{ width: '100%', marginTop: 10, padding: '8px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: GRAY, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                View All Analyses <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── View Resume Modal ── */}
      <Modal show={showResumeModal} onHide={() => setShowResumeModal(false)} size="xl" centered dialogClassName="ats-modal-light">
        <Modal.Header closeButton style={{ background: CARD_BG, borderBottom: `1px solid ${BORDER}`, padding: '12px 20px' }}>
          <Modal.Title style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>
            📄 {file?.name}
            <span style={{ fontSize: 11, color: GRAY, marginLeft: 8 }}>{file ? (file.size / 1024).toFixed(0) + ' KB' : ''}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, background: BG }}>
          {isPDF && fileObjectUrl ? (
            <iframe src={fileObjectUrl} title="Resume PDF" style={{ width: '100%', height: '82vh', border: 'none', background: CARD_BG }} />
          ) : (
            <div style={{ padding: 20 }}>
              <pre style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, color: GRAY, fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '65vh', overflowY: 'auto', fontFamily: 'Courier New, monospace' }}>
                {result?.resume_text || 'Resume text not available'}
              </pre>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ── AI Improve Modal ── */}
      <Modal show={showImproveModal} onHide={() => setShowImproveModal(false)} size="xl" centered dialogClassName="ats-modal-dark">
        <Modal.Header closeButton className="ats-modal-header">
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f0' }}>
            ✨ AI-Improved Resume{companyName ? ` — Tailored for ${companyName}` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ats-modal-body">
          {improveResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
              {/* Left: summary */}
              <div style={{ height: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Score comparison */}
                <div style={{ background: '#111116', border: '1px solid #1e1e24', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ff6b35', marginBottom: 10 }}>📊 Score Improvement</div>
                  {[
                    { label: 'Resume Quality', before: result?.score ?? 0, after: improveResult.estimated_ats_score ?? 0 },
                    ...(result?.jd_match_score != null ? [{ label: 'JD Match', before: result.jd_match_score, after: improveResult.estimated_jd_score ?? 0 }] : []),
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{row.label}</div>
                      {[{ tag: 'Before', val: row.before, color: '#ff6b35' }, { tag: 'After', val: row.after, color: '#22c55e' }].map(b => (
                        <div key={b.tag} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#555', width: 32, flexShrink: 0 }}>{b.tag}</span>
                          <div style={{ flex: 1, height: 7, background: '#111', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${b.val}%`, background: b.color, height: '100%', borderRadius: 4, transition: 'width 0.8s ease' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: b.color, minWidth: 34 }}>{b.val}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <p style={{ fontSize: 10, color: '#444', fontStyle: 'italic', margin: 0 }}>* Estimates — re-run ATS check for exact scores.</p>
                </div>

                {improveResult.changes_made?.length ? (
                  <div style={{ background: '#111116', border: '1px solid #1e1e24', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ff6b35', marginBottom: 8 }}>🔄 Changes Made</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {improveResult.changes_made.map((c, i) => (
                        <li key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#ccc', padding: '3px 0', lineHeight: 1.4 }}>
                          <span style={{ color: '#28a745', fontSize: 10, marginTop: 2 }}>✓</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Template selector */}
                <div style={{ background: '#111116', border: '1px solid #1e1e24', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ff6b35', marginBottom: 10 }}>🎨 Choose Template</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                        style={{ position: 'relative', background: selectedTemplate === t.id ? 'rgba(255,107,53,0.08)' : '#0a0a0e', border: `1.5px solid ${selectedTemplate === t.id ? '#ff6b35' : '#1e1e24'}`, borderRadius: 9, padding: 8, cursor: 'pointer', textAlign: 'left', boxShadow: selectedTemplate === t.id ? '0 0 0 2px rgba(255,107,53,0.18)' : 'none' }}>
                        <div style={{ background: '#fff', borderRadius: 4, padding: '4px 5px', height: 56, overflow: 'hidden', marginBottom: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ height: 9, borderRadius: 2, background: t.accent }} />
                          <div style={{ height: 3, borderRadius: 2, background: '#ccc', width: '55%' }} />
                          <div style={{ height: 2.5, borderRadius: 2, background: '#ddd', width: '80%' }} />
                          <div style={{ height: 2.5, borderRadius: 1, background: t.accent, opacity: 0.6, marginTop: 1 }} />
                          <div style={{ height: 2.5, borderRadius: 2, background: '#ccc', width: '90%' }} />
                          <div style={{ height: 2.5, borderRadius: 2, background: '#ccc', width: '65%' }} />
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#e0e0e0' }}>{t.name}</div>
                        <div style={{ fontSize: 9, color: '#555', lineHeight: 1.3 }}>{t.desc}</div>
                        {selectedTemplate === t.id && <span style={{ position: 'absolute', top: 6, right: 7, color: '#ff6b35', fontSize: 10, fontWeight: 800 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Downloads */}
                <div style={{ background: '#111116', border: '1px solid #1e1e24', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ff6b35', marginBottom: 2 }}>⬇️ Download Updated Resume</div>
                  <button onClick={handleDownloadDocx} style={{ background: 'rgba(23,105,255,0.12)', border: '1px solid rgba(23,105,255,0.3)', color: '#6699ff', padding: '10px 14px', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ fontSize: 20 }}>📝</span>
                    <span><div style={{ fontWeight: 700, fontSize: 12 }}>Download Word</div><div style={{ fontSize: 10, opacity: 0.75 }}>.docx — editable</div></span>
                  </button>
                  <button onClick={handleDownloadPdf} style={{ background: 'rgba(220,53,69,0.12)', border: '1px solid rgba(220,53,69,0.3)', color: '#e06c75', padding: '10px 14px', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <span><div style={{ fontWeight: 700, fontSize: 12 }}>Download PDF</div><div style={{ fontSize: 10, opacity: 0.75 }}>.pdf — ready to submit</div></span>
                  </button>
                  <button onClick={handleCopy} style={{ background: 'rgba(40,167,69,0.12)', border: '1px solid rgba(40,167,69,0.3)', color: '#4caf72', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
                  </button>
                </div>
              </div>

              {/* Right: preview */}
              <div style={{ display: 'flex', flexDirection: 'column', height: '75vh' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#111116', border: '1px solid #1e1e24', borderRadius: '10px 10px 0 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>AI-Updated Resume</span>
                  <div style={{ display: 'flex', gap: 4, background: '#0a0a0e', border: '1px solid #2a2a32', borderRadius: 8, padding: 3 }}>
                    {(['preview', 'raw'] as const).map(m => (
                      <button key={m} onClick={() => setPreviewMode(m)}
                        style={{ background: previewMode === m ? '#ff6b35' : 'transparent', border: 'none', color: previewMode === m ? '#fff' : '#666', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                        {m === 'preview' ? '👁 Preview' : '📝 Raw Text'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, border: '1px solid #1e1e24', borderTop: 'none', borderRadius: '0 0 10px 10px', overflowY: 'auto', background: '#fff' }}>
                  {previewMode === 'preview'
                    ? <ResumePreview parsed={parseResume(improveResult.full_improved_resume)} templateId={selectedTemplate} />
                    : <pre style={{ background: '#0a0a0e', border: 'none', padding: 20, color: '#d4d4d4', fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, minHeight: '100%', fontFamily: 'Courier New, monospace' }}>{improveResult.full_improved_resume}</pre>}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ── Paywall Modal ── */}
      <Modal show={showPaywall} onHide={() => setShowPaywall(false)} centered dialogClassName="ats-modal-dark">
        <Modal.Body style={{ padding: 0 }}>
          <div style={{ background: 'linear-gradient(160deg,#0d0d0f,#111116)', borderRadius: 16, padding: '36px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>
              {usage?.isSubscribed && (usage?.remaining ?? 0) <= 0 ? '🔒' : '⭐'}
            </div>
            {usage?.isSubscribed && (usage?.remaining ?? 0) <= 0 ? (
              <>
                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Limit Reached</div>
                <p style={{ color: '#888', fontSize: '0.88rem', marginBottom: 20 }}>You have used all <strong style={{ color: '#fff' }}>20</strong> ATS checks in your subscription. Please contact support.</p>
                <button style={{ background: '#ff7a00', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, color: '#fff', cursor: 'pointer' }} onClick={() => setShowPaywall(false)}>Close</button>
              </>
            ) : (
              <>
                <div style={{ color: '#ff7a00', fontWeight: 800, fontSize: '1.3rem', marginBottom: 8 }}>Subscribe to Continue</div>
                <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 6 }}>You've used your <strong style={{ color: '#fff' }}>1 free ATS check</strong>.</p>
                <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: 16 }}>Subscribe to get <strong style={{ color: '#ff7a00' }}>20 ATS checks</strong>, AI resume improvements, career roadmap insights and more.</p>
                <div style={{ background: '#0a0a0e', border: '1px solid #1e1e24', borderRadius: 12, padding: '12px 18px', marginBottom: 22, textAlign: 'left' }}>
                  {['✅ 20 ATS resume checks', '✅ AI-powered resume improvements', '✅ Job description keyword matching', '✅ Career roadmap & package insights', '✅ PDF & DOCX resume download'].map((f, i) => (
                    <div key={i} style={{ color: '#ccc', fontSize: '0.82rem', padding: '4px 0', borderBottom: i < 4 ? '1px solid #1e1e24' : 'none' }}>{f}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button style={{ background: 'linear-gradient(135deg,#ff7a00,#ff9a3c)', border: 'none', borderRadius: 10, padding: '10px 28px', fontWeight: 700, fontSize: '0.95rem', color: '#fff', cursor: 'pointer' }} onClick={() => { setShowPaywall(false); window.location.href = '/student/subscription'; }}>🔓 View Plans</button>
                  <button style={{ background: 'transparent', border: '1px solid #2a2a32', borderRadius: 10, padding: '10px 20px', color: '#888', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => setShowPaywall(false)}>Maybe Later</button>
                </div>
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <style>{`
        @keyframes atsSpin { to { transform: rotate(360deg); } }
        @keyframes atsFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .ats-modal-dark .modal-content { background: #0d0d0f; border: 1px solid #1e1e24; border-radius: 16px; color: #f0f0f0; }
        .ats-modal-header { background: #111116; border-bottom: 1px solid #1e1e24; border-radius: 16px 16px 0 0; padding: 1rem 1.25rem; }
        .ats-modal-header .btn-close { filter: invert(1) brightness(0.6); }
        .ats-modal-body { background: #0d0d0f; padding: 1.25rem; border-radius: 0 0 16px 16px; }
        .ats-modal-light .modal-content { background: var(--dash-card-bg, #ffffff); border: 1px solid var(--dash-border, #e5e7eb); border-radius: 16px; }
        @media (max-width: 900px) {
          .ats-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default ATSChecker;

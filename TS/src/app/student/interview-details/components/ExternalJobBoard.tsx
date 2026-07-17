import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import {
  FaSearch, FaMapMarkerAlt, FaBriefcase, FaExternalLinkAlt,
  FaClock, FaBuilding, FaLaptopCode, FaUserTie, FaGraduationCap,
  FaWifi, FaHandshake, FaChevronLeft, FaChevronRight, FaInfoCircle, FaBookmark, FaRegBookmark,
} from "react-icons/fa";
import { FiSliders, FiX, FiSearch as FiSearchIcon, FiChevronDown } from "react-icons/fi";
import { fetchSkillProfile, calcJobMatch, matchColor, SkillProfile } from "@/utils/jobMatch";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExternalJob {
  id: string;
  title: string;
  company: string;
  logo: string | null;
  location: string;
  isRemote: boolean;
  employmentType: string;
  salary: string | null;
  description: string;
  applyUrl: string;
  postedAt: string | null;
  skills: string[];
  experience: string | null;
  highlights: string[];
  source?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",        label: "All Jobs",     icon: <FaBriefcase />,    color: "#ff6b35" },
  { id: "it",         label: "IT / Tech",    icon: <FaLaptopCode />,   color: "#2563eb" },
  { id: "nonit",      label: "Non-IT",       icon: <FaUserTie />,      color: "#059669" },
  { id: "internship", label: "Internships",  icon: <FaGraduationCap />,color: "#7c3aed" },
  { id: "remote",     label: "Remote",       icon: <FaWifi />,         color: "#0891b2" },
  { id: "freelance",  label: "Freelance",    icon: <FaHandshake />,    color: "#d97706" },
];

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this board re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #f1f5f9)';
const CARD_BG     = 'var(--dash-card-bg, #ffffff)';
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)';
const PAGE_TEXT   = 'var(--dash-text, #0f172a)';
const PAGE_GRAY   = 'var(--dash-gray, #64748b)';

const TYPE_LABEL: Record<string, string> = {
  FULLTIME: "Full-time", PARTTIME: "Part-time",
  CONTRACTOR: "Contract", INTERN: "Internship",
};

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

// ─── Match Score ──────────────────────────────────────────────────────────────
const calcMatchScore = (job: ExternalJob, userSkills: string[]): number =>
  calcJobMatch(job.skills, `${job.title} ${job.description}`, userSkills);

// ─── Match Ring ───────────────────────────────────────────────────────────────
const MatchRing: React.FC<{ score: number; size?: number; tooltip?: string }> = ({ score, size = 46, tooltip }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = matchColor(score);
  return (
    <div className="ext-match-ring" title={tooltip || `${score}% profile match`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="ext-match-pct" style={{ color, fontSize: size / 46 * 0.58 + "rem" }}>{score}%</span>
    </div>
  );
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const EXT_AVATAR_COLORS = [
  ["#4F46E5","#EEF2FF"],["#0891B2","#ECFEFF"],["#16A34A","#F0FDF4"],
  ["#DC2626","#FEF2F2"],["#D97706","#FFFBEB"],["#7C3AED","#F5F3FF"],
  ["#DB2777","#FDF2F8"],["#0D9488","#F0FDFA"],
];
const extAvatarColor = (name: string) => EXT_AVATAR_COLORS[name.charCodeAt(0) % EXT_AVATAR_COLORS.length];
const extInitials = (name: string) => name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

// ─── Job Card ─────────────────────────────────────────────────────────────────
const ExtJobCard: React.FC<{ job: ExternalJob; score: number; matchTooltip: string; onView: (j: ExternalJob) => void; saved: boolean; onToggleSave: (id: string) => void }> = ({ job, score, matchTooltip, onView, saved, onToggleSave }) => {
  const [fg, bg] = extAvatarColor(job.company || "A");
  const badgeColor = job.source === "remotive" ? "#059669" : job.source === "arbeitnow" ? "#7c3aed" : "#ea580c";

  return (
    <div className="ext-job-card" onClick={() => onView(job)}>
      {/* Avatar */}
      <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: bg, color: fg, fontSize: "0.82rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {extInitials(job.company || "?")}
      </div>

      <div className="ext-job-body">
        {/* Row 1: title + source badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span className="ext-job-title">{job.title}</span>
          {job.source && (
            <span style={{ background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}44`, borderRadius: 6, padding: "1px 7px", fontSize: "0.62rem", fontWeight: 700 }}>
              {job.source.toUpperCase()}
            </span>
          )}
        </div>

        {/* Row 2: company + meta */}
        <div style={{ fontSize: "0.75rem", color: PAGE_GRAY, marginBottom: 8, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>{job.company}</span>
          {job.location && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><FaMapMarkerAlt size={10} />{job.location}</span>}
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><FaBriefcase size={10} />{TYPE_LABEL[job.employmentType] || job.employmentType}</span>
          {job.isRemote && <span className="ext-badge ext-badge-remote">Remote</span>}
          {job.salary && <span className="ext-salary">💰 {job.salary}</span>}
        </div>

        {/* Skills */}
        {job.skills.length > 0 && (
          <div className="ext-skills-row">
            {job.skills.slice(0, 5).map((s, i) => <span key={i} className="ext-skill-tag">{s}</span>)}
            {job.skills.length > 5 && <span className="ext-skill-more">+{job.skills.length - 5}</span>}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ alignSelf: "stretch", width: 1, background: PAGE_BORDER, flexShrink: 0 }} />

      {/* Right panel: time+bookmark on top, match ring+apply below */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, flexShrink: 0, minWidth: 190, alignSelf: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {job.postedAt ? (
            <span style={{ fontSize: "0.68rem", color: PAGE_GRAY, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}>
              <FaClock size={10} />{timeAgo(job.postedAt)}
            </span>
          ) : <span />}
          <button
            onClick={e => { e.stopPropagation(); onToggleSave(job.id); }}
            style={{ background: saved ? "rgba(255,122,0,0.1)" : "none", border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: saved ? "#ff7a00" : PAGE_GRAY, flexShrink: 0 }}
          >
            {saved ? <FaBookmark size={13} color="#ff7a00" /> : <FaRegBookmark size={13} color={PAGE_GRAY} />}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {matchTooltip ? <MatchRing score={score} tooltip={matchTooltip} size={54} /> : <span />}
          <button
            className="ext-apply-btn"
            onClick={e => { e.stopPropagation(); window.open(job.applyUrl, "_blank"); }}
          >
            <FaExternalLinkAlt style={{ marginRight: 4 }} />Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Detail Drawer ────────────────────────────────────────────────────────────
const JobDetailDrawer: React.FC<{ job: ExternalJob | null; onClose: () => void }> = ({ job, onClose }) => {
  const [imgError, setImgError] = useState(false);
  if (!job) return null;
  const initials = job.company?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const drawer = (
    <div className="ext-drawer-overlay" onClick={onClose}>
      <div className="ext-drawer" onClick={e => e.stopPropagation()}>
        <button className="ext-drawer-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="ext-drawer-header">
          <div className="ext-drawer-logo">
            {job.logo && !imgError ? (
              <img src={job.logo} alt={job.company} onError={() => setImgError(true)} />
            ) : (
              <div className="ext-logo-fallback ext-logo-lg">{initials}</div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ext-drawer-title">{job.title}</div>
            <div className="ext-drawer-company">{job.company}</div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="ext-drawer-body">
          <div className="ext-drawer-meta">
            {job.location && <div><FaMapMarkerAlt className="me-1" />{job.location}</div>}
            {job.isRemote && <span className="ext-badge ext-badge-remote">Remote</span>}
            <span className="ext-badge ext-badge-type">{TYPE_LABEL[job.employmentType] || job.employmentType}</span>
            {job.salary && <div>💰 {job.salary}</div>}
            {job.experience && <div><FaBriefcase className="me-1" />{job.experience} experience</div>}
            {job.postedAt && <div><FaClock className="me-1" />{timeAgo(job.postedAt)}</div>}
          </div>

          {job.skills.length > 0 && (
            <div className="mb-3">
              <div className="ext-section-label">Required Skills</div>
              <div className="ext-skills-row">
                {job.skills.map((s, i) => <span key={i} className="ext-skill-tag">{s}</span>)}
              </div>
            </div>
          )}

          {job.highlights.length > 0 && (
            <div className="mb-3">
              <div className="ext-section-label">Highlights</div>
              <ul className="ext-highlight-list">
                {job.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {job.description && (
            <div className="mb-4">
              <div className="ext-section-label">About the Role</div>
              <div className="ext-description">{job.description}{job.description.length >= 500 ? "…" : ""}</div>
            </div>
          )}
        </div>

        {/* Footer with Apply button */}
        <div className="ext-drawer-footer">
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="ext-apply-full-btn">
            <FaExternalLinkAlt className="me-2" /> Apply on Company Site
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ExternalJobBoard: React.FC = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const listRef = React.useRef<HTMLDivElement>(null);

  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("India");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [sources, setSources] = useState<Record<string, number>>({});
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [matchFilter, setMatchFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [matchSort, setMatchSort] = useState<"none" | "high-low" | "low-high">("none");

  // sidebar filter state
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [sideTypeFilter, setSideTypeFilter] = useState("");
  const [sideSourceFilter, setSideSourceFilter] = useState("");
  const [sideRemoteOnly, setSideRemoteOnly] = useState(false);
  const [sideLocQ, setSideLocQ] = useState("");
  const [sideSkillQ, setSideSkillQ] = useState("");

  const toggleSave = (id: string) => setSavedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const clearSideFilters = () => { setSideTypeFilter(""); setSideSourceFilter(""); setSideRemoteOnly(false); setSideLocQ(""); setSideSkillQ(""); };
  const activeSideFilterCount = [sideTypeFilter, sideSourceFilter, sideRemoteOnly ? "remote" : "", sideLocQ, sideSkillQ].filter(Boolean).length;

  // Fetch combined skill profile (declared skills + completed-course skills) for match scoring
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  useEffect(() => {
    fetchSkillProfile(baseURL, user?.token).then(sp => {
      if (sp) {
        setSkillProfile(sp);
        if (sp.combinedSkills.length) setUserSkills(sp.combinedSkills);
      }
    });
  }, [baseURL, user?.token]);

  const fetchJobs = useCallback(async (cat: string, q: string, loc: string, pg: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        category: cat, query: q, location: loc, page: String(pg)
      });
      const res = await fetch(`${baseURL}/api/jobs/external?${params}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();

      if (res.status === 503) { setNotConfigured(true); return; }
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");

      setJobs(data.jobs ?? []);
      setHasMore(!!data.hasMore);
      setSources(data.sources || {});
      setNotConfigured(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [baseURL, user?.token]);

  useEffect(() => {
    setPage(1);
    fetchJobs(category, searchQuery, locationQuery, 1);
  }, [category, fetchJobs]);

  const handleSearch = () => {
    setPage(1);
    fetchJobs(category, searchQuery, locationQuery, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs(category, searchQuery, locationQuery, newPage);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Client-side filtering
  const scoredJobs = jobs.map(job => ({ job, score: calcMatchScore(job, userSkills) }));

  const passesSideFilters = (job: ExternalJob) => {
    if (sideTypeFilter && (TYPE_LABEL[job.employmentType] || job.employmentType) !== sideTypeFilter) return false;
    if (sideSourceFilter && job.source !== sideSourceFilter) return false;
    if (sideRemoteOnly && !job.isRemote) return false;
    if (sideLocQ && !job.location?.toLowerCase().includes(sideLocQ.toLowerCase())) return false;
    if (sideSkillQ && !job.skills.some(s => s.toLowerCase().includes(sideSkillQ.toLowerCase()))) return false;
    return true;
  };

  // Counts per match tier (respecting the other filters, but not the match filter itself)
  const sideFilteredScored = scoredJobs.filter(({ job }) => passesSideFilters(job));
  const matchCounts = {
    high:   sideFilteredScored.filter(({ score }) => score >= 70).length,
    medium: sideFilteredScored.filter(({ score }) => score >= 40 && score < 70).length,
    low:    sideFilteredScored.filter(({ score }) => score > 0 && score < 40).length,
  };
  const MATCH_TIERS = [
    { key: "high",   label: "High Match",   sub: "70%+",     color: "#22c55e" },
    { key: "medium", label: "Medium Match", sub: "40-69%",   color: "#f59e0b" },
    { key: "low",    label: "Low Match",    sub: "Below 40%", color: "#ef4444" },
  ] as const;

  const matchTooltipFor = (score: number) => {
    if (!userSkills.length) return "";
    const parts = [`${score}% profile match`];
    if (skillProfile?.skills.length) parts.push(`${skillProfile.skills.length} declared skill${skillProfile.skills.length === 1 ? "" : "s"}`);
    if (skillProfile?.completedCourses.length) parts.push(`${skillProfile.completedCourses.length} completed course${skillProfile.completedCourses.length === 1 ? "" : "s"}`);
    if (skillProfile?.certificationsCount) parts.push(`${skillProfile.certificationsCount} certification${skillProfile.certificationsCount === 1 ? "" : "s"}`);
    return parts.length > 1 ? `${parts[0]} — based on ${parts.slice(1).join(", ")}` : parts[0];
  };
  const displayedJobs = scoredJobs
    .filter(({ job, score }) => {
      if (matchFilter === "high"   && !(score >= 70)) return false;
      if (matchFilter === "medium" && !(score >= 40 && score < 70)) return false;
      if (matchFilter === "low"    && !(score > 0  && score < 40)) return false;
      return passesSideFilters(job);
    })
    .sort((a, b) => {
      if (matchSort === "high-low") return b.score - a.score;
      if (matchSort === "low-high") return a.score - b.score;
      return matchFilter !== "all" ? b.score - a.score : 0;
    });

  // unique skills from loaded jobs (top 8)
  const extSkillOptions = [...new Set(jobs.flatMap(j => j.skills))].slice(0, 8);

  return (
    <div className="ext-root">
      {/* 2-column body */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── Left: job list ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* match filter bar — only meaningful once we know the student's skills */}
          {userSkills.length > 0 && (
            <div className="ext-match-filter-bar">
              <span className="ext-match-filter-label">Profile Match</span>
              <button
                className={`ext-match-filter-btn${matchFilter === "all" ? " active" : ""}`}
                style={{ ["--mf-color" as any]: "#ff7a00" }}
                onClick={() => setMatchFilter("all")}
              >
                All <span className="ext-mf-count">{scoredJobs.filter(({ job }) => passesSideFilters(job)).length}</span>
              </button>
              {MATCH_TIERS.map(t => (
                <button
                  key={t.key}
                  className={`ext-match-filter-btn${matchFilter === t.key ? " active" : ""}`}
                  style={{ ["--mf-color" as any]: t.color }}
                  onClick={() => setMatchFilter(matchFilter === t.key ? "all" : t.key)}
                  title={t.sub}
                >
                  <span className="ext-mf-dot" />
                  {t.label} <span className="ext-mf-count">{matchCounts[t.key]}</span>
                </button>
              ))}

              {/* Sort by match % — independent of the tier filter buttons above */}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span className="ext-match-filter-label" style={{ marginRight: 0 }}>Sort</span>
                <select
                  value={matchSort}
                  onChange={e => setMatchSort(e.target.value as typeof matchSort)}
                  style={{ border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 20, padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, color: PAGE_GRAY, background: CARD_BG, cursor: "pointer", outline: "none" }}
                >
                  <option value="none">Default</option>
                  <option value="high-low">Match: High → Low</option>
                  <option value="low-high">Match: Low → High</option>
                </select>
              </div>
            </div>
          )}

          {/* results bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: "0.82rem", color: "#ff7a00", fontWeight: 700 }}>
              {displayedJobs.length} Jobs found
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {sources.remotive  > 0 && <span className="ext-source-pill remotive">Remotive · {sources.remotive}</span>}
              {sources.arbeitnow > 0 && <span className="ext-source-pill arbeitnow">Arbeitnow · {sources.arbeitnow}</span>}
              {sources.adzuna    > 0 && <span className="ext-source-pill adzuna">Adzuna · {sources.adzuna}</span>}
            </div>
          </div>

          {/* notices */}
          {notConfigured && (
            <div className="ext-setup-notice">
              <FaInfoCircle className="me-2" />
              <div><strong>External Jobs API not configured.</strong> Add <code>JSEARCH_API_KEY</code> to your backend <code>.env</code> file.</div>
            </div>
          )}
          {error && !notConfigured && <div className="ext-error">⚠️ {error}</div>}

          {/* list */}
          <div className="ext-list-wrap" ref={listRef}>
            {loading && (
              <div className="ext-loading-overlay">
                <div className="ext-loading-spinner-box">
                  <Spinner animation="border" style={{ color: "#ff7a00", width: "2.2rem", height: "2.2rem", borderWidth: "3px" }} />
                  <span>Searching live jobs…</span>
                </div>
              </div>
            )}
            <div className={`ext-job-list${loading ? " ext-job-list--faded" : ""}`}>
              {displayedJobs.map(({ job, score }) => (
                <ExtJobCard key={job.id} job={job} score={score} matchTooltip={matchTooltipFor(score)} onView={setSelectedJob} saved={savedIds.has(job.id)} onToggleSave={toggleSave} />
              ))}
            </div>
          </div>

          {!loading && !error && !notConfigured && jobs.length === 0 && (
            <div className="ext-empty"><FaBriefcase style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "0.75rem" }} /><div>No jobs found. Try a different keyword or location.</div></div>
          )}
          {!loading && jobs.length > 0 && displayedJobs.length === 0 && (
            <div className="ext-empty"><FaBriefcase style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "0.75rem" }} /><div>No jobs match this filter. <button className="ext-clear-filter-btn" onClick={clearSideFilters}>Clear filters</button></div></div>
          )}

          {/* Pagination */}
          {jobs.length > 0 && (
            <div className="ext-pagination">
              <button className="ext-page-btn" onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading}><FaChevronLeft /> Prev</button>
              <span className="ext-page-num">Page {page}</span>
              <button className="ext-page-btn" onClick={() => handlePageChange(page + 1)} disabled={!hasMore || loading}>Next <FaChevronRight /></button>
            </div>
          )}
        </div>

        {/* ── Right: filter sidebar ── */}
        <div style={{
          width: 260, flexShrink: 0, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`,
          borderRadius: 14, position: "sticky", top: 16,
          maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Scrollable filter options */}
          <div className="ext-filter-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>

            {/* Job Type */}
            <ExtFilterSection title="Job Type">
              {["Full-time", "Part-time", "Contract", "Internship"].map(t => {
                const cnt = jobs.filter(j => (TYPE_LABEL[j.employmentType] || j.employmentType) === t).length;
                return <ExtCheckRow key={t} label={t} count={cnt} checked={sideTypeFilter === t} onChange={() => setSideTypeFilter(sideTypeFilter === t ? "" : t)} />;
              })}
            </ExtFilterSection>

            {/* Source */}
            <ExtFilterSection title="Source">
              {(["remotive", "arbeitnow", "adzuna"] as const).map(src => {
                const cnt = jobs.filter(j => j.source === src).length;
                return <ExtCheckRow key={src} label={src.charAt(0).toUpperCase() + src.slice(1)} count={cnt} checked={sideSourceFilter === src} onChange={() => setSideSourceFilter(sideSourceFilter === src ? "" : src)} />;
              })}
            </ExtFilterSection>

            {/* Remote */}
            <ExtFilterSection title="Work Mode">
              <ExtCheckRow label="Remote Only" count={jobs.filter(j => j.isRemote).length} checked={sideRemoteOnly} onChange={() => setSideRemoteOnly(p => !p)} />
            </ExtFilterSection>

            {/* Location */}
            <ExtFilterSection title="Location">
              <div style={{ position: "relative" }}>
                <FiSearchIcon size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: PAGE_GRAY }} />
                <input placeholder="Search location" value={sideLocQ} onChange={e => setSideLocQ(e.target.value)}
                  style={{ width: "100%", paddingLeft: 26, height: 32, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, fontSize: "0.75rem", color: PAGE_TEXT, outline: "none", background: CARD_BG }} />
              </div>
            </ExtFilterSection>

            {/* Skills */}
            <ExtFilterSection title="Skills">
              <div style={{ position: "relative", marginBottom: 8 }}>
                <FiSearchIcon size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: PAGE_GRAY }} />
                <input placeholder="Search skills" value={sideSkillQ} onChange={e => setSideSkillQ(e.target.value)}
                  style={{ width: "100%", paddingLeft: 26, height: 32, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, fontSize: "0.75rem", color: PAGE_TEXT, outline: "none", background: CARD_BG }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {extSkillOptions.map(s => {
                  const active = sideSkillQ === s;
                  return (
                    <button key={s} onClick={() => setSideSkillQ(active ? "" : s)} style={{ background: active ? "rgba(255,122,0,0.1)" : PAGE_BG, border: `1px solid ${active ? "#ff7a00" : PAGE_BORDER}`, color: active ? "#ff7a00" : PAGE_GRAY, borderRadius: 20, padding: "2px 9px", fontSize: "0.62rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      {s}{active && <FiX size={9} />}
                    </button>
                  );
                })}
              </div>
            </ExtFilterSection>
          </div>

          {/* Apply / Clear — always pinned at bottom */}
          <div style={{ padding: "12px 16px 16px", borderTop: `1px solid ${PAGE_BORDER}`, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, background: CARD_BG }}>
            <button style={{ width: "100%", background: "#ff7a00", border: "none", borderRadius: 10, color: "#fff", padding: "10px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <FiSliders size={13} /> Apply Filters
            </button>
            <button onClick={clearSideFilters} style={{ width: "100%", background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, color: activeSideFilterCount > 0 ? "#ff7a00" : PAGE_GRAY, padding: "9px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              Clear Filters {activeSideFilterCount > 0 && `(${activeSideFilterCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />

      <style>{`
        .ext-root { padding: 0; }
        .ext-filter-scroll { scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .ext-filter-scroll::-webkit-scrollbar { width: 3px; }
        .ext-filter-scroll::-webkit-scrollbar-track { background: transparent; }
        .ext-filter-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

        /* Category bar */
        .ext-cat-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .ext-cat-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1rem; border-radius: 25px; border: 1.5px solid var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); color: var(--dash-gray, #475569); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ext-cat-btn:hover { border-color: var(--dash-gray, #cbd5e1); color: var(--dash-text, #0f172a); background: var(--dash-page-bg, #f8fafc); }
        .ext-cat-btn.active { border-color: var(--cat-color, #ff7a00); color: var(--cat-color, #ff7a00); background: color-mix(in srgb, var(--cat-color, #ff7a00) 8%, var(--dash-card-bg, #fff)); }
        .ext-cat-icon { font-size: 0.85rem; }

        /* Search bar */
        .ext-search-bar { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .ext-search-input-wrap { flex: 1; min-width: 200px; display: flex; align-items: center; background: var(--dash-card-bg, #fff); border: 1.5px solid var(--dash-border, #e2e8f0); border-radius: 10px; padding: 0 1rem; gap: 0.6rem; }
        .ext-search-input-wrap:focus-within { border-color: #ff7a00; box-shadow: 0 0 0 3px rgba(255,122,0,0.08); }
        .ext-search-icon { color: var(--dash-gray, #94a3b8); flex-shrink: 0; font-size: 0.85rem; }
        .ext-search-input { flex: 1; background: transparent; border: none; outline: none; color: var(--dash-text, #0f172a); font-size: 0.88rem; padding: 0.65rem 0; }
        .ext-search-input::placeholder { color: var(--dash-gray, #94a3b8); }
        .ext-search-btn { background: #ff7a00; border: none; color: #fff; font-weight: 700; padding: 0.65rem 1.75rem; border-radius: 10px; font-size: 0.9rem; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
        .ext-search-btn:hover:not(:disabled) { background: #e86d00; box-shadow: 0 4px 14px rgba(255,122,0,0.3); }
        .ext-search-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Setup notice */
        .ext-setup-notice { display: flex; align-items: flex-start; gap: 0.75rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 1rem 1.25rem; color: #92400e; font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.5; }
        .ext-setup-notice a { color: #ff7a00; font-weight: 700; }
        .ext-setup-notice code { background: rgba(0,0,0,0.06); border-radius: 4px; padding: 0.1rem 0.3rem; font-size: 0.8rem; }
        .ext-error { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 0.75rem 1rem; color: #dc2626; font-size: 0.85rem; margin-bottom: 1rem; }
        .ext-results-info { font-size: 0.82rem; color: var(--dash-gray, #64748b); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .ext-more-hint { color: var(--dash-gray, #94a3b8); }
        .ext-source-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .ext-source-pill { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; }
        .ext-source-badge { font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
        .ext-source-jsearch, .ext-source-pill.jsearch { background: rgba(37,99,235,0.08); color: #2563eb; border: 1px solid rgba(37,99,235,0.2); }
        .ext-source-remotive, .ext-source-pill.remotive { background: rgba(5,150,105,0.08); color: #059669; border: 1px solid rgba(5,150,105,0.2); }
        .ext-source-arbeitnow, .ext-source-pill.arbeitnow { background: rgba(124,58,237,0.08); color: #7c3aed; border: 1px solid rgba(124,58,237,0.2); }
        .ext-source-adzuna, .ext-source-pill.adzuna { background: rgba(234,88,12,0.08); color: #ea580c; border: 1px solid rgba(234,88,12,0.2); }

        /* Loading overlay */
        .ext-list-wrap { position: relative; min-height: 200px; }
        .ext-loading-overlay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(241,245,249,0.8); backdrop-filter: blur(3px); border-radius: 12px; min-height: 220px; }
        .ext-loading-spinner-box { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: var(--dash-gray, #64748b); font-size: 0.88rem; }
        .ext-job-list--faded { opacity: 0.25; pointer-events: none; filter: blur(1px); transition: opacity 0.2s, filter 0.2s; }

        /* Job cards */
        .ext-job-list { display: flex; flex-direction: column; gap: 0.75rem; transition: opacity 0.2s; }
        .ext-job-card { background: var(--dash-card-bg, #fff); border: 1px solid var(--dash-border, #e2e8f0); border-radius: 12px; padding: 16px 18px; display: flex; gap: 14px; align-items: flex-start; cursor: pointer; transition: box-shadow 0.15s; }
        .ext-job-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

        .ext-job-logo { width: 46px; height: 46px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: var(--dash-page-bg, #f1f5f9); border: 1px solid var(--dash-border, #e2e8f0); display: flex; align-items: center; justify-content: center; }
        .ext-job-logo img { width: 100%; height: 100%; object-fit: contain; }
        .ext-logo-fallback { font-size: 0.9rem; font-weight: 800; color: #ff7a00; }
        .ext-logo-lg { font-size: 1.2rem; width: 56px; height: 56px; border-radius: 12px; }

        .ext-job-body { flex: 1; min-width: 0; }
        .ext-job-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 4px; }
        .ext-job-title { font-size: 0.9rem; font-weight: 700; color: var(--dash-text, #0f172a); line-height: 1.3; margin-bottom: 2px; }
        .ext-job-company { font-size: 0.78rem; color: var(--dash-gray, #475569); display: flex; align-items: center; font-weight: 600; }

        .ext-job-meta { display: flex; flex-wrap: wrap; gap: 0.6rem; font-size: 0.75rem; color: var(--dash-gray, #64748b); margin-bottom: 8px; align-items: center; }
        .ext-job-meta svg { margin-right: 3px; opacity: 0.7; }
        .ext-salary { color: #16a34a; font-weight: 600; }

        /* Badges */
        .ext-badge { display: inline-flex; align-items: center; padding: 0.18rem 0.55rem; border-radius: 20px; font-size: 0.68rem; font-weight: 700; }
        .ext-badge-remote { background: rgba(8,145,178,0.08); color: #0891b2; border: 1px solid rgba(8,145,178,0.2); }
        .ext-badge-type { background: var(--dash-page-bg, #f1f5f9); color: var(--dash-gray, #475569); border: 1px solid var(--dash-border, #e2e8f0); }

        /* Skills */
        .ext-skills-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .ext-skill-tag { background: rgba(255,122,0,0.06); color: #c05c00; border: 1px solid rgba(255,122,0,0.2); border-radius: 20px; padding: 2px 9px; font-size: 0.65rem; font-weight: 600; }
        .ext-skill-more { color: var(--dash-gray, #94a3b8); font-size: 0.68rem; padding: 2px 6px; }

        /* Match filter bar */
        .ext-match-filter-bar { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; padding: 0.6rem 1rem; background: var(--dash-card-bg, #fff); border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; }
        .ext-match-filter-label { font-size: 0.72rem; font-weight: 700; color: var(--dash-gray, #94a3b8); text-transform: uppercase; letter-spacing: 0.06em; margin-right: 0.25rem; white-space: nowrap; }
        .ext-match-filter-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; border-radius: 20px; border: 1.5px solid var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); color: var(--dash-gray, #475569); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ext-match-filter-btn:hover { border-color: var(--mf-color); color: var(--mf-color); }
        .ext-match-filter-btn.active { border-color: var(--mf-color); color: var(--mf-color); background: color-mix(in srgb, var(--mf-color) 8%, var(--dash-card-bg, #fff)); }
        .ext-mf-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mf-color); flex-shrink: 0; }
        .ext-mf-count { background: var(--dash-page-bg, #f1f5f9); color: var(--dash-gray, #475569); border-radius: 10px; padding: 0.05rem 0.45rem; font-size: 0.68rem; font-weight: 700; }
        .ext-clear-filter-btn { background: none; border: none; color: #ff7a00; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }

        /* Match ring */
        .ext-match-ring { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ext-match-pct { position: absolute; font-size: 0.58rem; font-weight: 800; line-height: 1; color: var(--dash-text, #0f172a); }

        /* Actions */
        .ext-job-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
        .ext-apply-btn { background: #ff7a00; border: none; color: #fff; font-size: 0.78rem; font-weight: 700; padding: 7px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
        .ext-apply-btn:hover { background: #e86d00; box-shadow: 0 4px 12px rgba(255,122,0,0.3); }
        .ext-view-btn { background: var(--dash-card-bg, #fff); border: 1px solid var(--dash-border, #e2e8f0); color: var(--dash-gray, #475569); font-size: 0.75rem; font-weight: 600; padding: 6px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .ext-view-btn:hover { border-color: #ff7a00; color: #ff7a00; }

        /* Pagination */
        .ext-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; padding: 1rem 0; }
        .ext-page-btn { display: flex; align-items: center; gap: 0.4rem; background: var(--dash-card-bg, #fff); border: 1px solid var(--dash-border, #e2e8f0); color: var(--dash-gray, #475569); font-size: 0.82rem; font-weight: 600; padding: 0.45rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .ext-page-btn:hover:not(:disabled) { border-color: #ff7a00; color: #ff7a00; }
        .ext-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ext-page-num { font-size: 0.82rem; color: var(--dash-gray, #64748b); font-weight: 600; min-width: 60px; text-align: center; }

        /* Empty */
        .ext-empty { text-align: center; padding: 4rem 0; color: var(--dash-gray, #94a3b8); font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; }

        /* Detail drawer */
        .ext-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); padding: 1rem; animation: extFadeIn 0.18s ease; }
        @keyframes extFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ext-drawer { width: min(780px, 96vw); max-height: 90vh; background: var(--dash-card-bg, #fff); border: 1px solid var(--dash-border, #e2e8f0); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: extSlideUp 0.22s ease; }
        @keyframes extSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ext-drawer-close { position: absolute; top: 1rem; right: 1rem; background: var(--dash-page-bg, #f1f5f9); border: 1px solid var(--dash-border, #e2e8f0); color: var(--dash-gray, #64748b); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; z-index: 2; }
        .ext-drawer-close:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
        .ext-drawer-header { display: flex; gap: 1.25rem; align-items: center; padding: 1.5rem 2rem 1.25rem; border-bottom: 1px solid var(--dash-border, #f1f5f9); background: var(--dash-card-bg, #fff); flex-shrink: 0; }
        .ext-drawer-title { font-size: 1.15rem; font-weight: 800; color: var(--dash-text, #0f172a); line-height: 1.3; margin-bottom: 4px; }
        .ext-drawer-company { font-size: 0.85rem; color: var(--dash-gray, #64748b); font-weight: 500; }
        .ext-drawer-body { overflow-y: auto; flex: 1; padding: 1.5rem 2rem; }
        .ext-drawer-body::-webkit-scrollbar { width: 4px; }
        .ext-drawer-body::-webkit-scrollbar-thumb { background: var(--dash-border, #e2e8f0); border-radius: 2px; }
        .ext-drawer-meta { display: flex; flex-wrap: wrap; gap: 0.6rem; font-size: 0.82rem; color: var(--dash-gray, #64748b); margin-bottom: 1.5rem; align-items: center; padding-bottom: 1.25rem; border-bottom: 1px solid var(--dash-border, #f1f5f9); }
        .ext-drawer-meta svg { opacity: 0.7; }
        .ext-section-label { font-size: 0.72rem; font-weight: 700; color: #ff7a00; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.6rem; }
        .ext-highlight-list { padding-left: 1.25rem; margin: 0; color: var(--dash-gray, #475569); font-size: 0.85rem; line-height: 1.7; }
        .ext-description { color: var(--dash-gray, #64748b); font-size: 0.85rem; line-height: 1.8; white-space: pre-line; }
        .ext-drawer-footer { padding: 1rem 2rem 1.5rem; flex-shrink: 0; border-top: 1px solid var(--dash-border, #f1f5f9); background: var(--dash-card-bg, #fff); }
        .ext-apply-full-btn { display: flex; align-items: center; justify-content: center; background: #ff7a00; color: #fff; font-weight: 700; padding: 0.9rem; border-radius: 12px; font-size: 0.95rem; text-decoration: none; transition: all 0.25s; }
        .ext-apply-full-btn:hover { background: #e86d00; box-shadow: 0 6px 20px rgba(255,122,0,0.3); color: #fff; }

        @media (max-width: 576px) {
          .ext-job-card { flex-direction: column; }
          .ext-job-actions { flex-direction: row; }
          .ext-cat-btn { font-size: 0.76rem; padding: 0.4rem 0.8rem; }
        }
      `}</style>
    </div>
  );
};

// ── sidebar sub-components ────────────────────────────────────────────────────
const ExtFilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ borderTop: `1px solid ${PAGE_BORDER}`, paddingTop: 12, marginBottom: 12 }}>
    <div style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: "0.78rem", marginBottom: 8 }}>{title}</div>
    {children}
  </div>
);

const ExtCheckRow = ({ label, count, checked, onChange }: { label: string; count: number; checked: boolean; onChange: () => void }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 6, userSelect: "none" }}>
    <div onClick={onChange} style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: "pointer", border: `1.5px solid ${checked ? "#ff7a00" : PAGE_BORDER}`, background: checked ? "#ff7a00" : CARD_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
    <span style={{ fontSize: "0.75rem", color: PAGE_TEXT, flex: 1 }}>{label}</span>
    <span style={{ fontSize: "0.68rem", color: PAGE_GRAY, fontWeight: 600 }}>{count}</span>
  </label>
);

export default ExternalJobBoard;

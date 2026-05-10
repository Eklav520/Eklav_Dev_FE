import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Spinner } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import {
  FaSearch, FaMapMarkerAlt, FaBriefcase, FaExternalLinkAlt,
  FaClock, FaBuilding, FaLaptopCode, FaUserTie, FaGraduationCap,
  FaWifi, FaHandshake, FaChevronLeft, FaChevronRight, FaInfoCircle,
} from "react-icons/fa";

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
const calcMatchScore = (job: ExternalJob, userSkills: string[]): number => {
  if (!userSkills.length) return 0;
  const us = userSkills.map(s => s.toLowerCase());
  const titleDesc = `${job.title} ${job.description}`.toLowerCase();

  // Skills in job.skills that match user skills (60 pts)
  let skillPts = 0;
  if (job.skills.length > 0) {
    const hits = job.skills.filter(s => us.some(u => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))).length;
    skillPts = Math.round((hits / job.skills.length) * 60);
  }

  // User skills mentioned in title or description (30 pts)
  const kwHits = us.filter(s => titleDesc.includes(s)).length;
  const kwPts = Math.min(30, Math.round((kwHits / us.length) * 30));

  // Not a senior/director role (student-friendly) (10 pts)
  const seniorPts = /senior|lead|head|director|vp |chief|principal/.test(job.title.toLowerCase()) ? 0 : 10;

  return Math.min(100, skillPts + kwPts + seniorPts);
};

// ─── Match Ring ───────────────────────────────────────────────────────────────
const MatchRing: React.FC<{ score: number; size?: number }> = ({ score, size = 46 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="ext-match-ring" title={`${score}% profile match`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e1e28" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <span className="ext-match-pct" style={{ color }}>{score}%</span>
    </div>
  );
};

// ─── Job Card ─────────────────────────────────────────────────────────────────
const ExtJobCard: React.FC<{ job: ExternalJob; onView: (j: ExternalJob) => void; matchScore: number }> = ({ job, onView, matchScore }) => {
  const [imgError, setImgError] = useState(false);
  const initials = job.company?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="ext-job-card" onClick={() => onView(job)}>
      {/* Company logo */}
      <div className="ext-job-logo">
        {job.logo && !imgError ? (
          <img src={job.logo} alt={job.company} onError={() => setImgError(true)} />
        ) : (
          <div className="ext-logo-fallback">{initials}</div>
        )}
      </div>

      <div className="ext-job-body">
        <div className="ext-job-top">
          <div>
            <div className="ext-job-title">{job.title}</div>
            <div className="ext-job-company">
              <FaBuilding style={{ marginRight: 5, opacity: 0.6 }} />
              {job.company}
            </div>
          </div>
          <div className="d-flex flex-column align-items-end gap-1">
            {job.isRemote && <span className="ext-badge ext-badge-remote">Remote</span>}
            <span className="ext-badge ext-badge-type">
              {TYPE_LABEL[job.employmentType] || job.employmentType}
            </span>
          </div>
        </div>

        <div className="ext-job-meta">
          {job.location && (
            <span><FaMapMarkerAlt /> {job.location}</span>
          )}
          {job.experience && (
            <span><FaBriefcase /> {job.experience}</span>
          )}
          {job.salary && (
            <span className="ext-salary">💰 {job.salary}</span>
          )}
          {job.source && (
            <span className={`ext-source-badge ext-source-${job.source.toLowerCase()}`}>{job.source}</span>
          )}
          {job.postedAt && (
            <span style={{ marginLeft: "auto" }}><FaClock /> {timeAgo(job.postedAt)}</span>
          )}
        </div>

        {job.skills.length > 0 && (
          <div className="ext-skills-row">
            {job.skills.slice(0, 5).map((s, i) => (
              <span key={i} className="ext-skill-tag">{s}</span>
            ))}
            {job.skills.length > 5 && (
              <span className="ext-skill-more">+{job.skills.length - 5}</span>
            )}
          </div>
        )}
      </div>

      <div className="ext-job-actions">
        {matchScore > 0 && <MatchRing score={matchScore} />}
        <button className="ext-apply-btn" onClick={e => { e.stopPropagation(); window.open(job.applyUrl, "_blank"); }}>
          <FaExternalLinkAlt style={{ marginRight: 5 }} />Apply
        </button>
        <button className="ext-view-btn" onClick={e => { e.stopPropagation(); onView(job); }}>Details</button>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [sources, setSources] = useState<Record<string, number>>({});
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [matchFilter, setMatchFilter] = useState<"all" | "high" | "medium" | "low">("all");

  // Fetch user profile for match scoring
  useEffect(() => {
    fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const skills: string[] = data?.profile?.skills ?? data?.skills ?? [];
        if (skills.length) setUserSkills(skills);
      })
      .catch(() => {});
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
  }, [category]);

  const handleSearch = () => {
    setPage(1);
    fetchJobs(category, searchQuery, locationQuery, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchJobs(category, searchQuery, locationQuery, newPage);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Client-side match filter + sort (no extra API call)
  const scoredJobs = jobs.map(job => ({ job, score: calcMatchScore(job, userSkills) }));
  const displayedJobs = scoredJobs
    .filter(({ score }) => {
      if (matchFilter === "high")   return score >= 70;
      if (matchFilter === "medium") return score >= 40 && score < 70;
      if (matchFilter === "low")    return score > 0  && score < 40;
      return true;
    })
    .sort((a, b) => matchFilter !== "all" ? b.score - a.score : 0);

  const matchCounts = {
    high:   scoredJobs.filter(({ score }) => score >= 70).length,
    medium: scoredJobs.filter(({ score }) => score >= 40 && score < 70).length,
    low:    scoredJobs.filter(({ score }) => score > 0 && score < 40).length,
  };

  return (
    <div className="ext-root">
      {/* Category tabs */}
      <div className="ext-cat-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`ext-cat-btn ${category === cat.id ? "active" : ""}`}
            style={category === cat.id ? { "--cat-color": cat.color } as React.CSSProperties : {}}
            onClick={() => setCategory(cat.id)}
          >
            <span className="ext-cat-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="ext-search-bar">
        <div className="ext-search-input-wrap">
          <FaSearch className="ext-search-icon" />
          <input
            className="ext-search-input"
            placeholder="Job title, skills, keywords…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="ext-search-input-wrap">
          <FaMapMarkerAlt className="ext-search-icon" />
          <input
            className="ext-search-input"
            placeholder="Location (e.g. Hyderabad, Bangalore)"
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button className="ext-search-btn" onClick={handleSearch} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Search"}
        </button>
      </div>

      {/* Match filter bar — only shown when profile skills are loaded */}
      {userSkills.length > 0 && jobs.length > 0 && (
        <div className="ext-match-filter-bar">
          <span className="ext-match-filter-label">Match:</span>
          {([
            { key: "all",    label: "All",          color: "#888",    count: jobs.length },
            { key: "high",   label: "Best (70%+)",  color: "#22c55e", count: matchCounts.high },
            { key: "medium", label: "Good (40%+)",  color: "#f59e0b", count: matchCounts.medium },
            { key: "low",    label: "Low (<40%)",   color: "#ef4444", count: matchCounts.low },
          ] as const).map(f => (
            <button
              key={f.key}
              className={`ext-match-filter-btn ${matchFilter === f.key ? "active" : ""}`}
              style={{ "--mf-color": f.color } as React.CSSProperties}
              onClick={() => setMatchFilter(f.key)}
            >
              <span className="ext-mf-dot" />
              {f.label}
              <span className="ext-mf-count">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* API not configured notice */}
      {notConfigured && (
        <div className="ext-setup-notice">
          <FaInfoCircle className="me-2" />
          <div>
            <strong>External Jobs API not configured.</strong>
            <span> Add <code>JSEARCH_API_KEY</code> to your backend <code>.env</code> file.
            Get a free key at <a href="https://rapidapi.com/letscrape-6bfcf1f5be/api/jsearch" target="_blank" rel="noopener noreferrer">RapidAPI → JSearch</a> (500 free requests/month).</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !notConfigured && (
        <div className="ext-error">⚠️ {error}</div>
      )}

      {/* Results count */}
      {!loading && jobs.length > 0 && (
        <div className="ext-results-info">
          <span>
            Showing <strong>{displayedJobs.length}</strong>
            {matchFilter !== "all" && <> of {jobs.length}</>} jobs · Page {page}
          </span>
          <div className="ext-source-pills">
            {sources.jsearch   > 0 && <span className="ext-source-pill jsearch">JSearch · {sources.jsearch}</span>}
            {sources.remotive  > 0 && <span className="ext-source-pill remotive">Remotive · {sources.remotive}</span>}
            {sources.arbeitnow > 0 && <span className="ext-source-pill arbeitnow">Arbeitnow · {sources.arbeitnow}</span>}
            {sources.adzuna    > 0 && <span className="ext-source-pill adzuna">Adzuna · {sources.adzuna}</span>}
          </div>
          {hasMore && <span className="ext-more-hint">more available →</span>}
        </div>
      )}

      {/* Job list with loading overlay */}
      <div className="ext-list-wrap" ref={listRef}>
        {loading && (
          <div className="ext-loading-overlay">
            <div className="ext-loading-spinner-box">
              <Spinner animation="border" style={{ color: "#ff6b35", width: "2.5rem", height: "2.5rem", borderWidth: "3px" }} />
              <span>Searching jobs from LinkedIn, Indeed & more…</span>
            </div>
          </div>
        )}
        <div className={`ext-job-list${loading ? " ext-job-list--faded" : ""}`}>
          {displayedJobs.map(({ job, score }) => (
            <ExtJobCard key={job.id} job={job} onView={setSelectedJob} matchScore={score} />
          ))}
        </div>
      </div>

      {/* Empty */}
      {!loading && !error && !notConfigured && jobs.length === 0 && (
        <div className="ext-empty">
          <FaBriefcase style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "0.75rem" }} />
          <div>No jobs found. Try a different keyword or location.</div>
        </div>
      )}
      {!loading && jobs.length > 0 && displayedJobs.length === 0 && (
        <div className="ext-empty">
          <FaBriefcase style={{ fontSize: "2.5rem", opacity: 0.3, marginBottom: "0.75rem" }} />
          <div>No jobs match this filter. <button className="ext-clear-filter-btn" onClick={() => setMatchFilter("all")}>Clear filter</button></div>
        </div>
      )}

      {/* Pagination */}
      {jobs.length > 0 && (
        <div className="ext-pagination">
          <button className="ext-page-btn" onClick={() => handlePageChange(page - 1)} disabled={page <= 1 || loading}>
            <FaChevronLeft /> Prev
          </button>
          <span className="ext-page-num">Page {page}</span>
          <button className="ext-page-btn" onClick={() => handlePageChange(page + 1)} disabled={!hasMore || loading}>
            Next <FaChevronRight />
          </button>
        </div>
      )}

      {/* Detail Drawer */}
      <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />

      <style>{`
        .ext-root { padding: 0; }

        /* Category bar */
        .ext-cat-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .ext-cat-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1.1rem; border-radius: 25px; border: 1.5px solid #2a2a32; background: #111116; color: #888; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ext-cat-btn:hover { border-color: #444; color: #ccc; }
        .ext-cat-btn.active { border-color: var(--cat-color, #ff6b35); color: var(--cat-color, #ff6b35); background: color-mix(in srgb, var(--cat-color, #ff6b35) 10%, transparent); }
        .ext-cat-icon { font-size: 0.85rem; }

        /* Search bar */
        .ext-search-bar { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .ext-search-input-wrap { flex: 1; min-width: 200px; display: flex; align-items: center; background: #111116; border: 1.5px solid #2a2a32; border-radius: 10px; padding: 0 1rem; gap: 0.6rem; }
        .ext-search-input-wrap:focus-within { border-color: #ff6b35; box-shadow: 0 0 0 3px rgba(255,107,53,0.1); }
        .ext-search-icon { color: #555; flex-shrink: 0; font-size: 0.85rem; }
        .ext-search-input { flex: 1; background: transparent; border: none; outline: none; color: #f0f0f0; font-size: 0.88rem; padding: 0.65rem 0; }
        .ext-search-input::placeholder { color: #444; }
        .ext-search-btn { background: linear-gradient(135deg, #ff6b35, #ff9a5c); border: none; color: #fff; font-weight: 700; padding: 0.65rem 1.75rem; border-radius: 10px; font-size: 0.9rem; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
        .ext-search-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(255,107,53,0.4); }
        .ext-search-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Setup notice */
        .ext-setup-notice { display: flex; align-items: flex-start; gap: 0.75rem; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); border-radius: 12px; padding: 1rem 1.25rem; color: #fbbf24; font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.5; }
        .ext-setup-notice a { color: #fbbf24; font-weight: 700; }
        .ext-setup-notice code { background: rgba(255,255,255,0.1); border-radius: 4px; padding: 0.1rem 0.3rem; font-size: 0.8rem; }
        .ext-error { background: rgba(220,53,69,0.08); border: 1px solid rgba(220,53,69,0.25); border-radius: 10px; padding: 0.75rem 1rem; color: #e06c75; font-size: 0.85rem; margin-bottom: 1rem; }
        .ext-results-info { font-size: 0.82rem; color: #666; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .ext-more-hint { color: #555; }
        .ext-source-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .ext-source-pill { font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; }
        /* Source badges on cards */
        .ext-source-badge { font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
        .ext-source-jsearch, .ext-source-pill.jsearch { background: rgba(37,99,235,0.12); color: #60a5fa; border: 1px solid rgba(37,99,235,0.25); }
        .ext-source-remotive, .ext-source-pill.remotive { background: rgba(5,150,105,0.12); color: #34d399; border: 1px solid rgba(5,150,105,0.25); }
        .ext-source-arbeitnow, .ext-source-pill.arbeitnow { background: rgba(124,58,237,0.12); color: #a78bfa; border: 1px solid rgba(124,58,237,0.25); }
        .ext-source-adzuna, .ext-source-pill.adzuna { background: rgba(234,88,12,0.12); color: #fb923c; border: 1px solid rgba(234,88,12,0.25); }

        /* Loading overlay */
        .ext-list-wrap { position: relative; min-height: 200px; }
        .ext-loading-overlay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(9,9,12,0.65); backdrop-filter: blur(3px); border-radius: 12px; min-height: 220px; }
        .ext-loading-spinner-box { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #888; font-size: 0.88rem; }
        .ext-job-list--faded { opacity: 0.25; pointer-events: none; filter: blur(1px); transition: opacity 0.2s, filter 0.2s; }

        /* Job cards */
        .ext-job-list { display: flex; flex-direction: column; gap: 0.75rem; transition: opacity 0.2s; }
        .ext-job-card { background: #0d0d0f; border: 1px solid #1e1e24; border-radius: 14px; padding: 1.1rem 1.25rem; display: flex; gap: 1rem; align-items: flex-start; cursor: pointer; transition: all 0.22s; }
        .ext-job-card:hover { border-color: #ff6b35; box-shadow: 0 4px 20px rgba(255,107,53,0.1); transform: translateY(-1px); }

        .ext-job-logo { width: 52px; height: 52px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #1a1a22; border: 1px solid #2a2a32; display: flex; align-items: center; justify-content: center; }
        .ext-job-logo img { width: 100%; height: 100%; object-fit: contain; }
        .ext-logo-fallback { font-size: 1rem; font-weight: 800; color: #ff6b35; }
        .ext-logo-lg { font-size: 1.4rem; width: 64px; height: 64px; border-radius: 14px; }

        .ext-job-body { flex: 1; min-width: 0; }
        .ext-job-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.5rem; }
        .ext-job-title { font-size: 0.95rem; font-weight: 700; color: #f0f0f0; line-height: 1.3; margin-bottom: 2px; }
        .ext-job-company { font-size: 0.82rem; color: #888; display: flex; align-items: center; }

        .ext-job-meta { display: flex; flex-wrap: wrap; gap: 0.6rem; font-size: 0.78rem; color: #666; margin-bottom: 0.6rem; align-items: center; }
        .ext-job-meta svg { margin-right: 3px; opacity: 0.7; }
        .ext-salary { color: #4caf72; font-weight: 600; }

        /* Badges */
        .ext-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
        .ext-badge-remote { background: rgba(8,145,178,0.15); color: #22d3ee; border: 1px solid rgba(8,145,178,0.3); }
        .ext-badge-type { background: rgba(255,255,255,0.06); color: #aaa; border: 1px solid #2a2a32; }

        /* Skills */
        .ext-skills-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .ext-skill-tag { background: rgba(255,107,53,0.08); color: #ff8c5a; border: 1px solid rgba(255,107,53,0.2); border-radius: 6px; padding: 0.18rem 0.55rem; font-size: 0.72rem; font-weight: 600; }
        .ext-skill-more { color: #555; font-size: 0.72rem; padding: 0.18rem 0.4rem; }

        /* Match filter bar */
        .ext-match-filter-bar { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; padding: 0.65rem 1rem; background: #0a0a0e; border: 1px solid #1e1e28; border-radius: 12px; }
        .ext-match-filter-label { font-size: 0.75rem; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.06em; margin-right: 0.25rem; white-space: nowrap; }
        .ext-match-filter-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.85rem; border-radius: 20px; border: 1.5px solid #2a2a32; background: transparent; color: #777; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .ext-match-filter-btn:hover { border-color: var(--mf-color); color: var(--mf-color); }
        .ext-match-filter-btn.active { border-color: var(--mf-color); color: var(--mf-color); background: color-mix(in srgb, var(--mf-color) 12%, transparent); }
        .ext-mf-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mf-color); flex-shrink: 0; }
        .ext-mf-count { background: rgba(255,255,255,0.07); border-radius: 10px; padding: 0.05rem 0.45rem; font-size: 0.7rem; font-weight: 700; }
        .ext-clear-filter-btn { background: none; border: none; color: #ff6b35; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 0; }

        /* Match ring */
        .ext-match-ring { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ext-match-pct { position: absolute; font-size: 0.62rem; font-weight: 800; line-height: 1; }

        /* Actions */
        .ext-job-actions { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .ext-apply-btn { background: linear-gradient(135deg, #ff6b35, #ff9a5c); border: none; color: #fff; font-size: 0.8rem; font-weight: 700; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; }
        .ext-apply-btn:hover { box-shadow: 0 4px 12px rgba(255,107,53,0.4); }
        .ext-view-btn { background: transparent; border: 1px solid #2a2a32; color: #888; font-size: 0.78rem; font-weight: 600; padding: 0.45rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .ext-view-btn:hover { border-color: #ff6b35; color: #ff6b35; }

        /* Pagination */
        .ext-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; padding: 1rem 0; }
        .ext-page-btn { display: flex; align-items: center; gap: 0.4rem; background: #111116; border: 1.5px solid #2a2a32; color: #ccc; font-size: 0.85rem; font-weight: 600; padding: 0.55rem 1.25rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .ext-page-btn:hover:not(:disabled) { border-color: #ff6b35; color: #ff6b35; }
        .ext-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ext-page-num { font-size: 0.85rem; color: #666; font-weight: 600; min-width: 60px; text-align: center; }

        /* Empty */
        .ext-empty { text-align: center; padding: 4rem 0; color: #555; font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; }

        /* Detail Modal */
        .ext-drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.78); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px); padding: 1rem; animation: extFadeIn 0.18s ease; }
        @keyframes extFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ext-drawer { width: min(780px, 96vw); max-height: 90vh; background: #0e0e12; border: 1px solid #242430; border-radius: 20px; padding: 0; overflow: hidden; display: flex; flex-direction: column; position: relative; box-shadow: 0 24px 80px rgba(0,0,0,0.7); animation: extSlideUp 0.22s ease; }
        @keyframes extSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ext-drawer-close { position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.07); border: 1px solid #2a2a32; color: #aaa; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: all 0.2s; z-index: 2; }
        .ext-drawer-close:hover { background: rgba(255,107,53,0.15); border-color: #ff6b35; color: #ff6b35; }
        .ext-drawer-header { display: flex; gap: 1.25rem; align-items: center; padding: 1.75rem 2rem 1.25rem; border-bottom: 1px solid #1e1e24; background: linear-gradient(180deg, #13131a 0%, #0e0e12 100%); flex-shrink: 0; }
        .ext-drawer-title { font-size: 1.2rem; font-weight: 800; color: #f2f2f2; line-height: 1.3; margin-bottom: 5px; }
        .ext-drawer-company { font-size: 0.9rem; color: #888; font-weight: 500; }
        .ext-drawer-body { overflow-y: auto; flex: 1; padding: 1.5rem 2rem; }
        .ext-drawer-body::-webkit-scrollbar { width: 4px; }
        .ext-drawer-body::-webkit-scrollbar-thumb { background: #2a2a32; border-radius: 2px; }
        .ext-drawer-meta { display: flex; flex-wrap: wrap; gap: 0.6rem; font-size: 0.83rem; color: #777; margin-bottom: 1.5rem; align-items: center; padding-bottom: 1.25rem; border-bottom: 1px solid #1a1a22; }
        .ext-drawer-meta svg { opacity: 0.7; }
        .ext-section-label { font-size: 0.75rem; font-weight: 700; color: #ff6b35; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.6rem; }
        .ext-highlight-list { padding-left: 1.25rem; margin: 0; color: #aaa; font-size: 0.85rem; line-height: 1.7; }
        .ext-description { color: #888; font-size: 0.85rem; line-height: 1.8; white-space: pre-line; }
        .ext-drawer-footer { padding: 1rem 2rem 1.5rem; flex-shrink: 0; border-top: 1px solid #1a1a22; background: #0e0e12; }
        .ext-apply-full-btn { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff6b35, #ff9a5c); color: #fff; font-weight: 700; padding: 0.9rem; border-radius: 12px; font-size: 0.95rem; text-decoration: none; transition: all 0.25s; }
        .ext-apply-full-btn:hover { box-shadow: 0 6px 20px rgba(255,107,53,0.4); color: #fff; transform: translateY(-1px); }

        @media (max-width: 576px) {
          .ext-job-card { flex-direction: column; }
          .ext-job-actions { flex-direction: row; }
          .ext-cat-btn { font-size: 0.76rem; padding: 0.45rem 0.85rem; }
        }
      `}</style>
    </div>
  );
};

export default ExternalJobBoard;

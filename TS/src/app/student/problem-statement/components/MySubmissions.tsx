import { useAuthContext } from '@/context/useAuthContext';
import React, { useEffect, useState, useMemo } from 'react';
import { Spinner } from 'react-bootstrap';

/* ── Types ── */
type Submission = {
  _id: string;
  challengeId?: { title?: string; difficulty?: string; _id?: string };
  feedback?: string;
  score?: number | null;
  status?: string;
  language?: string;
  time?: number | string;
  memory?: number | string;
  createdAt?: string;
};

/* ── Constants ── */
const PAGE_SIZE = 8;

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  'Accepted':            { color: '#16a34a', bg: '#f0fdf4' },
  'Wrong Answer':        { color: '#dc2626', bg: '#fff1f2' },
  'Time Limit Exceeded': { color: '#f59e0b', bg: '#fffbeb' },
  'Runtime Error':       { color: '#dc2626', bg: '#fff1f2' },
  'Compilation Error':   { color: '#7c3aed', bg: '#f5f3ff' },
  'Not Submitted':       { color: '#64748b', bg: '#f1f5f9' },
};

const DIFF_CFG: Record<string, { color: string; bg: string }> = {
  'Easy':   { color: '#16a34a', bg: '#f0fdf4' },
  'Medium': { color: '#f59e0b', bg: '#fffbeb' },
  'Hard':   { color: '#dc2626', bg: '#fff1f2' },
};

const LANG_COLOR: Record<string, string> = {
  'C++': '#0078d4', 'Java': '#e76f00', 'Python': '#3572A5',
  'JavaScript': '#f1e05a', 'TypeScript': '#3178c6', 'Go': '#00add8', 'Rust': '#a72145',
};

const ALL_TAGS = ['Array','String','Hash Table','Two Pointers','Stack','Tree','BFS','DFS',
  'Dynamic Programming','Linked List','Graph','Recursion','Sliding Window','Binary Search',
  'Heap','Design','Backtracking','Greedy','Math','Queue'];

const getTags = (id: string) => {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return [ALL_TAGS[h % ALL_TAGS.length], ALL_TAGS[(h * 3 + 7) % ALL_TAGS.length]];
};

const pct = (n: number, total: number) =>
  total > 0 ? `${((n / total) * 100).toFixed(2)}%` : '0.00%';

/* ── Icons ── */
const IconSubmit = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const IconCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const IconCode = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconReset = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
);
const IconChevDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const IconChevLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const IconChevRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const IconDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
);
const IconBookmark = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
);

/* ── Simple Select ── */
const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        appearance: 'none', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '7px 32px 7px 12px', fontSize: '0.8rem', color: '#374151', fontWeight: 500,
        cursor: 'pointer', outline: 'none', minWidth: 130,
      }}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: '#64748b' }}><IconChevDown /></span>
  </div>
);

/* ── Main Component ── */
const MySubmissions: React.FC = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [search, setSearch]           = useState('');
  const [filterLang, setFilterLang]   = useState('All Languages');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterLevel, setFilterLevel] = useState('All Levels');
  const [page, setPage]               = useState(1);

  useEffect(() => {
    if (!user?.token) return;
    setLoading(true);
    fetch(`${baseURL}/student/submissions`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(d  => setSubmissions(Array.isArray(d) ? d : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.token]);

  /* ── Stats ── */
  const total    = submissions.length;
  const accepted = submissions.filter(s => s.status === 'Accepted').length;
  const wrong    = submissions.filter(s => s.status === 'Wrong Answer').length;
  const tle      = submissions.filter(s => s.status === 'Time Limit Exceeded' || s.status === 'Runtime Error').length;
  const compile  = submissions.filter(s => s.status === 'Compilation Error').length;

  const statCards = [
    { icon: <IconSubmit />, iconColor: '#6366f1', iconBg: '#eef2ff', value: total,    label: 'Total Submissions', sub: 'Across all problems' },
    { icon: <IconCheck />,  iconColor: '#16a34a', iconBg: '#f0fdf4', value: accepted, label: 'Accepted',           sub: `${pct(accepted, total)} Acceptance Rate` },
    { icon: <IconX />,      iconColor: '#f59e0b', iconBg: '#fffbeb', value: wrong,    label: 'Wrong Answer',       sub: `${pct(wrong, total)} of total` },
    { icon: <IconClock />,  iconColor: '#ef4444', iconBg: '#fff1f2', value: tle,      label: 'Runtime / TLE',      sub: `${pct(tle, total)} of total` },
    { icon: <IconCode />,   iconColor: '#7c3aed', iconBg: '#f5f3ff', value: compile,  label: 'Compilation Error',  sub: `${pct(compile, total)} of total` },
  ];

  /* ── Filter options ── */
  const langOptions   = ['All Languages', ...Array.from(new Set(submissions.map(s => s.language).filter(Boolean) as string[]))];
  const statusOptions = ['All Status',    ...Object.keys(STATUS_CFG)];
  const levelOptions  = ['All Levels',    'Easy', 'Medium', 'Hard'];

  /* ── Filtered data ── */
  const filtered = useMemo(() => submissions.filter(s => {
    const title = s.challengeId?.title?.toLowerCase() || '';
    if (search && !title.includes(search.toLowerCase())) return false;
    if (filterLang !== 'All Languages' && s.language !== filterLang) return false;
    if (filterStatus !== 'All Status'  && s.status   !== filterStatus) return false;
    if (filterLevel  !== 'All Levels'  && s.challengeId?.difficulty !== filterLevel) return false;
    return true;
  }), [submissions, search, filterLang, filterStatus, filterLevel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => { setSearch(''); setFilterLang('All Languages'); setFilterStatus('All Status'); setFilterLevel('All Levels'); setPage(1); };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ',');
  };

  /* ── Pagination range ── */
  const pageRange = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Spinner animation="border" style={{ color: '#ff7a00' }} />
    </div>
  );

  return (
    <div style={{ padding: '24px 20px', background: '#f8fafc', minHeight: '100%' }}>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.iconColor, flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{c.value}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginTop: 2 }}>{c.label}</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ── */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '0 0 200px' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}><IconSearch /></span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by problem title..."
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px 7px 32px', fontSize: '0.8rem', color: '#374151', outline: 'none', background: '#fff' }}
            />
          </div>

          <Select value={filterLang}   onChange={v => { setFilterLang(v);   setPage(1); }} options={langOptions} />
          <Select value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} options={statusOptions} />
          <Select value={filterLevel}  onChange={v => { setFilterLevel(v);  setPage(1); }} options={levelOptions} />

          {/* Date range placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 14px', fontSize: '0.8rem', color: '#94a3b8', cursor: 'pointer', background: '#fff' }}>
            <IconCalendar /><span>Select Date Range</span>
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={resetFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
            <IconReset /> Reset Filters
          </button>
        </div>

        {/* Table */}
        {error ? (
          <div style={{ padding: 24, color: '#ef4444', fontSize: '0.85rem' }}>⚠ {error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No submissions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['', 'Problem', 'Level', 'Language', 'Status', 'Your Code', 'Time', 'Memory', 'Submitted On', 'Action'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '0.78rem', whiteSpace: 'nowrap', background: '#fff' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((sub, idx) => {
                  const title  = sub.challengeId?.title || '—';
                  const diff   = sub.challengeId?.difficulty || '';
                  const tags   = getTags(sub._id);
                  const status = sub.status || 'Not Submitted';
                  const sCfg   = STATUS_CFG[status] || STATUS_CFG['Not Submitted'];
                  const dCfg   = DIFF_CFG[diff];
                  const lang   = sub.language || '—';
                  const lColor = LANG_COLOR[lang] || '#64748b';
                  const time   = sub.time ? `${sub.time} ms` : '—';
                  const mem    = sub.memory ? `${sub.memory}` : '—';

                  return (
                    <tr key={sub._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Bookmark */}
                      <td style={{ padding: '12px 8px 12px 16px', color: '#cbd5e1' }}><IconBookmark /></td>

                      {/* Problem */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4, whiteSpace: 'nowrap' }}>{title}</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {tags.map(t => (
                            <span key={t} style={{ fontSize: '0.62rem', background: '#f1f5f9', color: '#64748b', borderRadius: 4, padding: '1px 7px', fontWeight: 500 }}>{t}</span>
                          ))}
                        </div>
                      </td>

                      {/* Level */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {dCfg ? (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: dCfg.color, background: dCfg.bg, borderRadius: 5, padding: '2px 10px' }}>{diff}</span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>

                      {/* Language */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {lang !== '—' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: lColor, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ color: '#374151', fontWeight: 500 }}>{lang}</span>
                          </div>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: sCfg.color, background: sCfg.bg, borderRadius: 6, padding: '3px 10px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sCfg.color }} />
                          {status}
                        </span>
                      </td>

                      {/* Your Code */}
                      <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>{time}</td>

                      {/* Time */}
                      <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>{time}</td>

                      {/* Memory */}
                      <td style={{ padding: '12px 16px', color: '#374151', whiteSpace: 'nowrap' }}>{mem}</td>

                      {/* Submitted On */}
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatDate(sub.createdAt)}</td>

                      {/* Action */}
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View</button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}><IconDots /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer & Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} submissions
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#cbd5e1' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevLeft />
            </button>

            {pageRange().map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>···</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)}
                  style={{ width: 32, height: 32, borderRadius: 7, border: page === p ? 'none' : '1px solid #e2e8f0', background: page === p ? '#ff7a00' : '#fff', color: page === p ? '#fff' : '#374151', fontWeight: page === p ? 700 : 400, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: page === p ? '0 2px 8px rgba(255,122,0,0.3)' : 'none' }}>
                  {p}
                </button>
              )
            )}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#cbd5e1' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconChevRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySubmissions;

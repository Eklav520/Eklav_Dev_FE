import React, { useEffect, useRef, useState } from 'react'
import {
  FiX, FiBookmark, FiShare2, FiMapPin, FiBriefcase, FiClock,
  FiExternalLink, FiFlag, FiChevronRight,
} from 'react-icons/fi'
import { FaStar } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

export interface Job {
  _id: string
  title: string
  company: string
  experience: string
  salary: string
  location: string
  skills: string[]
  highlights: string[]
  jobType: 'Internship' | 'Fresher' | 'Experienced'
  domain: 'Tech' | 'Non-Tech'
  logo: string
  postedDate: string
  expiryDate: string
  isExpired: boolean
  isRead: boolean
  isApplied?: boolean
  tag?: string
  attachments?: Array<{ fileName?: string; fileUrl?: string; mimeType?: string; size?: number }>
}

interface Props {
  show: boolean
  onHide: () => void
  job: Job | null
  onMarkedAsRead: (jobId: string) => void
  onApplied?: (jobId: string) => void
  jobs?: Job[]
  onSelectJob?: (j: Job) => void
  savedIds?: Set<string>
  onToggleSave?: (id: string) => void
}

// ── helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
const timeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return `${Math.floor(d / 30)}mo ago`
}

const PERKS = [
  { icon: '🏥', label: 'Health Insurance' },
  { icon: '🏖️', label: 'Paid Time Off' },
  { icon: '📚', label: 'Skill Development' },
  { icon: '⏰', label: 'Flexible Work Hours' },
  { icon: '💰', label: 'Performance Bonus' },
  { icon: '🏠', label: 'Work From Home' },
]

const TABS = ['Job Details', 'About Company', 'Similar Jobs'] as const
type Tab = typeof TABS[number]

// ── component ─────────────────────────────────────────────────────────────────
const JobDetailsModal: React.FC<Props> = ({
  show, onHide, job, onMarkedAsRead, onApplied,
  jobs = [], onSelectJob, savedIds = new Set(), onToggleSave,
}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [activeTab, setActiveTab] = useState<Tab>('Job Details')
  const [markLoading, setMarkLoading] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyError, setApplyError] = useState('')
  const centerRef = useRef<HTMLDivElement>(null)

  // reset tab on job change
  useEffect(() => { setActiveTab('Job Details'); setApplyError('') }, [job?._id])

  // block body scroll while open
  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [show])

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onHide() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onHide])

  if (!show || !job) return null

  const [fg, bg] = avatarColor(job.company)
  const isSaved = savedIds.has(job._id)
  const isExpired = job.isExpired || new Date(job.expiryDate) < new Date()
  const jobId = `JD-${job._id.slice(-4).toUpperCase()}`

  const handleMarkRead = async () => {
    if (job.isRead || markLoading || !token) return
    try {
      setMarkLoading(true)
      const res = await fetch(`${baseURL}/jobs/${job._id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) onMarkedAsRead(job._id)
    } catch { /* noop */ } finally { setMarkLoading(false) }
  }

  const handleApply = async () => {
    if (job.isApplied || applyLoading || isExpired || !token) return
    try {
      setApplyLoading(true)
      setApplyError('')

      // Pull the student's own profile (name, phone, skills, experience,
      // college, resume, rank score) rather than relying on the cached
      // session user or the job's own required-skills list — those aren't
      // the applicant's actual data.
      let displayName = (user as any)?.fullName || (user as any)?.username
      let profilePhone = ''
      let profileSkills: string[] = []
      let profileExperience = ''
      let profileLocation = ''
      let profileResume = ''
      let profileScore: number | null = null
      try {
        const profileRes = await fetch(`${baseURL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        if (profileRes.ok) {
          const profileData = await profileRes.json()
          const profile = profileData.user ?? profileData
          displayName = displayName || profile?.fullName || profile?.username
          profilePhone = profile?.phoneNo || ''
          profileSkills = Array.isArray(profile?.skills) ? profile.skills : []
          profileExperience = profile?.experience || ''
          profileLocation = profile?.college || ''
          profileResume = profile?.resume || ''
          profileScore = typeof profile?.rankScore === 'number' ? profile.rankScore : null
        }
      } catch { /* fall through to defaults below */ }
      displayName = displayName || (user?.email ? user.email.split('@')[0] : 'Student')

      const res = await fetch(`${baseURL}/jobs/${job._id}/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          email: user?.email || '',
          phone: profilePhone,
          skills: profileSkills,
          experience: profileExperience,
          location: profileLocation,
          resumeUrl: profileResume,
          score: profileScore,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to apply')
      }
      onApplied?.(job._id)
    } catch (e: any) {
      setApplyError(e?.message || 'Failed to apply')
    } finally {
      setApplyLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: job.title, text: `${job.title} at ${job.company}`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: '#f1f5f9', display: 'flex', flexDirection: 'column',
      fontFamily: 'inherit',
    }}>
      {/* ── Breadcrumb bar ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.78rem', color: '#64748b', flexShrink: 0,
      }}>
        <button onClick={onHide} style={{
          background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '0.78rem', padding: 0,
        }}>
          ← Back to Jobs
        </button>
        <span style={{ color: '#cbd5e1', margin: '0 4px' }}>|</span>
        <span style={{ color: '#94a3b8' }}>All Jobs</span>
        <FiChevronRight size={12} style={{ color: '#cbd5e1' }} />
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{job.title}</span>

        {/* Close */}
        <button onClick={onHide} style={{
          marginLeft: 'auto', background: '#f1f5f9', border: '1px solid #e2e8f0',
          borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#475569',
        }}>
          <FiX size={16} />
        </button>
      </div>

      {/* thin scrollbar styles */}
      <style>{`
        .jd-scroll::-webkit-scrollbar { width: 4px; }
        .jd-scroll::-webkit-scrollbar-track { background: transparent; }
        .jd-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
        .jd-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      {/* ── 3-column body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>

        {/* ── Left: Job list sidebar ── */}
        <div style={{
          width: 300, flexShrink: 0, background: '#fff',
          borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ff7a00' }}>
              {jobs.length} Jobs found
            </span>
          </div>
          <div className="jd-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {jobs.map(j => {
              const [jfg, jbg] = avatarColor(j.company)
              const isSelected = j._id === job._id
              return (
                <div
                  key={j._id}
                  onClick={() => onSelectJob?.(j)}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    marginBottom: 4,
                    border: isSelected ? '1.5px solid #ff7a00' : '1.5px solid transparent',
                    background: isSelected ? 'rgba(255,122,0,0.04)' : '#fff',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#fff' }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: jbg, color: jfg, fontSize: '0.7rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {initials(j.company)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: 4 }}>{j.company}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', color: '#94a3b8' }}>
                        <FiMapPin size={9} />{j.location.split(',')[0]}
                        <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{timeAgo(j.postedDate)}</span>
                      </div>
                      {j.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
                          {j.skills.slice(0, 3).map(s => (
                            <span key={s} style={{
                              background: 'rgba(255,122,0,0.06)', color: '#c05c00',
                              border: '1px solid rgba(255,122,0,0.2)', borderRadius: 20,
                              padding: '1px 6px', fontSize: '0.6rem', fontWeight: 600,
                            }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Center: Job detail ── */}
        <div ref={centerRef} className="jd-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header card */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '20px 24px 0' }}>
            {/* Top row: avatar + title + actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: bg, color: fg, fontSize: '1rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {initials(job.company)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem' }}>{job.title}</span>
                  {job.tag && (
                    <span style={{
                      background: job.tag === 'New' ? '#dcfce7' : '#fee2e2',
                      color: job.tag === 'New' ? '#16a34a' : '#dc2626',
                      border: `1px solid ${job.tag === 'New' ? '#86efac' : '#fca5a5'}`,
                      borderRadius: 6, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700,
                    }}>{job.tag}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#475569' }}>
                  <span style={{ fontWeight: 600 }}>{job.company}</span>
                  <span style={{ color: '#2563eb', fontSize: '0.7rem' }}>✓</span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onToggleSave?.(job._id)}
                  style={{
                    background: isSaved ? 'rgba(255,122,0,0.1)' : '#fff',
                    border: '1px solid #e2e8f0', borderRadius: 8,
                    width: 36, height: 36, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer',
                    color: isSaved ? '#ff7a00' : '#64748b',
                  }}
                >
                  <FiBookmark size={15} fill={isSaved ? '#ff7a00' : 'none'} />
                </button>
                <button
                  onClick={handleShare}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                    width: 36, height: 36, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#64748b',
                  }}
                >
                  <FiShare2 size={15} />
                </button>
                <button
                  onClick={handleMarkRead}
                  disabled={job.isRead || markLoading || isExpired}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0', borderRadius: 8, color: job.isRead ? '#16a34a' : '#475569',
                    padding: '8px 16px', fontWeight: 600, fontSize: '0.82rem',
                    cursor: (job.isRead || isExpired) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    opacity: markLoading ? 0.7 : 1,
                  }}
                >
                  {markLoading ? 'Marking…' : job.isRead ? '✓ Marked' : 'Mark As Read'}
                </button>
                <button
                  onClick={handleApply}
                  disabled={job.isApplied || applyLoading || isExpired}
                  style={{
                    background: isExpired ? '#94a3b8' : job.isApplied ? '#16a34a' : '#ff7a00',
                    border: 'none', borderRadius: 8, color: '#fff',
                    padding: '8px 20px', fontWeight: 700, fontSize: '0.85rem',
                    cursor: (job.isApplied || isExpired) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    opacity: applyLoading ? 0.7 : 1,
                    transition: 'background 0.3s',
                  }}
                >
                  {isExpired
                    ? 'Expired'
                    : applyLoading
                    ? 'Applying…'
                    : job.isApplied
                    ? '✓ Applied'
                    : 'Apply Now'}
                </button>
              </div>
            </div>

            {applyError && (
              <div style={{ marginBottom: 10, fontSize: '0.78rem', color: '#dc2626' }}>{applyError}</div>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#64748b', marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={11} />{job.location}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiBriefcase size={11} />{job.jobType}</span>
              {job.experience && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={11} />{job.experience}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={11} />Posted {timeAgo(job.postedDate)}</span>
            </div>

            {/* Skills tags */}
            {job.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {job.skills.map(s => (
                  <span key={s} style={{
                    background: '#f1f5f9', color: '#475569',
                    border: '1px solid #e2e8f0', borderRadius: 20,
                    padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600,
                  }}>{s}</span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f1f5f9', marginTop: 4 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: `2.5px solid ${activeTab === tab ? '#ff7a00' : 'transparent'}`,
                    color: activeTab === tab ? '#ff7a00' : '#64748b',
                    fontWeight: activeTab === tab ? 700 : 500,
                    fontSize: '0.82rem', padding: '10px 16px',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >{tab}</button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, padding: '20px 24px' }}>

            {activeTab === 'Job Details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Job overview */}
                <Section title="Job Overview">
                  <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.8, margin: 0 }}>
                    We are looking for a skilled <strong>{job.title}</strong> to join our growing team at {job.company}.
                    {job.domain === 'Tech'
                      ? ' You will be responsible for building responsive web applications, integrating APIs, and delivering excellent user experiences.'
                      : ' You will be responsible for driving business growth, collaborating with teams, and delivering excellent results.'}
                  </p>
                </Section>

                {/* Highlights / Description */}
                {job.highlights && job.highlights.length > 0 && (
                  <Section title="Responsibilities & Requirements">
                    <div className="jd-highlights" dangerouslySetInnerHTML={{ __html: job.highlights[0] || '' }} />
                  </Section>
                )}
                <style>{`
                  .jd-highlights { font-size: 0.85rem; line-height: 1.8; color: #475569 !important; }
                  .jd-highlights * { color: #475569 !important; background: transparent !important; }
                  .jd-highlights h1, .jd-highlights h2, .jd-highlights h3,
                  .jd-highlights h4, .jd-highlights h5, .jd-highlights h6 {
                    color: #0f172a !important; font-size: 0.95rem !important;
                    font-weight: 700 !important; margin: 12px 0 6px !important;
                  }
                  .jd-highlights p { margin-bottom: 6px !important; }
                  .jd-highlights ul, .jd-highlights ol { padding-left: 20px !important; margin-bottom: 8px !important; }
                  .jd-highlights li { margin-bottom: 4px !important; }
                  .jd-highlights strong, .jd-highlights b { color: #0f172a !important; font-weight: 700 !important; }
                `}</style>

                {/* Required skills */}
                {job.skills.length > 0 && (
                  <Section title="Required Skills">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {job.skills.map(s => (
                        <span key={s} style={{
                          background: 'rgba(255,122,0,0.06)', color: '#c05c00',
                          border: '1px solid rgba(255,122,0,0.2)',
                          borderRadius: 20, padding: '4px 12px',
                          fontSize: '0.75rem', fontWeight: 600,
                        }}>{s}</span>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Attachments */}
                {(job.attachments || []).length > 0 && (
                  <Section title="Attachments">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(job.attachments || []).map((att, i) => (
                        <a key={i} href={att.fileUrl} target="_blank" rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            color: '#ff7a00', fontSize: '0.82rem', textDecoration: 'none',
                            background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)',
                            borderRadius: 8, padding: '6px 12px', width: 'fit-content',
                          }}>
                          <FiExternalLink size={12} />
                          {att.fileName || `Attachment ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Expiry */}
                {isExpired && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fca5a5',
                    borderRadius: 10, padding: '14px 16px', color: '#dc2626', fontSize: '0.85rem',
                  }}>
                    <strong>This job posting has expired.</strong> Applications are no longer being accepted.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'About Company' && (
              <Section title={job.company}>
                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.8, margin: 0 }}>
                  {job.company} is a leading organization in the {job.domain} sector, based in {job.location}.
                  We offer competitive packages and growth opportunities for talented professionals.
                </p>
              </Section>
            )}

            {activeTab === 'Similar Jobs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {jobs.filter(j => j._id !== job._id && (j.domain === job.domain || j.skills.some(s => job.skills.includes(s)))).slice(0, 5).map(j => {
                  const [jfg, jbg] = avatarColor(j.company)
                  return (
                    <div key={j._id} onClick={() => onSelectJob?.(j)}
                      style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                        padding: '14px 16px', display: 'flex', gap: 12, cursor: 'pointer',
                      }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: jbg, color: jfg, fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {initials(j.company)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{j.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{j.company} · {j.location.split(',')[0]}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {j.skills.slice(0, 4).map(s => (
                            <span key={s} style={{ background: 'rgba(255,122,0,0.06)', color: '#c05c00', border: '1px solid rgba(255,122,0,0.2)', borderRadius: 20, padding: '1px 8px', fontSize: '0.62rem', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Company info + Job summary ── */}
        <div className="jd-scroll" style={{
          width: 280, flexShrink: 0, overflowY: 'auto',
          padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14,
          borderLeft: '1px solid #e2e8f0',
        }}>

          {/* About Company */}
          <RightCard title="About Company">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, color: fg, fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {initials(job.company)}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{job.company}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: '#f59e0b' }}>
                  {[1,2,3,4].map(i => <FaStar key={i} size={9} />)}
                  <FaStar size={9} style={{ color: '#e2e8f0' }} />
                  <span style={{ color: '#64748b', marginLeft: 3 }}>4.0</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.7, margin: '0 0 10px' }}>
              A {job.domain} company offering exciting career opportunities for professionals worldwide.
            </p>
            <InfoRow label="Industry" value={job.domain === 'Tech' ? 'IT Services & Consulting' : 'Business Services'} />
            <InfoRow label="Company Size" value="201-500 Employees" />
            <InfoRow label="Headquarters" value={job.location.split(',')[0]} />
            <button style={{
              marginTop: 10, width: '100%', background: '#fff',
              border: '1.5px solid #ff7a00', color: '#ff7a00',
              borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
            }}>
              View Company Profile
            </button>
          </RightCard>

          {/* Job Summary */}
          <RightCard title="Job Summary">
            <InfoRow label="Job Type" value={job.jobType} icon="💼" />
            <InfoRow label="Experience" value={job.experience || 'Not specified'} icon="📈" />
            <InfoRow label="Salary" value={job.salary || 'Not disclosed'} icon="₹" />
            <InfoRow label="Location" value={job.location} icon="📍" />
            <InfoRow label="Work Mode" value="Hybrid" icon="🖥️" />
            <InfoRow label="Job ID" value={jobId} icon="🔖" />
            <button style={{
              marginTop: 10, width: '100%', background: '#fff',
              border: '1px solid #fca5a5', color: '#dc2626',
              borderRadius: 8, padding: '7px', fontWeight: 600, fontSize: '0.75rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <FiFlag size={12} /> Report Job
            </button>
          </RightCard>

          {/* Benefits & Perks */}
          <RightCard title="Benefits & Perks">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PERKS.map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#475569' }}>
                  <span style={{ fontSize: '1rem' }}>{p.icon}</span>
                  <span style={{ fontWeight: 500 }}>{p.label}</span>
                </div>
              ))}
            </div>
          </RightCard>

        </div>
      </div>
    </div>
  )
}

// ── tiny sub-components ───────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
      {title}
    </div>
    {children}
  </div>
)

const RightCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 14px' }}>
    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: 12 }}>{title}</div>
    {children}
  </div>
)

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon && <span style={{ fontSize: '0.8rem' }}>{icon}</span>}
      {label}
    </span>
    <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </span>
  </div>
)

export default JobDetailsModal

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FiEdit2, FiSearch, FiBell, FiSettings, FiCheckCircle, FiMapPin, FiCalendar, FiUsers,
  FiGlobe, FiPlay, FiTarget, FiEye, FiHeart, FiBriefcase, FiUserPlus, FiAward, FiX, FiPlus,
  FiTrash2, FiMail, FiPhone, FiLinkedin, FiTwitter, FiFacebook, FiInstagram, FiYoutube, FiUpload,
  FiExternalLink, FiArrowRight,
} from 'react-icons/fi'
import { BsRocket, BsGem } from 'react-icons/bs'

// Uploaded files come back as a relative "/uploads/xxx" path; external URLs
// (typed in manually) are already absolute — only prefix the former.
const resolveMediaUrl = (baseURL: string, url?: string) => {
  if (!url) return ''
  return /^https?:\/\//.test(url) ? url : `${baseURL}${url}`
}

const ACCENT = '#f2622f' // coral — matches /hr/jobs, /hr/candidates, /hr/pipeline, /hr/interviews & /hr/settings
const GREEN  = '#16a34a'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#7c3aed'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

// ─── Types ──────────────────────────────────────────────────────────────────

type Highlight = {
  employees: number; employeesTrend: string
  activeJobs: number; activeJobsTrend: string
  hiresMade: number; hiresMadeSub: string
  countries: number
  awardsWon: number; awardsWonSub: string
}
type Perk = { icon: string; title: string; description: string }
type Department = { name: string; count: number; percent: number }
type LocationItem = { name: string; type: string; isHQ: boolean }
type KeyContact = { name: string; role: string; email: string; phone: string; avatarUrl: string }
type SocialLinks = { linkedin: string; twitter: string; facebook: string; instagram: string; youtube: string }

type CompanyProfile = {
  _id?: string
  name: string; tagline: string; verified: boolean
  logoUrl: string; heroImageUrl: string; cultureVideoUrl: string; cultureVideoDuration: string
  location: string; foundedYear: string; employeeCountRange: string; website: string
  industry: string; companyType: string; headquarters: string
  aboutText: string; mission: string; vision: string; values: string; cultureText: string
  highlights: Highlight
  cultureImages: string[]
  whyJoinPerks: Perk[]
  departments: Department[]
  locations: LocationItem[]
  socialLinks: SocialLinks
  keyContacts: KeyContact[]
}

const EMPTY_PROFILE: CompanyProfile = {
  name: '', tagline: '', verified: false,
  logoUrl: '', heroImageUrl: '', cultureVideoUrl: '', cultureVideoDuration: '',
  location: '', foundedYear: '', employeeCountRange: '', website: '',
  industry: '', companyType: '', headquarters: '',
  aboutText: '', mission: '', vision: '', values: '', cultureText: '',
  highlights: { employees: 0, employeesTrend: '', activeJobs: 0, activeJobsTrend: '', hiresMade: 0, hiresMadeSub: '', countries: 0, awardsWon: 0, awardsWonSub: '' },
  cultureImages: [], whyJoinPerks: [], departments: [], locations: [],
  socialLinks: { linkedin: '', twitter: '', facebook: '', instagram: '', youtube: '' },
  keyContacts: [],
}

const PERK_ICONS: Record<string, React.ReactNode> = {
  briefcase: <FiBriefcase size={14} />, growth: <FiTarget size={14} />,
  clock: <FiUsers size={14} />, heart: <FiHeart size={14} />,
}
const PERK_STYLE: Record<string, { bg: string; color: string }> = {
  briefcase: { bg: '#fef1ec', color: '#f2622f' }, growth: { bg: '#fef1ec', color: '#f2622f' },
  clock: { bg: '#fff7ed', color: '#f59e0b' }, heart: { bg: '#fef2f2', color: '#ef4444' },
}

const TABS = ['Overview', 'About Us', 'Culture', 'Benefits', 'Gallery', 'Awards & Recognitions', 'Policies', 'Contact Info'] as const

const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

// ─── Small building blocks ──────────────────────────────────────────────────

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20, ...style }}>{children}</div>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{children}</div>
)

// Symbolic "this field is empty" indicator — muted dashed-underline text,
// clickable straight into Edit Profile when the viewer is allowed to fill it in.
const MissingField = ({ children, icon, canEdit, onClick, style }: {
  children: React.ReactNode; icon?: React.ReactNode; canEdit: boolean; onClick: () => void; style?: React.CSSProperties
}) => (
  <button
    onClick={() => canEdit && onClick()}
    disabled={!canEdit}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0,
      color: '#cbd5e1', fontSize: '0.8rem', fontStyle: 'italic', cursor: canEdit ? 'pointer' : 'default',
      borderBottom: canEdit ? '1px dashed #cbd5e1' : 'none', lineHeight: 1.6, ...style,
    }}
  >
    {icon}{children}
  </button>
)

// ─── Main Page ───────────────────────────────────────────────────────────────

const CompanyProfilePage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token
  const canEdit = ['admin', 'instituteAdmin', 'collegeAdmin', 'hrAdmin'].includes(String(user?.role || ''))

  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Overview')
  const [showEdit, setShowEdit] = useState(false)
  const [loadError, setLoadError] = useState('')

  const fetchProfile = async () => {
    if (!baseURL || !token) return
    setLoadError('')
    try {
      const res = await fetch(`${baseURL}/hr/company-profile`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setProfile({ ...EMPTY_PROFILE, ...data, highlights: { ...EMPTY_PROFILE.highlights, ...(data.highlights || {}) }, socialLinks: { ...EMPTY_PROFILE.socialLinks, ...(data.socialLinks || {}) } })
      } else {
        const body = await res.json().catch(() => null)
        setLoadError(body?.error || `Failed to load company profile (HTTP ${res.status})`)
      }
    } catch {
      setLoadError('Failed to reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [baseURL, token])

  const h = profile.highlights

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Company Profile</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Manage your company information and showcase your brand to candidates.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Search candidates, jobs..." style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: 220, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem', outline: 'none', background: '#fff', color: '#334155', colorScheme: 'light' }} />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}><FiSettings size={15} /></button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}><FiBell size={15} /></button>
          {canEdit && (
            <button onClick={() => setShowEdit(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiEdit2 size={13} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fef2f2', border: `1px solid #fecaca`, color: '#b91c1c', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          <span>{loadError}</span>
          <button onClick={fetchProfile} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', flexShrink: 0 }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: GRAY, fontSize: '0.85rem' }}>Loading company profile…</div>
      ) : loadError ? null : (
        <>
          {/* Identity card (left) / Company Snapshot (right) — same row height */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'stretch', marginBottom: 16 }}>
            <Card style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => canEdit && setShowEdit(true)}
                    disabled={!canEdit || !!profile.logoUrl}
                    style={{
                      width: 96, height: 96, borderRadius: 20, background: '#0f172a', flexShrink: 0, border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      cursor: canEdit && !profile.logoUrl ? 'pointer' : 'default',
                    }}
                    title={canEdit && !profile.logoUrl ? 'Click to add a logo' : undefined}
                  >
                    {profile.logoUrl ? <img src={resolveMediaUrl(baseURL, profile.logoUrl)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: ORANGE, fontWeight: 800, fontSize: '2rem' }}>{initials(profile.name || 'E')}</span>}
                  </button>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>{profile.name || 'Company name not set'}</h2>
                      {profile.verified && <FiCheckCircle size={17} color={ACCENT} title="Verified" />}
                    </div>
                    {profile.tagline ? (
                      <p style={{ margin: '5px 0 12px', fontSize: '0.86rem', color: GRAY }}>{profile.tagline}</p>
                    ) : (
                      <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} style={{ margin: '5px 0 12px' }}>Add a tagline</MissingField>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: '0.8rem', color: GRAY }}>
                      {profile.location ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin size={13} />{profile.location}</span>
                        : <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} icon={<FiMapPin size={13} />}>Add location</MissingField>}
                      {profile.foundedYear ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiCalendar size={13} />Founded in {profile.foundedYear}</span>
                        : <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} icon={<FiCalendar size={13} />}>Add founded year</MissingField>}
                      {profile.employeeCountRange ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUsers size={13} />{profile.employeeCountRange} Employees</span>
                        : <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} icon={<FiUsers size={13} />}>Add employee count</MissingField>}
                    </div>
                    {profile.website ? (
                      <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.8rem', color: ACCENT, textDecoration: 'none', fontWeight: 500 }}>
                        <FiGlobe size={13} />{profile.website.replace(/^https?:\/\//, '')}<FiExternalLink size={11} />
                      </a>
                    ) : (
                      <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} icon={<FiGlobe size={13} />} style={{ marginTop: 12 }}>Add website</MissingField>
                    )}
                  </div>
                  {profile.heroImageUrl ? (
                    <div style={{ width: 340, height: 150, borderRadius: 14, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#1e293b' }}>
                      <img src={resolveMediaUrl(baseURL, profile.heroImageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <button
                      onClick={() => canEdit && setShowEdit(true)}
                      disabled={!canEdit}
                      style={{
                        width: 340, height: 150, borderRadius: 14, flexShrink: 0, border: `1.5px dashed ${BORDER}`, background: '#f8fafc',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#94a3b8',
                        cursor: canEdit ? 'pointer' : 'default',
                      }}
                    >
                      <FiUpload size={20} />
                      <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>No cover image added</span>
                      {canEdit && <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Click to add one</span>}
                    </button>
                  )}
                </div>
            </Card>

            {/* Company Snapshot — aligned beside identity card */}
            <Card>
              <SectionTitle>Company Snapshot</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Industry', profile.industry], ['Company Type', profile.companyType], ['Headquarters', profile.headquarters],
                  ['Year Founded', profile.foundedYear], ['Company Size', profile.employeeCountRange],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: GRAY }}>{label}</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{val || '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 20, overflowX: 'auto', overflowY: 'hidden' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap',
                fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? ACCENT : GRAY,
                borderBottom: activeTab === t ? `2px solid ${ACCENT}` : '2px solid transparent', marginBottom: -1,
              }}>{t}</button>
            ))}
          </div>

          {activeTab === 'Overview' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'flex-start' }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <Card>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 340px', minWidth: 0 }}>
                      <SectionTitle>About {profile.name || 'the company'}</SectionTitle>
                      {profile.aboutText ? (
                        <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.7, margin: '0 0 16px' }}>{profile.aboutText}</p>
                      ) : (
                        <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} style={{ margin: '0 0 16px', fontSize: '0.85rem' }}>Add a company description</MissingField>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                        {[
                          { icon: <BsRocket size={19} color={ACCENT} />, bg: '#fef1ec', title: 'Our Mission', text: profile.mission, placeholder: 'Add mission', list: false },
                          { icon: <FiEye size={19} color={PURPLE} />, bg: '#f1edfe', title: 'Our Vision', text: profile.vision, placeholder: 'Add vision', list: false },
                          { icon: <BsGem size={19} color={ORANGE} />, bg: '#fff4e6', title: 'Our Values', text: profile.values, placeholder: 'Add values', list: true },
                        ].map(b => (
                          <div key={b.title} style={{ background: b.bg, borderRadius: 14, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              {b.icon}
                              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{b.title}</span>
                            </div>
                            {b.text ? (
                              b.list ? (
                                <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.76rem', color: GRAY, lineHeight: 1.8 }}>
                                  {b.text.split(',').map(v => v.trim()).filter(Boolean).map((v, i) => <li key={i}>{v}</li>)}
                                </ul>
                              ) : (
                                <div style={{ fontSize: '0.76rem', color: GRAY, lineHeight: 1.6 }}>{b.text}</div>
                              )
                            ) : (
                              <MissingField canEdit={canEdit} onClick={() => setShowEdit(true)} style={{ fontSize: '0.76rem' }}>{b.placeholder}</MissingField>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {profile.cultureVideoUrl ? (
                      <div style={{ width: 300, minHeight: 220, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#0f172a' }}>
                        {profile.heroImageUrl && (
                          <img src={resolveMediaUrl(baseURL, profile.heroImageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, position: 'absolute', inset: 0 }} />
                        )}
                        <a href={resolveMediaUrl(baseURL, profile.cultureVideoUrl)} target="_blank" rel="noreferrer" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiPlay size={20} color="#0f172a" style={{ marginLeft: 2 }} />
                          </div>
                        </a>
                        <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>Life at {profile.name || 'us'}</div>
                        {profile.cultureVideoDuration && <div style={{ position: 'absolute', right: 14, bottom: 12, color: '#fff', fontSize: '0.72rem' }}>{profile.cultureVideoDuration}</div>}
                      </div>
                    ) : (
                      <button
                        onClick={() => canEdit && setShowEdit(true)}
                        disabled={!canEdit}
                        style={{
                          width: 300, minHeight: 220, borderRadius: 12, flexShrink: 0, border: `1.5px dashed ${BORDER}`, background: '#f8fafc',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8',
                          cursor: canEdit ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiPlay size={18} color="#94a3b8" style={{ marginLeft: 2 }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>No culture video added</span>
                        {canEdit && <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Click to add one</span>}
                      </button>
                    )}
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Company Highlights</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
                    {[
                      { icon: <FiUsers size={20} color={PURPLE} />, bg: '#f5f3ff', value: `${h.employees}+`, label: 'Employees', trend: h.employeesTrend, trendUp: true },
                      { icon: <FiBriefcase size={20} color={GREEN} />, bg: '#ecfdf5', value: `${h.activeJobs}+`, label: 'Active Jobs', trend: h.activeJobsTrend, trendUp: true },
                      { icon: <FiUserPlus size={20} color={ORANGE} />, bg: '#fff7ed', value: `${h.hiresMade >= 1000 ? `${Math.round(h.hiresMade / 1000)}K` : h.hiresMade}+`, label: 'Hires Made', trend: h.hiresMadeSub, trendUp: false },
                      { icon: <FiGlobe size={20} color={ACCENT} />, bg: '#fef1ec', value: String(h.countries), label: 'Countries', trend: 'Global presence', trendUp: false },
                      { icon: <FiAward size={20} color={RED} />, bg: '#fef2f2', value: `${h.awardsWon}+`, label: 'Awards Won', trend: h.awardsWonSub, trendUp: false },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{s.value}</div>
                          <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 500 }}>{s.label}</div>
                          {s.trend && <div style={{ fontSize: '0.7rem', color: s.trendUp ? GREEN : GRAY, marginTop: 2, whiteSpace: 'nowrap' }}>{s.trend}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
                  <Card style={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionTitle>Our Culture</SectionTitle>
                    <p style={{ fontSize: '0.8rem', color: GRAY, margin: '-8px 0 12px' }}>{profile.cultureText || 'We believe in creating a diverse, inclusive and collaborative environment where everyone can do their best work and grow.'}</p>
                    {profile.cultureImages.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {profile.cultureImages.slice(0, 4).map((img, i) => (
                          <div key={i} style={{ height: 110, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', border: `1px solid ${BORDER}` }}>
                            <img src={resolveMediaUrl(baseURL, img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    ) : <div style={{ fontSize: '0.78rem', color: GRAY }}>No culture photos added yet.</div>}
                    <button onClick={() => setActiveTab('Gallery')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 14, display: 'flex', alignItems: 'center', gap: 5, color: ACCENT, fontSize: '0.78rem', fontWeight: 600 }}>
                      View more photos <FiArrowRight size={12} />
                    </button>
                  </Card>

                  <Card style={{ display: 'flex', flexDirection: 'column' }}>
                    <SectionTitle>Why Join {profile.name || 'us'}?</SectionTitle>
                    {profile.whyJoinPerks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                        {profile.whyJoinPerks.map((p, i) => {
                          const style = PERK_STYLE[p.icon] || { bg: '#fef1ec', color: ACCENT }
                          return (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div style={{ width: 30, height: 30, borderRadius: 8, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{PERK_ICONS[p.icon] || <FiCheckCircle size={14} />}</div>
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{p.title}</div>
                                <div style={{ fontSize: '0.74rem', color: GRAY }}>{p.description}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : <div style={{ fontSize: '0.78rem', color: GRAY }}>No perks added yet.</div>}
                    <button onClick={() => setActiveTab('Benefits')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 14, display: 'flex', alignItems: 'center', gap: 5, color: ACCENT, fontSize: '0.78rem', fontWeight: 600 }}>
                      View all benefits <FiArrowRight size={12} />
                    </button>
                  </Card>
                </div>
              </div>

              {/* Right sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Departments</span>
                  </div>
                  {profile.departments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {profile.departments.map((d, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 3 }}>
                            <span style={{ color: '#334155' }}>{d.name}</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{d.count}</span>
                          </div>
                          <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, d.percent)}%`, background: ACCENT, borderRadius: 99 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontSize: '0.78rem', color: GRAY }}>No departments added yet.</div>}
                </Card>

                <Card>
                  <SectionTitle>Our Locations</SectionTitle>
                  {profile.locations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {profile.locations.map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FiMapPin size={13} color={GRAY} />
                          <span style={{ fontSize: '0.78rem', color: '#0f172a', flex: 1 }}>{l.name}</span>
                          <span style={{ fontSize: '0.66rem', fontWeight: 600, color: l.isHQ ? ACCENT : GRAY, background: l.isHQ ? '#fef1ec' : '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>{l.type || (l.isHQ ? 'Headquarters' : 'Office')}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontSize: '0.78rem', color: GRAY }}>No locations added yet.</div>}
                </Card>

                <Card>
                  <SectionTitle>Connect with us</SectionTitle>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[
                      { key: 'linkedin', icon: <FiLinkedin size={15} />, color: '#0a66c2' },
                      { key: 'twitter', icon: <FiTwitter size={15} />, color: '#1da1f2' },
                      { key: 'facebook', icon: <FiFacebook size={15} />, color: '#1877f2' },
                      { key: 'instagram', icon: <FiInstagram size={15} />, color: '#e1306c' },
                      { key: 'youtube', icon: <FiYoutube size={15} />, color: '#ff0000' },
                    ].map(s => {
                      const url = (profile.socialLinks as any)[s.key]
                      return (
                        <a key={s.key} href={url || undefined} target="_blank" rel="noreferrer"
                          style={{ width: 34, height: 34, borderRadius: '50%', background: url ? s.color : '#f1f5f9', color: url ? '#fff' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: url ? 'auto' : 'none' }}>
                          {s.icon}
                        </a>
                      )
                    })}
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Key Contacts</SectionTitle>
                  {profile.keyContacts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {profile.keyContacts.map((c, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: GRAY }}>
                            {c.avatarUrl ? <img src={resolveMediaUrl(baseURL, c.avatarUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(c.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                            <div style={{ fontSize: '0.7rem', color: GRAY }}>{c.role}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {c.email && <a href={`mailto:${c.email}`} style={{ color: GRAY }}><FiMail size={13} /></a>}
                            {c.phone && <a href={`tel:${c.phone}`} style={{ color: GRAY }}><FiPhone size={13} /></a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div style={{ fontSize: '0.78rem', color: GRAY }}>No key contacts added yet.</div>}
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '50px 0', color: GRAY }}>
                <div style={{ fontSize: '0.85rem' }}>{activeTab} content will appear here.</div>
              </div>
            </Card>
          )}
        </>
      )}

      {showEdit && (
        <EditProfileModal
          profile={profile}
          baseURL={baseURL}
          token={token}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setProfile(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}

// ─── Edit Profile Modal ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = { width: '100%', height: 36, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.8rem', color: '#0f172a', background: '#fff', colorScheme: 'light', outline: 'none', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { fontSize: '0.72rem', fontWeight: 600, color: GRAY, marginBottom: 4, display: 'block' }
const textareaStyle: React.CSSProperties = { ...inputStyle, height: 70, padding: '8px 10px', resize: 'vertical' as const, fontFamily: 'inherit' }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label style={labelStyle}>{label}</label>{children}</div>
)

const EDIT_SECTIONS = [
  { key: 'Basic Info', icon: <FiSettings size={15} />, desc: 'Name, logo, media & location' },
  { key: 'About & Culture', icon: <FiHeart size={15} />, desc: 'Description, values & photos' },
  { key: 'Highlights', icon: <FiAward size={15} />, desc: 'Stats shown on the overview' },
  { key: 'Departments & Locations', icon: <FiMapPin size={15} />, desc: 'Team breakdown & offices' },
  { key: 'Contacts & Social', icon: <FiUsers size={15} />, desc: 'Key contacts & social links' },
] as const
type EditSectionKey = typeof EDIT_SECTIONS[number]['key']

const SubHeading = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 12px', paddingBottom: 8, borderBottom: `1px solid ${BORDER}`, ...style }}>{children}</div>
)

// Shared file-picker widget for the modal — shows a thumbnail preview (or a
// placeholder box), an Upload/Change button, and a Remove button once set.
const UploadField = ({ label, value, previewSrc, hasPoster = true, accept, uploading, onUpload, onRemove, shape = 'square', isVideo = false }: {
  label: string; value: string; previewSrc: string; hasPoster?: boolean; accept: string; uploading: boolean
  onUpload: (file: File) => void; onRemove: () => void; shape?: 'square' | 'wide'; isVideo?: boolean
}) => {
  const inputId = `upload-${label.replace(/\s+/g, '-').toLowerCase()}`
  const boxStyle: React.CSSProperties = shape === 'wide'
    ? { width: '100%', height: 110, borderRadius: 10 }
    : { width: 76, height: 76, borderRadius: 12 }
  // A video file can't render inside an <img>; show a poster image if one
  // was explicitly supplied, else a play-icon placeholder confirming it's set.
  const showPoster = value && (!isVideo || hasPoster)
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ ...boxStyle, background: '#f1f5f9', border: `1px solid ${BORDER}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: shape === 'wide' ? 1 : undefined, position: 'relative' }}>
          {showPoster ? <img src={previewSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : value && isVideo ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#64748b' }}>
              <FiPlay size={18} />
              <span style={{ fontSize: '0.66rem' }}>Video uploaded</span>
            </div>
          ) : <FiUpload size={16} color="#94a3b8" />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor={inputId} style={{ height: 30, padding: '0 12px', borderRadius: 7, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <FiUpload size={12} /> {uploading ? 'Uploading…' : value ? 'Change' : 'Upload'}
          </label>
          <input id={inputId} type="file" accept={accept} style={{ display: 'none' }} disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }} />
          {value && (
            <button onClick={onRemove} style={{ height: 26, padding: '0 10px', borderRadius: 7, border: 'none', background: 'none', color: RED, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>Remove</button>
          )}
        </div>
      </div>
    </div>
  )
}

const EditProfileModal = ({ profile, baseURL, token, onClose, onSaved }: {
  profile: CompanyProfile; baseURL: string; token?: string
  onClose: () => void; onSaved: (p: CompanyProfile) => void
}) => {
  const [form, setForm] = useState<CompanyProfile>(JSON.parse(JSON.stringify(profile)))
  const [section, setSection] = useState<EditSectionKey>('Basic Info')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  const set = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => setForm(f => ({ ...f, [key]: value }))
  const setH = (key: keyof Highlight, value: string | number) => setForm(f => ({ ...f, highlights: { ...f.highlights, [key]: value } }))
  const setSocial = (key: keyof SocialLinks, value: string) => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }))

  const uploadFile = async (file: File, fieldKey: string, onDone: (url: string) => void) => {
    if (!baseURL || !token) return
    setUploadingField(fieldKey)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch(`${baseURL}/hr/company-profile/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      onDone(data.url)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploadingField(null)
    }
  }

  const save = async () => {
    if (!baseURL || !token) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${baseURL}/hr/company-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save company profile')
      const updated = await res.json()
      onSaved(updated)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 'min(1040px, 96vw)', height: 'min(760px, 92vh)', maxWidth: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Edit Company Profile</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: GRAY }}>Update how your company appears to candidates and staff.</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', color: GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FiX size={16} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar section nav */}
          <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${BORDER}`, background: '#f8fafc', padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {EDIT_SECTIONS.map(s => (
              <button key={s.key} onClick={() => setSection(s.key)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', border: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 10,
                background: section === s.key ? '#fff' : 'transparent',
                boxShadow: section === s.key ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
              }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: section === s.key ? '#fef1ec' : '#f1f5f9', color: section === s.key ? ACCENT : GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</span>
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: section === s.key ? 700 : 600, color: section === s.key ? '#0f172a' : '#334155' }}>{s.key}</div>
                  <div style={{ fontSize: '0.68rem', color: GRAY, marginTop: 1 }}>{s.desc}</div>
                </span>
              </button>
            ))}
          </div>

          {/* Content column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="hr-modal-scroll" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {section === 'Basic Info' && (
            <div>
              <SubHeading>Company Identity</SubHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                <Field label="Company Name"><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} /></Field>
                <Field label="Tagline"><input style={inputStyle} value={form.tagline} onChange={e => set('tagline', e.target.value)} /></Field>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.verified} onChange={e => set('verified', e.target.checked)} id="verified-cb" />
                  <label htmlFor="verified-cb" style={{ fontSize: '0.78rem', color: '#334155' }}>Show verified badge</label>
                </div>
              </div>

              <SubHeading>Media</SubHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                <UploadField
                  label="Logo" value={form.logoUrl} previewSrc={resolveMediaUrl(baseURL, form.logoUrl)}
                  accept="image/*" uploading={uploadingField === 'logoUrl'}
                  onUpload={f => uploadFile(f, 'logoUrl', url => set('logoUrl', url))}
                  onRemove={() => set('logoUrl', '')}
                />
                <UploadField
                  label="Hero / Side Image" value={form.heroImageUrl} previewSrc={resolveMediaUrl(baseURL, form.heroImageUrl)}
                  accept="image/*" uploading={uploadingField === 'heroImageUrl'}
                  onUpload={f => uploadFile(f, 'heroImageUrl', url => set('heroImageUrl', url))}
                  onRemove={() => set('heroImageUrl', '')}
                />
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 200px', gap: 14, alignItems: 'end' }}>
                  <UploadField
                    label="Culture Video" value={form.cultureVideoUrl} previewSrc={resolveMediaUrl(baseURL, form.heroImageUrl)}
                    hasPoster={!!form.heroImageUrl} isVideo
                    accept="video/*" uploading={uploadingField === 'cultureVideoUrl'} shape="wide"
                    onUpload={f => uploadFile(f, 'cultureVideoUrl', url => set('cultureVideoUrl', url))}
                    onRemove={() => set('cultureVideoUrl', '')}
                  />
                  <Field label="Video Duration (e.g. 02:45)"><input style={inputStyle} value={form.cultureVideoDuration} onChange={e => set('cultureVideoDuration', e.target.value)} /></Field>
                </div>
              </div>

              <SubHeading>Location & Details</SubHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Location"><input style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)} /></Field>
                <Field label="Founded Year"><input style={inputStyle} value={form.foundedYear} onChange={e => set('foundedYear', e.target.value)} /></Field>
                <Field label="Employee Count Range (e.g. 201-500)"><input style={inputStyle} value={form.employeeCountRange} onChange={e => set('employeeCountRange', e.target.value)} /></Field>
                <Field label="Website"><input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} /></Field>
                <Field label="Industry"><input style={inputStyle} value={form.industry} onChange={e => set('industry', e.target.value)} /></Field>
                <Field label="Company Type"><input style={inputStyle} value={form.companyType} onChange={e => set('companyType', e.target.value)} /></Field>
                <Field label="Headquarters"><input style={inputStyle} value={form.headquarters} onChange={e => set('headquarters', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {section === 'About & Culture' && (
            <div>
              <SubHeading>Description</SubHeading>
              <div style={{ marginBottom: 28 }}>
                <Field label="About Text"><textarea style={textareaStyle} value={form.aboutText} onChange={e => set('aboutText', e.target.value)} /></Field>
              </div>

              <SubHeading>Mission, Vision & Values</SubHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
                <Field label="Our Mission"><textarea style={textareaStyle} value={form.mission} onChange={e => set('mission', e.target.value)} /></Field>
                <Field label="Our Vision"><textarea style={textareaStyle} value={form.vision} onChange={e => set('vision', e.target.value)} /></Field>
                <Field label="Our Values (comma-separated)"><textarea style={textareaStyle} value={form.values} onChange={e => set('values', e.target.value)} /></Field>
              </div>

              <SubHeading>Culture</SubHeading>
              <div style={{ marginBottom: 28 }}>
                <div style={{ marginBottom: 14 }}>
                  <Field label="Culture Description"><textarea style={textareaStyle} value={form.cultureText} onChange={e => set('cultureText', e.target.value)} /></Field>
                </div>
                <span style={labelStyle}>Culture Photos</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                  {form.cultureImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', border: `1px solid ${BORDER}` }}>
                      <img src={resolveMediaUrl(baseURL, img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => set('cultureImages', form.cultureImages.filter((_, idx) => idx !== i))}
                        style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(15,23,42,0.7)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiX size={11} />
                      </button>
                    </div>
                  ))}
                  <label htmlFor="upload-culture-photo" style={{ height: 80, borderRadius: 8, border: `1.5px dashed ${BORDER}`, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: GRAY }}>
                    <FiUpload size={15} />
                    <span style={{ fontSize: '0.66rem', fontWeight: 600 }}>{uploadingField === 'cultureImages' ? 'Uploading…' : 'Add photo'}</span>
                  </label>
                  <input id="upload-culture-photo" type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingField === 'cultureImages'}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) uploadFile(f, 'cultureImages', url => set('cultureImages', [...form.cultureImages, url]))
                      e.target.value = ''
                    }} />
                </div>
              </div>

              <SubHeading>Perks & Benefits</SubHeading>
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button onClick={() => set('whyJoinPerks', [...form.whyJoinPerks, { icon: 'briefcase', title: '', description: '' }])} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4 }}><FiPlus size={12} /> Add perk</button>
                </div>
                {form.whyJoinPerks.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 30px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <select style={inputStyle} value={p.icon} onChange={e => set('whyJoinPerks', form.whyJoinPerks.map((v, idx) => idx === i ? { ...v, icon: e.target.value } : v))}>
                      {Object.keys(PERK_ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input style={inputStyle} placeholder="Title" value={p.title} onChange={e => set('whyJoinPerks', form.whyJoinPerks.map((v, idx) => idx === i ? { ...v, title: e.target.value } : v))} />
                    <input style={inputStyle} placeholder="Description" value={p.description} onChange={e => set('whyJoinPerks', form.whyJoinPerks.map((v, idx) => idx === i ? { ...v, description: e.target.value } : v))} />
                    <button onClick={() => set('whyJoinPerks', form.whyJoinPerks.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'Highlights' && (
            <div>
              <SubHeading>Growth Stats</SubHeading>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Employees"><input type="number" style={inputStyle} value={form.highlights.employees} onChange={e => setH('employees', Number(e.target.value))} /></Field>
                <Field label="Employees Trend (e.g. ↑ 15% this year)"><input style={inputStyle} value={form.highlights.employeesTrend} onChange={e => setH('employeesTrend', e.target.value)} /></Field>
                <Field label="Active Jobs"><input type="number" style={inputStyle} value={form.highlights.activeJobs} onChange={e => setH('activeJobs', Number(e.target.value))} /></Field>
                <Field label="Active Jobs Trend"><input style={inputStyle} value={form.highlights.activeJobsTrend} onChange={e => setH('activeJobsTrend', e.target.value)} /></Field>
                <Field label="Hires Made"><input type="number" style={inputStyle} value={form.highlights.hiresMade} onChange={e => setH('hiresMade', Number(e.target.value))} /></Field>
                <Field label="Hires Made Subtext (e.g. Since inception)"><input style={inputStyle} value={form.highlights.hiresMadeSub} onChange={e => setH('hiresMadeSub', e.target.value)} /></Field>
                <Field label="Countries"><input type="number" style={inputStyle} value={form.highlights.countries} onChange={e => setH('countries', Number(e.target.value))} /></Field>
                <Field label="Awards Won"><input type="number" style={inputStyle} value={form.highlights.awardsWon} onChange={e => setH('awardsWon', Number(e.target.value))} /></Field>
                <Field label="Awards Subtext (e.g. Industry recognized)"><input style={inputStyle} value={form.highlights.awardsWonSub} onChange={e => setH('awardsWonSub', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {section === 'Departments & Locations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                  <SubHeading style={{ flex: 1, marginBottom: 0 }}>Departments</SubHeading>
                  <button onClick={() => set('departments', [...form.departments, { name: '', count: 0, percent: 0 }])} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginBottom: 9 }}><FiPlus size={12} /> Add department</button>
                </div>
                <div style={{ marginTop: 12 }}>
                {form.departments.map((d, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 30px', gap: 8, marginBottom: 8 }}>
                    <input style={inputStyle} placeholder="Name" value={d.name} onChange={e => set('departments', form.departments.map((v, idx) => idx === i ? { ...v, name: e.target.value } : v))} />
                    <input type="number" style={inputStyle} placeholder="Count" value={d.count} onChange={e => set('departments', form.departments.map((v, idx) => idx === i ? { ...v, count: Number(e.target.value) } : v))} />
                    <input type="number" style={inputStyle} placeholder="Bar %" value={d.percent} onChange={e => set('departments', form.departments.map((v, idx) => idx === i ? { ...v, percent: Number(e.target.value) } : v))} />
                    <button onClick={() => set('departments', form.departments.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                  </div>
                ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                  <SubHeading style={{ flex: 1, marginBottom: 0 }}>Locations</SubHeading>
                  <button onClick={() => set('locations', [...form.locations, { name: '', type: 'Office', isHQ: false }])} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginBottom: 9 }}><FiPlus size={12} /> Add location</button>
                </div>
                <div style={{ marginTop: 12 }}>
                {form.locations.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 70px 30px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input style={inputStyle} placeholder="City, Country" value={l.name} onChange={e => set('locations', form.locations.map((v, idx) => idx === i ? { ...v, name: e.target.value } : v))} />
                    <input style={inputStyle} placeholder="Type" value={l.type} onChange={e => set('locations', form.locations.map((v, idx) => idx === i ? { ...v, type: e.target.value } : v))} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: GRAY }}>
                      <input type="checkbox" checked={l.isHQ} onChange={e => set('locations', form.locations.map((v, idx) => idx === i ? { ...v, isHQ: e.target.checked } : v))} /> HQ
                    </label>
                    <button onClick={() => set('locations', form.locations.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                  </div>
                ))}
                </div>
              </div>
            </div>
          )}

          {section === 'Contacts & Social' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <SubHeading>Social Links</SubHeading>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['linkedin', 'twitter', 'facebook', 'instagram', 'youtube'] as (keyof SocialLinks)[]).map(k => (
                    <input key={k} style={inputStyle} placeholder={k.charAt(0).toUpperCase() + k.slice(1) + ' URL'} value={form.socialLinks[k]} onChange={e => setSocial(k, e.target.value)} />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                  <SubHeading style={{ flex: 1, marginBottom: 0 }}>Key Contacts</SubHeading>
                  <button onClick={() => set('keyContacts', [...form.keyContacts, { name: '', role: '', email: '', phone: '', avatarUrl: '' }])} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginBottom: 9 }}><FiPlus size={12} /> Add contact</button>
                </div>
                <div style={{ marginTop: 12 }}>
                {form.keyContacts.map((c, i) => (
                  <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input style={inputStyle} placeholder="Name" value={c.name} onChange={e => set('keyContacts', form.keyContacts.map((v, idx) => idx === i ? { ...v, name: e.target.value } : v))} />
                      <input style={inputStyle} placeholder="Role" value={c.role} onChange={e => set('keyContacts', form.keyContacts.map((v, idx) => idx === i ? { ...v, role: e.target.value } : v))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 30px', gap: 8 }}>
                      <input style={inputStyle} placeholder="Email" value={c.email} onChange={e => set('keyContacts', form.keyContacts.map((v, idx) => idx === i ? { ...v, email: e.target.value } : v))} />
                      <input style={inputStyle} placeholder="Phone" value={c.phone} onChange={e => set('keyContacts', form.keyContacts.map((v, idx) => idx === i ? { ...v, phone: e.target.value } : v))} />
                      <button onClick={() => set('keyContacts', form.keyContacts.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer' }}><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <span style={{ fontSize: '0.76rem', color: RED }}>{error}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ height: 36, padding: '0 18px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>
          </div>
        </div>
      </div>
      <style>{`
        .hr-modal-scroll::-webkit-scrollbar { width: 6px; }
        .hr-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .hr-modal-scroll::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 4px; }
        .hr-modal-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .hr-modal-scroll { scrollbar-width: thin; scrollbar-color: ${BORDER} transparent; }
      `}</style>
    </div>
  )
}

export default CompanyProfilePage

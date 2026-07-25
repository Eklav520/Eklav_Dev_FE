import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  FiSearch, FiBell, FiPlus, FiX, FiChevronDown, FiDownload, FiGrid, FiSettings,
  FiCheckCircle, FiSlash,
} from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const CYAN   = '#06b6d4'
const TEAL   = '#14b8a6'
const RED    = '#ef4444'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'
const ACCENT = '#f2622f' // coral — matches /hr/jobs & /hr/candidates: primary buttons, active states, links

const STAGE_COLOR_PALETTE = [BLUE, ORANGE, PURPLE, CYAN, TEAL, GREEN, '#f43f5e', '#a855f7']

interface PipelineStageDoc {
  _id: string
  name: string
  order: number
  stageType: string
  durationValue?: number | null
  durationUnit?: string
  isFinalStage?: boolean
}

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
  ['#DB2777', '#FDF2F8'], ['#0D9488', '#F0FDFA'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const scoreColor = (score?: number | null) => {
  if (score == null) return GRAY
  if (score >= 75) return '#059669'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

const scoreBg = (score?: number | null) => {
  if (score == null) return '#f1f5f9'
  if (score >= 75) return '#ecfdf5'
  if (score >= 50) return '#fff7ed'
  return '#fef2f2'
}

interface Candidate {
  _id: string
  jobId: string
  jobTitle?: string
  name: string
  score?: number | null
  pipelineStage?: string
  isRejected?: boolean
  appliedOn: string
  createdAt: string
  hasApplied?: boolean
}

interface JobOption { _id: string; title: string; location?: string }

const emptyNewCandidate = { jobId: '', name: '', email: '', phone: '', skills: '', experience: '', location: '' }

const HRPipelinePage = () => {
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [stages, setStages] = useState<PipelineStageDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJob, setFilterJob] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [stagePopover, setStagePopover] = useState<{ id: string; rect: DOMRect } | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [newCandidate, setNewCandidate] = useState(emptyNewCandidate)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const fetchAll = () => {
    if (!baseURL || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${baseURL}/candidates`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/jobs`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/pipeline-stages`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([candidateData, jobData, stageData]) => {
        // The pipeline board only tracks real applicants moving through hiring
        // stages — /candidates also returns the full platform-wide talent pool
        // (students who never applied), which has no place on this board.
        setCandidates(Array.isArray(candidateData) ? candidateData.filter((c: any) => c.hasApplied) : [])
        setJobs(Array.isArray(jobData) ? jobData.map((j: any) => ({ _id: j._id, title: j.title, location: j.location })) : [])
        setStages(Array.isArray(stageData) ? stageData.sort((a: PipelineStageDoc, b: PipelineStageDoc) => a.order - b.order) : [])
      })
      .catch(() => { setCandidates([]); setJobs([]); setStages([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  const jobLocationMap = useMemo(() => {
    const m: Record<string, string> = {}
    jobs.forEach(j => { if (j.location) m[j._id] = j.location })
    return m
  }, [jobs])

  const locationOptions = useMemo(() => Array.from(new Set(jobs.map(j => j.location).filter(Boolean))) as string[], [jobs])

  const filtered = useMemo(() => {
    return candidates.filter(cd => {
      if (filterJob && cd.jobId !== filterJob) return false
      if (filterLocation && jobLocationMap[cd.jobId] !== filterLocation) return false
      if (search) {
        const q = search.toLowerCase()
        if (!cd.name.toLowerCase().includes(q) && !(cd.jobTitle || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [candidates, filterJob, filterLocation, search, jobLocationMap])

  const stageNames = useMemo(() => stages.map(s => s.name), [stages])

  const grouped = useMemo(() => {
    const g: Record<string, Candidate[]> = {}
    stageNames.forEach(name => { g[name] = [] })
    const fallback = stageNames[0]
    filtered.forEach(cd => {
      const stage = cd.pipelineStage && g[cd.pipelineStage] ? cd.pipelineStage : fallback
      if (stage && g[stage]) g[stage].push(cd)
    })
    Object.keys(g).forEach(k => g[k].sort((a, b) => new Date(b.appliedOn || b.createdAt).getTime() - new Date(a.appliedOn || a.createdAt).getTime()))
    return g
  }, [filtered, stageNames])

  const total = filtered.length

  const conversionRates = useMemo(() => {
    return stageNames.slice(0, -1).map((name, i) => {
      const from = (grouped[name] || []).length
      const to = (grouped[stageNames[i + 1]] || []).length
      const pct = from > 0 ? Math.round((to / from) * 1000) / 10 : 0
      return { from: name, to: stageNames[i + 1], pct }
    })
  }, [grouped, stageNames])

  const firstStageCount = grouped[stageNames[0]]?.length || 0
  const lastStageCount = grouped[stageNames[stageNames.length - 1]]?.length || 0
  const overallConversion = firstStageCount > 0 ? Math.round((lastStageCount / firstStageCount) * 1000) / 10 : 0

  const topJobs = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach(cd => { const t = cd.jobTitle || 'Untitled'; map[t] = (map[t] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [filtered])

  const changeStage = async (cd: Candidate, newStage: string) => {
    setStagePopover(null)
    setActionError('')
    setActioningId(cd._id)
    try {
      const res = await fetch(`${baseURL}/candidates/${cd._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineStage: newStage }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to update stage')
      }
      setCandidates(prev => prev.map(c => c._id === cd._id ? { ...c, pipelineStage: newStage } : c))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update stage')
    } finally {
      setActioningId(null)
    }
  }

  const toggleReject = async (cd: Candidate) => {
    setStagePopover(null)
    setActionError('')
    setActioningId(cd._id)
    try {
      const nextRejected = !cd.isRejected
      const res = await fetch(`${baseURL}/candidates/${cd._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRejected: nextRejected }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to update candidate')
      }
      setCandidates(prev => prev.map(c => c._id === cd._id ? { ...c, isRejected: nextRejected } : c))
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update candidate')
    } finally {
      setActioningId(null)
    }
  }

  const handleAddCandidate = async () => {
    if (!newCandidate.jobId || !newCandidate.name.trim()) {
      setAddError('Job and Candidate Name are required')
      return
    }
    setAdding(true)
    setAddError('')
    try {
      const res = await fetch(`${baseURL}/candidates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newCandidate),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to add candidate')
      }
      setShowAdd(false)
      setNewCandidate(emptyNewCandidate)
      fetchAll()
    } catch (e: any) {
      setAddError(e?.message || 'Failed to add candidate')
    } finally {
      setAdding(false)
    }
  }

  const exportCsv = () => {
    const header = ['Name', 'Job Applied', 'Stage', 'Score', 'Applied On']
    const rows = filtered.map(cd => [cd.name, cd.jobTitle || '', cd.pipelineStage || 'Applied', cd.score != null ? String(cd.score) : '', formatDate(cd.appliedOn)])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'pipeline.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const maxStageCount = Math.max(1, ...stageNames.map(name => (grouped[name] || []).length))

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Pipeline</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Track your hiring pipeline at every stage.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates, jobs..."
              style={{ paddingLeft: 32, paddingRight: 12, height: 36, width: 240, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem', color: '#334155', background: '#fff', outline: 'none', colorScheme: 'light' }}
            />
          </div>
          <button title="Settings" style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiSettings size={15}/>
          </button>
          <button title="Notifications" style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
        </div>
      </div>

      {actionError && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{actionError}</div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <select value={filterJob} onChange={e => setFilterJob(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', height: 36, width: 190, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 30px 0 12px', fontSize: '0.8rem', background: '#fff', color: '#334155', colorScheme: 'light', cursor: 'pointer' }}>
              <option value="">All Jobs</option>
              {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
            <FiChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ appearance: 'none', WebkitAppearance: 'none', height: 36, width: 190, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 30px 0 12px', fontSize: '0.8rem', background: '#fff', color: '#334155', colorScheme: 'light', cursor: 'pointer' }}>
              <option value="">All Locations</option>
              {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <FiChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/hr/pipeline/stages/create')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
            <FiPlus size={13}/> Add Stage
          </button>
          <button onClick={() => navigate('/hr/pipeline/manage')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
            <FiSettings size={13}/> Manage Pipeline
          </button>
          <button title="Board view" style={{ width: 32, height: 32, background: '#fef1ec', border: `1px solid #fbd0bb`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, cursor: 'default' }}>
            <FiGrid size={14}/>
          </button>
          <button onClick={exportCsv} title="Export CSV" style={{ width: 32, height: 32, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', cursor: 'pointer' }}>
            <FiDownload size={14}/>
          </button>
        </div>
      </div>

      {/* Main content: kanban + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>

        {/* Kanban board */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, stages.length)}, minmax(0, 1fr))`, gap: 6, alignItems: 'start' }}>
          {stages.map((stage, idx) => {
            const color = STAGE_COLOR_PALETTE[idx % STAGE_COLOR_PALETTE.length]
            const cards = grouped[stage.name] || []
            const showAll = !!expanded[stage.name]
            const visibleCards = showAll ? cards : cards.slice(0, 4)
            return (
              <div key={stage._id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.name}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 600, flexShrink: 0 }}>{cards.length}</span>
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOverStage(stage.name) }}
                  onDragLeave={() => setDragOverStage(prev => prev === stage.name ? null : prev)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOverStage(null)
                    if (!draggedId) return
                    const cd = candidates.find(c => c._id === draggedId)
                    setDraggedId(null)
                    if (cd && (cd.pipelineStage || stageNames[0]) !== stage.name) changeStage(cd, stage.name)
                  }}
                  style={{
                    padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120, maxHeight: 560, overflowY: 'auto',
                    background: dragOverStage === stage.name ? `${color}0d` : 'transparent',
                    outline: dragOverStage === stage.name ? `2px dashed ${color}` : 'none',
                    outlineOffset: -4,
                    transition: 'background 0.1s',
                  }}
                >
                  {loading && <div style={{ fontSize: '0.74rem', color: GRAY, textAlign: 'center', padding: '10px 0' }}>Loading…</div>}
                  {!loading && cards.length === 0 && <div style={{ fontSize: '0.74rem', color: '#cbd5e1', textAlign: 'center', padding: '10px 0' }}>No candidates</div>}
                  {visibleCards.map(cd => {
                    const [fg, bg] = avatarColor(cd.name)
                    // Under-review stages (awaiting a person's decision, not a
                    // pipeline milestone with its own date) show a compact
                    // "Under review" card instead of job title/date/score.
                    const isHiringManagerStage = /hiring manager|hr interview/i.test(stage.name)
                    return (
                      <div
                        key={cd._id}
                        draggable
                        onDragStart={e => { setDraggedId(cd._id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => { setDraggedId(null); setDragOverStage(null) }}
                        onClick={e => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setStagePopover(prev => prev?.id === cd._id ? null : { id: cd._id, rect })
                        }}
                        style={{
                          border: `1px solid ${cd.isRejected ? '#fecaca' : BORDER}`, borderRadius: 10, padding: 10, cursor: 'grab',
                          background: cd.isRejected ? '#fef2f2' : '#fff', opacity: (actioningId === cd._id || draggedId === cd._id) ? 0.4 : 1,
                          position: 'relative',
                        }}
                      >
                        {cd.isRejected && (
                          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 700, color: RED, background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>REJECTED</span>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, color: fg, fontSize: '0.68rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {initials(cd.name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cd.name}</div>
                            {isHiringManagerStage ? (
                              cd.jobId && <div style={{ fontSize: '0.66rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>REQ-{cd.jobId.slice(-4).toUpperCase()}</div>
                            ) : (
                              <div style={{ fontSize: '0.68rem', color: GRAY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cd.jobTitle || '—'}</div>
                            )}
                          </div>
                        </div>
                        {isHiringManagerStage ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: ORANGE, background: '#fff7ed', padding: '2px 8px', borderRadius: 20 }}>
                            Under review
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.64rem', color: GRAY, lineHeight: 1.4 }}>{stage.name} on</div>
                              <div style={{ fontSize: '0.68rem', color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDate(cd.appliedOn)}</div>
                            </div>
                            {cd.score != null && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: scoreColor(cd.score), background: scoreBg(cd.score), padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                                {cd.score}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {!showAll && cards.length > 4 && (
                    <button onClick={() => setExpanded(p => ({ ...p, [stage.name]: true }))} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>
                      + {cards.length - 4} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pipeline Summary */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 14 }}>Pipeline Summary</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PipelineDonut total={total} segments={stages.map((s, i) => ({ label: s.name, value: (grouped[s.name] || []).length, color: STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length] }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {stages.map((s, i) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length], flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.74rem', color: GRAY, flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>{(grouped[s.name] || []).length} ({total ? Math.round((grouped[s.name] || []).length / total * 1000) / 10 : 0}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Rate */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 12 }}>Conversion Rate</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversionRates.map(c => (
                <div key={`${c.from}-${c.to}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#334155', marginBottom: 3 }}>
                    <span>{c.from} → {c.to}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, c.pct)}%`, background: ACCENT, borderRadius: 3 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Jobs in Pipeline */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 14 }}>Top Jobs in Pipeline</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topJobs.length === 0 && <span style={{ fontSize: '0.78rem', color: GRAY }}>No candidates yet.</span>}
              {topJobs.map(([title, count]) => (
                <div key={title} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{title}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{count}</span>
                </div>
              ))}
            </div>
            <div onClick={() => navigate('/hr/jobs')} style={{ marginTop: 12, fontSize: '0.76rem', color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>
              View all jobs
            </div>
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 18 }}>Drop-off Analysis</span>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 160, paddingLeft: 4 }}>
          {stages.map((s, i) => {
            const color = STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length]
            const count = (grouped[s.name] || []).length
            const heightPct = (count / maxStageCount) * 100
            const prevCount = i > 0 ? (grouped[stages[i - 1].name] || []).length : count
            const dropPct = i > 0 && prevCount > 0 ? Math.round((1 - count / prevCount) * 1000) / 10 : null
            return (
              <div key={s._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{count}</span>
                <div style={{ width: '60%', minHeight: 2, height: `${Math.max(2, heightPct)}%`, background: color, borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontSize: '0.7rem', color: GRAY, marginTop: 8 }}>{s.name}</span>
                {dropPct !== null && (
                  <span style={{ fontSize: '0.62rem', color: dropPct > 0 ? RED : GREEN, marginTop: 2 }}>{dropPct > 0 ? `↓ ${dropPct}%` : '—'}</span>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.76rem', color: GRAY }}>Overall conversion rate from {stageNames[0] || 'Applied'} to {stageNames[stageNames.length - 1] || 'Hired'}</span>
          <span style={{ background: '#fef1ec', color: ACCENT, fontSize: '0.74rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{overallConversion}%</span>
        </div>
      </div>

      {/* Stage-change popover */}
      {stagePopover && createPortal(
        <>
          <div onClick={() => setStagePopover(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div style={{
            position: 'fixed',
            top: Math.min(stagePopover.rect.bottom + 4, window.innerHeight - 260),
            left: Math.min(stagePopover.rect.left, window.innerWidth - 200),
            minWidth: 190, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 200, overflow: 'hidden',
          }}>
            {(() => {
              const cd = candidates.find(c => c._id === stagePopover.id)
              if (!cd) return null
              return (
                <>
                  <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: GRAY, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Move to stage</div>
                  {stages.filter(s => s.name !== (cd.pipelineStage || stageNames[0])).map((s, i) => (
                    <button
                      key={s._id}
                      onClick={() => changeStage(cd, s.name)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', color: '#334155', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLOR_PALETTE[stages.indexOf(s) % STAGE_COLOR_PALETTE.length] }}/> {s.name}
                    </button>
                  ))}
                  <div style={{ borderTop: `1px solid ${BORDER}` }} />
                  <button
                    onClick={() => toggleReject(cd)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none', border: 'none', color: cd.isRejected ? '#059669' : '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = cd.isRejected ? '#ecfdf5' : '#fef2f2' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                  >
                    {cd.isRejected ? <FiCheckCircle size={13}/> : <FiSlash size={13}/>} {cd.isRejected ? 'Unmark Rejected' : 'Mark Rejected'}
                  </button>
                </>
              )
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Add Candidate modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 480, maxWidth: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Add Candidate</span>
              <button onClick={() => { setShowAdd(false); setAddError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {addError && (
                <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8 }}>{addError}</div>
              )}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Job *</label>
                <select value={newCandidate.jobId} onChange={e => setNewCandidate(f => ({ ...f, jobId: e.target.value }))}
                  style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 10px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light' }}>
                  <option value="">Select a job</option>
                  {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Candidate Name *</label>
                <input value={newCandidate.name} onChange={e => setNewCandidate(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                  placeholder="e.g. Priya Singh" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Phone</label>
                  <input value={newCandidate.phone} onChange={e => setNewCandidate(f => ({ ...f, phone: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Email</label>
                  <input value={newCandidate.email} onChange={e => setNewCandidate(f => ({ ...f, email: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="name@email.com" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Experience</label>
                  <input value={newCandidate.experience} onChange={e => setNewCandidate(f => ({ ...f, experience: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="e.g. 2.5 Yrs" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Location</label>
                  <input value={newCandidate.location} onChange={e => setNewCandidate(f => ({ ...f, location: e.target.value }))}
                    style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                    placeholder="e.g. Bangalore" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Skills (comma separated)</label>
                <input value={newCandidate.skills} onChange={e => setNewCandidate(f => ({ ...f, skills: e.target.value }))}
                  style={{ width: '100%', height: 38, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.84rem', background: '#fff', color: '#0f172a', colorScheme: 'light', boxSizing: 'border-box' }}
                  placeholder="React, Node.js, MongoDB" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => { setShowAdd(false); setAddError('') }} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAddCandidate} disabled={adding} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: adding ? 'default' : 'pointer', opacity: adding ? 0.7 : 1 }}>
                {adding ? 'Adding…' : 'Add Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PipelineDonut = ({ total, segments }: { total: number; segments: { label: string; value: number; color: string }[] }) => {
  const size = 92, cx = 46, cy = 46, r = 33, stroke = 10
  const circum = 2 * Math.PI * r
  let offset = 0
  const segs = segments.map(s => {
    const dash = total > 0 ? (s.value / total) * circum : 0
    const gap = circum - dash
    const seg = { ...s, dash, gap, offset: circum * 0.25 - offset }
    offset += dash
    return seg
  })
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, display: 'block' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={stroke}/>
        {segs.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={s.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{total.toLocaleString()}</span>
        <span style={{ fontSize: '0.5rem', color: GRAY, lineHeight: 1.3, textAlign: 'center' }}>Total<br/>Candidates</span>
      </div>
    </div>
  )
}

export default HRPipelinePage

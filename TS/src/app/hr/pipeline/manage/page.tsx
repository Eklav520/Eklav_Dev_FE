import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiPlus, FiEdit2, FiCopy, FiTrash2, FiChevronRight, FiEye, FiX, FiMove, FiArrowUp, FiArrowDown,
  FiCheck, FiSend, FiUserCheck, FiClipboard, FiUsers, FiMail, FiArrowLeft,
} from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const ACCENT  = '#4f46e5'
const GREEN   = '#10b981'
const RED     = '#ef4444'
const GRAY    = '#64748b'
const BORDER  = '#e2e8f0'
const STAGE_COLOR_PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6']

interface PipelineStageDoc {
  _id: string
  name: string
  order: number
  stageType: string
  durationValue?: number | null
  durationUnit?: string
  mandatory?: boolean
  autoMoveNext?: boolean
}

const stageIcon = (stageType?: string) => {
  switch (stageType) {
    case 'Auto Qualification': return <FiSend size={16} />
    case 'Screening': return <FiClipboard size={16} />
    case 'Assessment': return <FiCheck size={16} />
    case 'Interview': return <FiUserCheck size={16} />
    case 'Offer & Onboarding': return <FiMail size={16} />
    default: return <FiUsers size={16} />
  }
}

const stageSubtitle = (s: PipelineStageDoc) => {
  if (s.stageType === 'Interview' && s.durationValue) {
    return `Interview • ${s.durationValue} ${s.durationUnit === 'Minutes' ? 'Min' : s.durationUnit}`
  }
  return s.stageType
}

const HRManagePipelinePage = () => {
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [stages, setStages] = useState<PipelineStageDoc[]>([])
  const [candidateCounts, setCandidateCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [reordered, setReordered] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fetchAll = () => {
    if (!baseURL || !token) return
    setLoading(true)
    Promise.all([
      fetch(`${baseURL}/pipeline-stages`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${baseURL}/candidates`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([stageData, candidateData]) => {
        const list = Array.isArray(stageData) ? stageData : []
        setStages(list.sort((a: PipelineStageDoc, b: PipelineStageDoc) => a.order - b.order))
        const counts: Record<string, number> = {}
        ;(Array.isArray(candidateData) ? candidateData : []).forEach((cd: any) => {
          const stage = cd.pipelineStage || 'Applied'
          counts[stage] = (counts[stage] || 0) + 1
        })
        setCandidateCounts(counts)
      })
      .catch(() => { setStages([]); setCandidateCounts({}) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  const moveStage = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= stages.length) return
    const next = [...stages]
    ;[next[index], next[target]] = [next[target], next[index]]
    setStages(next)
    setReordered(true)
  }

  // Drag-and-drop reorder — moves the dragged stage to sit right before the
  // row it's dropped on, shifting everything between the two positions.
  const reorderStage = (from: number, to: number) => {
    if (from === to) return
    const next = [...stages]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setStages(next)
    setReordered(true)
  }

  const savePipelineOrder = async () => {
    setSaving(true)
    setError('')
    try {
      const order = stages.map((s, i) => ({ id: s._id, order: i + 1 }))
      const res = await fetch(`${baseURL}/pipeline-stages/reorder`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to save order')
      }
      setReordered(false)
      fetchAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to save pipeline order')
    } finally {
      setSaving(false)
    }
  }

  const duplicateStage = async (stage: PipelineStageDoc) => {
    setError('')
    try {
      const res = await fetch(`${baseURL}/pipeline-stages/${stage._id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to duplicate stage')
      }
      fetchAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to duplicate stage')
    }
  }

  const deleteStage = async (stage: PipelineStageDoc) => {
    if (!window.confirm(`Delete stage "${stage.name}"? Candidates currently in it will need to be moved manually.`)) return
    setError('')
    try {
      const res = await fetch(`${baseURL}/pipeline-stages/${stage._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to delete stage')
      }
      fetchAll()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete stage')
    }
  }

  const totalCandidates = useMemo(() => Object.values(candidateCounts).reduce((s, n) => s + n, 0), [candidateCounts])

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button onClick={() => navigate('/hr/pipeline')} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', flexShrink: 0 }}>
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Manage Pipeline</h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>View and customize your hiring pipeline stages.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setShowPreview(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            <FiEye size={14}/> Preview Candidate Journey
          </button>
          <button onClick={() => navigate('/hr/pipeline/stages/create')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={15}/> Add Stage
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: GRAY, fontSize: '0.85rem' }}>
          Loading pipeline…
        </div>
      ) : (
      <>
        {/* Horizontal stage flow */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, marginBottom: 20, overflowX: 'auto' }}>
          {stages.map((s, i) => (
            <div key={s._id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 150 }}>
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length]}1a`, color: STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {stageIcon(s.stageType)}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: GRAY, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stageSubtitle(s)}</div>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Candidates</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{candidateCounts[s.name] || 0}</div>
              </div>
              {i < stages.length - 1 && <FiChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0, margin: '0 2px' }} />}
            </div>
          ))}
          <div
            onClick={() => navigate('/hr/pipeline/stages/create')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: `1.5px dashed ${BORDER}`, borderRadius: 10, padding: 12, minWidth: 90, cursor: 'pointer', color: ACCENT }}
          >
            <FiPlus size={18} />
            <span style={{ fontSize: '0.74rem', fontWeight: 600 }}>Add Stage</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'flex-start' }}>
          {/* Pipeline Stages table */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}`, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Pipeline Stages</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Order', 'Stage Name', 'Stage Type', 'Duration', 'Mandatory', 'Auto Move', 'Candidates', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stages.map((s, i) => (
                  <tr
                    key={s._id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={e => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) setDragOverIndex(i) }}
                    onDragLeave={() => setDragOverIndex(prev => (prev === i ? null : prev))}
                    onDrop={e => {
                      e.preventDefault()
                      if (dragIndex !== null) reorderStage(dragIndex, i)
                      setDragIndex(null)
                      setDragOverIndex(null)
                    }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null) }}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: dragOverIndex === i ? '#eef2ff' : dragIndex === i ? '#f8fafc' : 'transparent',
                      opacity: dragIndex === i ? 0.5 : 1,
                      borderTop: dragOverIndex === i ? `2px solid ${ACCENT}` : '1px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ cursor: 'grab', color: '#cbd5e1', display: 'flex' }} title="Drag to reorder"><FiMove size={13}/></span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{i + 1}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button onClick={() => moveStage(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#e2e8f0' : '#94a3b8', padding: 0, lineHeight: 0 }}><FiArrowUp size={11}/></button>
                          <button onClick={() => moveStage(i, 1)} disabled={i === stages.length - 1} style={{ background: 'none', border: 'none', cursor: i === stages.length - 1 ? 'default' : 'pointer', color: i === stages.length - 1 ? '#e2e8f0' : '#94a3b8', padding: 0, lineHeight: 0 }}><FiArrowDown size={11}/></button>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{s.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#334155' }}>{s.stageType}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#334155' }}>{s.durationValue ? `${s.durationValue} ${s.durationUnit === 'Minutes' ? 'Min' : s.durationUnit}` : '-'}</td>
                    <td style={{ padding: '12px 14px' }}>{s.mandatory ? <FiCheck size={14} color={GREEN}/> : <FiX size={14} color={RED}/>}</td>
                    <td style={{ padding: '12px 14px' }}>{s.autoMoveNext ? <FiCheck size={14} color={GREEN}/> : <FiX size={14} color={RED}/>}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{candidateCounts[s.name] || 0}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => navigate(`/hr/pipeline/stages/create?id=${s._id}`)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><FiEdit2 size={14}/></button>
                        <button onClick={() => duplicateStage(s)} title="Duplicate" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><FiCopy size={14}/></button>
                        <button onClick={() => deleteStage(s)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><FiTrash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pipeline Settings sidebar */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 14 }}>Pipeline Settings</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
              {[
                { icon: <FiMove size={14}/>, title: 'Reorder Stages', hint: 'Drag a row, or use the ↑↓ arrows, to reorder pipeline stages' },
                { icon: <FiEdit2 size={14}/>, title: 'Edit Stage', hint: 'Update stage details and configuration' },
                { icon: <FiCopy size={14}/>, title: 'Duplicate Stage', hint: 'Create a copy of an existing stage' },
                { icon: <FiTrash2 size={14}/>, title: 'Delete Stage', hint: 'Remove a stage from the pipeline' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#eef2ff', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
                    <div style={{ fontSize: '0.7rem', color: GRAY, marginTop: 1 }}>{item.hint}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={savePipelineOrder}
              disabled={!reordered || saving}
              style={{ width: '100%', background: reordered ? ACCENT : '#e2e8f0', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: '0.82rem', fontWeight: 600, cursor: reordered && !saving ? 'pointer' : 'default' }}
            >
              {saving ? 'Saving…' : 'Save Pipeline Order'}
            </button>
          </div>
        </div>
      </>
      )}

      {/* Preview Candidate Journey modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 640, maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Candidate Journey</span>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                <FiX size={18}/>
              </button>
            </div>
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stages.map((s, i) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length]}1a`, color: STAGE_COLOR_PALETTE[i % STAGE_COLOR_PALETTE.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                    <div style={{ fontSize: '0.74rem', color: GRAY }}>{stageSubtitle(s)}{s.mandatory ? ' • Mandatory' : ' • Optional'}</div>
                  </div>
                  {i < stages.length - 1 && <FiChevronRight size={14} color="#cbd5e1" />}
                </div>
              ))}
              {stages.length === 0 && <span style={{ fontSize: '0.82rem', color: GRAY }}>No stages configured yet.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HRManagePipelinePage

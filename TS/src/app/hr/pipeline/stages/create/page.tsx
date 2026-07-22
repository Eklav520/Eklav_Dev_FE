import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FiArrowLeft, FiSave, FiX, FiInfo, FiChevronRight, FiCheckCircle,
} from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

// ─── Palette ────────────────────────────────────────────────────────────────
const ACCENT  = '#4f46e5'
const GREEN   = '#10b981'
const GRAY    = '#64748b'
const BORDER  = '#e2e8f0'

const STAGE_TYPES = ['Auto Qualification', 'Screening', 'Assessment', 'Interview', 'Offer & Onboarding', 'Custom']
const DURATION_UNITS = ['Minutes', 'Hours', 'Days']
const QUALIFICATIONS = ['Any', 'High School', 'Diploma', "Bachelor's Degree", "Master's Degree", 'PhD']
const PASSING_CRITERIA = ['Manual Evaluation', 'Score Based', 'AI Evaluation']

type FormState = {
  name: string
  stageType: string
  order: string
  durationValue: string
  durationUnit: string
  interviewMode: 'Online' | 'Offline' | 'Hybrid' | ''
  assignInterviewer: string
  instructions: string
  enableAIEvaluation: boolean
  autoMoveNext: boolean
  mandatory: boolean
  minQualification: string
  passingCriteria: string
  minScore: string
  requireDocumentsBefore: boolean
  allowReschedule: boolean
  addFeedbackForm: boolean
  isFinalStage: boolean
}

const emptyForm: FormState = {
  name: '', stageType: 'Interview', order: '', durationValue: '', durationUnit: 'Minutes',
  interviewMode: '', assignInterviewer: '', instructions: '',
  enableAIEvaluation: false, autoMoveNext: false, mandatory: true,
  minQualification: '', passingCriteria: '', minScore: '',
  requireDocumentsBefore: false, allowReschedule: false, addFeedbackForm: false, isFinalStage: false,
}

interface StageOption { _id: string; name: string; order: number }

// ─── Small building blocks ───────────────────────────────────────────────────
const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
    {children}{required && <span style={{ color: '#ef4444' }}> *</span>}
  </label>
)

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: `1px solid ${BORDER}`, borderRadius: 8,
  padding: '0 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  background: '#fff', color: '#0f172a', colorScheme: 'light',
}

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, ...style }}>{children}</div>
)

const Toggle = ({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 36, height: 20, borderRadius: 20, background: checked ? ACCENT : '#e2e8f0', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}
    >
      <div style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </div>
    <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 500 }}>{label}{hint && <FiInfo size={11} style={{ marginLeft: 5, color: '#94a3b8' }} />}</span>
  </label>
)

const HRAddStagePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [form, setForm] = useState<FormState>(emptyForm)
  const [existingStages, setExistingStages] = useState<StageOption[]>([])
  const [saving, setSaving] = useState<'draft' | 'save' | null>(null)
  const [error, setError] = useState('')
  const [loadingStage, setLoadingStage] = useState(!!editId)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    if (!baseURL || !token) return
    fetch(`${baseURL}/pipeline-stages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setExistingStages(list.map((s: any) => ({ _id: s._id, name: s.name, order: s.order })))
        if (!editId) set('order', String(list.length + 1))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  useEffect(() => {
    if (!editId || !baseURL || !token) return
    setLoadingStage(true)
    fetch(`${baseURL}/pipeline-stages`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const stage = (Array.isArray(data) ? data : []).find((s: any) => s._id === editId)
        if (!stage) throw new Error('Stage not found')
        setForm({
          name: stage.name || '',
          stageType: stage.stageType || 'Custom',
          order: String(stage.order ?? ''),
          durationValue: stage.durationValue != null ? String(stage.durationValue) : '',
          durationUnit: stage.durationUnit || 'Minutes',
          interviewMode: stage.interviewMode || '',
          assignInterviewer: stage.assignInterviewer || '',
          instructions: stage.instructions || '',
          enableAIEvaluation: !!stage.enableAIEvaluation,
          autoMoveNext: !!stage.autoMoveNext,
          mandatory: stage.mandatory !== false,
          minQualification: stage.minQualification || '',
          passingCriteria: stage.passingCriteria || '',
          minScore: stage.minScore != null ? String(stage.minScore) : '',
          requireDocumentsBefore: !!stage.requireDocumentsBefore,
          allowReschedule: !!stage.allowReschedule,
          addFeedbackForm: !!stage.addFeedbackForm,
          isFinalStage: !!stage.isFinalStage,
        })
      })
      .catch(e => setError(e?.message || 'Failed to load stage'))
      .finally(() => setLoadingStage(false))
  }, [editId, baseURL, token])

  const submit = async (status: 'Draft' | 'Active') => {
    if (!form.name.trim()) { setError('Stage Name is required'); return }
    setSaving(status === 'Draft' ? 'draft' : 'save')
    setError('')
    try {
      const payload = { ...form, status }
      const res = await fetch(editId ? `${baseURL}/pipeline-stages/${editId}` : `${baseURL}/pipeline-stages`, {
        method: editId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to save stage')
      }
      navigate('/hr/pipeline/manage')
    } catch (e: any) {
      setError(e?.message || 'Failed to save stage')
    } finally {
      setSaving(null)
    }
  }

  const orderNum = Number(form.order) || existingStages.length + 1
  const sortedOthers = [...existingStages].sort((a, b) => a.order - b.order)
  const nextStage = sortedOthers.find(s => s.order >= orderNum && s._id !== editId)

  const durationLabel = form.durationValue ? `${form.durationValue} ${form.durationUnit === 'Minutes' ? 'Min' : form.durationUnit}` : ''
  const previewSubtitle = form.stageType === 'Interview' && durationLabel ? `Interview • ${durationLabel}` : form.stageType

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.78rem', color: GRAY, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span onClick={() => navigate('/hr/pipeline')} style={{ cursor: 'pointer' }}>Pipeline</span>
        <FiChevronRight size={11} />
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{editId ? 'Edit Stage' : 'Add Stage'}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <button onClick={() => navigate('/hr/pipeline')} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#334155', flexShrink: 0 }}>
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>{editId ? 'Edit Stage' : 'Add Stage'}</h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: GRAY }}>{editId ? 'Update this pipeline stage.' : 'Create a new stage for your hiring pipeline.'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => submit('Draft')} disabled={saving !== null || loadingStage} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            <FiSave size={14} /> {saving === 'draft' ? 'Saving…' : 'Save as Draft'}
          </button>
          <button onClick={() => navigate('/hr/pipeline/manage')} style={{ width: 40, height: 40, borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
            <FiX size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>
      )}

      {loadingStage ? (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: GRAY, fontSize: '0.85rem' }}>
          Loading stage…
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 300px', gap: 16, alignItems: 'flex-start' }}>
        {/* Left: main details */}
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <Label required>Stage Name</Label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Technical Interview" />
            </div>
            <div>
              <Label required>Stage Type</Label>
              <select style={inputStyle} value={form.stageType} onChange={e => set('stageType', e.target.value)}>
                {STAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 6 }}>
            <div>
              <Label required>Stage Order</Label>
              <input type="number" min={1} style={inputStyle} value={form.order} onChange={e => set('order', e.target.value)} />
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>Order of this stage in the pipeline</div>
            </div>
            <div>
              <Label>Estimated Duration</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" min={0} style={inputStyle} value={form.durationValue} onChange={e => set('durationValue', e.target.value)} placeholder="45" />
                <select style={{ ...inputStyle, width: 130, flexShrink: 0 }} value={form.durationUnit} onChange={e => set('durationUnit', e.target.value)}>
                  {DURATION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {form.stageType === 'Interview' && (
            <div style={{ marginBottom: 16, marginTop: 10 }}>
              <Label>Interview Mode</Label>
              <div style={{ display: 'flex', gap: 16 }}>
                {(['Online', 'Offline', 'Hybrid'] as const).map(mode => (
                  <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                    <input type="radio" checked={form.interviewMode === mode} onChange={() => set('interviewMode', mode)} style={{ accentColor: ACCENT, colorScheme: 'light' }} />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <Label>Assign Interviewer (Optional)</Label>
            <input style={inputStyle} value={form.assignInterviewer} onChange={e => set('assignInterviewer', e.target.value)} placeholder="Interviewer name or email" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <Label>Instructions (Visible to interviewers)</Label>
            <textarea
              value={form.instructions}
              onChange={e => set('instructions', e.target.value.slice(0, 500))}
              placeholder="Evaluate the candidate on technical knowledge, problem solving skills and communication."
              rows={4}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', background: '#fff', color: '#0f172a', colorScheme: 'light' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 }}>{form.instructions.length} / 500</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Toggle checked={form.enableAIEvaluation} onChange={v => set('enableAIEvaluation', v)} label="Enable AI Evaluation" hint />
            <Toggle checked={form.autoMoveNext} onChange={v => set('autoMoveNext', v)} label="Auto move candidate to next stage after completion" hint />
            <Toggle checked={form.mandatory} onChange={v => set('mandatory', v)} label="Mark stage as mandatory" hint />
          </div>
        </Card>

        {/* Middle: Qualification & Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Qualification & Criteria</div>
            <div style={{ marginBottom: 14 }}>
              <Label>Minimum Qualification (Optional)</Label>
              <select style={inputStyle} value={form.minQualification} onChange={e => set('minQualification', e.target.value)}>
                <option value="">Select...</option>
                {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <Label>Passing Criteria (Optional)</Label>
              <select style={inputStyle} value={form.passingCriteria} onChange={e => set('passingCriteria', e.target.value)}>
                <option value="">Select...</option>
                {PASSING_CRITERIA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <Label>Minimum Score (Optional)</Label>
              <div style={{ position: 'relative' }}>
                <input type="number" min={0} max={100} style={{ ...inputStyle, paddingRight: 30 }} value={form.minScore} onChange={e => set('minScore', e.target.value)} placeholder="60" />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>%</span>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Configuration</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['requireDocumentsBefore', 'Candidate must upload documents before this stage'],
                ['allowReschedule', 'Allow candidate to reschedule'],
                ['addFeedbackForm', 'Add feedback form for interviewer'],
                ['isFinalStage', 'This is the final stage'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form[key as keyof FormState] as boolean}
                    onChange={e => set(key as keyof FormState, e.target.checked as any)}
                    style={{ accentColor: ACCENT, colorScheme: 'light' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: preview + tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Stage Preview</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eef2ff', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', margin: '0 auto 10px' }}>
                {orderNum}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{form.name || 'Untitled Stage'}</div>
              <div style={{ fontSize: '0.76rem', color: GRAY, marginTop: 2 }}>{previewSubtitle}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: form.mandatory ? GREEN : GRAY }}>{form.mandatory ? 'Mandatory' : 'Optional'}</span>
              </div>
            </div>
            {nextStage && (
              <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', color: GRAY }}>Next Stage</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>{nextStage.name} <FiChevronRight size={12} /></span>
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <FiInfo size={14} color={ACCENT} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Tips</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ fontSize: '0.76rem', color: '#475569' }}>Use clear stage names for better communication.</li>
              <li style={{ fontSize: '0.76rem', color: '#475569' }}>Set the correct order to maintain pipeline flow.</li>
              <li style={{ fontSize: '0.76rem', color: '#475569' }}>Enable auto move to save time.</li>
            </ul>
          </Card>
        </div>
      </div>
      )}

      {/* Bottom nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={() => navigate('/hr/pipeline/manage')} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: `1px solid ${BORDER}`, background: '#fff', color: '#334155', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => submit('Active')} disabled={saving !== null} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving === 'save' ? 'Saving…' : <>Save Stage <FiCheckCircle size={13} /></>}
        </button>
      </div>
    </div>
  )
}

export default HRAddStagePage

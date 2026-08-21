import { useEffect, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { FaTag, FaPencilAlt, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'
const ORANGE = '#ff7a00'

type Plan = '6months' | '12months'
const PLANS: { key: Plan; label: string }[] = [
  { key: '6months', label: '6 Months' },
  { key: '12months', label: '12 Months' },
]

type ModuleInfo = { key: string; label: string; description: string; plans: Record<Plan, number> }
// `${moduleKey}:${plan}` — each duration is edited/saved independently.
type EditKey = string

// The price a student sees on the LSRW pattern-selection screen (and every
// other module purchase screen later) is read live from the same
// ModulePricing collection this page writes to — a save here takes effect
// immediately, no deploy needed.
const ModulePricingPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<EditKey | null>(null)
  const [draftRupees, setDraftRupees] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedKey, setSavedKey] = useState<EditKey | null>(null)

  const load = () => {
    if (!user?.token) return
    setLoading(true)
    setError(null)
    fetch(`${baseURL}/api/eklavadmin/module-pricing`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to load')
        setModules(data.modules)
      })
      .catch((e) => setError(e.message || 'Failed to load module pricing'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [user?.token, baseURL])

  const startEdit = (moduleKey: string, plan: Plan, priceInPaise: number) => {
    setEditingKey(`${moduleKey}:${plan}`)
    setDraftRupees(String(priceInPaise / 100))
  }
  const cancelEdit = () => { setEditingKey(null); setDraftRupees('') }

  const save = (moduleKey: string, plan: Plan) => {
    const rupees = Number(draftRupees)
    if (!user?.token || !Number.isFinite(rupees) || rupees < 1) return
    setSaving(true)
    fetch(`${baseURL}/api/eklavadmin/module-pricing/${moduleKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ plan, priceInPaise: Math.round(rupees * 100) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Failed to save')
        setModules((prev) => prev.map((m) => (m.key === moduleKey ? { ...m, plans: { ...m.plans, [plan]: data.priceInPaise } } : m)))
        const key = `${moduleKey}:${plan}`
        setEditingKey(null)
        setSavedKey(key)
        setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2000)
      })
      .catch((e) => setError(e.message || 'Failed to save price'))
      .finally(() => setSaving(false))
  }

  return (
    <>
      <PageMetaData title="Module Pricing" />
      <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '24px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: PAGE_TEXT, margin: '0 0 4px' }}>Module Pricing</h2>
          <p style={{ color: PAGE_GRAY, fontSize: 13, margin: 0 }}>
            Set what a student pays to unlock one module individually — 6 Month and 12 Month options, same as the full plan. Changes apply immediately.
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: PAGE_GRAY, fontSize: 13 }}>
            <FaSpinner /> Loading…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {modules.map((mod) => (
              <div key={mod.key} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FaTag size={14} color={ORANGE} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: PAGE_TEXT }}>{mod.label}</span>
                </div>
                <p style={{ color: PAGE_GRAY, fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>{mod.description}</p>

                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {PLANS.map(({ key: plan, label }) => {
                    const editKey = `${mod.key}:${plan}`
                    const priceInPaise = mod.plans?.[plan] ?? 0
                    return (
                      <div key={plan} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10.5, color: PAGE_GRAY, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 6 }}>{label}</div>
                        {editingKey === editKey ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '6px 10px', flex: 1 }}>
                              <span style={{ color: PAGE_GRAY, fontSize: 13 }}>₹</span>
                              <input
                                type="number"
                                min={1}
                                value={draftRupees}
                                onChange={(e) => setDraftRupees(e.target.value)}
                                autoFocus
                                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: 14, fontWeight: 700, color: PAGE_TEXT }}
                              />
                            </div>
                            <button
                              onClick={() => save(mod.key, plan)}
                              disabled={saving}
                              title="Save"
                              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                            >
                              <FaCheck size={11} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              title="Cancel"
                              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_GRAY, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                            >
                              <FaTimes size={11} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontWeight: 800, fontSize: 19, color: PAGE_TEXT }}>₹{priceInPaise / 100}</span>
                              {savedKey === editKey && <span style={{ marginLeft: 10, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Saved</span>}
                            </div>
                            <button
                              onClick={() => startEdit(mod.key, plan, priceInPaise)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, background: PAGE_BG, border: `1px solid ${PAGE_BORDER}`, color: PAGE_TEXT, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                              <FaPencilAlt size={9} /> Edit
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default ModulePricingPage

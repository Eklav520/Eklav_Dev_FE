import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import { Building2, Lock, ChevronRight } from 'lucide-react'
import { useAuthContext } from '@/context/useAuthContext'
import { FiSearch, FiZap, FiChevronRight } from 'react-icons/fi'

type ModulePlan = '6months' | '12months'

type CompanyDoc = {
  _id: string
  companyName: string
  logoUrl?: string
  createdAt: string
}

type CompanyGroup = {
  companyName: string
  logoUrl: string
  paperCount: number
  hasFreeSample: boolean
}

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal —
// same tokens as StudentCompanyInterviewPage.tsx.
const PAGE_BG     = 'var(--dash-page-bg, #f1f5f9)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

const CompanyGridPage = () => {
  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const navigate = useNavigate()

  const [companies, setCompanies] = useState<CompanyDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [moduleInfo, setModuleInfo] = useState<{ fullAccess: boolean; active: boolean; plans: Record<ModulePlan, number>; label: string } | null>(null)
  const [buyingPlan, setBuyingPlan] = useState<ModulePlan | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<ModulePlan>('12months')
  const [buyError, setBuyError] = useState<string | null>(null)

  const fetchModuleAccess = () => {
    if (!token) return
    fetch(`${baseURL}/api/student/module-access`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return
        const mod = data.modules?.companyInterview
        setModuleInfo({
          fullAccess: !!data.fullAccess,
          active: !!mod?.active,
          plans: { '6months': mod?.plans?.['6months'] ?? 19900, '12months': mod?.plans?.['12months'] ?? 34900 },
          label: mod?.label ?? 'Company Mock Interviews',
        })
      })
      .catch(() => {})
  }
  useEffect(fetchModuleAccess, [token, baseURL])

  const hasAccess = moduleInfo ? (moduleInfo.fullAccess || moduleInfo.active) : user?.status?.toLowerCase() === 'approved'

  const buyModule = (plan: ModulePlan) => {
    if (!token || buyingPlan) return
    setBuyingPlan(plan)
    setBuyError(null)
    fetch(`${baseURL}/api/student/module-access/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ moduleKey: 'companyInterview', plan }),
    })
      .then((r) => r.json())
      .then((order) => {
        if (!order.success) throw new Error(order.message || 'Failed to start payment')
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: 'Eklav',
          description: order.moduleLabel,
          order_id: order.orderId,
          prefill: { name: user?.fullName || '', email: user?.email || '' },
          theme: { color: '#ff7a00' },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`${baseURL}/api/student/module-access/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...response, moduleKey: 'companyInterview', plan }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyData.success) throw new Error(verifyData.message || 'Payment verification failed')
              fetchModuleAccess()
            } catch (e: any) {
              setBuyError(e.message || 'Payment verification failed. Contact support.')
            } finally {
              setBuyingPlan(null)
            }
          },
          modal: { ondismiss: () => setBuyingPlan(null) },
        }
        const razorpay = new (window as any).Razorpay(options)
        razorpay.on('payment.failed', (response: any) => {
          setBuyError(`Payment failed: ${response.error?.description || 'Unknown error'}`)
          setBuyingPlan(null)
        })
        razorpay.open()
      })
      .catch((e) => { setBuyError(e.message || 'Failed to start payment'); setBuyingPlan(null) })
  }

  useEffect(() => {
    if (!token) return
    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${baseURL}/api/company-interview?page=1&limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok || !data.success) throw new Error('Failed to fetch companies')
        setCompanies(data.data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load companies')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [token, baseURL])

  // Companies come back sorted by createdAt desc, so the first doc is the
  // single free-trial company (matches isFreeCompanyInterview on the backend).
  const freeCompanyName = companies[0]?.companyName

  const groups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, CompanyGroup>()
    companies.forEach((c) => {
      const key = (c.companyName || 'Unknown').trim()
      const existing = map.get(key)
      if (existing) {
        existing.paperCount += 1
        if (!existing.logoUrl && c.logoUrl) existing.logoUrl = c.logoUrl
      } else {
        map.set(key, {
          companyName: key,
          logoUrl: c.logoUrl || '',
          paperCount: 1,
          hasFreeSample: key === freeCompanyName,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
  }, [companies, freeCompanyName])

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return groups
    return groups.filter((g) => g.companyName.toLowerCase().includes(q))
  }, [groups, search])

  const goToCompany = (companyName: string) => navigate(`/student/company-rounds/${encodeURIComponent(companyName)}`)

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: PAGE_BG, gap: 12 }}>
      <Spinner animation="border" style={{ color: '#ff7a00' }} />
      <p style={{ color: PAGE_GRAY, margin: 0, fontSize: '0.85rem' }}>Loading companies…</p>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: PAGE_BG, gap: 12 }}>
      <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 24px', color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: CARD_BG, borderBottom: `1px solid ${PAGE_BORDER}`,
        padding: '18px 24px', display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 20, flexShrink: 0, flexWrap: 'wrap' as const,
      }}>
        <div>
          <div style={{ fontWeight: 800, color: PAGE_TEXT, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            Company Mock Interviews
            {!hasAccess && (
              <span title="Unlock this module, or subscribe to a full plan" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#ff7a00', fontSize: '0.8rem', fontWeight: 700 }}>
                <Lock size={12} />(Premium Module)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: PAGE_GRAY, marginTop: 3 }}>
            Choose a company to practice its mock interview papers.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' as const }}>
          <div style={{ position: 'relative', width: 220 }}>
            <FiSearch size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: PAGE_GRAY }} />
            <input
              placeholder="Search company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 32px', borderRadius: 9,
                border: `1px solid ${PAGE_BORDER}`, background: PAGE_BG, color: PAGE_TEXT, fontSize: '0.82rem',
              }}
            />
          </div>

          <div style={{
            background: 'rgba(255,122,0,0.05)', border: '1px solid rgba(255,122,0,0.18)',
            borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            maxWidth: 300, flexShrink: 0,
          }}>
            <FiZap size={18} color="#ff7a00" style={{ flexShrink: 0 }} />
            <div style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.8rem' }}>Level Up Your Interview Skills</div>
          </div>

          {!hasAccess && (() => {
            const price6 = (moduleInfo?.plans?.['6months'] ?? 19900) / 100
            const price12 = (moduleInfo?.plans?.['12months'] ?? 34900) / 100
            const betterValue = price12 / 12 < price6 / 6
            const isBusy = buyingPlan === selectedPlan
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#fff', border: '1px solid #f0d9c0', borderRadius: 10, padding: 4, flexShrink: 0 }}>
                {(['6months', '12months'] as const).map((plan) => {
                  const price = plan === '6months' ? price6 : price12
                  const active = selectedPlan === plan
                  const highlight = plan === '12months' && betterValue
                  return (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                        padding: '6px 14px', borderRadius: 7, minWidth: 78,
                        border: active ? '1.5px solid #ff7a00' : '1.5px solid transparent', cursor: 'pointer',
                        background: active ? '#fff7ed' : 'transparent',
                      }}
                    >
                      {highlight && (
                        <span style={{
                          position: 'absolute', top: -8, right: -4, background: '#16a34a', color: '#fff', fontSize: 8.5,
                          fontWeight: 700, letterSpacing: 0.2, borderRadius: 10, padding: '2px 5px', whiteSpace: 'nowrap',
                        }}>
                          BEST
                        </span>
                      )}
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: active ? '#ff7a00' : '#999', whiteSpace: 'nowrap' }}>
                        {plan === '6months' ? '6 Months' : '12 Months'}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>₹{price}</span>
                    </button>
                  )
                })}
                <button
                  onClick={() => buyModule(selectedPlan)}
                  disabled={!!buyingPlan || !moduleInfo}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: '#ff7a00', border: 'none', color: '#fff',
                    borderRadius: 7, padding: '9px 18px', fontSize: 12.5, fontWeight: 700, marginLeft: 6,
                    cursor: buyingPlan ? 'not-allowed' : 'pointer', opacity: buyingPlan && !isBusy ? 0.5 : 1,
                  }}
                >
                  {isBusy ? 'Processing…' : <>Buy Now <FiChevronRight size={13} /></>}
                </button>
              </div>
            )
          })()}
        </div>
      </div>
      {buyError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, margin: '10px 24px 0' }}>
          {buyError}
        </div>
      )}

      {/* Grid */}
      <div style={{ padding: 24, flex: 1 }}>
        {filteredGroups.length === 0 ? (
          <div style={{ textAlign: 'center', color: PAGE_GRAY, padding: '60px 0', fontSize: '0.85rem' }}>
            No companies found.
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16,
          }}>
            {filteredGroups.map((g) => {
              const locked = !hasAccess && !g.hasFreeSample
              return (
                <button
                  key={g.companyName}
                  onClick={() => { if (!locked) goToCompany(g.companyName) }}
                  disabled={locked}
                  title={locked ? 'Unlock Company Mock Interviews, or subscribe to a full plan, to view this company.' : undefined}
                  style={{
                    background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14,
                    padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 10, cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'center', position: 'relative',
                    opacity: locked ? 0.55 : 1,
                  }}
                >
                  {locked && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Lock size={11} color="#94a3b8" />
                    </div>
                  )}

                  {g.logoUrl ? (
                    <div style={{
                      width: 108, height: 108, borderRadius: 20,
                      background: 'linear-gradient(150deg, rgba(255,122,0,0.14), rgba(255,122,0,0.02))',
                      border: '2px solid #ff7a00', boxShadow: '0 8px 22px rgba(255,122,0,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6,
                    }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: 14, background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10,
                      }}>
                        <img
                          src={g.logoUrl}
                          alt={g.companyName}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      width: 108, height: 108, borderRadius: 20,
                      background: 'linear-gradient(150deg, rgba(255,122,0,0.18), rgba(255,122,0,0.06))',
                      border: '2px solid #ff7a00', boxShadow: '0 8px 22px rgba(255,122,0,0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Building2 size={40} color="#ff7a00" />
                    </div>
                  )}

                  <div style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.88rem', lineHeight: 1.3 }}>{g.companyName}</div>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,122,0,0.08)',
                    color: '#ff7a00', fontSize: '0.68rem', fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                  }}>
                    {g.paperCount} {g.paperCount === 1 ? 'Paper' : 'Papers'}
                    <ChevronRight size={11} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyGridPage

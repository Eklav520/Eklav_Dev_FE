import { useEffect, useMemo, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { FaStar, FaCheckCircle, FaTimesCircle, FaRegClock, FaBookOpen } from 'react-icons/fa'

const GREEN  = '#34d399'
const RED    = '#f87171'
const ORANGE = '#fbbf24'
const GRAY   = '#94a3b8'
const TEXT   = '#f1f5f9'
const BORDER = '#232f42'
const CARD_BG = '#12161c'
const ACCENT = '#f2622f'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Pending:  { bg: 'rgba(251,191,36,0.14)', color: '#fbbf24' },
  Approved: { bg: 'rgba(52,211,153,0.14)', color: '#34d399' },
  Rejected: { bg: 'rgba(248,113,113,0.14)', color: '#f87171' },
}

interface Story {
  _id: string
  studentName: string
  story: string
  rating: number
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  reviewedAt?: string
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const Stars = ({ rating }: { rating: number }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(n => <FaStar key={n} size={11} color={n <= rating ? '#fbbf24' : BORDER} />)}
  </div>
)

const SuccessStoriesPage = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined

  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending')
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const fetchStories = () => {
    if (!baseURL || !token) return
    setLoading(true)
    fetch(`${baseURL}/admin/success-stories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setStories(Array.isArray(data?.stories) ? data.stories : []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  const counts = useMemo(() => {
    const c = { total: stories.length, pending: 0, approved: 0, rejected: 0 }
    stories.forEach(s => {
      if (s.status === 'Pending') c.pending++
      else if (s.status === 'Approved') c.approved++
      else if (s.status === 'Rejected') c.rejected++
    })
    return c
  }, [stories])

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'Pending', label: `Pending (${counts.pending})` },
    { key: 'Approved', label: `Approved (${counts.approved})` },
    { key: 'Rejected', label: `Rejected (${counts.rejected})` },
    { key: 'All', label: `All (${counts.total})` },
  ]

  const filtered = useMemo(() => stories.filter(s => activeTab === 'All' || s.status === activeTab), [stories, activeTab])

  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    setActioningId(id)
    setActionError('')
    try {
      const res = await fetch(`${baseURL}/admin/success-stories/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const data = await res.json()
      setStories(prev => prev.map(s => s._id === id ? data.story : s))
    } catch (e: any) {
      setActionError('Failed to update story status')
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <PageMetaData title="Success Stories" />

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: TEXT }}>Success Stories</h1>
        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Review student-submitted stories before they go live on the homepage.</p>
      </div>

      {actionError && (
        <div style={{ background: 'rgba(248,113,113,0.14)', color: '#f87171', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{actionError}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Stories', value: counts.total, icon: <FaBookOpen size={16}/>, ic: ACCENT, bg: 'rgba(242,98,47,0.14)' },
          { label: 'Pending Review', value: counts.pending, icon: <FaRegClock size={16}/>, ic: ORANGE, bg: 'rgba(251,191,36,0.14)' },
          { label: 'Approved', value: counts.approved, icon: <FaCheckCircle size={16}/>, ic: GREEN, bg: 'rgba(52,211,153,0.14)' },
          { label: 'Rejected', value: counts.rejected, icon: <FaTimesCircle size={16}/>, ic: RED, bg: 'rgba(248,113,113,0.14)' },
        ].map(s => (
          <div key={s.label} style={{ background: CARD_BG, borderRadius: 12, padding: '14px 16px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: GRAY }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: TEXT, lineHeight: 1.1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? ACCENT : CARD_BG, border: `1px solid ${activeTab === tab.key ? ACCENT : BORDER}`,
              color: activeTab === tab.key ? '#fff' : TEXT, borderRadius: 7, padding: '7px 12px',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: CARD_BG, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0b0f17' }}>
              {['Student', 'Story', 'Rating', 'Status', 'Submitted', 'Actions'].map(h => (
                <th key={h} style={{ padding: '11px 16px', fontSize: '0.72rem', fontWeight: 700, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>No stories in this filter.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', fontSize: '0.85rem', color: GRAY }}>Loading stories…</td></tr>
            )}
            {!loading && filtered.map(s => {
              const st = STATUS_STYLE[s.status]
              return (
                <tr key={s._id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' }}>{s.studentName}</td>
                  <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: '#cbd5e1', maxWidth: 380, lineHeight: 1.5 }}>{s.story}</td>
                  <td style={{ padding: '14px 16px' }}><Stars rating={s.rating}/></td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: st.bg, color: st.color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.76rem', color: GRAY, whiteSpace: 'nowrap' }}>{formatDate(s.createdAt)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {s.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => updateStatus(s._id, 'Approved')}
                          disabled={actioningId === s._id}
                          style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 6, color: GREEN, fontSize: '0.72rem', fontWeight: 700, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(s._id, 'Rejected')}
                          disabled={actioningId === s._id}
                          style={{ background: 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, color: RED, fontSize: '0.72rem', fontWeight: 700, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: GRAY }}>Reviewed {formatDate(s.reviewedAt)}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SuccessStoriesPage

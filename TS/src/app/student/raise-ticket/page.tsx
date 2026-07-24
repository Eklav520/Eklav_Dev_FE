import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import {
  FaTicketAlt, FaClock, FaCheckCircle, FaBoxOpen, FaHeadset, FaPaperclip,
  FaPaperPlane, FaChevronRight, FaSearch, FaTimes,
} from 'react-icons/fa'

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'
const ACCENT      = '#ff7a00'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Open:         { bg: '#fef2f2', color: '#dc2626' },
  'In Progress':{ bg: '#fff7ed', color: '#d97706' },
  Resolved:     { bg: '#ecfdf5', color: '#059669' },
  Closed:       { bg: '#f1f5f9', color: '#64748b' },
}

const FAQS = [
  { q: 'How to access my purchased course?', a: 'Go to My Courses from the sidebar — every course you’ve purchased or been enrolled into shows up there with a Resume button.' },
  { q: 'How to appear for an assessment?', a: 'Open the assessment from your course curriculum or the Assessments tab and click Start — make sure your camera/mic permissions are allowed.' },
  { q: 'Payment related issues', a: 'If a payment was deducted but your plan didn’t activate, raise a ticket under Payment & Subscription with your transaction ID so our team can verify it.' },
  { q: 'How to reset my password?', a: 'Use the Forgot Password link on the login page. If you don’t receive the reset email, raise a ticket under Account.' },
]

interface TicketItem {
  _id: string
  ticketNumber?: string
  subject?: string
  category?: string
  subCategory?: string
  issue?: string
  status?: string
  submittedAt?: string
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const RaiseTicketPage = () => {
  const { user } = useAuthContext()
  const token = (user as any)?.token as string | undefined
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [categories, setCategories] = useState<Record<string, string[]>>({})
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [issue, setIssue] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [counts, setCounts] = useState({ total: 0, open: 0, resolved: 0, closed: 0 })
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showTicketsModal, setShowTicketsModal] = useState(false)

  const fetchTickets = () => {
    if (!baseURL || !token) return
    fetch(`${baseURL}/tickets/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setTickets(Array.isArray(data?.tickets) ? data.tickets : [])
        setCounts(data?.counts || { total: 0, open: 0, resolved: 0, closed: 0 })
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (!baseURL || !token) return
    fetch(`${baseURL}/tickets/categories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setCategories(data || {}))
      .catch(() => {})
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, token])

  const subCategoryOptions = useMemo(() => categories[category] || [], [categories, category])

  const resetForm = () => {
    setCategory(''); setSubCategory(''); setSubject(''); setIssue(''); setAttachment(null)
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!category || !subject.trim() || !issue.trim()) {
      setError('Please fill in category, subject and a description of your issue.')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('category', category)
      form.append('subCategory', subCategory)
      form.append('subject', subject)
      form.append('issue', issue)
      if (attachment) form.append('attachment', attachment)

      const res = await fetch(`${baseURL}/tickets/student`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to submit ticket')
      }
      const data = await res.json()
      setSuccess(`Ticket ${data?.ticket?.ticketNumber || ''} submitted — we’ll get back to you soon.`)
      resetForm()
      fetchTickets()
    } catch (e: any) {
      setError(e?.message || 'Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8,
    padding: '0 12px', fontSize: '0.85rem', color: PAGE_TEXT, background: CARD_BG, outline: 'none',
  }

  return (
    <div style={{ background: PAGE_BG, minHeight: '100%' }}>
      <PageMetaData title="Raise a Ticket" />

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: PAGE_TEXT }}>Raise a Ticket</h1>
        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: PAGE_GRAY }}>Need help? Let us know your issue and we&apos;ll get back to you.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'My Tickets', sub: 'Total Tickets', value: counts.total, icon: <FaTicketAlt size={17}/>, ic: ACCENT, bg: 'rgba(255,122,0,0.12)' },
          { label: 'Open', sub: 'Still in progress', value: counts.open, icon: <FaClock size={17}/>, ic: '#d97706', bg: '#fff7ed' },
          { label: 'Resolved', sub: 'Completed', value: counts.resolved, icon: <FaCheckCircle size={17}/>, ic: '#059669', bg: '#ecfdf5' },
          { label: 'Closed', sub: 'Closed Tickets', value: counts.closed, icon: <FaBoxOpen size={17}/>, ic: PAGE_GRAY as any, bg: 'var(--dash-border, #f1f5f9)' },
        ].map(s => (
          <div key={s.label} style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: PAGE_GRAY }}>{s.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: PAGE_TEXT, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Left: form + track ticket */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: 22 }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: ACCENT, marginBottom: 16 }}>Create a New Ticket</div>

            {error && <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8, marginBottom: 14 }}>{success}</div>}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: PAGE_TEXT, marginBottom: 6 }}>1. Select Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={category} onChange={e => { setCategory(e.target.value); setSubCategory('') }} style={{ ...inputStyle, colorScheme: 'light' }}>
                <option value="">Select a category</option>
                {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: PAGE_TEXT, marginBottom: 6 }}>2. Select Sub-Category</label>
              <select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!category} style={{ ...inputStyle, colorScheme: 'light', opacity: category ? 1 : 0.6 }}>
                <option value="">Select a sub-category</option>
                {subCategoryOptions.map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: PAGE_TEXT, marginBottom: 6 }}>3. Subject <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter a short subject for your issue" style={inputStyle}/>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: PAGE_TEXT, marginBottom: 6 }}>4. Describe Your Issue <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea
                value={issue}
                onChange={e => setIssue(e.target.value)}
                placeholder="Please provide as much detail as possible about the issue you are facing..."
                rows={5}
                style={{ ...inputStyle, height: 'auto', padding: 12, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>
                <FaPaperclip size={12}/> Attach File (Optional)
                <input type="file" hidden onChange={e => setAttachment(e.target.files?.[0] || null)} />
              </label>
              {attachment && <span style={{ marginLeft: 10, fontSize: '0.76rem', color: PAGE_GRAY }}>{attachment.name}</span>}
              <div style={{ fontSize: '0.7rem', color: PAGE_GRAY, marginTop: 4 }}>Max file size: 10MB</div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 12px', fontSize: '0.76rem', color: '#9a3412', marginBottom: 18 }}>
              You can attach screenshots or documents that help us understand the issue better.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={resetForm} style={{ height: 40, padding: '0 18px', borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_TEXT, fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: '0.84rem', fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                <FaPaperPlane size={12}/> {submitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </div>

          <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(255,122,0,0.12)', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaSearch size={15}/>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: PAGE_TEXT }}>Track Your Ticket</div>
                <div style={{ fontSize: '0.75rem', color: PAGE_GRAY }}>You can track the status of your ticket anytime.</div>
              </div>
            </div>
            <button onClick={() => setShowTicketsModal(true)} style={{ height: 36, padding: '0 16px', borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, color: PAGE_TEXT, fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              View My Tickets
            </button>
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Need immediate help */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,122,0,0.10), rgba(255,148,77,0.06))', border: '1px solid rgba(255,122,0,0.25)', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,122,0,0.15)', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <FaHeadset size={18}/>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: PAGE_TEXT, marginBottom: 4 }}>Need Immediate Help?</div>
            <div style={{ fontSize: '0.76rem', color: PAGE_GRAY, marginBottom: 14 }}>Check our Help Center or contact our support team.</div>
            <Link to="/help/center" style={{ display: 'block', background: ACCENT, color: '#fff', borderRadius: 8, padding: '9px 0', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', marginBottom: 10 }}>
              Go to Help Center
            </Link>
            <div style={{ fontSize: '0.72rem', color: PAGE_GRAY, marginBottom: 4 }}>or</div>
            <div style={{ fontSize: '0.76rem', color: PAGE_GRAY }}>
              Email us at <a href="mailto:admin@eklav.in" style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>admin@eklav.in</a>
            </div>
          </div>

          {/* My Recent Tickets */}
          <div id="my-tickets" style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: PAGE_TEXT }}>My Recent Tickets</span>
              {tickets.length > 3 && <span onClick={() => setShowTicketsModal(true)} style={{ fontSize: '0.74rem', color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>View All</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tickets.length === 0 && <span style={{ fontSize: '0.78rem', color: PAGE_GRAY }}>No tickets raised yet.</span>}
              {tickets.slice(0, 3).map(t => {
                const st = STATUS_STYLE[t.status || 'Open']
                return (
                  <div key={t._id} style={{ paddingBottom: 10, borderBottom: `1px solid ${PAGE_BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ background: st.bg, color: st.color, fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{t.status || 'Open'}</span>
                      <span style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>#{t.ticketNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: PAGE_TEXT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>Created on {formatDate(t.submittedAt)}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FAQs */}
          <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: 18 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: PAGE_TEXT, display: 'block', marginBottom: 12 }}>Frequently Asked Questions</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FAQS.map((f, i) => (
                <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? `1px solid ${PAGE_BORDER}` : 'none' }}>
                  <button
                    onClick={() => setOpenFaq(prev => prev === i ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'none', border: 'none', padding: '10px 0', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 500, color: PAGE_TEXT }}>{f.q}</span>
                    <FaChevronRight size={10} color={PAGE_GRAY as any} style={{ transform: openFaq === i ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}/>
                  </button>
                  {openFaq === i && (
                    <div style={{ fontSize: '0.75rem', color: PAGE_GRAY, paddingBottom: 10, lineHeight: 1.5 }}>{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All Tickets modal */}
      {showTicketsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: CARD_BG, borderRadius: 14, width: 620, maxWidth: '100%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PAGE_BORDER}`, flexShrink: 0 }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: PAGE_TEXT }}>My Tickets ({tickets.length})</span>
              <button onClick={() => setShowTicketsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PAGE_GRAY as any, display: 'flex' }}>
                <FaTimes size={16}/>
              </button>
            </div>
            <div style={{ padding: '10px 20px', overflowY: 'auto', flex: 1 }}>
              {tickets.length === 0 && (
                <div style={{ padding: '30px 0', textAlign: 'center', fontSize: '0.82rem', color: PAGE_GRAY }}>No tickets raised yet.</div>
              )}
              {tickets.map(t => {
                const st = STATUS_STYLE[t.status || 'Open']
                return (
                  <div key={t._id} style={{ padding: '12px 0', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: PAGE_GRAY }}>#{t.ticketNumber}</span>
                      <span style={{ background: st.bg, color: st.color, fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>{t.status || 'Open'}</span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: PAGE_TEXT, marginBottom: 3 }}>{t.subject}</div>
                    {(t.category || t.subCategory) && (
                      <div style={{ fontSize: '0.72rem', color: PAGE_GRAY, marginBottom: 3 }}>{[t.category, t.subCategory].filter(Boolean).join(' → ')}</div>
                    )}
                    {t.issue && (
                      <div style={{ fontSize: '0.76rem', color: PAGE_GRAY, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{t.issue}</div>
                    )}
                    <div style={{ fontSize: '0.68rem', color: PAGE_GRAY }}>Created on {formatDate(t.submittedAt)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RaiseTicketPage

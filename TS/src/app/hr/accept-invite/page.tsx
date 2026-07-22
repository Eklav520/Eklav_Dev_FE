import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'

const BLUE = '#2563eb'
const BORDER = '#e2e8f0'

interface InviteInfo { name: string; email: string; role: string }

const HRAcceptInvitePage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!token || !baseURL || fetchedRef.current) return
    fetchedRef.current = true
    fetch(`${baseURL}/team-members/invite/${token}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error || 'This invite link is invalid or has expired')
        return r.json()
      })
      .then(data => setInvite(data))
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false))
  }, [token, baseURL])

  const handleSubmit = async () => {
    if (password.length < 6) { setSubmitError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setSubmitError('Passwords do not match'); return }
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${baseURL}/team-members/invite/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Failed to accept invite')
      setDone(true)
      setTimeout(() => navigate('/auth/sign-in'), 2500)
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to accept invite')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { width: '100%', height: 40, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', fontSize: '0.86rem', background: '#fff', color: '#0f172a', colorScheme: 'light' as const, boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: 420, maxWidth: '100%', padding: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        {loading && <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.86rem' }}>Loading invite…</div>}

        {!loading && loadError && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Invite unavailable</div>
            <div style={{ fontSize: '0.86rem', color: '#dc2626' }}>{loadError}</div>
          </div>
        )}

        {!loading && !loadError && done && (
          <div style={{ textAlign: 'center' }}>
            <FiCheckCircle size={36} color="#10b981" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>You're all set!</div>
            <div style={{ fontSize: '0.86rem', color: '#64748b' }}>Redirecting you to sign in…</div>
          </div>
        )}

        {!loading && !loadError && !done && invite && (
          <>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Welcome, {invite.name}</div>
            <div style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: 22 }}>
              You've been invited as <b>{invite.role}</b>. Set a password for <b>{invite.email}</b> to activate your account.
            </div>

            {submitError && (
              <div style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', padding: '9px 12px', borderRadius: 8, marginBottom: 14 }}>{submitError}</div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" style={inputStyle} />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', height: 42, borderRadius: 8, border: 'none', background: BLUE, color: '#fff', fontSize: '0.88rem', fontWeight: 600, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Activating…' : 'Activate Account'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default HRAcceptInvitePage

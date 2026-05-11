import React, { useEffect, useRef, useState } from 'react'

interface Props {
  show: boolean
  onStay: () => void
  onLogout: () => void
  autoLogoutSeconds?: number  // countdown before auto-logout (default 120 s)
}

const IdleWarningModal: React.FC<Props> = ({
  show,
  onStay,
  onLogout,
  autoLogoutSeconds = 120,
}) => {
  const [remaining, setRemaining] = useState(autoLogoutSeconds)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!show) {
      setRemaining(autoLogoutSeconds)
      clearInterval(timerRef.current)
      return
    }

    setRemaining(autoLogoutSeconds)
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null

  const pct = Math.round((remaining / autoLogoutSeconds) * 100)
  const circumference = 2 * Math.PI * 26  // radius = 26

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9998,
        backdropFilter: 'blur(4px)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: 20,
        padding: '36px 32px',
        width: 360,
        maxWidth: '90vw',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        textAlign: 'center',
        fontFamily: '"Segoe UI", sans-serif',
      }}>
        {/* Countdown ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <svg width={68} height={68} viewBox="0 0 68 68">
            <circle cx={34} cy={34} r={26}
              fill="none" stroke="#1e293b" strokeWidth={5} />
            <circle cx={34} cy={34} r={26}
              fill="none"
              stroke={remaining <= 30 ? '#ef4444' : '#ff7a00'}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <text x={34} y={39} textAnchor="middle"
              fill={remaining <= 30 ? '#ef4444' : '#ff7a00'}
              fontSize={16} fontWeight={700}>
              {remaining}
            </text>
          </svg>
        </div>

        <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: 8, fontSize: '1.1rem' }}>
          Are you still there?
        </h5>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 28, lineHeight: 1.6 }}>
          You've been inactive for 15 minutes.<br />
          You'll be logged out in <strong style={{ color: remaining <= 30 ? '#ef4444' : '#ff7a00' }}>{remaining}s</strong>.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onLogout}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'transparent', border: '1px solid #334155',
              color: '#94a3b8', fontWeight: 600, fontSize: '0.88rem',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#ef4444', e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#334155', e.currentTarget.style.color = '#94a3b8')}
          >
            Logout Now
          </button>
          <button
            onClick={onStay}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #ff7a00, #e96d00)',
              border: 'none', color: '#fff',
              fontWeight: 700, fontSize: '0.88rem',
              cursor: 'pointer', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </>
  )
}

export default IdleWarningModal

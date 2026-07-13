import React from 'react'

interface Props {
  show: boolean
  message: string
  onOk: () => void
}

const isAnotherDevice = (msg: string) =>
  msg.toLowerCase().includes('another device') || msg.toLowerCase().includes('logged in on')

const SessionExpiredModal: React.FC<Props> = ({ show, message, onOk }) => {
  if (!show) return null

  const otherDevice = isAnotherDevice(message)

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.80)',
        zIndex: 9998,
        backdropFilter: 'blur(6px)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24,
        padding: '40px 36px 36px',
        width: 520,
        maxWidth: '94vw',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        textAlign: 'center',
        fontFamily: '"Segoe UI", sans-serif',
      }}>

        {/* Icon circle */}
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: otherDevice ? 'rgba(251,146,60,0.12)' : 'rgba(239,68,68,0.12)',
          border: `2px solid ${otherDevice ? 'rgba(251,146,60,0.35)' : 'rgba(239,68,68,0.35)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
        }}>
          {otherDevice ? (
            /* Monitor / another device icon */
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          ) : (
            /* Clock / expired icon */
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h5 style={{ color: '#fff', fontWeight: 700, marginBottom: 12, fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
          {otherDevice ? 'Signed in on Another Device' : 'Your Session Has Expired'}
        </h5>

        {/* Description */}
        {otherDevice ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 12 }}>
            <p style={{ margin: 0 }}>
              Someone signed into your <strong style={{ color: '#cbd5e1' }}>Eklav account</strong> from another device or browser.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              For your security, you have been logged out here.
            </p>
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 12 }}>
            <p style={{ margin: 0 }}>
              You've been away for a while and your session has timed out.
            </p>
            <p style={{ margin: '10px 0 0' }}>
              Please log in again to continue where you left off.
            </p>
          </div>
        )}

        {/* Tip */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 28,
          color: '#64748b',
          fontSize: '0.8rem',
          lineHeight: 1.6,
        }}>
          {otherDevice
            ? '💡 If this wasn\'t you, change your password immediately after logging in.'
            : '💡 Tip: Your progress is saved. You can pick up right where you left off.'}
        </div>

        {/* Button */}
        <button
          onClick={onOk}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 12,
            background: otherDevice
              ? 'linear-gradient(135deg, #f97316, #ea580c)'
              : 'linear-gradient(135deg, #ff7a00, #e96d00)',
            border: 'none', color: '#fff',
            fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer', transition: 'opacity 0.2s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          OK, Take Me to Login
        </button>
      </div>
    </>
  )
}

export default SessionExpiredModal

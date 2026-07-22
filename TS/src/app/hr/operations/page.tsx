import { FiSearch, FiCalendar, FiBell, FiFileText, FiUserCheck, FiClipboard, FiShield } from 'react-icons/fi'
import { useAuthContext } from '@/context/useAuthContext'

const GRAY   = '#64748b'
const BLUE   = '#2563eb'
const BORDER = '#e2e8f0'

const AVATAR_COLORS = [
  ['#4F46E5', '#EEF2FF'], ['#0891B2', '#ECFEFF'], ['#16A34A', '#F0FDF4'],
  ['#DC2626', '#FEF2F2'], ['#D97706', '#FFFBEB'], ['#7C3AED', '#F5F3FF'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials = (name: string) => (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'

// Post-offer processing: this is the landing shell for the HR Operations
// role. The feature areas below (offers, onboarding, documents, background
// verification) are scoped but not yet built — this page tracks that.
const OPERATIONS_AREAS = [
  { key: 'offers', label: 'Offer Letters', desc: 'Generate and track offer letters sent to selected candidates.', icon: FiFileText, ic: BLUE, bg: '#eff6ff' },
  { key: 'onboarding', label: 'Onboarding', desc: 'Checklist and status for candidates who have accepted an offer.', icon: FiUserCheck, ic: '#16A34A', bg: '#f0fdf4' },
  { key: 'documents', label: 'Document Collection', desc: 'Collect and verify ID, education, and employment documents.', icon: FiClipboard, ic: '#D97706', bg: '#fffbeb' },
  { key: 'verification', label: 'Background Verification', desc: 'Track background check status before joining.', icon: FiShield, ic: '#7C3AED', bg: '#f5f3ff' },
]

const HROperationsPage = () => {
  const { user } = useAuthContext()
  const memberName = (user as any)?.fullName || (user as any)?.name || 'HR Operations'
  const [pfg, pbg] = avatarColor(memberName)

  const inputBase = { border: `1px solid ${BORDER}`, borderRadius: 8, background: '#fff', color: '#334155', colorScheme: 'light' as const }

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Operations</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Offer letters, onboarding, documents and verification for hired candidates.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input placeholder="Search candidates…" style={{ ...inputBase, paddingLeft: 32, paddingRight: 12, height: 36, width: 240, fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiBell size={15}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 40, border: `1px solid ${BORDER}`, background: '#fff' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: pbg, color: pfg, fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials(memberName)}</div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{memberName}</div>
              <div style={{ fontSize: '0.66rem', color: GRAY, whiteSpace: 'nowrap' }}>HR Operations</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {OPERATIONS_AREAS.map(area => {
          const Icon = area.icon
          return (
            <div key={area.key} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 20, display: 'flex', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: area.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: area.ic, flexShrink: 0 }}>
                <Icon size={19} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{area.label}</div>
                <div style={{ fontSize: '0.78rem', color: GRAY, lineHeight: 1.5 }}>{area.desc}</div>
                <div style={{ marginTop: 10, fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', background: '#fff7ed', display: 'inline-block', padding: '3px 9px', borderRadius: 20 }}>Coming soon</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default HROperationsPage

import type { IconType } from 'react-icons'
import { FiClock } from 'react-icons/fi'

const GRAY = '#64748b'
const BORDER = '#e2e8f0'

const ComingSoon = ({ title, icon: Icon = FiClock }: { title: string; icon?: IconType }) => (
  <div style={{ minHeight: '100%' }}>
    <h1 style={{ margin: '0 0 20px', fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>{title}</h1>
    <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: '70px 20px', textAlign: 'center' }}>
      <Icon size={28} color="#94a3b8" style={{ marginBottom: 12 }} />
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>{title} is coming soon</div>
      <div style={{ fontSize: '0.8rem', color: GRAY }}>This section isn't built yet — check back later.</div>
    </div>
  </div>
)

export default ComingSoon

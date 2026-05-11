import React from 'react'
import { ResumeData } from './ResumeData'

// Template — Henry Jackson style
// Full-width header · Wide left main · Narrow right sidebar (light bg)
const ACCENT = '#1e293b'
const BLUE   = '#2563eb'

const ResumeCorporate: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name     = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')
  const roleTags = data.role ? data.role.split(/[|,]/).map(s => s.trim()).filter(Boolean) : []

  // Section heading used in left main column
  const MainSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderBottom: `1.5px solid #e2e8f0`, paddingBottom: 5, marginBottom: 10 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</span>
      </div>
      {children}
    </div>
  )

  // Section heading used in right sidebar
  const SideSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, borderBottom: `1.5px solid #cbd5e1`, paddingBottom: 5, marginBottom: 10 }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</span>
      </div>
      {children}
    </div>
  )

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 7, marginBottom: 4, alignItems: 'flex-start' }}>
      <span style={{ color: '#94a3b8', flexShrink: 0, fontSize: 9, marginTop: 4 }}>●</span>
      <span style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.65 }}>{text}</span>
    </div>
  )

  const DotRating = ({ filled = 5 }: { filled?: number }) => (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < filled ? BLUE : '#e2e8f0', border: `1px solid ${i < filled ? BLUE : '#cbd5e1'}` }} />
      ))}
    </div>
  )

  return (
    <div style={{ fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif', background: '#fff', maxWidth: 794, margin: '0 auto', minHeight: 1122, boxSizing: 'border-box' }}>

      {/* ── Full-Width Header ── */}
      <div style={{ padding: '22px 28px 16px', borderBottom: `2px solid ${BLUE}`, background: '#fff' }}>
        {name && (
          <div style={{ fontSize: 26, fontWeight: 900, color: ACCENT, letterSpacing: 0.3, lineHeight: 1, marginBottom: 5 }}>{name}</div>
        )}
        {roleTags.length > 0 && (
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginBottom: 9 }}>
            {roleTags.join('  |  ')}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', fontSize: 10, color: '#64748b' }}>
          {data.email    && <span>✉ {data.email}</span>}
          {data.linkedin && <span>🔗 {data.linkedin}</span>}
          {location      && <span>📍 {location}</span>}
          {data.phone    && <span>☏ {data.phone}</span>}
        </div>
      </div>

      {/* ── Two-Column Body ── */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>

        {/* LEFT — main content (65%) */}
        <div style={{ width: '64%', padding: '18px 22px', boxSizing: 'border-box', borderRight: '1px solid #e2e8f0' }}>

          {data.summary && (
            <MainSection icon="👤" title="Summary">
              <p style={{ fontSize: 10.5, color: '#4b5563', lineHeight: 1.75, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
            </MainSection>
          )}

          {!!data.education?.length && (
            <MainSection icon="🎓" title="Education">
              {data.education.map((e, i) => <Bullet key={i} text={e} />)}
            </MainSection>
          )}

          {!!data.experience?.length && (
            <MainSection icon="💼" title="Research & Academic Experience">
              {data.experience.map((e, i) => <Bullet key={i} text={e} />)}
            </MainSection>
          )}

          {!!data.projects?.length && (
            <MainSection icon="🚀" title="Projects">
              {data.projects.map((p, i) => <Bullet key={i} text={p} />)}
            </MainSection>
          )}

          {!!data.certifications?.length && (
            <MainSection icon="📋" title="Training & Courses">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                {data.certifications.map((c, i) => (
                  <div key={i} style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 700, color: ACCENT }}>{c.split('–')[0]?.trim() || c}</div>
                    {c.includes('–') && <div style={{ color: '#64748b' }}>{c.split('–')[1]?.trim()}</div>}
                  </div>
                ))}
              </div>
            </MainSection>
          )}
        </div>

        {/* RIGHT — sidebar (35%) */}
        <div style={{ width: '36%', padding: '18px 18px', background: '#f8fafc', boxSizing: 'border-box' }}>

          {/* Key Achievements */}
          {!!data.achievements?.length && (
            <SideSection icon="⭐" title="Key Achievements">
              {data.achievements.map((a, i) => {
                const parts = a.split('–')
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT, marginBottom: 2 }}>
                      ⭐ {parts[0]?.trim() || a}
                    </div>
                    {parts[1] && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.55 }}>{parts[1].trim()}</div>}
                  </div>
                )
              })}
            </SideSection>
          )}

          {!!data.skills?.length && (
            <SideSection icon="🔧" title="Skills">
              <p style={{ fontSize: 10.5, color: '#4b5563', lineHeight: 1.7, margin: 0 }}>
                {data.skills.join(' • ')}
              </p>
            </SideSection>
          )}

          {!!data.languages?.length && (
            <SideSection icon="🌐" title="Languages">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {data.languages.map((l, i) => {
                  const parts = l.split(/[-–]/)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: ACCENT }}>{parts[0]?.trim()}</div>
                        {parts[1] && <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{parts[1].trim()}</div>}
                      </div>
                      <DotRating filled={i === 0 ? 5 : i === 1 ? 3 : 4} />
                    </div>
                  )
                })}
              </div>
            </SideSection>
          )}

          {!!data.hobbies?.length && (
            <SideSection icon="💡" title="Interests">
              {data.hobbies.map((h, i) => {
                const parts = h.split('–')
                return (
                  <div key={i} style={{ marginBottom: 9 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT, marginBottom: 1 }}>{parts[0]?.trim()}</div>
                    {parts[1] && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.55 }}>{parts[1].trim()}</div>}
                  </div>
                )
              })}
            </SideSection>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeCorporate

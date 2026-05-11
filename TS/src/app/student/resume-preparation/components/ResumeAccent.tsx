import React from 'react'
import { ResumeData } from './ResumeData'

// Template — Mary Lee style
// Narrow left sidebar · Wide right column with large name at top
const ACCENT  = '#0e7490'
const ACCENT2 = '#164e63'
const LIGHT   = '#ecfeff'

const ResumeAccent: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name     = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')
  const roleTags = data.role ? data.role.split(/[|,]/).map(s => s.trim()).filter(Boolean) : []

  const SideSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{title}</span>
      </div>
      <div style={{ height: 1.5, background: `${ACCENT}40`, marginBottom: 8 }} />
      {children}
    </div>
  )

  const MainSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, color: ACCENT2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
        <div style={{ flex: 1, height: 1.5, background: `${ACCENT}30` }} />
      </div>
      {children}
    </div>
  )

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 7, marginBottom: 4, alignItems: 'flex-start' }}>
      <span style={{ color: ACCENT, flexShrink: 0, fontSize: 9, marginTop: 4 }}>●</span>
      <span style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.65 }}>{text}</span>
    </div>
  )

  const DotRating = ({ filled = 5 }: { filled?: number }) => (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i < filled ? ACCENT : '#e2e8f0', border: `1px solid ${i < filled ? ACCENT : '#cbd5e1'}` }} />
      ))}
    </div>
  )

  return (
    <div style={{ fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif', background: '#fff', maxWidth: 794, margin: '0 auto', minHeight: 1122, display: 'flex', boxSizing: 'border-box' }}>

      {/* ── LEFT Sidebar ── */}
      <div style={{ width: '30%', background: '#f0f9ff', borderRight: `3px solid ${ACCENT}`, padding: '28px 16px', boxSizing: 'border-box', flexShrink: 0 }}>

        {/* Contacts */}
        <SideSection icon="✉" title="Contacts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.email    && <div style={{ fontSize: 10, color: '#374151' }}>✉ {data.email}</div>}
            {data.phone    && <div style={{ fontSize: 10, color: '#374151' }}>☏ {data.phone}</div>}
            {data.linkedin && <div style={{ fontSize: 10, color: '#374151' }}>🔗 {data.linkedin}</div>}
            {location      && <div style={{ fontSize: 10, color: '#374151' }}>📍 {location}</div>}
          </div>
        </SideSection>

        {/* Skills */}
        {!!data.skills?.length && (
          <SideSection icon="🔧" title="Skills">
            <p style={{ fontSize: 10.5, color: '#374151', lineHeight: 1.75, margin: 0 }}>
              {data.skills.join(' • ')}
            </p>
          </SideSection>
        )}

        {/* Key Achievements */}
        {!!data.achievements?.length && (
          <SideSection icon="⭐" title="Key Achievements">
            {data.achievements.map((a, i) => {
              const parts = a.split('–')
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT2, marginBottom: 2 }}>{parts[0]?.trim()}</div>
                  {parts[1] && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.55 }}>{parts[1].trim()}</div>}
                </div>
              )
            })}
          </SideSection>
        )}

        {/* Interests */}
        {!!data.hobbies?.length && (
          <SideSection icon="💡" title="Interests">
            {data.hobbies.map((h, i) => {
              const parts = h.split('–')
              return (
                <div key={i} style={{ marginBottom: 9 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT2 }}>{parts[0]?.trim()}</div>
                  {parts[1] && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.55 }}>{parts[1].trim()}</div>}
                </div>
              )
            })}
          </SideSection>
        )}
      </div>

      {/* ── RIGHT Main Column ── */}
      <div style={{ flex: 1, padding: '0', boxSizing: 'border-box' }}>

        {/* Name Header */}
        <div style={{ padding: '24px 24px 18px', borderBottom: `1px solid #e2e8f0` }}>
          {name && <div style={{ fontSize: 28, fontWeight: 900, color: ACCENT2, letterSpacing: 0.3, lineHeight: 1.1, marginBottom: 6 }}>{name}</div>}
          {roleTags.length > 0 && (
            <div style={{ background: LIGHT, border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {roleTags.join('  |  ')}
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '18px 24px' }}>

          {/* Summary */}
          {data.summary && (
            <MainSection icon="👤" title="Summary">
              <p style={{ fontSize: 10.5, color: '#4b5563', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
            </MainSection>
          )}

          {/* Experience */}
          {!!data.experience?.length && (
            <MainSection icon="💼" title="Experience">
              {data.experience.map((e, i) => <Bullet key={i} text={e} />)}
            </MainSection>
          )}

          {/* Education */}
          {!!data.education?.length && (
            <MainSection icon="🎓" title="Education">
              {data.education.map((e, i) => <Bullet key={i} text={e} />)}
            </MainSection>
          )}

          {/* Projects / Training */}
          {!!data.projects?.length && (
            <MainSection icon="📋" title="Training & Additional">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {data.projects.map((p, i) => {
                  const parts = p.split('–')
                  return (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT2, marginBottom: 2 }}>{parts[0]?.trim()}</div>
                      {parts[1] && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>{parts[1].trim()}</div>}
                    </div>
                  )
                })}
              </div>
            </MainSection>
          )}

          {/* Certifications */}
          {!!data.certifications?.length && (
            <MainSection icon="🏅" title="Certifications">
              {data.certifications.map((c, i) => <Bullet key={i} text={c} />)}
            </MainSection>
          )}

          {/* Languages */}
          {!!data.languages?.length && (
            <MainSection icon="🌐" title="Languages">
              <div style={{ display: 'flex', gap: '6px 24px', flexWrap: 'wrap' }}>
                {data.languages.map((l, i) => {
                  const parts = l.split(/[-–]/)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: ACCENT2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{parts[0]?.trim()}</div>
                        {parts[1] && <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{parts[1].trim()}</div>}
                      </div>
                      <DotRating filled={i === 0 ? 5 : i === 1 ? 4 : 3} />
                    </div>
                  )
                })}
              </div>
            </MainSection>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeAccent

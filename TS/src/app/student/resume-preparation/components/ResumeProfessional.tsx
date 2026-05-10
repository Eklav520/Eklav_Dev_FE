import React from 'react'
import { ResumeData } from './ResumeData'

// Template 3 — Executive Two-Column (dark sidebar + clean content)
const sidebar  = '#1e2d3d'
const accent   = '#3b82f6'

const ResumeProfessional: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')

  const SideSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 5 }}>{title}</div>
      {children}
    </div>
  )

  const MainSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: sidebar, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `2px solid ${accent}`, paddingBottom: 4, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )

  const MainBullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 6 }} />
      <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{text}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif', background: '#fff', maxWidth: 794, margin: '0 auto', minHeight: 1122, display: 'flex', boxSizing: 'border-box' }}>

      {/* ── Left Sidebar ── */}
      <div style={{ width: '32%', background: sidebar, padding: '36px 22px', color: '#fff', flexShrink: 0, boxSizing: 'border-box' }}>

        {/* Name + Role */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          {name && <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 5 }}>{name}</div>}
          {data.role && <div style={{ fontSize: 11, color: accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{data.role}</div>}
        </div>

        {/* Contact */}
        <SideSection title="Contact">
          <div style={{ fontSize: 10.5, color: '#cbd5e1', lineHeight: 1.9 }}>
            {data.email    && <div>✉ {data.email}</div>}
            {data.phone    && <div>☏ {data.phone}</div>}
            {data.linkedin && <div>🔗 {data.linkedin}</div>}
            {location      && <div>📍 {location}</div>}
          </div>
        </SideSection>

        {/* Skills */}
        {!!data.skills?.length && (
          <SideSection title="Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 6px' }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 10, background: 'rgba(59,130,246,0.18)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </SideSection>
        )}

        {/* Education */}
        {!!data.education?.length && (
          <SideSection title="Education">
            {data.education.map((e, i) => (
              <div key={i} style={{ fontSize: 10.5, color: '#cbd5e1', lineHeight: 1.65, marginBottom: 6 }}>{e}</div>
            ))}
          </SideSection>
        )}

        {/* Languages */}
        {!!data.languages?.length && (
          <SideSection title="Languages">
            {data.languages.map((l, i) => (
              <div key={i} style={{ fontSize: 10.5, color: '#cbd5e1', marginBottom: 3 }}>{l}</div>
            ))}
          </SideSection>
        )}

        {/* Hobbies */}
        {!!data.hobbies?.length && (
          <SideSection title="Interests">
            <div style={{ fontSize: 10.5, color: '#cbd5e1', lineHeight: 1.7 }}>{data.hobbies.join(' • ')}</div>
          </SideSection>
        )}
      </div>

      {/* ── Right Content ── */}
      <div style={{ flex: 1, padding: '36px 30px', boxSizing: 'border-box' }}>

        {/* Summary */}
        {data.summary && (
          <MainSection title="Professional Summary">
            <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
          </MainSection>
        )}

        {/* Experience */}
        {!!data.experience?.length && (
          <MainSection title="Work Experience">
            {data.experience.map((e, i) => <MainBullet key={i} text={e} />)}
          </MainSection>
        )}

        {/* Projects */}
        {!!data.projects?.length && (
          <MainSection title="Projects">
            {data.projects.map((p, i) => <MainBullet key={i} text={p} />)}
          </MainSection>
        )}

        {/* Certifications */}
        {!!data.certifications?.length && (
          <MainSection title="Certifications">
            {data.certifications.map((c, i) => <MainBullet key={i} text={c} />)}
          </MainSection>
        )}
      </div>
    </div>
  )
}

export default ResumeProfessional

import React from 'react'
import { ResumeData } from './ResumeData'

// Template 5 — Creative Accent (bold gradient header, teal accent, left color bar)
const accent  = '#0d9488'
const accent2 = '#0f766e'

const ResumeMinimalist: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
      <div style={{ width: 3, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 9 }}>{title}</div>
        {children}
      </div>
    </div>
  )

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
      <span style={{ color: accent, flexShrink: 0, fontSize: 9, marginTop: 5 }}>◆</span>
      <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{text}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif', background: '#fff', maxWidth: 794, margin: '0 auto', minHeight: 1122, boxSizing: 'border-box' }}>

      {/* ── Gradient Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${accent} 0%, #134e4a 100%)`, padding: '34px 40px 28px' }}>
        {name && <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 3, letterSpacing: 0.3 }}>{name}</div>}
        {data.role && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 12, letterSpacing: '0.06em' }}>{data.role}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 10.5, color: 'rgba(255,255,255,0.75)' }}>
          {data.email    && <span>✉ {data.email}</span>}
          {data.phone    && <span>☏ {data.phone}</span>}
          {data.linkedin && <span>🔗 {data.linkedin}</span>}
          {location      && <span>📍 {location}</span>}
        </div>
      </div>

      <div style={{ padding: '30px 40px' }}>

        {/* ── Summary ── */}
        {data.summary && (
          <Section title="Summary">
            <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
          </Section>
        )}

        {/* ── Skills ── */}
        {!!data.skills?.length && (
          <Section title="Core Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px' }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 10.5, background: '#f0fdfa', color: accent2, border: `1px solid ${accent}44`, borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Experience ── */}
        {!!data.experience?.length && (
          <Section title="Experience">
            {data.experience.map((e, i) => <Bullet key={i} text={e} />)}
          </Section>
        )}

        {/* ── Education ── */}
        {!!data.education?.length && (
          <Section title="Education">
            {data.education.map((e, i) => <Bullet key={i} text={e} />)}
          </Section>
        )}

        {/* ── Projects ── */}
        {!!data.projects?.length && (
          <Section title="Projects">
            {data.projects.map((p, i) => <Bullet key={i} text={p} />)}
          </Section>
        )}

        {/* ── Certifications ── */}
        {!!data.certifications?.length && (
          <Section title="Certifications">
            {data.certifications.map((c, i) => <Bullet key={i} text={c} />)}
          </Section>
        )}

        {/* ── Extra ── */}
        {(!!data.languages?.length || !!data.hobbies?.length) && (
          <Section title="Additional">
            {!!data.languages?.length && <div style={{ fontSize: 11, marginBottom: 5, color: '#4b5563' }}><strong style={{ color: accent }}>Languages:</strong> {data.languages.join(' · ')}</div>}
            {!!data.hobbies?.length   && <div style={{ fontSize: 11, color: '#4b5563' }}><strong style={{ color: accent }}>Interests:</strong> {data.hobbies.join(' · ')}</div>}
          </Section>
        )}
      </div>
    </div>
  )
}

export default ResumeMinimalist

import React from 'react'
import { ResumeData } from './ResumeData'

// Template 2 — Modern Blue (clean sans-serif, colored header, pill skills)
const accent = '#1d4ed8'

const ResumeModern: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 4, height: 18, background: accent, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: '#dbeafe' }} />
      </div>
      {children}
    </div>
  )

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0, marginTop: 5 }} />
      <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{text}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: '"Segoe UI","Helvetica Neue",Arial,sans-serif', background: '#fff', color: '#1f2937', maxWidth: 794, margin: '0 auto', minHeight: 1122, boxSizing: 'border-box' }}>

      {/* ── Header Band ── */}
      <div style={{ background: accent, padding: '30px 40px 24px', position: 'relative' }}>
        {name && <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: 0.5, marginBottom: 2 }}>{name}</div>}
        {data.role && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginBottom: 10 }}>{data.role}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 10.5, color: 'rgba(255,255,255,0.8)' }}>
          {data.email    && <span>✉ {data.email}</span>}
          {data.phone    && <span>☏ {data.phone}</span>}
          {data.linkedin && <span>🔗 {data.linkedin}</span>}
          {location      && <span>📍 {location}</span>}
        </div>
      </div>

      <div style={{ padding: '28px 40px' }}>

        {/* ── Summary ── */}
        {data.summary && (
          <Section title="Summary">
            <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
          </Section>
        )}

        {/* ── Skills ── */}
        {!!data.skills?.length && (
          <Section title="Skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px' }}>
              {data.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 10.5, background: '#eff6ff', color: accent, border: `1px solid #bfdbfe`, borderRadius: 20, padding: '3px 12px', fontWeight: 600 }}>{s}</span>
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
            {!!data.languages?.length && <div style={{ fontSize: 11, marginBottom: 4 }}><strong>Languages:</strong> {data.languages.join(', ')}</div>}
            {!!data.hobbies?.length   && <div style={{ fontSize: 11 }}><strong>Interests:</strong> {data.hobbies.join(', ')}</div>}
          </Section>
        )}
      </div>
    </div>
  )
}

export default ResumeModern

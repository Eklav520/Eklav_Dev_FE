import React from 'react'
import { ResumeData } from './ResumeData'

// Template 4 — Elegant Minimal (ultra-clean, slate accent, generous whitespace)
const accent = '#0f172a'
const muted  = '#64748b'
const line   = '#e2e8f0'

const ResumeElegant: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.18em', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: line }} />
      </div>
      {children}
    </div>
  )

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
      <div style={{ width: 1.5, height: 12, background: '#94a3b8', flexShrink: 0, marginTop: 4 }} />
      <span style={{ fontSize: 11, color: '#334155', lineHeight: 1.7 }}>{text}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif', background: '#fff', color: accent, padding: '44px 48px', maxWidth: 794, margin: '0 auto', minHeight: 1122, boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 30 }}>
        {name && <div style={{ fontSize: 30, fontWeight: 300, color: accent, letterSpacing: '-0.5px', marginBottom: 3 }}>{name}</div>}
        {data.role && <div style={{ fontSize: 12.5, color: '#3b82f6', fontWeight: 600, marginBottom: 10, letterSpacing: '0.04em' }}>{data.role}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', fontSize: 10.5, color: muted }}>
          {data.email    && <span>{data.email}</span>}
          {data.phone    && <span>{data.phone}</span>}
          {data.linkedin && <span>{data.linkedin}</span>}
          {location      && <span>{location}</span>}
        </div>
        <div style={{ height: 1, background: accent, marginTop: 14 }} />
      </div>

      {/* ── Summary ── */}
      {data.summary && (
        <Section title="Summary">
          <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
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

      {/* ── Skills ── */}
      {!!data.skills?.length && (
        <Section title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px' }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ fontSize: 10.5, color: '#334155', background: '#f8fafc', border: `1px solid ${line}`, borderRadius: 4, padding: '3px 11px' }}>{s}</span>
            ))}
          </div>
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
          {!!data.languages?.length && <div style={{ fontSize: 11, marginBottom: 4, color: '#475569' }}><strong style={{ color: accent }}>Languages:</strong> {data.languages.join(' · ')}</div>}
          {!!data.hobbies?.length   && <div style={{ fontSize: 11, color: '#475569' }}><strong style={{ color: accent }}>Interests:</strong> {data.hobbies.join(' · ')}</div>}
        </Section>
      )}
    </div>
  )
}

export default ResumeElegant

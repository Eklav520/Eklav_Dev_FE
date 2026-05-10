import React from 'react'
import { ResumeData } from './ResumeData'

// Template 1 — Classic Traditional (ATS-friendly, serif, black/white)
const ResumeClassic: React.FC<{ data: ResumeData }> = ({ data }) => {
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')
  const contact = [data.email, data.phone, data.linkedin, location].filter(Boolean).join('  •  ')

  const Divider = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 8px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#111', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1.5, background: '#111' }} />
    </div>
  )

  const Bullet = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5, alignItems: 'flex-start' }}>
      <span style={{ color: '#555', flexShrink: 0, fontSize: 10, marginTop: 3 }}>▸</span>
      <span style={{ fontSize: 11, color: '#222', lineHeight: 1.7 }}>{text}</span>
    </div>
  )

  return (
    <div style={{ fontFamily: '"Georgia","Times New Roman",serif', background: '#fff', color: '#111', padding: '40px 46px', maxWidth: 794, margin: '0 auto', minHeight: 1122, boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', borderBottom: '2.5px solid #111', paddingBottom: 14, marginBottom: 4 }}>
        {name && <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>{name}</div>}
        {data.role && <div style={{ fontSize: 11.5, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{data.role}</div>}
        {contact && <div style={{ fontSize: 10.5, color: '#444' }}>{contact}</div>}
      </div>

      {/* ── Summary ── */}
      {data.summary && (<>
        <Divider title="Professional Summary" />
        <p style={{ fontSize: 11, color: '#333', lineHeight: 1.75, margin: 0, textAlign: 'justify' }}>{data.summary}</p>
      </>)}

      {/* ── Experience ── */}
      {!!data.experience?.length && (<>
        <Divider title="Work Experience" />
        {data.experience.map((e, i) => <Bullet key={i} text={e} />)}
      </>)}

      {/* ── Education ── */}
      {!!data.education?.length && (<>
        <Divider title="Education" />
        {data.education.map((e, i) => <Bullet key={i} text={e} />)}
      </>)}

      {/* ── Skills ── */}
      {!!data.skills?.length && (<>
        <Divider title="Technical Skills" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 8px' }}>
          {data.skills.map((s, i) => (
            <span key={i} style={{ fontSize: 10.5, background: '#f0f0f0', border: '1px solid #ccc', borderRadius: 3, padding: '2px 9px', fontFamily: 'Arial,sans-serif', color: '#222' }}>{s}</span>
          ))}
        </div>
      </>)}

      {/* ── Projects ── */}
      {!!data.projects?.length && (<>
        <Divider title="Projects" />
        {data.projects.map((p, i) => <Bullet key={i} text={p} />)}
      </>)}

      {/* ── Certifications ── */}
      {!!data.certifications?.length && (<>
        <Divider title="Certifications" />
        {data.certifications.map((c, i) => <Bullet key={i} text={c} />)}
      </>)}

      {/* ── Languages / Hobbies ── */}
      {(!!data.languages?.length || !!data.hobbies?.length) && (<>
        <Divider title="Additional" />
        {!!data.languages?.length && <div style={{ fontSize: 11, marginBottom: 4 }}><strong>Languages:</strong> {data.languages.join(', ')}</div>}
        {!!data.hobbies?.length   && <div style={{ fontSize: 11 }}><strong>Interests:</strong> {data.hobbies.join(', ')}</div>}
      </>)}
    </div>
  )
}

export default ResumeClassic

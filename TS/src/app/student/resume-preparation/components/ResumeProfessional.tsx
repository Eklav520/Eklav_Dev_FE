import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'
const accentColor = '#0077b6'

const ResumeProfessional: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  const sectionStyle: React.CSSProperties = {
    marginBottom: '10px',
    padding: 0,
  }

  const headingStyle: React.CSSProperties = {
    color: accentColor,
    fontSize: '16px',
    margin: '0 0 4px 0',
    fontWeight: 600,
  }

  const listStyle: React.CSSProperties = {
    margin: 0,
    paddingLeft: '16px',
    listStyle: 'disc',
  }

  const itemStyle: React.CSSProperties = {
    marginBottom: '2px',
    color: textColor,
  }

  return (
    <div
      className="resume-paper"
      style={{
        fontFamily: 'Segoe UI, sans-serif',
        backgroundColor: '#ffffff',
        color: textColor,
        padding: '30px',
        maxWidth: '850px',
        margin: '0 auto',
        border: '1px solid #dddddd',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        fontSize: '14px',
        lineHeight: '1.5',
      }}
    >
      {/* ================= Header ================= */}
      <header
        style={{
          borderBottom: `1px solid ${accentColor}`,
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        {displayName && (
          <h1
            style={{
              color: accentColor,
              fontSize: '24px',
              margin: 0,
            }}
          >
            {displayName}
          </h1>
        )}

        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: textColor }}>
          {data.email && <>{data.email}</>}
          {data.email && data.phone && ' | '}
          {data.phone && <>{data.phone}</>}
          {(data.email || data.phone) && data.linkedin && ' | '}
          {data.linkedin && <>{data.linkedin}</>}
        </p>
      </header>

      {/* ================= Summary ================= */}
      {data.summary && (
        <section style={sectionStyle}>
          <h3 style={headingStyle}>Summary</h3>
          <p style={{ margin: 0, color: textColor }}>{data.summary}</p>
        </section>
      )}

      {/* ================= Skills ================= */}
      {!!data.skills?.length && (
        <section style={sectionStyle}>
          <h3 style={headingStyle}>Skills</h3>
          <ul style={listStyle}>
            {data.skills.map((skill, i) => (
              <li key={i} style={itemStyle}>
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ================= Education ================= */}
      {!!data.education?.length && (
        <section style={sectionStyle}>
          <h3 style={headingStyle}>Education</h3>
          <ul style={listStyle}>
            {data.education.map((edu, i) => (
              <li key={i} style={itemStyle}>
                {edu}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ================= Experience ================= */}
      {!!data.experience?.length && (
        <section style={sectionStyle}>
          <h3 style={headingStyle}>Experience</h3>
          <ul style={listStyle}>
            {data.experience.map((exp, i) => (
              <li key={i} style={itemStyle}>
                {exp}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ================= Projects ================= */}
      {!!data.projects?.length && (
        <section style={sectionStyle}>
          <h3 style={headingStyle}>Projects</h3>
          <ul style={listStyle}>
            {data.projects.map((proj, i) => (
              <li key={i} style={itemStyle}>
                {proj}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default ResumeProfessional

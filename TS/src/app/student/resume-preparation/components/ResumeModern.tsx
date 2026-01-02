import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'

const ResumeModern: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  return (
    <div
      className="resume-paper"
      style={{
        fontFamily: 'Arial, sans-serif',
        color: textColor,
        padding: '40px',
        backgroundColor: '#ffffff',
        lineHeight: '1.6',
        maxWidth: '900px',
        margin: '0 auto',
        border: '1px solid #dddddd',
        borderRadius: '8px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* ================= Header ================= */}
      <div
        style={{
          backgroundColor: '#007bff',
          color: '#ffffff',
          padding: '20px',
          borderRadius: '8px 8px 0 0',
        }}
      >
        {displayName && (
          <h1 style={{ marginBottom: '4px', fontWeight: 'bold' }}>
            {displayName}
          </h1>
        )}

        <p style={{ marginTop: '4px', fontSize: '14px' }}>
          {data.email && <>{data.email}</>}
          {data.email && data.phone && ' | '}
          {data.phone && <>{data.phone}</>}
          {(data.email || data.phone) && data.linkedin && ' | '}
          {data.linkedin && <>{data.linkedin}</>}
        </p>
      </div>

      {/* ================= Objective ================= */}
      {data.objective && (
        <>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px', color: textColor }}>
            Objective
          </h3>
          <p style={{ color: textColor }}>{data.objective}</p>
        </>
      )}

      {/* ================= Summary ================= */}
      {data.summary && (
        <>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px', color: textColor }}>
            AI Summary
          </h3>
          <p style={{ color: textColor }}>{data.summary}</p>
        </>
      )}

      {/* ================= Skills ================= */}
      {!!data.skills?.length && (
        <>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px', color: textColor }}>
            Skills
          </h3>
          <ul>
            {data.skills.map((skill, i) => (
              <li key={i} style={{ color: textColor }}>
                {skill}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ================= Education ================= */}
      {!!data.education?.length && (
        <>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px', color: textColor }}>
            Education
          </h3>
          <ul>
            {data.education.map((edu, i) => (
              <li key={i} style={{ color: textColor }}>
                {edu}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ================= Experience ================= */}
      {!!data.experience?.length && (
        <>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px', color: textColor }}>
            Experience
          </h3>
          <ul>
            {data.experience.map((exp, i) => (
              <li key={i} style={{ color: textColor }}>
                {exp}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ================= Projects ================= */}
      {!!data.projects?.length && (
        <>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px', color: textColor }}>
            Projects
          </h3>
          <ul>
            {data.projects.map((proj, i) => (
              <li key={i} style={{ color: textColor }}>
                {proj}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default ResumeModern

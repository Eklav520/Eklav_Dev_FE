import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'

const TemplateClassic: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  return (
    <div
      className="resume-paper"
      style={{
        fontFamily: 'Georgia, serif',
        lineHeight: '1.6',
        padding: '20px',
        backgroundColor: '#ffffff',
        color: textColor,
        maxWidth: '900px',
        margin: '0 auto',
        border: '1px solid #dddddd',
      }}
    >
      {/* ================= Header ================= */}
      {displayName && (
        <h3
          style={{
            textAlign: 'center',
            textTransform: 'uppercase',
            marginBottom: '5px',
            color: textColor,
          }}
        >
          {displayName}
        </h3>
      )}

      <p style={{ textAlign: 'center', color: textColor, fontSize: '14px' }}>
        {data.email && <>{data.email}</>}
        {data.email && data.phone && ' | '}
        {data.phone && <>{data.phone}</>}
        {(data.email || data.phone) && data.linkedin && ' | '}
        {data.linkedin && <>{data.linkedin}</>}
      </p>

      {/* ================= Summary ================= */}
      {data.summary && (
        <>
          <h5
            style={{
              backgroundColor: '#f1f1f1',
              padding: '6px 10px',
              marginTop: '20px',
              color: textColor,
            }}
          >
            Summary
          </h5>
          <p style={{ color: textColor }}>{data.summary}</p>
        </>
      )}

      {/* ================= Skills ================= */}
      {!!data.skills?.length && (
        <>
          <h5
            style={{
              backgroundColor: '#f1f1f1',
              padding: '6px 10px',
              marginTop: '20px',
              color: textColor,
            }}
          >
            Technical Skills
          </h5>
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
          <h5
            style={{
              backgroundColor: '#f1f1f1',
              padding: '6px 10px',
              marginTop: '20px',
              color: textColor,
            }}
          >
            Education
          </h5>
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
          <h5
            style={{
              backgroundColor: '#f1f1f1',
              padding: '6px 10px',
              marginTop: '20px',
              color: textColor,
            }}
          >
            Experience
          </h5>
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
          <h5
            style={{
              backgroundColor: '#f1f1f1',
              padding: '6px 10px',
              marginTop: '20px',
              color: textColor,
            }}
          >
            Projects
          </h5>
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

export default TemplateClassic

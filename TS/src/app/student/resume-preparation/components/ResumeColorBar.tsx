// ResumeColorBar.tsx
import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'
const accentColor = '#1976d2'

const ResumeColorBar: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  return (
    <div
      className="resume-paper"
      style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        maxWidth: '850px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: textColor,
        border: '1px solid #dddddd',
      }}
    >
      {/* ================= Header Bar ================= */}
      <div
        style={{
          backgroundColor: accentColor,
          color: '#ffffff',
          padding: '16px',
        }}
      >
        {displayName && (
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: 600,
            }}
          >
            {displayName}
          </h1>
        )}

        <p style={{ marginTop: '6px', fontSize: '14px' }}>
          {data.email && <>{data.email}</>}
          {data.email && data.phone && ' | '}
          {data.phone && <>{data.phone}</>}
          {(data.email || data.phone) && data.linkedin && ' | '}
          {data.linkedin && <>{data.linkedin}</>}
        </p>
      </div>

      {/* ================= Content ================= */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#ffffff',
          color: textColor,
        }}
      >
        {data.summary && (
          <>
            <h3 style={{ color: accentColor, marginBottom: '4px' }}>
              Summary
            </h3>
            <p style={{ marginTop: 0 }}>{data.summary}</p>
          </>
        )}

        {!!data.skills?.length && (
          <>
            <h3 style={{ color: accentColor }}>Skills</h3>
            <ul>
              {data.skills.map((skill, i) => (
                <li key={i} style={{ color: textColor }}>
                  {skill}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.experience?.length && (
          <>
            <h3 style={{ color: accentColor }}>Experience</h3>
            <ul>
              {data.experience.map((exp, i) => (
                <li key={i} style={{ color: textColor }}>
                  {exp}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.education?.length && (
          <>
            <h3 style={{ color: accentColor }}>Education</h3>
            <ul>
              {data.education.map((edu, i) => (
                <li key={i} style={{ color: textColor }}>
                  {edu}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default ResumeColorBar

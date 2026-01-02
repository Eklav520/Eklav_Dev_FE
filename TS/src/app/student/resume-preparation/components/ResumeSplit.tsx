// ResumeSplit.tsx
import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'
const accentColor = '#6c757d'

const ResumeSplit: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  return (
    <div
      className="resume-paper"
      style={{
        display: 'flex',
        fontFamily: 'Verdana, sans-serif',
        fontSize: '13px',
        backgroundColor: '#ffffff',
        color: textColor,
        maxWidth: '900px',
        margin: '0 auto',
        border: '1px solid #dddddd',
      }}
    >
      {/* ================= Left Sidebar ================= */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e5e5',
        }}
      >
        {/* Contact */}
        {(data.email || data.phone || data.city || data.country) && (
          <>
            <h3 style={{ color: accentColor }}>Contact</h3>
            <p style={{ lineHeight: '1.6', color: textColor }}>
              {data.email && <>{data.email}<br /></>}
              {data.phone && <>{data.phone}<br /></>}
              {(data.city || data.country) && (
                <>
                  {data.city}
                  {data.city && data.country ? ', ' : ''}
                  {data.country}
                </>
              )}
            </p>
          </>
        )}

        {/* Skills */}
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

        {/* Languages */}
        {!!data.languages?.length && (
          <>
            <h3 style={{ color: accentColor }}>Languages</h3>
            <ul>
              {data.languages.map((lang, i) => (
                <li key={i} style={{ color: textColor }}>
                  {lang}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* ================= Right Content ================= */}
      <div
        style={{
          flex: 2,
          padding: '20px',
          backgroundColor: '#ffffff',
          color: textColor,
        }}
      >
        {displayName && (
          <h2 style={{ marginTop: 0, color: textColor }}>
            {displayName}
          </h2>
        )}

        {data.summary && (
          <p style={{ lineHeight: '1.6' }}>{data.summary}</p>
        )}

        {/* Experience */}
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

        {/* Education */}
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

export default ResumeSplit

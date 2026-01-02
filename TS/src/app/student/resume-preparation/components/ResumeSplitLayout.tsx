import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'
const accentColor = '#a70000'

const ResumeSplitLayout: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  return (
    <div
      className="resume-paper"
      style={{
        display: 'flex',
        fontFamily: 'Segoe UI, sans-serif',
        color: textColor,
        backgroundColor: '#ffffff',
        border: '1px solid #dddddd',
        boxShadow: '0 0 6px rgba(0,0,0,0.1)',
        maxWidth: '900px',
        margin: '0 auto',
        padding: 0,
      }}
    >
      {/* ================= Left Sidebar ================= */}
      <div
        style={{
          width: '32%',
          backgroundColor: '#ffffff',
          padding: '30px',
          borderRight: '1px solid #e5e5e5',
        }}
      >
        {/* Contact */}
        <div style={{ marginBottom: '24px', fontSize: '14px', color: textColor }}>
          {data.email && (
            <>
              <strong>Email:</strong> {data.email}
              <br />
            </>
          )}
          {data.phone && (
            <>
              <strong>Phone:</strong> {data.phone}
              <br />
            </>
          )}
          {(data.city || data.country) && (
            <small>
              {data.city}
              {data.city && data.country ? ', ' : ''}
              {data.country}
              {data.pinCode ? ` - ${data.pinCode}` : ''}
            </small>
          )}
        </div>

        {/* Skills */}
        {!!data.skills?.length && (
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                borderBottom: `2px solid ${accentColor}`,
                paddingBottom: '4px',
                color: accentColor,
              }}
            >
              Skills
            </h4>
            <ul style={{ paddingLeft: '16px' }}>
              {data.skills.map((skill, i) => (
                <li key={i} style={{ color: textColor }}>
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Education */}
        {!!data.education?.length && (
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                borderBottom: `2px solid ${accentColor}`,
                paddingBottom: '4px',
                color: accentColor,
              }}
            >
              Education
            </h4>
            <ul style={{ paddingLeft: '16px' }}>
              {data.education.map((edu, i) => (
                <li key={i} style={{ color: textColor }}>
                  {edu}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages */}
        {!!data.languages?.length && (
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                borderBottom: `2px solid ${accentColor}`,
                paddingBottom: '4px',
                color: accentColor,
              }}
            >
              Languages
            </h4>
            <ul style={{ paddingLeft: '16px' }}>
              {data.languages.map((lang, i) => (
                <li key={i} style={{ color: textColor }}>
                  {lang}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Certifications */}
        {!!data.certifications?.length && (
          <div>
            <h4
              style={{
                borderBottom: `2px solid ${accentColor}`,
                paddingBottom: '4px',
                color: accentColor,
              }}
            >
              Certifications
            </h4>
            <ul style={{ paddingLeft: '16px' }}>
              {data.certifications.map((cert, i) => (
                <li key={i} style={{ color: textColor }}>
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ================= Right Content ================= */}
      <div
        style={{
          width: '68%',
          padding: '30px 40px',
          backgroundColor: '#ffffff',
          color: textColor,
        }}
      >
        {displayName && (
          <h1 style={{ marginBottom: '5px', fontSize: '28px', color: textColor }}>
            {displayName}
          </h1>
        )}

        <hr
          style={{
            border: `1px solid ${accentColor}`,
            width: '60px',
            margin: '10px 0 20px 0',
          }}
        />

        {/* Summary */}
        {data.summary && (
          <>
            <h3 style={{ color: accentColor, fontSize: '18px' }}>Summary</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.6', color: textColor }}>
              {data.summary}
            </p>
          </>
        )}

        {/* Experience */}
        {!!data.experience?.length && (
          <>
            <h3
              style={{
                color: accentColor,
                fontSize: '18px',
                marginTop: '24px',
              }}
            >
              Experience
            </h3>
            <ul style={{ paddingLeft: '16px' }}>
              {data.experience.map((exp, i) => (
                <li key={i} style={{ marginBottom: '12px', color: textColor }}>
                  {exp}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Projects */}
        {!!data.projects?.length && (
          <>
            <h3
              style={{
                color: accentColor,
                fontSize: '18px',
                marginTop: '24px',
              }}
            >
              Projects
            </h3>
            <ul style={{ paddingLeft: '16px' }}>
              {data.projects.map((proj, i) => (
                <li key={i} style={{ color: textColor }}>
                  {proj}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default ResumeSplitLayout

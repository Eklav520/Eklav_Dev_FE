import React from 'react'
import { ResumeData } from './ResumeData'

const textColor = '#212529'

const ResumeElegant: React.FC<{ data: ResumeData }> = ({ data }) => {
  const displayName = [data.fullName, data.surname].filter(Boolean).join(' ')

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'A'

  return (
    <div
      className="resume-paper"
      style={{
        display: 'flex',
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        color: textColor,
        border: '1px solid #dddddd',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ================= Sidebar ================= */}
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '30px',
          width: '260px',
          textAlign: 'center',
          borderRight: '1px solid #e5e5e5',
          color: textColor,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            backgroundColor: '#007bff',
            color: '#ffffff',
            borderRadius: '50%',
            width: '100px',
            height: '100px',
            lineHeight: '100px',
            fontSize: '36px',
            margin: '0 auto 20px',
            fontWeight: 'bold',
          }}
        >
          {initials}
        </div>

        {displayName && (
          <h4 style={{ marginBottom: '6px', fontWeight: 600, color: textColor }}>
            {displayName}
          </h4>
        )}

        {data.role && (
          <small style={{ color: '#6c757d' }}>{data.role}</small>
        )}

        <hr style={{ margin: '20px 0' }} />

        <p style={{ fontSize: '14px', lineHeight: '1.6', color: textColor }}>
          {data.email && <>{data.email}<br /></>}
          {data.phone && <>{data.phone}<br /></>}
          {(data.city || data.country) && (
            <>
              {data.city}
              {data.city && data.country ? ', ' : ''}
              {data.country}
              {data.pinCode ? ` - ${data.pinCode}` : ''}
              <br />
            </>
          )}
          {data.linkedin && <>{data.linkedin}</>}
        </p>
      </div>

      {/* ================= Main Content ================= */}
      <div
        style={{
          padding: '30px',
          flexGrow: 1,
          backgroundColor: '#ffffff',
          color: textColor,
        }}
      >
        {data.objective && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Objective
            </h2>
            <p style={{ color: textColor }}>{data.objective}</p>
          </>
        )}

        {data.summary && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Summary
            </h2>
            <p style={{ color: textColor }}>{data.summary}</p>
          </>
        )}

        {!!data.skills?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Skills
            </h2>
            <ul style={{ columns: 2, paddingLeft: '20px', color: textColor }}>
              {data.skills.map((skill, i) => (
                <li key={i} style={{ color: textColor }}>
                  {skill}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.education?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Education
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              {data.education.map((edu, i) => (
                <li key={i} style={{ color: textColor }}>
                  {edu}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.experience?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Experience
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              {data.experience.map((exp, i) => (
                <li key={i} style={{ color: textColor }}>
                  {exp}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.projects?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Projects
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              {data.projects.map((proj, i) => (
                <li key={i} style={{ color: textColor }}>
                  {proj}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.certifications?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Certifications
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              {data.certifications.map((cert, i) => (
                <li key={i} style={{ color: textColor }}>
                  {cert}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.languages?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Languages
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              {data.languages.map((lang, i) => (
                <li key={i} style={{ color: textColor }}>
                  {lang}
                </li>
              ))}
            </ul>
          </>
        )}

        {!!data.hobbies?.length && (
          <>
            <h2 style={{ borderBottom: '2px solid #007bff', color: textColor }}>
              Hobbies
            </h2>
            <ul style={{ paddingLeft: '20px' }}>
              {data.hobbies.map((hobby, i) => (
                <li key={i} style={{ color: textColor }}>
                  {hobby}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default ResumeElegant

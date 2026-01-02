import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeElegant: React.FC<{ data: ResumeData }> = ({ data }) => {
  const initials = data.fullName
    ? data.fullName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'A';

  return (
    <div style={{ display: 'flex', fontFamily: 'Segoe UI, sans-serif', maxWidth: '900px', margin: '0 auto', background: '#fff', color: '#333', border: '1px solid #ddd' }}>
      {/* Sidebar */}
      <div style={{ backgroundColor: '#f4f4f4', padding: '30px', width: '250px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#007bff', color: '#fff', borderRadius: '50%', width: '100px', height: '100px', lineHeight: '100px', fontSize: '36px', margin: '0 auto 20px', fontWeight: 'bold' }}>
          {initials}
        </div>
        <h4 style={{ marginBottom: '5px' }}>{data.fullName}</h4>
        <small>{data.role}</small>
        <hr />
        <p style={{ fontSize: '14px' }}>{data.email}<br />{data.phone}<br />{data.linkedin}</p>
      </div>

      {/* Main content */}
      <div style={{ padding: '30px', flexGrow: 1 }}>
        <h2 style={{ borderBottom: '2px solid #007bff' }}>Objective</h2>
        <p>{data.objective}</p>

        <h2 style={{ borderBottom: '2px solid #007bff' }}>Summary</h2>
        <p>{data.summary}</p>

        <h2 style={{ borderBottom: '2px solid #007bff' }}>Skills</h2>
        <ul style={{ columns: 2, paddingLeft: '20px' }}>
          {data.skills.map((skill, i) => <li key={i}>{skill}</li>)}
        </ul>

        <h2 style={{ borderBottom: '2px solid #007bff' }}>Education</h2>
        <ul style={{ paddingLeft: '20px' }}>
          {data.education.map((edu, i) => <li key={i}>{edu}</li>)}
        </ul>

        <h2 style={{ borderBottom: '2px solid #007bff' }}>Experience</h2>
        <ul style={{ paddingLeft: '20px' }}>
          {data.experience.map((exp, i) => <li key={i}>{exp}</li>)}
        </ul>

        <h2 style={{ borderBottom: '2px solid #007bff' }}>Projects</h2>
        <ul style={{ paddingLeft: '20px' }}>
          {data.projects.map((proj, i) => <li key={i}>{proj}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default ResumeElegant;

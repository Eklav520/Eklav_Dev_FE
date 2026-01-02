// ResumeCompact.tsx
import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeCompact: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div style={{ fontFamily: 'Arial', fontSize: 14, padding: 20, lineHeight: 1.4, maxWidth: 800 }}>
    <h2 style={{ marginBottom: 4 }}>{data.fullName} {data.surname}</h2>
    <p style={{ marginBottom: 12 }}>
      {data.city}, {data.country} - {data.pinCode}<br />
      {data.email} | {data.phone}
    </p>

    {data.summary && (
      <>
        <h4>Summary</h4>
        <p>{data.summary}</p>
      </>
    )}

    {data.experience.length > 0 && (
      <>
        <h4>Experience</h4>
        <ul>{data.experience.map((item, i) => <li key={i}>{item}</li>)}</ul>
      </>
    )}

    {data.skills.length > 0 && (
      <>
        <h4>Skills</h4>
        <p>{data.skills.join(', ')}</p>
      </>
    )}

    {data.education.length > 0 && (
      <>
        <h4>Education</h4>
        <ul>{data.education.map((edu, i) => <li key={i}>{edu}</li>)}</ul>
      </>
    )}
  </div>
);

export default ResumeCompact;

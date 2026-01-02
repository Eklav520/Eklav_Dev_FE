// ResumeDark.tsx
import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeDark: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div style={{ background: '#1a1a1a', color: '#e0e0e0', padding: '30px', fontFamily: 'Roboto', maxWidth: 800 }}>
    <h1 style={{ borderBottom: '1px solid #444', paddingBottom: 8 }}>{data.fullName}</h1>
    <p>{data.email} | {data.phone} | {data.city}, {data.country}</p>

    {data.summary && (
      <>
        <h3>Summary</h3>
        <p>{data.summary}</p>
      </>
    )}

    {data.experience.length > 0 && (
      <>
        <h3>Experience</h3>
        <ul>{data.experience.map((e, i) => <li key={i}>{e}</li>)}</ul>
      </>
    )}

    {data.education.length > 0 && (
      <>
        <h3>Education</h3>
        <ul>{data.education.map((e, i) => <li key={i}>{e}</li>)}</ul>
      </>
    )}
  </div>
);

export default ResumeDark;

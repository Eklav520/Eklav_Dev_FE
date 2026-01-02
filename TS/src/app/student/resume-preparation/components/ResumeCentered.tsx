// ResumeCentered.tsx
import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeCentered: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div style={{ fontFamily: 'Georgia, serif', maxWidth: 750, margin: 'auto', padding: 24 }}>
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <h1 style={{ marginBottom: 0 }}>{data.fullName} {data.surname}</h1>
      <small>{data.email} | {data.phone} | {data.city}, {data.country}</small>
    </div>

    <hr />

    <section>
      <h3>Summary</h3>
      <p>{data.summary}</p>
    </section>

    <section>
      <h3>Skills</h3>
      <ul>{data.skills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>
    </section>

    <section>
      <h3>Experience</h3>
      <ul>{data.experience.map((exp, i) => <li key={i}>{exp}</li>)}</ul>
    </section>

    <section>
      <h3>Education</h3>
      <ul>{data.education.map((edu, i) => <li key={i}>{edu}</li>)}</ul>
    </section>
  </div>
);

export default ResumeCentered;

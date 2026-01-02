import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeProfessional: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div
    style={{
      fontFamily: 'Segoe UI, sans-serif',
      backgroundColor: '#ffffff',
      color: '#000000',
      padding: '40px',
      maxWidth: '850px',
      margin: '0 auto',
      border: '1px solid #ddd',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}
  >
    <header style={{ borderBottom: '2px solid #0077b6', paddingBottom: '10px', marginBottom: '20px' }}>
      <h1 style={{ color: '#0077b6', margin: '0' }}>{data.fullName}</h1>
      <p style={{ margin: '4px 0' }}>{data.email} | {data.phone} | {data.linkedin}</p>
    </header>

    <section>
      <h3 style={{ color: '#0077b6' }}>Objective</h3>
      <p>{data.objective}</p>
    </section>

    <section>
      <h3 style={{ color: '#0077b6' }}>AI Summary</h3>
      <p>{data.summary}</p>
    </section>

    <section>
      <h3 style={{ color: '#0077b6' }}>Skills</h3>
      <ul>{data.skills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>
    </section>

    <section>
      <h3 style={{ color: '#0077b6' }}>Education</h3>
      <ul>{data.education.map((edu, i) => <li key={i}>{edu}</li>)}</ul>
    </section>

    <section>
      <h3 style={{ color: '#0077b6' }}>Experience</h3>
      <ul>{data.experience.map((exp, i) => <li key={i}>{exp}</li>)}</ul>
    </section>

    <section>
      <h3 style={{ color: '#0077b6' }}>Projects</h3>
      <ul>{data.projects.map((proj, i) => <li key={i}>{proj}</li>)}</ul>
    </section>
  </div>
);

export default ResumeProfessional;

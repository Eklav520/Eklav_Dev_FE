import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeModern: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div
    style={{
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      padding: '40px',
      backgroundColor: '#ffffff',
      lineHeight: '1.6',
      maxWidth: '900px',
      margin: '0 auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
    }}
  >
    <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '8px 8px 0 0' }}>
      <h1 style={{ marginBottom: '0', fontWeight: 'bold' }}>{data.fullName}</h1>
      <p style={{ marginTop: '4px' }}>{data.email} | {data.phone} | {data.linkedin}</p>
    </div>

    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>Objective</h3>
    <p>{data.objective}</p>

    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>AI Summary</h3>
    <p>{data.summary}</p>

    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>Skills</h3>
    <ul>{data.skills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>

    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>Education</h3>
    <ul>{data.education.map((edu, i) => <li key={i}>{edu}</li>)}</ul>

    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>Experience</h3>
    <ul>{data.experience.map((exp, i) => <li key={i}>{exp}</li>)}</ul>

    <h3 style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '20px' }}>Projects</h3>
    <ul>{data.projects.map((proj, i) => <li key={i}>{proj}</li>)}</ul>
  </div>
);

export default ResumeModern;

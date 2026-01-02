import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeMinimalist: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div
    style={{
      fontFamily: 'Georgia, serif',
      color: '#000',
      padding: '40px',
      backgroundColor: '#ffffff',
      lineHeight: '1.6',
      maxWidth: '800px',
      margin: '0 auto'
    }}
  >
    <h1 style={{ textTransform: 'uppercase', marginBottom: '0', fontWeight: 'bold' }}>{data.fullName}</h1>
    <p style={{ marginTop: '4px' }}>{data.email} | {data.phone} | {data.linkedin}</p>

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

export default ResumeMinimalist;

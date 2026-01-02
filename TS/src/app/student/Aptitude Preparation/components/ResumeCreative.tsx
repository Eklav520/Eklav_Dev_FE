import React from 'react';
import { ResumeData } from './ResumeData';

const ResumeCreative: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div
    style={{
      fontFamily: 'Poppins, sans-serif',
      background: '#fefefe',
      padding: '40px',
      maxWidth: '850px',
      margin: '0 auto',
      color: '#222'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid #f39c12', paddingBottom: '10px' }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, color: '#f39c12' }}>{data.fullName}</h1>
        <p>{data.email} | {data.phone} | {data.linkedin}</p>
      </div>
    </div>

    <section style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#f39c12' }}>Objective</h3>
      <p>{data.objective}</p>
    </section>

    <section style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#f39c12' }}>AI Summary</h3>
      <p>{data.summary}</p>
    </section>

    <section style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#f39c12' }}>Skills</h3>
      <ul style={{ columns: 2, paddingLeft: '20px' }}>{data.skills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>
    </section>

    <section style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#f39c12' }}>Education</h3>
      <ul style={{ paddingLeft: '20px' }}>{data.education.map((edu, i) => <li key={i}>{edu}</li>)}</ul>
    </section>

    <section style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#f39c12' }}>Experience</h3>
      <ul style={{ paddingLeft: '20px' }}>{data.experience.map((exp, i) => <li key={i}>{exp}</li>)}</ul>
    </section>

    <section style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#f39c12' }}>Projects</h3>
      <ul style={{ paddingLeft: '20px' }}>{data.projects.map((proj, i) => <li key={i}>{proj}</li>)}</ul>
    </section>
  </div>
);

export default ResumeCreative;

import React from 'react';
import { ResumeData } from './ResumeData';

const TemplateClassic: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div style={{ fontFamily: 'Georgia', lineHeight: '1.6', padding: '20px' }}>
    <h3 style={{ textAlign: 'center', textTransform: 'uppercase' }}>{data.fullName}</h3>
    <p style={{ textAlign: 'center' }}>{data.email} | {data.phone} | {data.linkedin}</p>

    <h5 style={{ backgroundColor: '#ccc', padding: '5px 10px', marginTop: '20px' }}>Objective</h5>
    <p>{data.objective}</p>

    <h5 style={{ backgroundColor: '#ccc', padding: '5px 10px', marginTop: '20px' }}>Technical Skills</h5>
    <ul>{data.skills.map((skill, i) => <li key={i}>{skill}</li>)}</ul>

    <h5 style={{ backgroundColor: '#ccc', padding: '5px 10px', marginTop: '20px' }}>Education</h5>
    <ul>{data.education.map((edu, i) => <li key={i}>{edu}</li>)}</ul>

    <h5 style={{ backgroundColor: '#ccc', padding: '5px 10px', marginTop: '20px' }}>Experience</h5>
    <ul>{data.experience.map((exp, i) => <li key={i}>{exp}</li>)}</ul>

    <h5 style={{ backgroundColor: '#ccc', padding: '5px 10px', marginTop: '20px' }}>Projects</h5>
    <ul>{data.projects.map((proj, i) => <li key={i}>{proj}</li>)}</ul>

    <h5 style={{ backgroundColor: '#ccc', padding: '5px 10px', marginTop: '20px' }}>Summary</h5>
    <p>{data.summary}</p>
  </div>
);

export default TemplateClassic;

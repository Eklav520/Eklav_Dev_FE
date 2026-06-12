// Step5Summary.tsx
import React, { useState } from 'react';
import { StepProps } from '../ResumeBuilder';
import axios from 'axios';

const Step5Summary: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const [loading, setLoading] = useState(false);

  const cleanSkills = (data.skills || []).filter(Boolean);
  const cleanExperience = (data.experience || []).filter(Boolean);
  const hasEnoughData = cleanSkills.length > 0 || cleanExperience.length > 0;

  const generateSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL || ''}/generate`, data);
      const raw: string = res.data.summary ?? '';
      const clean = raw
        .split('\n')
        .filter(line => !/^\s*[#]+/.test(line))
        .filter(line => !/^\s*---+\s*$/.test(line))
        .filter(line => !/^\s*\*\*[^*]+\*\*\s*$/.test(line))
        .join(' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      setData({ ...data, summary: clean });
    } catch (err) {
      alert('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Professional Summary</h3>

      {/* Show what will be used to generate */}
      <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>AI will generate your summary based on:</p>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#495057' }}>Skills: </span>
          {cleanSkills.length > 0
            ? cleanSkills.map((s, i) => (
                <span key={i} style={{ display: 'inline-block', background: '#0d6efd22', color: '#0d6efd', border: '1px solid #0d6efd44', borderRadius: 20, padding: '2px 10px', fontSize: 12, marginRight: 5, marginBottom: 4 }}>{s}</span>
              ))
            : <span style={{ color: '#dc3545', fontSize: 13 }}>None added — go back to Step 4 to add skills</span>
          }
        </div>

        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#495057' }}>Experience: </span>
          {cleanExperience.length > 0
            ? cleanExperience.map((e, i) => (
                <span key={i} style={{ display: 'inline-block', background: '#19875422', color: '#198754', border: '1px solid #19875444', borderRadius: 20, padding: '2px 10px', fontSize: 12, marginRight: 5, marginBottom: 4 }}>{e}</span>
              ))
            : <span style={{ color: '#6c757d', fontSize: 13 }}>None added</span>
          }
        </div>

        {data.role && (
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#495057' }}>Target Role: </span>
            <span style={{ fontSize: 13, color: '#333' }}>{data.role}</span>
          </div>
        )}

        {!hasEnoughData && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, fontSize: 13, color: '#856404' }}>
            ⚠️ Add at least one skill or experience entry to generate a personalized summary.
          </div>
        )}
      </div>

      <textarea
        className="form-control my-3"
        rows={6}
        placeholder="Your professional summary will appear here, or write your own"
        value={data.summary}
        onChange={(e) => setData({ ...data, summary: e.target.value })}
      />

      <button className="btn btn-outline-primary mb-3" onClick={generateSummary} disabled={loading}>
        {loading ? (
          <><span className="spinner-border spinner-border-sm me-2" />Generating personalized summary...</>
        ) : (
          '✨ Generate Professional Summary'
        )}
      </button>

      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={goNext}>Next</button>
      </div>
    </div>
  );
};

export default Step5Summary;

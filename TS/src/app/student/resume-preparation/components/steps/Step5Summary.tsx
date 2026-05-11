// Step5Summary.tsx
import React, { useState } from 'react';
import { StepProps } from '../ResumeBuilder';
import axios from 'axios';

const Step5Summary: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.post('http://localhost:3000/generate', data);
      const raw: string = res.data.summary ?? '';
      const clean = raw
        .split('\n')
        .filter(line => !/^\s*[#]+/.test(line))          // drop markdown headings
        .filter(line => !/^\s*---+\s*$/.test(line))       // drop horizontal rules
        .filter(line => !/^\s*\*\*[^*]+\*\*\s*$/.test(line)) // drop standalone **Label** lines
        .join(' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')                  // strip bold markers, keep text
        .replace(/\*(.+?)\*/g, '$1')                       // strip italic markers, keep text
        .replace(/\[.*?\]\(.*?\)/g, '')                    // strip markdown links
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
      <textarea
        className="form-control my-3"
        rows={6}
        placeholder="Write or generate a summary"
        value={data.summary}
        onChange={(e) => setData({ ...data, summary: e.target.value })}
      />
      <button className="btn btn-outline-primary mb-3" onClick={generateSummary} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Summary using AI'}
      </button>
      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={goNext}>Next</button>
      </div>
    </div>
  );
};

export default Step5Summary;

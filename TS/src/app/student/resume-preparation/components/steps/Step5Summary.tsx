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
      setData({ ...data, summary: res.data.summary });
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

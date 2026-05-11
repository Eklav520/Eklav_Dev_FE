import React from 'react';
import { ResumeData } from '../ResumeData';

interface StepProps {
  data: ResumeData;
  setData: (data: ResumeData) => void;
  goNext: () => void;
  goBack: () => void;
}

const Step3Achievements: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const achievements = data.achievements ?? [];

  const handleChange = (index: number, value: string) => {
    const updated = [...achievements];
    updated[index] = value;
    setData({ ...data, achievements: updated });
  };

  const add = () => setData({ ...data, achievements: [...achievements, ''] });

  const remove = (index: number) =>
    setData({ ...data, achievements: achievements.filter((_, i) => i !== index) });

  return (
    <div className="container mt-4">
      <h3>Key Achievements</h3>
      <p className="text-muted" style={{ fontSize: 13 }}>
        Highlight your top accomplishments — awards, metrics, milestones, or impact statements.
      </p>
      {achievements.map((ach, i) => (
        <div className="input-group my-2" key={i}>
          <input
            className="form-control"
            placeholder={`e.g. Increased sales by 30% in Q2 2023`}
            value={ach}
            onChange={(e) => handleChange(i, e.target.value)}
          />
          <button className="btn btn-danger" onClick={() => remove(i)}>Remove</button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={add}>+ Add Achievement</button>
      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={goNext}>Next</button>
      </div>
    </div>
  );
};

export default Step3Achievements;

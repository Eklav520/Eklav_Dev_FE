// Step2Experience.tsx
import React from 'react';
import { ResumeData } from '../ResumeData';

interface StepProps {
  data: ResumeData;
  setData: (data: ResumeData) => void;
  goNext: () => void;
  goBack: () => void;
}

const Step2Experience: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const handleChange = (index: number, value: string) => {
    const updated = [...data.experience];
    updated[index] = value;
    setData({ ...data, experience: updated });
  };

  const addExperience = () => {
    setData({ ...data, experience: [...data.experience, ''] });
  };

  const removeExperience = (index: number) => {
    const updated = data.experience.filter((_, i) => i !== index);
    setData({ ...data, experience: updated });
  };

  return (
    <div className="container mt-4">
      <h3>Experience</h3>
      {data.experience.map((exp, i) => (
        <div className="input-group my-2" key={i}>
          <input className="form-control" value={exp} onChange={(e) => handleChange(i, e.target.value)} />
          <button className="btn btn-danger" onClick={() => removeExperience(i)}>Remove</button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={addExperience}>+ Add Experience</button>
      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={goNext}>Next</button>
      </div>
    </div>
  );
};

export default Step2Experience;

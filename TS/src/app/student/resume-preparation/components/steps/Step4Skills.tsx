// Step4Skills.tsx
import React from 'react';
import { StepProps } from '../ResumeBuilder';

const Step4Skills: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const handleChange = (index: number, value: string) => {
    const updated = [...data.skills];
    updated[index] = value;
    setData({ ...data, skills: updated });
  };

  const addSkill = () => {
    setData({ ...data, skills: [...data.skills, ''] });
  };

  const removeSkill = (index: number) => {
    const updated = data.skills.filter((_, i) => i !== index);
    setData({ ...data, skills: updated });
  };

  return (
    <div className="container mt-4">
      <h3>Skills</h3>
      {data.skills.map((skill, i) => (
        <div className="input-group my-2" key={i}>
          <input
            className="form-control"
            placeholder="Enter skill"
            value={skill}
            onChange={(e) => handleChange(i, e.target.value)}
          />
          <button className="btn btn-danger" onClick={() => removeSkill(i)}>Remove</button>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={addSkill}>+ Add Skill</button>
      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={goNext}>Next</button>
      </div>
    </div>
  );
};

export default Step4Skills;

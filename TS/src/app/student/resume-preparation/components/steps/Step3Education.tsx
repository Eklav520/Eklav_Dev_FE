// Step3Education.tsx
import React from 'react';
import { StepProps } from '../ResumeBuilder';

const Step3Education: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const handleChange = (index: number, value: string) => {
    const updated = [...data.education];
    updated[index] = value;
    setData({ ...data, education: updated });
  };

  const addField = () => {
    setData({ ...data, education: [...data.education, ''] });
  };

  const removeField = (index: number) => {
    const updated = data.education.filter((_, i) => i !== index);
    setData({ ...data, education: updated });
  };

  return (
    <div className="container mt-4">
      <h3>Education</h3>
      {data.education.map((item, i) => (
        <div key={i} className="input-group my-2">
          <input
            className="form-control"
            value={item}
            onChange={(e) => handleChange(i, e.target.value)}
            placeholder="Education detail (e.g. B.Tech in CSE - XYZ University - 2023)"
          />
          <button className="btn btn-danger" onClick={() => removeField(i)}>Remove</button>
        </div>
      ))}
      <button className="btn btn-secondary my-2" onClick={addField}>+ Add Education</button>
      <div>
        <button className="btn btn-secondary me-2" onClick={goBack}>Back</button>
        <button className="btn btn-primary" onClick={goNext}>Next</button>
      </div>
      
    </div>
  );
};

export default Step3Education;

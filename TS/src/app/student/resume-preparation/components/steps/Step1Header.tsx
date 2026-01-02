import React from 'react';
import { StepProps } from '../ResumeBuilder'; // or a shared file like 'types/StepProps'

const Step1Header: React.FC<StepProps> = ({ data, setData, goNext }) => {
  const handleChange = (field: keyof typeof data, value: string) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div>
      <h4>Header Details</h4>
      <input
        className="form-control my-2"
        placeholder="Full Name"
        value={data.fullName}
        onChange={(e) => handleChange('fullName', e.target.value)}
      />
      <input
        className="form-control my-2"
        placeholder="Surname"
        value={data.surname}
        onChange={(e) => handleChange('surname', e.target.value)}
      />
      <input
        className="form-control my-2"
        placeholder="City"
        value={data.city}
        onChange={(e) => handleChange('city', e.target.value)}
      />
      <input
        className="form-control my-2"
        placeholder="Country"
        value={data.country}
        onChange={(e) => handleChange('country', e.target.value)}
      />
      <input
        className="form-control my-2"
        placeholder="Pin Code"
        value={data.pinCode}
        onChange={(e) => handleChange('pinCode', e.target.value)}
      />
      <input
        className="form-control my-2"
        placeholder="Email"
        value={data.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      <input
        className="form-control my-2"
        placeholder="Phone"
        value={data.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
      />

      <button className="btn btn-primary mt-3" onClick={goNext}>
        Next
      </button>
    </div>
  );
};

export default Step1Header;

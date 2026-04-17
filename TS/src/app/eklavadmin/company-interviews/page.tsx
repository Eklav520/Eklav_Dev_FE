import { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import Step1 from './components/Step1'
import Step2 from './components/Step2'
import { useAuthContext } from '@/context/useAuthContext'

const CompanyInterview = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    companyName: "",
    role: "",
    package: "",
    location: "",
    description: "",
    rounds: []
  });

  // ✅ Next Step Validation
  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName) {
        alert("Please enter company name");
        return;
      }

      if (!formData.rounds.length) {
        alert("Please select at least one round");
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  // ✅ Previous Step
  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  // ✅ Final Submit
  const handleSubmit = async () => {
  try {
    if (!user?.token) {
      alert('Unauthorized: Please login again')
      return
    }

    // ✅ Validation: all rounds must have questions
    const isValid = formData.rounds.every(
      (r: any) => r.questions && r.questions.length > 0
    );

    if (!isValid) {
      alert("Please upload questions for all rounds");
      return;
    }

    // ✅ Prepare payload
    const payload = {
      ...formData,
      rounds: formData.rounds.map((r: any) => ({
        ...r,
        duration: Number(r.duration) || 0,
        questionCount: Number(r.questionCount) || 0,
        questions: r.questions || [],
      })),
    };

    console.log("Submitting 👉", payload);

    // ✅ API Call
    const res = await fetch(
      `${baseURL}/api/company-interview/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("✅ Company Interview Created");

      // 🔄 Reset form
      setFormData({
        companyName: "",
        role: "",
        package: "",
        location: "",
        description: "",
        rounds: [],
      });

      setStep(1); // back to step1
    } else {
      alert(data.error || "Failed to create");
    }

  } catch (error) {
    console.error(error);
    alert("Server Error");
  }
};

  return (
    <>
      <PageMetaData title="Company Interview" />

      <Card className="bg-transparent border rounded-4 p-3">

        {/* 🔹 Step Indicator */}
        <div className="mb-3">
          <h5>
            Step {step} of 2
          </h5>
        </div>

        {/* 🔹 Step Content */}
        {step === 1 && (
          <Step1 formData={formData} setFormData={setFormData} />
        )}

        {step === 2 && (
          <Step2 formData={formData} setFormData={setFormData} />
        )}

        {/* 🔹 Navigation Buttons */}
        <div className="d-flex justify-content-between mt-4">

          {step > 1 && (
            <Button variant="secondary" onClick={handlePrev}>
              Previous
            </Button>
          )}

          {step < 2 && (
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          )}

          {step === 2 && (
            <Button variant="success" onClick={handleSubmit}>
              Submit
            </Button>
          )}

        </div>

      </Card>
    </>
  )
}

export default CompanyInterview
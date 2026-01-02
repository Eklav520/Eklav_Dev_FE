// ResumeBuilder.tsx
import React, { useState } from 'react';
import TemplateGallery from './TemplateGallery';
import ResumeForm from './ResumeForm';
import { templateList, TemplateKey } from './templateList';
import { ResumeData } from './ResumeData';
import html2pdf from 'html2pdf.js';


const ResumeBuilder: React.FC = () => {
  const [step, setStep] = useState(0);
const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | null>(null);
  const [formData, setFormData] = useState<ResumeData>({
    fullName: '', email: '', phone: '', linkedin: '', objective: '', role: '',
    skills: [], education: [], experience: [], projects: [], summary: ''
  });

  const SelectedTemplateComponent = selectedTemplate ? templateList[selectedTemplate].component : null;


  const handleDownload = () => {
    const element = document.getElementById('resume-preview');
    if (element) {
      html2pdf().from(element).set({ margin: 0.5, filename: `${formData.fullName}_Resume.pdf`, html2canvas: { scale: 2 } }).save();
    }
  };

  return (
    <div className="container py-4">
      {step === 0 && (
        <TemplateGallery onSelectTemplate={(id) => { setSelectedTemplate(id); setStep(1); }} />
      )}

      {step === 1 && selectedTemplate && (
        <div className="row">
          <div className="col-md-6">
            <ResumeForm data={formData} setData={setFormData} />
            <button className="btn btn-success mt-3" onClick={handleDownload}>Download as PDF</button>
          </div>
          <div className="col-md-6">
            <div id="resume-preview" className="border p-3 bg-white">
              {SelectedTemplateComponent && <SelectedTemplateComponent data={formData} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;

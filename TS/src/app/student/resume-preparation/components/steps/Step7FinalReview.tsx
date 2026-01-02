import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { ResumeData } from '../ResumeData';

interface Step7FinalReviewProps {
  data: ResumeData;
  goBack: () => void;
  SelectedTemplateComponent?: React.FC<{ data: ResumeData }>;
}

const Step7FinalReview: React.FC<Step7FinalReviewProps> = ({
  data,
  goBack,
  SelectedTemplateComponent,
}) => {
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (resumeRef.current) {
      html2pdf()
        .from(resumeRef.current)
        .set({
          margin: 0.5,
          filename: `${data.fullName}_${data.surname}_Resume.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        })
        .save();
    }
  };

  return (
    <div className="container mt-4">
      <h3>Final Review</h3>

      <div ref={resumeRef} className="p-3 bg-white border rounded shadow-sm">
        {SelectedTemplateComponent ? (
          <SelectedTemplateComponent data={data} />
        ) : (
          <p className="text-muted">No template selected.</p>
        )}
      </div>

      <div className="mt-3 d-flex justify-content-between">
        <button className="btn btn-outline-secondary" onClick={goBack}>
          Back
        </button>
        <button className="btn btn-success" onClick={handleDownload}>
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default Step7FinalReview;

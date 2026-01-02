import React from 'react';
import { templateList, TemplateKey } from './templateList';

type TemplateGalleryProps = {
  onSelectTemplate: (id: TemplateKey) => void;
};

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  return (
    <div className="container text-center mt-5">
      <h2>Choose a Resume Template</h2>
      <div className="row mt-4">
        {Object.entries(templateList).map(([key, { label }]) => (
          <div className="col-md-4 mb-4" key={key}>
            <div className="border p-3 rounded shadow-sm h-100">
              <h5 className="mb-3">{label}</h5>
              <div className="d-grid">
                <button className="btn btn-primary" onClick={() => onSelectTemplate(key as TemplateKey)}>
                  Select {label}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateGallery;

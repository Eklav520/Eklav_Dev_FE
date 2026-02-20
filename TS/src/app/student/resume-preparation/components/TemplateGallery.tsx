import React from 'react';
import { templateList, TemplateKey } from './templateList';

type TemplateGalleryProps = {
  onSelectTemplate: (id: TemplateKey) => void;
};

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  return (
    <div className="container py-5">

      {/* Heading */}
      <div className="text-center mb-5">
        <h2 className="fw-bold text-white">
          Choose Your Resume Template
        </h2>

        <p className="text-white-50">
          Select a professional design to get started
        </p>
      </div>

      {/* Templates Grid */}
      <div className="row">
        {Object.entries(templateList).map(([key, { label }]) => (
          <div className="col-md-4 mb-4" key={key}>
            <div
              className="h-100 p-4 rounded-4"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                transition: 'all 0.25s ease',
                boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow =
                  '0 12px 30px rgba(255,122,0,0.15)';
                e.currentTarget.style.border =
                  '1px solid rgba(255,122,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 6px 20px rgba(0,0,0,0.05)';
                e.currentTarget.style.border = '1px solid #e5e7eb';
              }}
            >
              <h5
                className="fw-semibold mb-4"
                style={{ color: '#1e293b' }}
              >
                {label}
              </h5>

              <div className="d-grid">
                <button
                  className="btn"
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '10px 16px',
                  }}
                  onClick={() =>
                    onSelectTemplate(key as TemplateKey)
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff7a00';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1e293b';
                  }}
                >
                  Select Template
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
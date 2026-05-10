import React from 'react';
import ResumeClassic from './ResumeClassic';
import ResumeModern from './ResumeModern';
import ResumeProfessional from './ResumeProfessional';
import ResumeElegant from './ResumeElegant';
import ResumeMinimalist from './ResumeMinimalist';
import { ResumeData } from './ResumeData';

export type TemplateKey = 'classic' | 'modern' | 'executive' | 'elegant' | 'creative';

export const templateList: Record<TemplateKey, {
  label: string;
  description: string;
  component: React.FC<{ data: ResumeData }>;
}> = {
  classic: {
    label: 'Classic',
    description: 'Traditional serif design — ATS-friendly & timeless',
    component: ResumeClassic,
  },
  modern: {
    label: 'Modern',
    description: 'Clean blue header with pill-style skill badges',
    component: ResumeModern,
  },
  executive: {
    label: 'Executive',
    description: 'Two-column with dark sidebar — premium corporate look',
    component: ResumeProfessional,
  },
  elegant: {
    label: 'Elegant',
    description: 'Ultra-clean minimal layout with generous whitespace',
    component: ResumeElegant,
  },
  creative: {
    label: 'Creative',
    description: 'Teal gradient header with bold left-accent sections',
    component: ResumeMinimalist,
  },
};

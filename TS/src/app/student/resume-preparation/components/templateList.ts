import React from 'react';
import ResumeClassic from './ResumeClassic';
import ResumeModern from './ResumeModern';
import ResumeProfessional from './ResumeProfessional';
import ResumeElegant from './ResumeElegant';
import ResumeMinimalist from './ResumeMinimalist';
import ResumeCorporate from './ResumeCorporate';
import ResumeAccent from './ResumeAccent';
import { ResumeData } from './ResumeData';

export type TemplateKey = 'classic' | 'modern' | 'executive' | 'elegant' | 'creative' | 'corporate' | 'accent';

export const templateList: Record<TemplateKey, {
  label: string;
  description: string;
  component: React.FC<{ data: ResumeData }>;
  // Whether this template's layout actually renders data.profilePhoto anywhere.
  // Drives whether the "Profile Photo" upload field is shown in Personal Information —
  // uploading a photo for a template that never displays it was confusing users.
  hasPhoto: boolean;
}> = {
  classic: {
    label: 'Classic',
    description: 'Traditional serif design — ATS-friendly & timeless',
    component: ResumeClassic,
    hasPhoto: false,
  },
  modern: {
    label: 'Modern',
    description: 'Clean blue header with pill-style skill badges',
    component: ResumeModern,
    hasPhoto: false,
  },
  executive: {
    label: 'Executive',
    description: 'Two-column with dark sidebar — premium corporate look',
    component: ResumeProfessional,
    hasPhoto: true,
  },
  elegant: {
    label: 'Elegant',
    description: 'Ultra-clean minimal layout with generous whitespace',
    component: ResumeElegant,
    hasPhoto: false,
  },
  creative: {
    label: 'Creative',
    description: 'Teal gradient header with bold left-accent sections',
    component: ResumeMinimalist,
    hasPhoto: false,
  },
  corporate: {
    label: 'Corporate',
    description: 'Full-width header · wide main · achievements sidebar',
    component: ResumeCorporate,
    hasPhoto: false,
  },
  accent: {
    label: 'Accent',
    description: 'Narrow teal sidebar · wide right column · bold name header',
    component: ResumeAccent,
    hasPhoto: true,
  },
};

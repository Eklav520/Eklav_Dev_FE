import ResumeClassic from './ResumeClassic';
import ResumeModern from './ResumeModern';
import ResumeMinimalist from './ResumeMinimalist';
import { ResumeData } from './ResumeData';
import ResumeElegant from './ResumeElegant';
import ResumeProfessional from './ResumeProfessional';
import { Component } from 'react';
import ResumeCompact from './ResumeCompact';
import ResumeCentered from './ResumeCentered';
import ResumeSplit from './ResumeSplit';
import ResumeDark from './ResumeDark';
import ResumeColorBar from './ResumeColorBar';
import ResumeSplitLayout from './ResumeSplitLayout';

export type TemplateKey = 'classic' | 'modern' | 'minimalist' | 'ResumeProfessional' | 'ResumeCompact' | 'elegant' | 'ResumeCentered' | 'ResumeSplit' | 'ResumeDark' | 'ResumeColorBar' | 'ResumeSplitLayout';

export const templateList: Record<TemplateKey, {
  label: string;
  component: React.FC<{ data: ResumeData }>;
}> = {
  classic: {
    label: 'Classic',
    component: ResumeClassic,
  },
  modern: {
    label: 'Modern',
    component: ResumeModern,
  },
  minimalist: {
    label: 'Minimalist',
    component: ResumeMinimalist,
    
  },
  ResumeProfessional:{
     label: 'ResumeProfessional',
    component: ResumeProfessional,
  },

  ResumeCompact:{
    label: 'ResumeCompact',
    component: ResumeCompact,
  },

  ResumeCentered:{
    label:'ResumeCentered',
    component: ResumeCentered,
  },
  elegant: { label: 'Elegant', component: ResumeElegant },
  ResumeDark: { label: 'ResumeDark', component: ResumeDark },
  ResumeSplit: { label: 'ResumeSplit', component: ResumeSplit },
  ResumeColorBar: { label: 'ResumeColorBar', component: ResumeColorBar },
  ResumeSplitLayout: { label: 'ResumeSplitLayout', component: ResumeSplitLayout },
};

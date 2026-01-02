import ResumeClassic from './ResumeClassic';
import ResumeModern from './ResumeModern';
import ResumeMinimalist from './ResumeMinimalist';
import { ResumeData } from './ResumeData';
import ResumeElegant from './ResumeElegant';

export type TemplateKey = 'classic' | 'modern' | 'minimalist' | 'elegant';

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
  elegant: { label: 'Elegant', component: ResumeElegant },
};

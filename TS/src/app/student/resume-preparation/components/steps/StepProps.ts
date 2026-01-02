// StepProps.ts
import { ResumeData } from '../ResumeData';

export interface StepProps {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>; // ✅ correct type
  goNext: () => void;
  goBack?: () => void;
}
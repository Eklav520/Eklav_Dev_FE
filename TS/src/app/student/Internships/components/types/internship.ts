export interface InternshipType {
  _id: string;
  title: string;
  description: string;
  tools: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status: "Open" | "Closed" | "In Progress";
  stipend: string;
  acceptanceCriteria: string[];
  links: string[];
  screenshotKeys: string[];
  dueDate: string;
  maxStudents: number;
  createdAt: string;
  updatedAt: string;
  appliedStudents?: Array<string | null>;
  seatsLeft?: number;
  isFull?: boolean;
  hasApplied?: boolean;
}
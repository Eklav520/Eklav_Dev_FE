// src/pages/MockInterview/interview.data.ts

export type InterviewQuestion = {
  id: string
  question: string
  type: 'technical' | 'hr'
}

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'q1',
    question: 'Explain the difference between var, let, and const.',
    type: 'technical',
  },
  {
    id: 'q2',
    question: 'What is REST API and how does it work?',
    type: 'technical',
  },
  {
    id: 'q3',
    question: 'Tell me about a challenge you faced while learning.',
    type: 'hr',
  },
]

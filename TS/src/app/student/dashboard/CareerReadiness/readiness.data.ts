// src/pages/CareerReadiness/readiness.data.ts

export type SkillProgress = {
  skill: string
  progress: number // %
}

export const readinessData = {
  overallScore: 62,
  strengths: ['HTML', 'CSS', 'React Basics'],
  improvements: ['API Design', 'MongoDB Indexing'],
  skills: [
    { skill: 'Frontend', progress: 70 },
    { skill: 'Backend', progress: 55 },
    { skill: 'Databases', progress: 50 },
    { skill: 'DevOps & Tools', progress: 40 },
  ],
}

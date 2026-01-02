// src/pages/LearningRoadmap/roadmap.data.ts

export type RoadmapPhase = {
  id: string
  title: string
  duration: string
  hours: number
  skills: string[]
  tools: string[]
}

export const fullStackRoadmap: RoadmapPhase[] = [
  {
    id: 'phase-1',
    title: 'Foundations',
    duration: 'Weeks 1–6',
    hours: 120,
    skills: ['HTML', 'CSS', 'JavaScript'],
    tools: ['VS Code', 'Browser DevTools'],
  },
  {
    id: 'phase-2',
    title: 'Frontend Development',
    duration: 'Weeks 7–14',
    hours: 150,
    skills: ['React', 'State Management', 'API Integration'],
    tools: ['React', 'Axios', 'Git'],
  },
  {
    id: 'phase-3',
    title: 'Backend Development',
    duration: 'Weeks 15–22',
    hours: 150,
    skills: ['Node.js', 'Express', 'MongoDB'],
    tools: ['Node.js', 'Postman', 'MongoDB'],
  },
  {
    id: 'phase-4',
    title: 'Projects & Interview Prep',
    duration: 'Weeks 23–32',
    hours: 100,
    skills: ['Projects', 'System Design', 'Interview Prep'],
    tools: ['GitHub', 'Deployment'],
  },
]

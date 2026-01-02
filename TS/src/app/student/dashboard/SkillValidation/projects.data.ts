// src/pages/SkillValidation/projects.data.ts

export type MiniProject = {
  id: string
  title: string
  description: string
  skills: string[]
  difficulty: 'Easy' | 'Medium'
}

export const phaseProjects: Record<string, MiniProject[]> = {
  'phase-1': [
    {
      id: 'html-project',
      title: 'Personal Portfolio Website',
      description:
        'Build a responsive portfolio using HTML & CSS.',
      skills: ['HTML', 'CSS'],
      difficulty: 'Easy',
    },
  ],
  'phase-2': [
    {
      id: 'react-project',
      title: 'Task Manager App',
      description:
        'Create a React app with CRUD operations.',
      skills: ['React', 'State Management'],
      difficulty: 'Medium',
    },
  ],
  'phase-3': [
    {
      id: 'api-project',
      title: 'REST API for Blog',
      description:
        'Build REST APIs using Node.js & MongoDB.',
      skills: ['Node.js', 'Express', 'MongoDB'],
      difficulty: 'Medium',
    },
  ],
}

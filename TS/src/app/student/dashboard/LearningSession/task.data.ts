// src/pages/LearningSession/task.data.ts

export type LearningTask = {
  id: string
  title: string
  type: 'video' | 'reading' | 'practice'
  duration: number // minutes
  description: string
}

export const todayTasks: LearningTask[] = [
  {
    id: 'task-1',
    title: 'Introduction to HTML',
    type: 'video',
    duration: 20,
    description: 'Learn what HTML is and how the web works.',
  },
  {
    id: 'task-2',
    title: 'Basic HTML Tags',
    type: 'reading',
    duration: 15,
    description: 'Understand headings, paragraphs, and lists.',
  },
  {
    id: 'task-3',
    title: 'Create Your First Web Page',
    type: 'practice',
    duration: 30,
    description: 'Build a simple HTML page using basic tags.',
  },
]

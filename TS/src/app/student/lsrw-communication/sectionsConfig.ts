import {
  FaHeadphones, FaBook, FaPencilAlt, FaRandom, FaBookOpen, FaFont, FaMicrophone, FaFileAlt,
} from 'react-icons/fa'

// Shared between the round overview (page.tsx) and the Pattern Selection
// screen's score/attempt table — single source of truth for the round's
// real 6 sections (as opposed to the Pattern cards' placeholder badges,
// which don't map 1:1 onto these).
export const SECTIONS = [
  {
    key: 'listeningReading', num: '01', label: 'Listening & Reading', desc: 'Read a displayed sentence aloud, or listen to audio and repeat it — both recorded.',
    icon: FaHeadphones, color: '#ff7a00', bg: '#fff7ed', url: '', marks: 50,
    rules: ['Reading questions: read the displayed sentence aloud and record it.', 'Listening questions: listen to the audio, then repeat exactly what you heard.', 'Each recording is capped at 60 seconds.'],
  },
  {
    key: 'reading', num: '02', label: 'Passage', desc: 'Read the passage and answer the questions given.',
    icon: FaBook, color: '#22c55e', bg: '#f0fdf4', url: '/student/LearningPractice', marks: 25,
    rules: ['Read the passage carefully.', 'Answer all questions based on the passage.', 'You can navigate between questions in this section.'],
  },
  {
    key: 'writing', num: '03', label: 'Writing', desc: 'Write an essay or response on the given topic.',
    icon: FaPencilAlt, color: '#8b5cf6', bg: '#f5f3ff', url: '/student/WritingPractice', marks: 25,
    rules: ['Choose one topic and write your response.', 'Write a well-structured essay or response.', 'Stay within the word limit (250 – 300 words).'],
  },
  {
    key: 'jumbled', num: '04', label: 'Jumbled Sentences', desc: 'Rearrange words to form a meaningful, grammatically correct sentence.',
    icon: FaRandom, color: '#0891b2', bg: '#ecfeff', url: '', marks: 10,
    rules: ['Rearrange the parts to form a meaningful sentence.', 'The sentence should be grammatically correct.', 'Make sure to use proper punctuation.'],
  },
  {
    key: 'storytelling', num: '05', label: 'Story Telling', desc: 'Look at the picture and points, then write a creative story.',
    icon: FaBookOpen, color: '#db2777', bg: '#fdf2f8', url: '', marks: 10,
    rules: ['Look at the picture and the given points carefully.', 'Write a creative, well-structured story using them.', 'Stay within the minimum and maximum word limits.'],
  },
  {
    key: 'grammar', num: '06', label: 'Grammar', desc: 'Test your understanding of grammar rules and their correct usage.',
    icon: FaFont, color: '#ea580c', bg: '#fff7ed', url: '', marks: 10,
    rules: ['Read each question carefully.', 'Choose the most appropriate option.', 'Pay attention to grammar rules.'],
  },
] as const

// A Pattern is ONE sequential exam attempt made up of these sections, in this
// exact order — must stay in sync with the backend's
// Eklav_Dev_BE/src/utils/lsrwPatternConfig.js. Marks are nominal placeholders
// for sections without real auto-grading yet (only "listeningReading" scores
// for real today via speech-to-text word-diff); the rest are tracked as
// "attempted" (done, pending grading) until each one's grading is built.
export const PATTERN_SECTIONS: Record<1 | 2, {
  key: string; label: string; desc: string; icon: any; color: string; bg: string; marks: number; rules: string[]
}[]> = {
  1: [
    { key: 'listeningReading', label: 'Listening & Reading', desc: 'Read a displayed sentence aloud, or listen to audio and repeat it — both recorded.', icon: FaHeadphones, color: '#ff7a00', bg: '#fff7ed', marks: 50,
      rules: ['Reading questions: read the displayed sentence aloud and record it.', 'Listening questions: listen to the audio, then repeat exactly what you heard.', 'Each recording is capped at 60 seconds.'] },
    { key: 'speaking', label: 'Speaking', desc: 'Speak on the given topic clearly and confidently within the time limit.', icon: FaMicrophone, color: '#7c3aed', bg: '#f5f3ff', marks: 20,
      rules: ['Speak clearly on the given topic.', 'Stay within the recording time limit per question.', 'You cannot navigate back once a question is submitted.'] },
    { key: 'grammar', label: 'Grammar', desc: 'Test your understanding of grammar rules and their correct usage.', icon: FaFont, color: '#16a34a', bg: '#f0fdf4', marks: 20,
      rules: ['Read each question carefully.', 'Choose the most appropriate option.', 'Pay attention to grammar rules.'] },
    { key: 'passages', label: 'Passages', desc: 'Read the passage and answer the questions given.', icon: FaFileAlt, color: '#ea580c', bg: '#fff7ed', marks: 10,
      rules: ['Read the passage carefully.', 'Answer all questions based on the passage.', 'You can navigate between questions in this section.'] },
  ],
  2: [
    { key: 'listeningReading', label: 'Listening & Reading', desc: 'Read a displayed sentence aloud, or listen to audio and repeat it — both recorded.', icon: FaHeadphones, color: '#ff7a00', bg: '#fff7ed', marks: 50,
      rules: ['Reading questions: read the displayed sentence aloud and record it.', 'Listening questions: listen to the audio, then repeat exactly what you heard.', 'Each recording is capped at 60 seconds.'] },
    { key: 'jumbled', label: 'Jumbled Sentences', desc: 'Rearrange words to form a meaningful, grammatically correct sentence.', icon: FaRandom, color: '#0891b2', bg: '#ecfeff', marks: 20,
      rules: ['Rearrange the parts to form a meaningful sentence.', 'The sentence should be grammatically correct.', 'Make sure to use proper punctuation.'] },
    { key: 'grammar', label: 'Grammar', desc: 'Test your understanding of grammar rules and their correct usage.', icon: FaFont, color: '#16a34a', bg: '#f0fdf4', marks: 20,
      rules: ['Read each question carefully.', 'Choose the most appropriate option.', 'Pay attention to grammar rules.'] },
    { key: 'storytelling', label: 'Story Telling', desc: 'Look at the picture and points, then write a creative story.', icon: FaBookOpen, color: '#db2777', bg: '#fdf2f8', marks: 10,
      rules: ['Look at the picture and the given points carefully.', 'Write a creative, well-structured story using them.', 'Stay within the minimum and maximum word limits.'] },
  ],
}

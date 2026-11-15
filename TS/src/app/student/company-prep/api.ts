/* Company Specific Preparation — student API (backend: /api/student/company-prep) */

export type Level = 'Easy' | 'Medium' | 'Hard'
export type QType = 'mcq' | 'fill' | 'coding'

export type StudentCompany = {
  _id: string; name: string; logoUrl?: string; description?: string
  examCount: number; levels: Record<Level, number>; examsAttempted: number; bestPercentage: number | null
}
export type StudentExam = {
  _id: string; title: string; level: Level; durationMins: number; instructions?: string
  sections: { name: string; count: number; marks?: number; types?: Record<QType, number> }[]; questionCount: number; totalMarks: number
  byType?: Record<QType, number>
  attempts: number; bestPercentage: number | null
  lastAttempt: { _id: string; percentage: number; submittedAt: string } | null
  inProgressAttemptId: string | null
}
export type ExamQuestion = {
  _id: string; section: string; type: QType; question: string; marks: number
  options?: { A?: string; B?: string; C?: string; D?: string }
  coding?: { inputFormat: string; outputFormat: string; constraints: string; languages: string[]; samples: { input: string; output: string }[]; totalTests: number }
}
export type Answer = { option?: string; text?: string; code?: string; language?: string }
export type StartPayload = {
  attempt: { _id: string; startedAt: string; endsAt: string; serverNow: string; draft: Record<string, Answer> }
  exam: { _id: string; title: string; level: Level; durationMins: number; instructions?: string; sections: string[] }
  company: { name: string; logoUrl?: string }
  questions: ExamQuestion[]
}
export type ReviewItem = {
  questionId: string; section: string; type: QType; marks: number; marksAwarded: number; isCorrect: boolean
  question: string; explanation: string; yourAnswer?: string; language?: string; passed?: number; total?: number
  options?: { A?: string; B?: string; C?: string; D?: string }; correctAnswer?: string
  aiExplanation?: string
}
export type ResultPayload = {
  company: { name: string; logoUrl?: string }
  exam: { _id: string; title: string; level: Level; durationMins: number; sections: string[] }
  attempt: {
    _id: string; score: number; totalMarks: number; percentage: number; correctCount: number; questionCount: number
    sectionScores: { section: string; score: number; total: number; correct: number; count: number }[]
    startedAt: string; submittedAt: string; timeTakenSecs: number; autoSubmitted: boolean
  }
  history: { _id: string; percentage: number; submittedAt: string }[]
  review: ReviewItem[]
}

export const LEVELS: Level[] = ['Easy', 'Medium', 'Hard']
export const LEVEL_COLOR: Record<Level, string> = { Easy: '#16a34a', Medium: '#d97706', Hard: '#dc2626' }
export const TYPE_LABEL: Record<QType, string> = { mcq: 'MCQ', fill: 'Fill in the blank', coding: 'Coding' }
export const LANGUAGES = ['c', 'cpp', 'java', 'python', 'javascript', 'csharp', 'go', 'rust', 'php', 'ruby', 'typescript']
export const LANG_LABEL: Record<string, string> = {
  c: 'C (GCC)', cpp: 'C++ (GCC)', java: 'Java', python: 'Python 3', javascript: 'JavaScript (Node.js)',
  csharp: 'C# (.NET)', go: 'Go', rust: 'Rust', php: 'PHP', ruby: 'Ruby', typescript: 'TypeScript',
}
export const MONACO_LANG: Record<string, string> = {
  c: 'c', cpp: 'cpp', java: 'java', python: 'python', javascript: 'javascript',
  csharp: 'csharp', go: 'go', rust: 'rust', php: 'php', ruby: 'ruby', typescript: 'typescript',
}
/* Starter code: reads all of stdin, leaves the logic to the student */
export const STARTER: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    // Read input from stdin and print the answer\n    \n    return 0;\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Read input from stdin and print the answer\n    \n    return 0;\n}\n',
  java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and print the answer\n        \n    }\n}\n',
  python: 'import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    # Write your solution here\n    \n\nsolve()\n',
  javascript: "const data = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\n// Write your solution here\n\n",
  csharp: 'using System;\nusing System.Linq;\n\nclass Program {\n    static void Main() {\n        // Read input with Console.ReadLine() and print the answer\n        \n    }\n}\n',
  go: 'package main\n\nimport (\n    "bufio"\n    "fmt"\n    "os"\n)\n\nfunc main() {\n    reader := bufio.NewReader(os.Stdin)\n    _ = reader\n    // Read input and print the answer\n    fmt.Println()\n}\n',
  rust: 'use std::io::{self, Read};\n\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    // Write your solution here\n    \n}\n',
  php: '<?php\n$input = trim(stream_get_contents(STDIN));\n// Write your solution here\n\n',
  ruby: 'input = STDIN.read.split\n# Write your solution here\n\n',
  typescript: "const data: string[] = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\n// Write your solution here\n\n",
}

export const fmtDuration = (secs: number) => {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`
}

export const makeApi = (baseURL: string, token?: string) => {
  const call = async <T = any>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${baseURL}/api/student/company-prep${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) throw new Error(data.message || 'Something went wrong')
    return data
  }
  const body = (b: unknown) => JSON.stringify(b)
  return {
    companies: () => call<{ available: boolean; institute: { name: string } | null; companies: StudentCompany[] }>('/companies'),
    company: (id: string) => call<{ company: StudentCompany; exams: StudentExam[] }>(`/companies/${id}`),
    start: (examId: string) => call<StartPayload>(`/exams/${examId}/start`, { method: 'POST' }),
    saveDraft: (attemptId: string, answers: Record<string, Answer>) => call(`/attempts/${attemptId}/draft`, { method: 'PUT', body: body({ answers }) }),
    run: (attemptId: string, b: { questionId: string; code: string; language: string; stdin?: string }) =>
      call<{ results?: { passed: boolean; stdout: string; stderr: string; input: string; expected: string }[]; custom?: { stdout: string; stderr: string } }>(`/attempts/${attemptId}/run`, { method: 'POST', body: body(b) }),
    submit: (attemptId: string, answers: Record<string, Answer>, auto = false, tabSwitches = 0) => call<{ attemptId: string }>(`/attempts/${attemptId}/submit`, { method: 'POST', body: body({ answers, auto, tabSwitches }) }),
    result: (attemptId: string) => call<ResultPayload>(`/attempts/${attemptId}`),
    explain: (attemptId: string, questionId: string) => call<{ explanation: string }>(`/attempts/${attemptId}/explain`, { method: 'POST', body: body({ questionId }) }),
  }
}
export type Api = ReturnType<typeof makeApi>

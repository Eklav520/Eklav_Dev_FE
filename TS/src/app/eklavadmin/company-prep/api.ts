/* Company Specific Preparation — admin API (backend: /api/admin/company-prep) */

export type Level = 'Easy' | 'Medium' | 'Hard'
export type QType = 'mcq' | 'fill' | 'coding'

export type PrepCompany = {
  _id: string; name: string; logoUrl?: string; description?: string; isActive: boolean
  examCount: number; publishedCount: number; questionCount: number; instituteCount: number
}
export type PrepExam = {
  _id: string; companyId: string; title: string; level: Level; durationMins: number; instructions?: string
  sections: { name: string }[]; order: number; status: 'draft' | 'published'
  questionCount: number; totalMarks: number; bySection: Record<string, number>; byType: Record<QType, number>
}
export type TestCase = { input: string; output: string; hidden: boolean }
export type PrepQuestion = {
  _id: string; examId: string; section: string; order: number; type: QType; question: string; marks: number; explanation?: string
  options?: { A?: string; B?: string; C?: string; D?: string }; correctOption?: 'A' | 'B' | 'C' | 'D' | null
  answers?: string[]
  coding?: { inputFormat?: string; outputFormat?: string; constraints?: string; languages?: string[]; testCases?: TestCase[] }
}
export type AccessRow = { _id: string; name: string; domain?: string; email?: string; status?: string; enabled: boolean; enabledAt: string | null }

export const LEVELS: Level[] = ['Easy', 'Medium', 'Hard']
export const LEVEL_BADGE: Record<Level, string> = { Easy: 'aui-badge-green', Medium: 'aui-badge-amber', Hard: 'aui-badge-red' }
export const TYPE_LABEL: Record<QType, string> = { mcq: 'MCQ', fill: 'Fill in the blank', coding: 'Coding' }
export const TYPE_BADGE: Record<QType, string> = { mcq: 'aui-badge-blue', fill: 'aui-badge-purple', coding: 'aui-badge-orange' }
export const DEFAULT_SECTIONS = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical']

export const makeApi = (baseURL: string, token?: string) => {
  const call = async <T = any>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${baseURL}/api/admin/company-prep${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
      const err: any = new Error(data.message || 'Request failed')
      err.details = data.errors
      throw err
    }
    return data
  }
  const body = (b: unknown) => JSON.stringify(b)
  return {
    companies: () => call<{ companies: PrepCompany[] }>('/companies'),
    createCompany: (b: Partial<PrepCompany>) => call('/companies', { method: 'POST', body: body(b) }),
    updateCompany: (id: string, b: Partial<PrepCompany>) => call(`/companies/${id}`, { method: 'PUT', body: body(b) }),
    deleteCompany: (id: string) => call(`/companies/${id}`, { method: 'DELETE' }),
    exams: (companyId: string) => call<{ exams: PrepExam[] }>(`/companies/${companyId}/exams`),
    createExam: (companyId: string, b: any) => call(`/companies/${companyId}/exams`, { method: 'POST', body: body(b) }),
    updateExam: (id: string, b: any) => call(`/exams/${id}`, { method: 'PUT', body: body(b) }),
    deleteExam: (id: string) => call(`/exams/${id}`, { method: 'DELETE' }),
    questions: (examId: string) => call<{ exam: PrepExam; questions: PrepQuestion[] }>(`/exams/${examId}/questions`),
    createQuestion: (examId: string, b: any) => call(`/exams/${examId}/questions`, { method: 'POST', body: body(b) }),
    bulkQuestions: (examId: string, questions: any[], replace: boolean) => call<{ imported: number }>(`/exams/${examId}/questions/bulk`, { method: 'POST', body: body({ questions, replace }) }),
    updateQuestion: (id: string, b: any) => call(`/questions/${id}`, { method: 'PUT', body: body(b) }),
    deleteQuestion: (id: string) => call(`/questions/${id}`, { method: 'DELETE' }),
    access: (companyId: string) => call<{ institutes: AccessRow[] }>(`/companies/${companyId}/access`),
    setAccess: (companyId: string, instituteId: string, enabled: boolean) => call(`/companies/${companyId}/access`, { method: 'PUT', body: body({ instituteId, enabled }) }),
    uploadLogo: async (file: File): Promise<string> => {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch(`${baseURL}/api/company-interview/upload-logo`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.logoUrl) throw new Error(data.error || 'Logo upload failed')
      return data.logoUrl
    },
  }
}
export type Api = ReturnType<typeof makeApi>

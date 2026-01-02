export type TestCase = {
  _id: number
  input: string
  output: string
}

export type Problem = {
  id: number
  _id: string
  title: string
  desc: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  testCases: TestCase[]
}

const baseURL = import.meta.env.VITE_API_BASE_URL

export const fetchProblems = async (): Promise<Problem[]> => {
  const res = await fetch(`${baseURL}/api/dashboard/adminProblems`)
  const data = await res.json()

  return data.map((p: any, index: number): Problem => ({
    id: index + 1,
    _id: p._id,
    title: p.title,
    desc: p.desc ?? 'Description not available',
    difficulty: (p.difficulty ?? 'Easy') as 'Easy' | 'Medium' | 'Hard',
    testCases: p.testCases ?? [],
  }))
}

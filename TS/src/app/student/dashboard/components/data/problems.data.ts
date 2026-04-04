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
  const token = localStorage.getItem('token')
  console.log('Token from localStorage:', token)

  if (!token) {
    throw new Error('No authentication token found')
  }

  const res = await fetch(`${baseURL}/api/dashboard/adminProblems`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  console.log('Response status:', res.status)
  const data = await res.json()
  console.log('Response data:', data)

  return data.map((p: any, index: number): Problem => ({
    id: index + 1,
    _id: p._id,
    title: p.title,
    desc: p.desc ?? 'Description not available',
    difficulty: (p.difficulty ?? 'Easy') as 'Easy' | 'Medium' | 'Hard',
    testCases: p.testCases ?? [],
  }))
}

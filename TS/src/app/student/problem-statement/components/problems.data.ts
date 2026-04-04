/* ---------------------------------------
   TYPES
--------------------------------------- */

export type TestCase = {
  _id: number
  input: string
  output: string
}

export type Problem = {
  id: number            // UI serial number
  _id: string           // MongoDB id
  title: string
  desc: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  testCases: TestCase[]
}

/* ---------------------------------------
   API FETCH HELPER
--------------------------------------- */

const baseURL = import.meta.env.VITE_API_BASE_URL

export const fetchProblems = async (token?: string): Promise<Problem[]> => {
  try {
    // ✅ If token not available yet, avoid crash
    if (!token) {
      console.warn("⚠️ No token provided to fetchProblems, skipping API call")
      return []
    }

    const res = await fetch(`${baseURL}/api/dashboard/adminProblems`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status (problem-statement):', res.status)

    if (!res.ok) {
      throw new Error(`Failed to fetch problems: ${res.status}`)
    }

    const data = await res.json()
    console.log('Response data (problem-statement):', data)

    // ✅ Safe mapping
    return (data || []).map((p: any, index: number): Problem => ({
      id: index + 1,
      _id: p._id,
      title: p.title,
      desc: p.desc ?? 'Description not available',
      difficulty: (p.difficulty ?? 'Easy') as 'Easy' | 'Medium' | 'Hard',
      testCases: p.testCases ?? [],
    }))

  } catch (error) {
    console.error("❌ fetchProblems error:", error)
    return [] // ✅ prevent UI crash
  }
}
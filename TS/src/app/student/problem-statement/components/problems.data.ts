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

// List view only ever renders title/difficulty (search + table columns) — hits
// the lightweight /summary route instead of fetching every problem's full
// desc/testCases up front, which was the source of the long initial load.
export const fetchProblems = async (token?: string): Promise<Problem[]> => {
  try {
    // ✅ If token not available yet, avoid crash
    if (!token) {
      console.warn("⚠️ No token provided to fetchProblems, skipping API call")
      return []
    }

    // verified=true: only problems where all 3 languages currently pass — students should
    // never land on a problem that's still broken due to a harness/test-data/AI-solution bug,
    // regardless of which language they pick to solve it in. Grows automatically as more
    // problems get fixed; no separate "publish" step needed.
    const res = await fetch(`${baseURL}/api/dashboard/adminProblems/summary?verified=true`, {
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

    // ✅ Safe mapping — desc/testCases aren't in the summary response;
    // fetchProblemById fills them in once a specific problem is opened.
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

// Full detail (desc + testCases) for exactly the one problem the student
// opened — called on selection instead of bundling this into fetchProblems.
export const fetchProblemById = async (id: string, token?: string): Promise<Problem | null> => {
  try {
    if (!token || !id) return null

    const res = await fetch(`${baseURL}/api/dashboard/adminProblems/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch problem ${id}: ${res.status}`)
    }

    const p = await res.json()
    return {
      id: 0, // caller should preserve the original serial number from the list
      _id: p._id,
      title: p.title,
      desc: p.desc ?? 'Description not available',
      difficulty: (p.difficulty ?? 'Easy') as 'Easy' | 'Medium' | 'Hard',
      testCases: p.testCases ?? [],
    }
  } catch (error) {
    console.error("❌ fetchProblemById error:", error)
    return null
  }
}
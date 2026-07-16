// Shared job-match scoring: how well a job fits a student's profile,
// based on their declared skills + skills earned from completed courses
// (see backend GET /profile/skill-profile).

export interface SkillProfile {
  skills: string[]
  certificationsCount: number
  completedCourses: { courseId: string; title: string; keySkills: string[] }[]
  combinedSkills: string[]
}

export async function fetchSkillProfile(baseURL: string, token?: string): Promise<SkillProfile | null> {
  try {
    const res = await fetch(`${baseURL}/profile/skill-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Score 0-100 for how well a job matches the student's combined skill set
 * (declared profile skills + skills from fully-completed courses).
 *
 *  - 60 pts: overlap between the job's listed skills and the student's skills
 *  - 30 pts: student skills mentioned in the job title/description
 *  - 10 pts: not a senior/lead role (student-friendly)
 */
export function calcJobMatch(
  jobSkills: string[],
  jobTitleAndDescription: string,
  studentSkills: string[]
): number {
  if (!studentSkills.length) return 0
  const us = studentSkills.map(s => s.toLowerCase())
  const titleDesc = jobTitleAndDescription.toLowerCase()

  // Job postings (especially from aggregators like Adzuna/JSearch) often tag
  // a long, noisy list of skills — some core, some tangential ("video",
  // "UI/UX", "docker" on a plain frontend role). Dividing by the FULL list
  // unfairly tanks the score for a student who nails the core skills but
  // doesn't happen to match every tag. Instead, matching ~4 of the job's
  // skills is treated as full credit, so a long tag list isn't punishing.
  let skillPts = 0
  if (jobSkills.length > 0) {
    const hits = jobSkills.filter(s => us.some(u => u.includes(s.toLowerCase()) || s.toLowerCase().includes(u))).length
    const expectedForFullCredit = Math.min(jobSkills.length, 4)
    skillPts = Math.round(Math.min(1, hits / expectedForFullCredit) * 60)
  }

  // Same fix here — a broad, well-rounded profile (10+ skills) shouldn't need
  // most of them name-checked in one job description to get credit.
  const kwHits = us.filter(s => titleDesc.includes(s)).length
  const kwExpectedForFullCredit = Math.min(us.length, 4)
  const kwPts = Math.round(Math.min(1, kwHits / kwExpectedForFullCredit) * 30)

  const seniorPts = /senior|lead|head|director|vp |chief|principal/.test(titleDesc) ? 0 : 10

  return Math.min(100, skillPts + kwPts + seniorPts)
}

export function matchColor(score: number): string {
  return score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
}

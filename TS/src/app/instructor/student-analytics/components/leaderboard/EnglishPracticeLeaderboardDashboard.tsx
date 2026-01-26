import { useState } from "react"
import { Card, Button } from "react-bootstrap"

import EnglishPracticeLeaderboard from "../../../dashboard/components/EnglishPracticeLeaderboard"
import { useAuthContext } from "@/context/useAuthContext"

type EnglishPracticeLeaderboardDashboardProps = {
  year: number
  month: number
  week: string | null
}

const EnglishPracticeLeaderboardDashboard = ({
  week,
}: EnglishPracticeLeaderboardDashboardProps) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [generating, setGenerating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const generateRanking = async () => {
    if (!week) return

    try {
      setGenerating(true)

      const res = await fetch(
        `${baseURL}/api/englishPracticeRanking/weekly`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify({
            section: "ENGLISH_PRACTICE",
            subSection: "SPEAKING",
            weekKey: week
          })
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to generate ranking")
      }

      // Refresh leaderboard without page reload
      setRefreshKey(prev => prev + 1)
    } catch (err: any) {
      console.error("Generate ranking failed:", err)
      alert(err.message || "Failed to generate ranking")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">English Practice Leaderboard</h5>

        {user?.role === "admin" && week && (
          <Button
            size="sm"
            variant="primary"
            disabled={generating}
            onClick={generateRanking}
          >
            {generating ? "Generating..." : "Generate Ranking"}
          </Button>
        )}
      </Card.Header>

      <Card.Body>
        {!week ? (
          <p className="text-center text-muted mb-0">
            Select a week from the filters above to view leaderboard.
          </p>
        ) : (
          <EnglishPracticeLeaderboard
            key={refreshKey}
            section="ENGLISH_PRACTICE"
            subSection="SPEAKING"
            weekKey={week}
          />
        )}
      </Card.Body>
    </Card>
  )
}

export default EnglishPracticeLeaderboardDashboard

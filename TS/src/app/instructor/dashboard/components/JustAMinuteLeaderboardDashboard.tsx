import { useEffect, useState } from "react"
import { Card, Form, Spinner, Button } from "react-bootstrap"

import JustAMinuteLeaderboard from "./JustAMinuteLeaderboard"
import { useAuthContext } from "@/context/useAuthContext"

const JustAMinuteLeaderboardDashboard = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [weeks, setWeeks] = useState<string[]>([])
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * Fetch available weeks
   */
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const res = await fetch(
          `${baseURL}/api/adminDashboardHistoryTable/admin/weeks`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`
            }
          }
        )

        const data = await res.json()
        setWeeks(data)
        setSelectedWeek(data[data.length - 1]) // latest week
      } catch (err) {
        console.error("Failed to fetch weeks", err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeeks()
  }, [baseURL, user?.token])

  /**
   * Generate JAM ranking
   */
  const generateRanking = async () => {
    if (!selectedWeek) return

    try {
      setGenerating(true)

      const res = await fetch(
        `${baseURL}/api/justAMinuteRanking/weekly`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`
          },
          body: JSON.stringify({
            weekKey: selectedWeek
          })
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to generate ranking")
      }

      // refresh leaderboard without reload
      setRefreshKey(prev => prev + 1)
    } catch (err: any) {
      console.error("Generate JAM ranking failed:", err)
      alert(err.message || "Failed to generate ranking")
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <Spinner animation="border" />

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Just-A-Minute Leaderboard</h5>

        <div className="d-flex align-items-center gap-2">
          <Form.Select
            style={{ width: 160 }}
            value={selectedWeek ?? ""}
            onChange={e => setSelectedWeek(e.target.value)}
          >
            {weeks.map(w => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Form.Select>

          {user?.role === "admin" && selectedWeek && (
            <Button
              size="sm"
              variant="primary"
              disabled={generating}
              onClick={generateRanking}
            >
              {generating ? "Generating..." : "Generate Ranking"}
            </Button>
          )}
        </div>
      </Card.Header>

      <Card.Body>
        {selectedWeek && (
          <JustAMinuteLeaderboard
            key={refreshKey}
            weekKey={selectedWeek}
          />
        )}
      </Card.Body>
    </Card>
  )
}

export default JustAMinuteLeaderboardDashboard

import { useState } from 'react'
import { Card, Button } from 'react-bootstrap'

import ReadingLeaderboard from '../../../dashboard/components/ReadingLeaderboard'
import { useAuthContext } from '@/context/useAuthContext'

type ReadingLeaderboardDashboardProps = {
  year: number
  month: number
  week: string | null
  college: string | null
}

const ReadingLeaderboardDashboard = ({
  week,
  college,
}: ReadingLeaderboardDashboardProps) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [generating, setGenerating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  /**
   * Generate Reading ranking
   */
  const generateRanking = async () => {
    if (!week) return

    try {
      setGenerating(true)

      const res = await fetch(
        `${baseURL}/api/readingRanking/weekly`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({
            weekKey: week,
            college, // ✅ pass college
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to generate ranking')
      }

      // refresh leaderboard
      setRefreshKey(prev => prev + 1)
    } catch (err: any) {
      console.error('Generate Reading ranking failed:', err)
      alert(err.message || 'Failed to generate ranking')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Reading Leaderboard</h5>

        {(user?.role === 'admin' || user?.role === 'collegeAdmin') && week && (
          <Button
            size="sm"
            variant="primary"
            disabled={generating}
            onClick={generateRanking}
          >
            {generating ? 'Generating...' : 'Generate Ranking'}
          </Button>
        )}
      </Card.Header>

      <Card.Body>
        {!week ? (
          <p className="text-center text-muted mb-0">
            Select a week from the filters above to view leaderboard.
          </p>
        ) : (
          <ReadingLeaderboard
            key={refreshKey}
            weekKey={week}
            college={college} // ✅ pass college
          />
        )}
      </Card.Body>
    </Card>
  )
}

export default ReadingLeaderboardDashboard

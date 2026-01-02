import { Badge, Table, Card } from 'react-bootstrap'

const AIResultPanel = ({ result }: { result: any }) => {
  if (!result?.summary) return null

  const {
    summary,
    testCaseResults = [],
    feedback = {},
  } = result

  const percentageVariant =
    summary.passPercentage === 100
      ? 'success'
      : summary.passPercentage >= 65
      ? 'warning'
      : 'danger'

  return (
    <div className="d-flex flex-column gap-3">
      {/* ===== Status Summary ===== */}
      <Card className="p-3 border-start border-4 border-warning">
        <div className="d-flex justify-content-between align-items-center">
          <strong className="text-warning">Status</strong>
          <Badge
            bg={
              feedback.verdict === 'ACCEPTED'
                ? 'success'
                : feedback.verdict === 'PARTIALLY_ACCEPTED'
                ? 'warning'
                : 'danger'
            }
          >
            {feedback.verdict || 'UNKNOWN'}
          </Badge>
        </div>

        <div className="mt-2">
          Passed {summary.passed}/{summary.totalTestCases}
        </div>

        <div>
          Pass Percentage:{' '}
          <Badge bg={percentageVariant}>
            {summary.passPercentage}%
          </Badge>
        </div>
      </Card>

      {/* ===== Test Case Results ===== */}
      <Card className="p-3 border-start border-4 border-warning">
        <strong className="mb-2 d-block text-warning">
          Test Case Results
        </strong>

        <Table bordered hover responsive size="sm" className="mb-0">
          <thead>
            <tr>
              <th>Case</th>
              <th>Status</th>
              <th>Expected</th>
              <th>Received</th>
              <th>Message</th>
            </tr>
          </thead>

          <tbody>
            {testCaseResults.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  No test case results available
                </td>
              </tr>
            ) : (
              testCaseResults.map((tc: any, index: number) => (
                <tr key={tc.testCaseId ?? index}>
                  <td><strong>Case {index + 1}</strong></td>

                  <td>
                    <Badge bg={tc.status === 'PASS' ? 'success' : 'danger'}>
                      {tc.status}
                    </Badge>
                  </td>

                  <td>
                    <code>{JSON.stringify(tc.expected)}</code>
                  </td>

                  <td>
                    <code>
                      {tc.received ? JSON.stringify(tc.received) : 'null'}
                    </code>
                  </td>

                  <td>{tc.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>

      {/* ===== AI Feedback ===== */}
      <Card className="p-3 border-start border-4 border-warning">
        <strong className="text-warning">AI Feedback</strong>

        <p className="mb-1 mt-1">
          {feedback.remarks || 'No feedback available'}
        </p>

        <div className="small text-muted">
          Time: {feedback.timeComplexity || '-'} | Space:{' '}
          {feedback.spaceComplexity || '-'}
        </div>

        {feedback.improvements && (
          <div className="mt-2 text-warning">
            💡 {feedback.improvements}
          </div>
        )}
      </Card>
    </div>
  )
}

export default AIResultPanel

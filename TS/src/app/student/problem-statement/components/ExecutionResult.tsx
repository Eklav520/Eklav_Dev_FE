type Result = {
  testCaseId: number
  status: 'passed' | 'failed'
  output: string
}

const ExecutionResult = ({ results }: { results: Result[] }) => {
  return (
    <div className="p-3">
      {results.map((r) => (
        <div key={r.testCaseId} className="mb-2">
          <strong>Case {r.testCaseId}:</strong>{' '}
          {r.status === 'passed' ? '✅ Passed' : '❌ Failed'}
          {r.status === 'failed' && (
            <div className="text-danger small">Output: {r.output}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ExecutionResult

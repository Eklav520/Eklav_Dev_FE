import React from 'react'

const ORANGE = '#ff7a00'

const AIResultPanel = ({ result }: { result: any }) => {
  if (!result?.summary) return null

  const { summary, testCaseResults = [], feedback = {} } = result

  const allPassed = summary.passPercentage === 100
  const verdictColor = allPassed ? '#16a34a' : summary.passPercentage >= 65 ? ORANGE : '#dc2626'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0' }}>

      {/* ── Summary bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: allPassed ? '#f0fdf4' : '#fff7ed',
        border: `1px solid ${verdictColor}40`,
        borderLeft: `4px solid ${verdictColor}`,
        borderRadius: 8, padding: '10px 14px',
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: verdictColor }}>
            {allPassed ? '✓ All tests passed' : `${summary.passed} / ${summary.totalTestCases} tests passed`}
          </span>
          <span style={{ marginLeft: 12, fontSize: '0.8rem', color: '#888' }}>
            {summary.passPercentage}%
          </span>
        </div>
        <span style={{
          fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px',
          borderRadius: 12, color: '#fff', background: verdictColor,
        }}>
          {feedback.verdict || 'UNKNOWN'}
        </span>
      </div>

      {/* ── Per-test-case cards ── */}
      {testCaseResults.map((tc: any, idx: number) => {
        const pass = tc.status === 'PASS'
        const hasConsoleOutput = !!tc.stdout
        const receivedIsNull = tc.received === null || tc.received === undefined || tc.received === 'null' || tc.received === 'undefined'
        const showConsoleTip = !pass && receivedIsNull && hasConsoleOutput

        return (
          <div key={tc.testCaseId ?? idx} style={{
            border: `1px solid ${pass ? '#bbf7d0' : '#fecaca'}`,
            borderLeft: `4px solid ${pass ? '#16a34a' : '#dc2626'}`,
            borderRadius: 8, overflow: 'hidden', background: '#fff',
          }}>
            {/* Card header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px',
              background: pass ? '#f0fdf4' : '#fff1f2',
              borderBottom: `1px solid ${pass ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, color: pass ? '#16a34a' : '#dc2626',
                background: pass ? '#dcfce7' : '#fee2e2',
                padding: '2px 8px', borderRadius: 10,
              }}>
                {pass ? '✓ PASS' : '✗ FAIL'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#555', fontWeight: 500 }}>
                Test Case {idx + 1}
              </span>
            </div>

            {/* Card body */}
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Input */}
              {tc.input && (
                <Row label="Input" color="#6366f1">
                  <code style={codeStyle}>{tc.input}</code>
                </Row>
              )}

              {/* Expected */}
              <Row label="Expected" color="#16a34a">
                <code style={{ ...codeStyle, background: '#f0fdf4', color: '#15803d' }}>
                  {tc.expected ?? '—'}
                </code>
              </Row>

              {/* Received */}
              <Row label="Your Output" color={pass ? '#16a34a' : '#dc2626'}>
                <code style={{ ...codeStyle, background: pass ? '#f0fdf4' : '#fff1f2', color: pass ? '#15803d' : '#dc2626' }}>
                  {receivedIsNull ? 'nothing returned (undefined)' : tc.received}
                </code>
              </Row>

              {/* Console Output */}
              {hasConsoleOutput && (
                <Row label="Console" color="#92400e">
                  <code style={{ ...codeStyle, background: '#fffbeb', color: '#92400e' }}>
                    {tc.stdout}
                  </code>
                </Row>
              )}

              {/* Helpful tip */}
              {showConsoleTip && (
                <div style={{
                  fontSize: '0.75rem', color: '#92400e',
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 6, padding: '6px 10px', marginTop: 2,
                }}>
                  Tip: Your code printed the value using <code>console.log</code> but the grader
                  needs a <strong>return</strong> value. Use <code>return</code> instead.
                </div>
              )}

              {/* Error message */}
              {!pass && tc.message && tc.message !== 'Wrong answer' && (
                <div style={{
                  fontSize: '0.75rem', color: '#991b1b',
                  background: '#fff1f2', border: '1px solid #fecaca',
                  borderRadius: 6, padding: '6px 10px',
                }}>
                  {tc.message}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Helpers ── */
const codeStyle: React.CSSProperties = {
  fontSize: '0.82rem', padding: '3px 8px', borderRadius: 5,
  background: '#f3f4f6', color: '#1f2937', fontFamily: 'monospace',
  wordBreak: 'break-all',
}

const Row = ({ label, color, children }: { label: string; color: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
    <span style={{
      minWidth: 90, fontSize: '0.7rem', fontWeight: 600,
      color, textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: 4,
    }}>
      {label}
    </span>
    <div style={{ flex: 1 }}>{children}</div>
  </div>
)

export default AIResultPanel

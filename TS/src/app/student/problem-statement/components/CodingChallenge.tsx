import { useEffect, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import ProblemsList from './ProblemsList'
import { Problem, fetchProblems } from './problems.data'

import Discussion from './Discussion/Discussion'
import CodeEditor from './CodeEditor'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Container, Row, Col, Tabs, Tab, Badge, Button, Dropdown } from 'react-bootstrap'
import AIResultPanel from './AIResultPanel'
import { FiFileText, FiBookOpen, FiMessageCircle, FiUpload } from 'react-icons/fi'
import './ProblemStatement.css'
import { useAuthContext } from '@/context/useAuthContext'
import SubmissionList from './SubmissionsTab'

/* ---------------- TYPES ---------------- */

type Language =
  | 'cpp'
  | 'java'
  | 'python'
  | 'python3'
  | 'javascript'
  | 'typescript'
  | 'c'
  | 'csharp'
  | 'go'
  | 'kotlin'
  | 'swift'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'dart'
  | 'scala'

type ActiveTab = 'problemsList' | 'description' | 'discussion' | 'submission'

/* ---------------- LANGUAGE OPTIONS ---------------- */

const LANGUAGE_GROUPS = [
  [
    { key: 'javascript', label: 'JavaScript' },
    { key: 'typescript', label: 'TypeScript' },
    { key: 'python', label: 'Python' },
    { key: 'python3', label: 'Python3' },
    { key: 'java', label: 'Java' },
    { key: 'cpp', label: 'C++' },
    { key: 'c', label: 'C' },
    { key: 'csharp', label: 'C#' },
  ],
  [
    { key: 'go', label: 'Go' },
    { key: 'rust', label: 'Rust' },
    { key: 'ruby', label: 'Ruby' },
    { key: 'php', label: 'PHP' },
    { key: 'swift', label: 'Swift' },
    { key: 'kotlin', label: 'Kotlin' },
    { key: 'scala', label: 'Scala' },
    { key: 'dart', label: 'Dart' },
  ],
]

/* ---------------- DEFAULT CODE ---------------- */

const DEFAULT_CODE: Record<Language, string> = {
  /* ================= JAVASCRIPT ================= */
  javascript: `function solution(nums, target) {
  // Write your code here
  return [];
}`,

  /* ================= JAVA ================= */
  java: `class Solution {
  public int[] solution(int[] nums, int target) {
    // Write your code here
    return new int[]{};
  }
}`,

  /* ================= PYTHON ================= */
  python: `def solution(nums, target):
    # Write your code here
    return []`,

  python3: `def solution(nums, target):
    # Write your code here
    return []`,

  /* ================= C++ ================= */
  cpp: `#include <vector>
using namespace std;

vector<int> solution(vector<int>& nums, int target) {
  // Write your code here
  return {};
}`,

  /* ================= C ================= */
  c: `#include <stdlib.h>

/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* solution(int* nums, int numsSize, int target, int* returnSize) {
  // Write your code here
  *returnSize = 0;
  return NULL;
}`,

  /* ================= C# (FIXED) ================= */
  csharp: `using System;
using System.Collections.Generic;

public class Solution {
  public int[] SolutionMethod(int[] nums, int target) {
    // Write your code here
    return new int[0];
  }
}`,

  /* ================= TYPESCRIPT ================= */
  typescript: `function solution(nums: number[], target: number): number[] {
  // Write your code here
  return [];
}`,

  /* ================= GO ================= */
  go: `func solution(nums []int, target int) []int {
  // Write your code here
  return []int{}
}`,

  /* ================= KOTLIN ================= */
  kotlin: `class Solution {
  fun solution(nums: IntArray, target: Int): IntArray {
    // Write your code here
    return intArrayOf()
  }
}`,

  /* ================= SWIFT ================= */
  swift: `class Solution {
  func solution(_ nums: [Int], _ target: Int) -> [Int] {
    // Write your code here
    return []
  }
}`,

  /* ================= RUST ================= */
  rust: `impl Solution {
  pub fn solution(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // Write your code here
    vec![]
  }
}`,

  /* ================= RUBY ================= */
  ruby: `def solution(nums, target)
  # Write your code here
  []
end`,

  /* ================= PHP ================= */
  php: `class Solution {
  function solution($nums, $target) {
    // Write your code here
    return [];
  }
}`,

  /* ================= DART ================= */
  dart: `class Solution {
  List<int> solution(List<int> nums, int target) {
    // Write your code here
    return [];
  }
}`,

  /* ================= SCALA ================= */
  scala: `object Solution {
  def solution(nums: Array[Int], target: Int): Array[Int] = {
    // Write your code here
    Array()
  }
}`,
}

/* ---------------- COMPONENT ---------------- */

const ProblemStatement = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [isProblemLoading, setIsProblemLoading] = useState(false)

  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState(DEFAULT_CODE.javascript)

  const [showTestPanel, setShowTestPanel] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('problemsList')
  const [testTab, setTestTab] = useState<'result'>('result')
  const [completedIds, setCompletedIds] = useState<number[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [loadingProblems, setLoadingProblems] = useState(true)

  const PASS_THRESHOLD = 65

  /* ---------------- LOAD PROBLEMS ---------------- */

  useEffect(() => {
    const loadProblems = async () => {
      setLoadingProblems(true)

      const data = await fetchProblems()
      setProblems(data)

      setLoadingProblems(false)
    }

    loadProblems()
  }, [])

  useEffect(() => {
    const fetchCompletedProblems = async () => {
      try {
        const res = await fetch(`${baseURL}/api/ai/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await res.json()
        if (!result.success) return

        const completed = result.data.filter((s: any) => s.verdict === 'ACCEPTED' && s.isBestSubmission === true).map((s: any) => Number(s.problemId)) // 👈 FORCE NUMBER

        setCompletedIds([...new Set<number>(completed)])
      } catch (err) {
        console.error('Failed to load submissions', err)
      }
    }

    if (token) fetchCompletedProblems()
  }, [token])

  /* ---------------- LANGUAGE CHANGE ---------------- */

  useEffect(() => {
    setCode(DEFAULT_CODE[language])
  }, [language])

  /* ---------------- DEBUG LOGGING ---------------- */

  useEffect(() => {
    console.log('Current language:', language)
    console.log('Current code length:', code.length)
  }, [language, code])

  useEffect(() => {
    if (aiResult) {
      console.log('AI Result:', aiResult)
    }
  }, [aiResult])

  if (loadingProblems) {
    return (
      <Container className="p-5 text-center text-muted">
        <div
          className="spinner-border"
          role="status"
          style={{ color: "#ff7a00" }}
        >
          <span className="visually-hidden">Loading problem...</span>
        </div>
        <p className="mt-2">Loading problem statement…</p>
      </Container>
    )
  }

  const normalizedTestCases = selectedProblem?.testCases?.map((tc) => {
    const input = tc.input.trim()

    // Case 1: Already JSON → keep
    if (input.startsWith('[')) {
      return tc
    }

    // Case 2: nums=[...], target=number (Two Sum)
    const arrayMatches = input.match(/\[[^\]]*\]/g)
    const numberMatches = input.match(/-?\d+/g)

    if (arrayMatches && arrayMatches.length === 1 && numberMatches && numberMatches.length >= 2) {
      const nums = JSON.parse(arrayMatches[0])
      const target = Number(numberMatches[numberMatches.length - 1])

      return {
        ...tc,
        input: JSON.stringify([nums, target]),
      }
    }

    // Case 3: l1=[...], l2=[...] (Add Two Numbers)
    if (arrayMatches && arrayMatches.length >= 2) {
      return {
        ...tc,
        input: JSON.stringify(arrayMatches.map((arr) => JSON.parse(arr))),
      }
    }

    return tc
  })

  const handleAIGuidance = async () => {

    setAiLoading(true)

    try {

      const res = await fetch(`${baseURL}/api/aiEvaluate/code-help`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          language,
          code,
          problem: selectedProblem?.desc
        })
      })

      const data = await res.json()

      if (data.comments) {

        setCode(prev => {

          let lines = prev.split("\n")

          // Remove old AI hints
          lines = lines.filter(line =>
            !line.includes("👍") &&
            !line.includes("Next step") &&
            !line.includes("Hint:")
          )

          const openBraceIndex = lines.findIndex(l => l.includes("{"))

          if (openBraceIndex !== -1) {

            const comments = data.comments
              .split("\n")
              .map((c: string) => "  " + c)

            lines.splice(openBraceIndex + 1, 0, ...comments)
          }

          return lines.join("\n")
        })

      }

    } catch (err) {
      console.error("AI help failed", err)
    } finally {
      setAiLoading(false)
    }
  }

  /* ---------------- ACTIONS ---------------- */

  const handleRun = async () => {
    setShowTestPanel(true)
    setLoading(true)

    try {
      console.log('Running code for language:', language)
      console.log('Test cases:', selectedProblem?.testCases)

      const res = await fetch(`${baseURL}/api/aiEvaluate/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code,
          testCases: normalizedTestCases,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()
      console.log('Evaluation response:', data)
      setAiResult(data)
    } catch (error: any) {
      console.error('Evaluation error:', error)
      setAiResult({
        status: 'EVALUATED',
        language,
        summary: {
          totalTestCases: selectedProblem?.testCases.length,
          passed: 0,
          failed: selectedProblem?.testCases.length,
          passPercentage: 0,
        },
        testCaseResults: selectedProblem?.testCases.map((tc, index) => ({
          testCaseId: index + 1,
          status: 'FAIL',
          expected: JSON.parse(tc.output),
          received: null,
          message: error.message || 'Evaluation failed',
        })),
        feedback: {
          verdict: 'REJECTED',
          remarks: error.message || 'Evaluation failed',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = aiResult?.summary?.passPercentage >= PASS_THRESHOLD && ['ACCEPTED', 'PARTIALLY_ACCEPTED'].includes(aiResult?.feedback?.verdict)

  const handleSubmit = async () => {
    if (!canSubmit || !token) return

    setSubmitting(true)

    const payload = {
      problemId: selectedProblem?.id,
      problemTitle: selectedProblem?.title,
      language: language, // Use current language
      passPercentage: aiResult.summary.passPercentage,
      passed: aiResult.summary.passed,
      total: aiResult.summary.totalTestCases,
      verdict: aiResult.feedback.verdict,
      timeComplexity: aiResult.feedback.timeComplexity || 'Not calculated',
      spaceComplexity: aiResult.feedback.spaceComplexity || 'Not calculated',
      code,
    }

    try {
      const response = await fetch(`${baseURL}/api/ai/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      // Show success message
      alert('Solution submitted successfully!')
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit solution')
    } finally {
      setSubmitting(false)
    }
  }

  const passPercent = aiResult?.summary?.passPercentage || 0

  /* ---------------- UI ---------------- */

  return (
    <>
      <PageMetaData title="Problem Statement" />

      <Container fluid className="vh-100 p-0">
        <Row className="h-100 g-0">
          {/* ================= LEFT PANEL ================= */}
          <Col md={5} className="border-end h-100 d-flex flex-column p-0">
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as ActiveTab)} className="problem-tabs">
              <Tab
                eventKey="problemsList"
                title={
                  <>
                    <FiBookOpen /> Problems
                  </>
                }
              />
              <Tab
                eventKey="description"
                title={
                  <>
                    <FiFileText /> Description
                  </>
                }
              />
              <Tab
                eventKey="discussion"
                title={
                  <>
                    <FiMessageCircle /> Doubts
                  </>
                }
              />
              <Tab
                eventKey="submission"
                title={
                  <>
                    <FiUpload /> Submissions
                  </>
                }
              />
            </Tabs>

            <div className="flex-grow-1 overflow-auto p-3">
              {activeTab === 'problemsList' && (
                <ProblemsList
                  selectedId={selectedProblem?.id}
                  completedIds={completedIds}
                  onSelect={(p) => {
                    setIsProblemLoading(true)
                    setSelectedProblem(p)
                    setActiveTab('description')
                    // Reset code to default for new problem
                    setCode(DEFAULT_CODE[language])
                    setIsProblemLoading(false)
                  }}
                />
              )}

              {activeTab === 'submission' && <SubmissionList />}

              {activeTab === 'description' && (
                <>
                  <h4 className="fw-bold">
                    {selectedProblem?.id}. {selectedProblem?.title}
                  </h4>
                  <Badge
                    style={{
                      backgroundColor:
                        selectedProblem?.difficulty === 'Medium'
                          ? '#ff7a00'
                          : undefined,
                    }}
                    bg={
                      selectedProblem?.difficulty === 'Easy'
                        ? 'success'
                        : selectedProblem?.difficulty === 'Hard'
                          ? 'danger'
                          : undefined
                    }
                  >
                    {selectedProblem?.difficulty}
                  </Badge>

                  <p className="mt-3" style={{ whiteSpace: 'pre-line' }}>
                    {selectedProblem?.desc}
                  </p>

                  <h6 className="fw-semibold mt-3">Examples</h6>
                  {selectedProblem?.testCases.map((tc, idx) => (
                    <div key={idx} className="border rounded p-2 mb-2 bg-light">
                      <strong>Input:</strong> <pre>{tc.input}</pre>
                      <strong>Output:</strong> <pre>{tc.output}</pre>
                    </div>
                  ))}
                </>
              )}

              {activeTab === 'discussion' && selectedProblem && <Discussion problemId={selectedProblem?.id} />}
            </div>
          </Col>

          {/* ================= RIGHT PANEL ================= */}
          <Col md={7} className="d-flex flex-column p-0" style={{ height: '100%', minHeight: 0 }}>
            {/* Header */}
            <div className="border-bottom px-3 py-2 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h6 className="m-0">Code Editor</h6>
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#ff7a00',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '8px',
                  }}
                >
                  🔒 Submit unlocks at {PASS_THRESHOLD}% pass rate
                </span>
              </div>

              <Button
                size="sm"
                style={{
                  backgroundColor: '#ff7a00',
                  border: 'none',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleAIGuidance}
                disabled={aiLoading || !selectedProblem}
              >
                {aiLoading && (
                  <span className="spinner-border spinner-border-sm" role="status" />
                )}

                {aiLoading ? "Thinking..." : "🤖 AI Help"}
              </Button>

              {/* LANGUAGE SELECTOR */}
              <Dropdown align="end">
                <Dropdown.Toggle
                  size="sm"
                  variant="outline-secondary"
                  className="d-flex align-items-center"
                >
                  <span className="me-2">
                    {LANGUAGE_GROUPS.flat().find((l) => l.key === language)?.label}
                  </span>
                  <FiChevronDown />
                </Dropdown.Toggle>

                <Dropdown.Menu style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {LANGUAGE_GROUPS.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {groupIndex > 0 && <Dropdown.Divider />}
                      {group.map((lang) => (
                        <Dropdown.Item
                          key={lang.key}
                          onClick={() => setLanguage(lang.key as Language)}
                          active={language === lang.key}
                        >
                          {lang.label}
                        </Dropdown.Item>
                      ))}
                    </div>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>

            {/* Editor */}
            <div
              style={{
                height: showTestPanel ? '65%' : '100%',
                transition: 'height 0.2s ease',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                }}>
                {selectedProblem ? (
                  <CodeEditor language={language} value={code} onChange={setCode} />
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#888",
                      fontSize: "18px",
                      fontWeight: 500
                    }}
                  >
                    👈 Select a problem from the list to start coding
                  </div>
                )}
              </div>
            </div>

            {/* Test Result Panel */}
            {showTestPanel && (
              <div className="border-top d-flex flex-column" style={{ height: '35%' }}>
                <div className="d-flex align-items-center px-3 py-2 text-muted small">
                  <Tabs activeKey={testTab} onSelect={(k) => setTestTab(k as any)} className="border-0">
                    <Tab eventKey="result" title={<span className="fw-bold">Test Result</span>} />
                  </Tabs>

                  <Button size="sm" variant="link" className="ms-auto p-1" onClick={() => setShowTestPanel(false)}>
                    <FiChevronDown size={18} />
                  </Button>
                </div>

                <div className="flex-grow-1 overflow-auto px-3 pb-2">
                  <AIResultPanel result={aiResult} />
                </div>
              </div>
            )}

            {!showTestPanel && (
              <div className="border-top py-1 d-flex justify-content-center">
                <Button size="sm" variant="link" onClick={() => setShowTestPanel(true)}>
                  <FiChevronUp size={18} /> Show Testcases
                </Button>
              </div>
            )}

            {/* Footer */}
            {/* Footer */}
            <div className="border-top px-3 py-2 d-flex justify-content-between align-items-center">

              {/* Left Side - Status */}
              <div>
                {aiResult && (
                  <>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          aiResult.summary?.passPercentage >= PASS_THRESHOLD
                            ? '#198754'   // green when unlocked
                            : '#ff7a00',  // orange until unlocked
                        color: '#fff',
                      }}
                    >
                      {aiResult.summary?.passPercentage || 0}%{' '}
                      {aiResult.feedback?.verdict || 'NOT RUN'}
                    </span>

                    {/* 🔥 ADD THIS HERE */}
                    {aiResult && !canSubmit && (
                      <div>
                        <small style={{ color: '#ff7a00', fontWeight: 500 }}>
                          You need at least {PASS_THRESHOLD}% test cases to enable Submit.
                        </small>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Side - Buttons */}
              <div className="d-flex gap-2">
                <Button variant="secondary" onClick={handleRun} disabled={!canSubmit || submitting || !selectedProblem}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Running…
                    </>
                  ) : (
                    'Run'
                  )}
                </Button>

                <Button
                  style={{
                    backgroundColor: canSubmit ? '#ff7a00' : '#ffc999',
                    border: 'none',
                  }}
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Submitting…
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default ProblemStatement

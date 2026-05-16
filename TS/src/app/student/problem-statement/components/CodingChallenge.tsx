import { useEffect, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import ProblemsList from './ProblemsList'
import { Problem, fetchProblems } from './problems.data'

import Discussion from './Discussion/Discussion'
import CodeEditor from './CodeEditor'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Container, Row, Col, Tabs, Tab, Badge, Button, Dropdown, Modal } from 'react-bootstrap'
import AIResultPanel from './AIResultPanel'
import { FiFileText, FiBookOpen, FiMessageCircle, FiUpload } from 'react-icons/fi'
import './ProblemStatement.css'
import { useAuthContext } from '@/context/useAuthContext'
import SubmissionList from './SubmissionsTab'

/* ---------------- TYPES ---------------- */

type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'

type ActiveTab = 'problemsList' | 'submission'

/* ---------------- LANGUAGE OPTIONS ---------------- */

const LANGUAGE_GROUPS: { heading: string; items: { key: string; label: string; color: string }[] }[] = [
  {
    heading: 'Supported Languages',
    items: [
      { key: 'javascript', label: 'JavaScript', color: '#f7df1e' },
      { key: 'typescript', label: 'TypeScript', color: '#3178c6' },
      { key: 'python',     label: 'Python',     color: '#3572a5' },
      { key: 'java',       label: 'Java',       color: '#b07219' },
      { key: 'cpp',        label: 'C++',        color: '#f34b7d' },
      { key: 'c',          label: 'C',          color: '#555555' },
      { key: 'csharp',     label: 'C#',         color: '#178600' },
      { key: 'php',        label: 'PHP',        color: '#4f5b93' },
      { key: 'ruby',       label: 'Ruby',       color: '#cc342d' },
      { key: 'go',         label: 'Go',         color: '#00add8' },
      { key: 'rust',       label: 'Rust',       color: '#dea584' },
    ],
  },
]

const ALL_LANGUAGES = LANGUAGE_GROUPS.flatMap(g => g.items)

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

  /* ================= PHP ================= */
  php: `<?php
function solution($nums, $target) {
    // Write your code here
    return [];
}`,

  /* ================= RUBY ================= */
  ruby: `def solution(nums, target)
  # Write your code here
  []
end`,

  /* ================= GO ================= */
  go: `func solution(nums []int, target int) []int {
    // Write your code here
    return []int{}
}`,

  /* ================= RUST ================= */
  rust: `fn solution(nums: Vec<i32>, target: i32) -> Vec<i32> {
    // Write your code here
    vec![]
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDescTab, setModalDescTab] = useState<'description' | 'discussion'>('description')

  const PASS_THRESHOLD = 65

  /* ---------------- LOAD PROBLEMS ---------------- */

  useEffect(() => {
    if (!token) {
      console.log("⏳ Waiting for token...")
      return
    }

    const loadProblems = async () => {
      console.log("🚀 Calling fetchProblems with token:", token)

      setLoadingProblems(true)

      try {
        const data = await fetchProblems(token)  // ✅ FIX HERE
        setProblems(data)
      } catch (err) {
        console.error("❌ Failed to load problems", err)
      } finally {
        setLoadingProblems(false)
      }
    }

    loadProblems()
  }, [token]) // ✅ IMPORTANT

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
      try {
        const nums = JSON.parse(arrayMatches[0])
        const target = Number(numberMatches[numberMatches.length - 1])

        return {
          ...tc,
          input: JSON.stringify([nums, target]),
        }
      } catch (e) {
        console.error('Error parsing nums:', e)
        return tc
      }
    }

    // Case 3: Multiple arrays (e.g., Add Two Numbers, MST edges)
    if (arrayMatches && arrayMatches.length >= 2) {
      try {
        return {
          ...tc,
          input: JSON.stringify(arrayMatches.map((arr) => JSON.parse(arr))),
        }
      } catch (e) {
        console.error('Error parsing arrays:', e)
        return tc
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
        testCaseResults: selectedProblem?.testCases.map((tc, index) => {
          const expected = (() => {
            try {
              return JSON.parse(tc.output)
            } catch (e) {
              console.error('Error parsing output:', e)
              return tc.output
            }
          })()
          return {
            testCaseId: index + 1,
            status: 'FAIL',
            expected,
            received: null,
            message: error.message || 'Evaluation failed',
          }
        }),
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

  const closeModal = () => {
    setIsModalOpen(false)
    setShowTestPanel(false)
    setAiResult(null)
  }

  return (
    <>
      <PageMetaData title="Problem Statement" />

      {/* ================= MAIN PAGE — Problems list ================= */}
      <Container fluid className="py-3 px-4">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k as ActiveTab)}
          className="problem-tabs mb-3"
        >
          <Tab eventKey="problemsList" title={<><FiBookOpen className="me-1" />Problems</>} />
          <Tab eventKey="submission"   title={<><FiUpload className="me-1" />Submissions</>} />
        </Tabs>

        {activeTab === 'problemsList' && (
          <ProblemsList
            problems={problems}
            selectedId={selectedProblem?.id}
            completedIds={completedIds}
            onSelect={(p) => {
              setSelectedProblem(p)
              setCode(DEFAULT_CODE[language])
              setAiResult(null)
              setShowTestPanel(false)
              setModalDescTab('description')
              setIsModalOpen(true)
            }}
          />
        )}

        {activeTab === 'submission' && <SubmissionList />}
      </Container>

      {/* ================= FULLSCREEN MODAL — Coding environment ================= */}
      <Modal
        show={isModalOpen}
        onHide={closeModal}
        fullscreen
        dialogClassName="coding-modal"
      >
        <Modal.Header
          style={{ padding: '6px 16px', borderBottom: '1px solid #dee2e6', background: '#fff', minHeight: 'unset' }}
        >
          {/* Left: difficulty badge only */}
          <Badge
            style={{ backgroundColor: selectedProblem?.difficulty === 'Medium' ? '#ff7a00' : undefined }}
            bg={selectedProblem?.difficulty === 'Easy' ? 'success' : selectedProblem?.difficulty === 'Hard' ? 'danger' : undefined}
          >
            {selectedProblem?.difficulty}
          </Badge>

          {/* Right: lock badge + close */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="badge" style={{ backgroundColor: '#ff7a00', color: '#fff', fontSize: '0.7rem' }}>
              🔒 Submit unlocks at {PASS_THRESHOLD}%
            </span>
            <Button variant="outline-secondary" size="sm" onClick={closeModal}>✕</Button>
          </div>
        </Modal.Header>

        <Modal.Body className="p-0" style={{ display: 'flex', overflow: 'hidden', height: 'calc(100vh - 57px)' }}>
          <Row className="g-0 w-100 h-100">

            {/* ── LEFT: Description ── */}
            <Col md={5} className="border-end h-100 d-flex flex-column p-0">
              <Tabs
                activeKey={modalDescTab}
                onSelect={(k) => setModalDescTab(k as any)}
                className="problem-tabs"
              >
                <Tab eventKey="description" title={<><FiFileText className="me-1" />Description</>} />
                <Tab eventKey="discussion"  title={<><FiMessageCircle className="me-1" />Doubts</>} />
              </Tabs>

              <div className="flex-grow-1 overflow-auto p-3">
                {modalDescTab === 'description' && selectedProblem && (
                  <>
                    <h5 className="fw-bold mb-2">
                      {selectedProblem.id}. {selectedProblem.title}
                    </h5>
                    <p style={{ whiteSpace: 'pre-line' }}>{selectedProblem.desc}</p>
                    <h6 className="fw-semibold mt-3">Examples</h6>
                    {selectedProblem.testCases.map((tc, idx) => (
                      <div key={idx} className="border rounded p-2 mb-2 bg-light">
                        <strong>Input:</strong> <pre className="mb-1">{tc.input}</pre>
                        <strong>Output:</strong> <pre className="mb-0">{tc.output}</pre>
                      </div>
                    ))}
                  </>
                )}
                {modalDescTab === 'discussion' && selectedProblem && (
                  <Discussion problemId={selectedProblem.id} />
                )}
              </div>
            </Col>

            {/* ── RIGHT: Code editor ── */}
            <Col md={7} className="d-flex flex-column p-0 h-100">

              {/* Toolbar */}
              <div className="border-bottom px-3 py-2 d-flex align-items-center gap-2">
                <Button
                  size="sm"
                  style={{ backgroundColor: '#ff7a00', border: 'none', fontWeight: 500 }}
                  onClick={handleAIGuidance}
                  disabled={aiLoading}
                >
                  {aiLoading
                    ? <><span className="spinner-border spinner-border-sm me-1" />Thinking...</>
                    : '🤖 AI Help'}
                </Button>

                <Dropdown align="end" className="ms-auto">
                  <Dropdown.Toggle
                    size="sm"
                    variant="outline-secondary"
                    className="d-flex align-items-center gap-2"
                    style={{ borderRadius: 8, padding: '4px 12px', fontWeight: 500 }}
                  >
                    {(() => { const l = ALL_LANGUAGES.find(l => l.key === language); return l ? (
                      <>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
                        {l.label}
                      </>
                    ) : language })()}
                    <FiChevronDown size={13} />
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ minWidth: 200, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', padding: '6px 0' }}>
                    {LANGUAGE_GROUPS.map((group, gi) => (
                      <div key={gi}>
                        {gi > 0 && <Dropdown.Divider style={{ margin: '4px 0' }} />}
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '4px 14px 2px' }}>
                          {group.heading}
                        </div>
                        {group.items.map((lang) => (
                          <Dropdown.Item
                            key={lang.key}
                            onClick={() => setLanguage(lang.key as Language)}
                            active={language === lang.key}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', fontSize: '0.875rem', borderRadius: 6, margin: '1px 4px' }}
                          >
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: lang.color, flexShrink: 0, display: 'inline-block' }} />
                            {lang.label}
                            {language === lang.key && <span style={{ marginLeft: 'auto', color: '#ff7a00', fontSize: 12 }}>✓</span>}
                          </Dropdown.Item>
                        ))}
                      </div>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>

              {/* Editor area */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flex: showTestPanel ? '0 0 60%' : '1 1 100%', overflow: 'hidden', transition: 'flex 0.2s ease' }}>
                  <CodeEditor language={language} value={code} onChange={setCode} />
                </div>

                {/* Test result panel */}
                {showTestPanel && (
                  <div className="border-top d-flex flex-column" style={{ flex: '0 0 40%', minHeight: 0 }}>
                    <div className="d-flex align-items-center px-3 py-1 border-bottom">
                      <span className="fw-bold small">Test Result</span>
                      <Button size="sm" variant="link" className="ms-auto p-1" onClick={() => setShowTestPanel(false)}>
                        <FiChevronDown size={16} />
                      </Button>
                    </div>
                    <div className="flex-grow-1 overflow-auto px-3 py-2">
                      <AIResultPanel result={aiResult} />
                    </div>
                  </div>
                )}

                {!showTestPanel && aiResult && (
                  <div className="border-top py-1 d-flex justify-content-center">
                    <Button size="sm" variant="link" onClick={() => setShowTestPanel(true)}>
                      <FiChevronUp size={16} /> Show Results
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-top px-3 py-2 d-flex justify-content-between align-items-center">
                <div>
                  {aiResult && (
                    <>
                      <span className="badge" style={{
                        backgroundColor: aiResult.summary?.passPercentage >= PASS_THRESHOLD ? '#198754' : '#ff7a00',
                        color: '#fff',
                      }}>
                        {aiResult.summary?.passPercentage || 0}% {aiResult.feedback?.verdict || 'NOT RUN'}
                      </span>
                      {!canSubmit && (
                        <div>
                          <small style={{ color: '#ff7a00', fontWeight: 500 }}>
                            Need {PASS_THRESHOLD}% to unlock Submit
                          </small>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRun} disabled={loading || submitting}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-1" />Running…</>
                      : 'Run'}
                  </Button>
                  <Button
                    size="sm"
                    style={{ backgroundColor: canSubmit ? '#ff7a00' : '#ffc999', border: 'none' }}
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-1" />Submitting…</>
                      : 'Submit'}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default ProblemStatement

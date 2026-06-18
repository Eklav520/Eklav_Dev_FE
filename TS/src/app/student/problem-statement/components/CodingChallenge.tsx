import { useEffect, useRef, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import ProblemsList from './ProblemsList'
import { Problem, fetchProblems } from './problems.data'

import Discussion from './Discussion/Discussion'
import CodeEditor from './CodeEditor'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Container, Row, Col, Tabs, Tab, Badge, Button, Dropdown, Modal } from 'react-bootstrap'
import AIResultPanel from './AIResultPanel'
import AIGuidePanel from './AIGuidePanel'
import { FiFileText, FiBookOpen, FiMessageCircle, FiUpload, FiCpu } from 'react-icons/fi'
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
  const isPending = user?.status?.toLowerCase() === 'pending'

  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [isProblemLoading, setIsProblemLoading] = useState(false)

  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState(DEFAULT_CODE.javascript)

  const [showTestPanel, setShowTestPanel] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('problemsList')
  const [testTab, setTestTab] = useState<'result'>('result')
  const [completedIds, setCompletedIds] = useState<number[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [loadingProblems, setLoadingProblems] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDescTab, setModalDescTab] = useState<'description' | 'discussion' | 'ai-guide'>('description')
  const codeRef = useRef<string>(DEFAULT_CODE.javascript)

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
    if (!token) return

    const fetchCompletedProblems = async () => {
      try {
        const res = await fetch(`${baseURL}/api/ai/me`, { headers: { Authorization: `Bearer ${token}` } })
        const result = await res.json()
        if (!result.success) return
        const completed = result.data
          .filter((s: any) => s.verdict === 'ACCEPTED' && s.isBestSubmission === true)
          .map((s: any) => Number(s.problemId))
        setCompletedIds([...new Set<number>(completed)])
      } catch (err) {
        console.error('Failed to load submissions', err)
      }
    }

    fetchCompletedProblems()
  }, [token])

  /* ---------------- LANGUAGE CHANGE ---------------- */

  useEffect(() => {
    setCode(DEFAULT_CODE[language])
  }, [language])

  // Keep a ref so AIGuidePanel always reads the latest code without needing re-renders
  useEffect(() => { codeRef.current = code }, [code])
  const getCode = () => codeRef.current

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

      if (!response.ok) throw new Error('Submission failed')

      const saved = await response.json()
      setSubmissionResult({
        ...payload,
        attemptNumber: saved.data?.attemptNumber ?? 1,
        isBestSubmission: saved.data?.isBestSubmission ?? true,
        createdAt: saved.data?.createdAt ?? new Date().toISOString(),
      })
      setShowTestPanel(false)

      // Refresh completed IDs
      const meRes = await fetch(`${baseURL}/api/ai/me`, { headers: { Authorization: `Bearer ${token}` } })
      const meData = await meRes.json()
      if (meData.success) {
        const ids = meData.data
          .filter((s: any) => s.verdict === 'ACCEPTED' && s.isBestSubmission === true)
          .map((s: any) => Number(s.problemId))
        setCompletedIds([...new Set<number>(ids)])
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit solution. Please try again.')
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
    setSubmissionResult(null)
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
            isPending={isPending}
            onSelect={(p) => {
              setSelectedProblem(p)
              setCode(DEFAULT_CODE[language])
              setAiResult(null)
              setShowTestPanel(false)
              setSubmissionResult(null)
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

        <Modal.Body className="p-0" style={{ display: 'flex', overflow: 'hidden', height: 'calc(100vh - 57px)', position: 'relative' }}>
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
                <Tab eventKey="ai-guide"    title={<><FiCpu className="me-1" />AI Guide</>} />
              </Tabs>

              <div className="flex-grow-1 overflow-auto p-3" style={modalDescTab === 'ai-guide' ? { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : undefined}>
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
                {modalDescTab === 'ai-guide' && selectedProblem && (
                  <AIGuidePanel
                    problem={selectedProblem.desc}
                    problemTitle={selectedProblem.title}
                    language={language}
                    getCode={getCode}
                  />
                )}
              </div>
            </Col>

            {/* ── RIGHT: Code editor ── */}
            <Col md={7} className="d-flex flex-column p-0 h-100">

              {/* Toolbar */}
              <div className="border-bottom px-3 py-2 d-flex align-items-center gap-2">
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
          {/* ── Submission success overlay ── */}
          {submissionResult && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                background: '#111', border: '1px solid #222',
                borderRadius: 16, padding: '36px 40px', maxWidth: 480, width: '90%',
                textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}>
                {/* Icon */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: submissionResult.verdict === 'ACCEPTED'
                    ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 30,
                }}>
                  {submissionResult.verdict === 'ACCEPTED' ? '✅' : '⚡'}
                </div>

                {/* Headline */}
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6', marginBottom: 4 }}>
                  {submissionResult.verdict === 'ACCEPTED' ? 'Accepted!' : 'Partially Accepted'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 24 }}>
                  {selectedProblem?.title}
                </div>

                {/* Stats grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12, marginBottom: 24,
                }}>
                  {[
                    { label: 'Score', value: `${submissionResult.passPercentage}%`, color: submissionResult.verdict === 'ACCEPTED' ? '#22c55e' : '#f59e0b' },
                    { label: 'Tests Passed', value: `${submissionResult.passed}/${submissionResult.total}`, color: '#9ca3af' },
                    { label: 'Attempt', value: `#${submissionResult.attemptNumber}`, color: '#9ca3af' },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: '#1a1a1a', borderRadius: 10, padding: '12px 8px',
                      border: '1px solid #2a2a2a',
                    }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* Language + Best badge */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                  <span style={{
                    fontSize: '0.72rem', background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: 6, padding: '3px 10px', color: '#9ca3af', textTransform: 'capitalize',
                  }}>
                    {submissionResult.language}
                  </span>
                  {submissionResult.isBestSubmission && (
                    <span style={{
                      fontSize: '0.72rem', background: 'rgba(250,204,21,0.12)',
                      border: '1px solid rgba(250,204,21,0.3)', color: '#facc15',
                      borderRadius: 6, padding: '3px 10px', fontWeight: 700,
                    }}>
                      ⭐ Best Submission
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setSubmissionResult(null) }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid #2a2a2a',
                      background: '#1a1a1a', color: '#9ca3af', fontSize: '0.83rem',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Continue Coding
                  </button>
                  <button
                    onClick={() => {
                      closeModal()
                      setActiveTab('submission')
                    }}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                      background: '#ff7a00', color: '#fff', fontSize: '0.83rem',
                      fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  )
}

export default ProblemStatement

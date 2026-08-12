import { useEffect, useRef, useState } from 'react'
import PageMetaData from '@/components/PageMetaData'
import ProblemsList from './ProblemsList'
import { Problem, fetchProblems, fetchProblemById } from './problems.data'

import Discussion from './Discussion/Discussion'
import CodeEditor from './CodeEditor'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { Container, Row, Col, Tabs, Tab, Badge, Button, Dropdown, Modal } from 'react-bootstrap'
import AIResultPanel from './AIResultPanel'
import AIGuidePanel from './AIGuidePanel'
import { FiFileText, FiBookOpen, FiMessageCircle, FiUpload, FiCpu, FiList, FiCheckCircle, FiTrendingUp } from 'react-icons/fi'
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

type ActiveTab = 'problemsList' | 'submission' | 'bookmarked' | 'contests'

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
  const [timerSeconds, setTimerSeconds] = useState(3600)
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0)
  const [testPanelTab, setTestPanelTab] = useState<'testcases' | 'output'>('testcases')
  const codeRef = useRef<string>(DEFAULT_CODE.javascript)

  const PASS_THRESHOLD = 65

  /* ---------------- LOAD PROBLEMS ---------------- */

  useEffect(() => {
    if (!token) {
      return
    }

    const loadProblems = async () => {

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

  useEffect(() => {
    if (!isModalOpen) { setTimerSeconds(3600); setSelectedTestCaseIdx(0); return }
    const iv = setInterval(() => setTimerSeconds(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(iv)
  }, [isModalOpen])

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  if (loadingProblems) {
    return (
      <Container className="p-5 text-center">
        <div
          className="spinner-border"
          role="status"
          style={{ color: "#ff7a00" }}
        >
          <span className="visually-hidden">Loading problem...</span>
        </div>
        <p className="mt-2" style={{ color: '#64748b' }}>Loading problem statement…</p>
      </Container>
    )
  }

  const normalizedTestCases = selectedProblem?.testCases?.map((tc) => {
    const input = tc.input.trim()

    // Case 1: Already JSON → keep
    if (input.startsWith('[')) {
      return tc
    }

    // Operations-format inputs (e.g. "nums=[1,3,5], query(0,2)" or "update(1,2), query(0,2)")
    // must never go through the array/number rewriting below — that heuristic was written for
    // plain "nums=[...], target=N" problems and doesn't know about method calls at all. It just
    // counts arrays and numbers anywhere in the string, so a call like "query(0,2)" gets its own
    // digits swept up as if they were a trailing target value, mangling e.g.
    // "nums=[1,3,5], query(0,2)" into "[[1,3,5],2]" — silently destroying the method-call
    // structure the backend actually needs to run this as a stateful operations problem.
    if (/\w+\([^)]*\)/.test(input)) {
      return tc
    }

    // Any "key=value, key2=value2, ..." input (however many scalar params, alongside however
    // many arrays) is already the backend's own native convention — every wrapper's parser
    // (parseTopLevel/__parse_input/etc.) handles it directly. The array/number-counting
    // heuristic below was only ever a proxy for "1 array + 1 trailing scalar" (Two Sum-style)
    // and breaks the moment a problem has 2+ scalar params: it counts EVERY digit anywhere in
    // the string (including inside the array itself), so e.g. "arr=[1,2,3,4,5], k=4, x=3" (5
    // digits inside the array + 4 + 3 = 7 numbers) satisfies ">= 2" just as easily as a real
    // single-target case, and blindly keeps only the LAST number found — silently discarding
    // k=4 entirely and mangling the input into "[[1,2,3,4,5],3]". Trust the backend's own
    // parser for anything already in this format instead of re-guessing it here.
    if (input.includes('=')) {
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
          title: selectedProblem?.title,
          desc: selectedProblem?.desc,
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

  const successRate = problems.length > 0 ? ((completedIds.length / problems.length) * 100).toFixed(1) : '0.0'

  return (
    <>
      <PageMetaData title="Problem Statement" />

      {/* ================= MAIN PAGE ================= */}
      <Container fluid className="py-3 px-4">

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg, #ff7a00, #e85d00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(255,122,0,0.3)', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div>
              <h4 style={{ fontWeight: 800, color: 'var(--dash-text, #0f172a)', margin: 0, fontSize: '1.3rem', lineHeight: 1.2 }}>Code Challenge</h4>
              <p style={{ color: 'var(--dash-gray, #94a3b8)', fontSize: '0.75rem', margin: 0, marginTop: 2 }}>Practice real-world programming problems and improve your coding skills.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { icon: <FiList size={20} />,        value: problems.length.toLocaleString(),       label: 'Total Problems',   color: '#6366f1', bg: 'rgba(99,102,241,0.07)'  },
              { icon: <FiCheckCircle size={20} />, value: completedIds.length.toLocaleString(),   label: 'Solved Problems',  color: '#22c55e', bg: 'rgba(34,197,94,0.07)'   },
              { icon: <FiTrendingUp size={20} />,  value: `${successRate}%`,                      label: 'Success Rate',     color: '#f59e0b', bg: 'rgba(245,158,11,0.07)' },
            ].map(item => (
              <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.color}25`, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 130 }}>
                <span style={{ color: item.color, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: item.color, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 2 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--dash-border, #e2e8f0)', marginBottom: 22 }}>
          {([
            { key: 'problemsList', label: 'All Problems' },
            { key: 'submission',   label: 'My Submissions' },
            { key: 'bookmarked',   label: 'Bookmarked' },
            { key: 'contests',     label: 'Contests' },
          ] as { key: ActiveTab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: 'none', border: 'none', padding: '10px 22px', fontSize: '0.84rem',
                fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? '#ff7a00' : 'var(--dash-gray, #64748b)',
                borderBottom: activeTab === t.key ? '2.5px solid #ff7a00' : '2.5px solid transparent',
                cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>

        {activeTab === 'problemsList' && (
          <ProblemsList
            problems={problems}
            selectedId={selectedProblem?.id}
            completedIds={completedIds}
            isPending={isPending}
            onSelect={(p) => {
              // The list only carries title/difficulty (see fetchProblems) —
              // open the modal immediately with that, then fill in the real
              // desc/testCases once fetchProblemById resolves, preserving
              // the list's serial `id` (used elsewhere for tags/stats).
              setSelectedProblem(p)
              setCode(DEFAULT_CODE[language])
              setAiResult(null)
              setShowTestPanel(false)
              setSubmissionResult(null)
              setModalDescTab('description')
              setIsModalOpen(true)
              setIsProblemLoading(true)
              fetchProblemById(p._id, token).then((full) => {
                if (full) setSelectedProblem((prev) => (prev && prev._id === p._id ? { ...full, id: p.id } : prev))
              }).finally(() => setIsProblemLoading(false))
            }}
          />
        )}

        {activeTab === 'submission' && <SubmissionList />}

        {(activeTab === 'bookmarked' || activeTab === 'contests') && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--dash-gray, #94a3b8)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
            <div style={{ fontWeight: 700, color: 'var(--dash-text, #475569)', fontSize: '1rem', marginBottom: 6 }}>Coming Soon</div>
            <div style={{ fontSize: '0.82rem' }}>This section is under development.</div>
          </div>
        )}
      </Container>

      {/* ================= FULLSCREEN MODAL — Coding environment ================= */}
      <Modal show={isModalOpen} onHide={closeModal} fullscreen dialogClassName="coding-modal">
        <Modal.Body className="p-0" style={{ display: 'flex', overflow: 'hidden', height: '100vh', position: 'relative' }}>
          <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>

            {/* ── LEFT: Problem Description ── */}
            <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2d2d2d', height: '100%', overflow: 'hidden', background: '#1e1e1e' }}>

              {/* Back button — height matches the right panel's toolbar exactly */}
              <div style={{ height: 48, padding: '0 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #2d2d2d', flexShrink: 0, background: '#252526', boxSizing: 'border-box' }}>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to Problems
                </button>
              </div>

              {/* Content area — overflow:hidden so each tab controls its own scroll */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {selectedProblem && (() => {
                  const diffColor = selectedProblem.difficulty === 'Easy' ? '#16a34a' : selectedProblem.difficulty === 'Hard' ? '#dc2626' : '#f59e0b'
                  const diffBg    = selectedProblem.difficulty === 'Easy' ? 'rgba(22,163,74,0.15)' : selectedProblem.difficulty === 'Hard' ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)'
                  const ALL_T = ['Array','String','Hash Table','Two Pointers','Stack','Tree','BFS','DFS','Dynamic Programming','Linked List','Graph','Recursion','Sliding Window','Binary Search','Heap','Design','Backtracking','Greedy','Math','Queue']
                  const tags  = [ALL_T[selectedProblem.id % ALL_T.length], ALL_T[(selectedProblem.id * 3 + 7) % ALL_T.length]]
                  const solvedK   = `${(((selectedProblem.id * 53 + 7) % 80) + 10)}.${selectedProblem.id % 9}K`
                  const acceptPct = `${(((selectedProblem.id * 37 + 13) % 60) + 30).toFixed(2)}%`
                  return (
                    <>
                      {/* Problem header — fixed, never scrolls */}
                      <div style={{ padding: '14px 18px 12px', flexShrink: 0, background: '#252526', borderBottom: '1px solid #2d2d2d' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: '1.05rem' }}>{selectedProblem.title}</span>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: diffColor, background: diffBg, padding: '2px 9px', borderRadius: 20, flexShrink: 0 }}>{selectedProblem.difficulty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#9ca3af' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            Solved by {solvedK} users
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#22c55e' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                            {acceptPct} Acceptance
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {tags.map(tag => (
                            <span key={tag} style={{ fontSize: '0.63rem', background: '#2d2d2d', color: '#9ca3af', borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      {/* Description — always rendered; blurred when another tab is active */}
                      <div
                        className="coding-left-scroll"
                        style={{
                          flex: 1, overflowY: 'auto', padding: '16px 18px', background: '#1e1e1e',
                          filter: modalDescTab !== 'description' ? 'blur(3px)' : 'none',
                          transition: 'filter 0.2s ease',
                          pointerEvents: modalDescTab !== 'description' ? 'none' : 'auto',
                          userSelect: modalDescTab !== 'description' ? 'none' : 'auto',
                        }}
                      >
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>Problem Statement</div>
                        {isProblemLoading ? (
                          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 16 }}>Loading problem…</div>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.75, marginBottom: 16, whiteSpace: 'pre-line' }}>{selectedProblem.desc}</div>
                        )}
                        {selectedProblem.testCases.slice(0, 3).map((tc, idx) => (
                          <div key={idx} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Example {idx + 1}:</div>
                            <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '10px 14px', border: '1px solid #3c3c3c' }}>
                              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: '#a3b3c6' }}>Input: </span>
                                <code style={{ fontFamily: 'monospace', color: '#d4d4d4' }}>{tc.input}</code>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                                <span style={{ fontWeight: 700, color: '#a3b3c6' }}>Output: </span>
                                <code style={{ fontFamily: 'monospace', color: '#d4d4d4' }}>{tc.output}</code>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comments overlay — slides over blurred description */}
                      {modalDescTab === 'discussion' && (
                        <div style={{ position: 'absolute', inset: 0, top: 0, background: 'rgba(18,18,18,0.92)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                          <div className="coding-left-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', color: '#9ca3af' }}>
                            <Discussion problemId={selectedProblem.id} />
                          </div>
                        </div>
                      )}

                      {/* AI Guide overlay — slides over blurred description */}
                      {modalDescTab === 'ai-guide' && (
                        <div style={{ position: 'absolute', inset: 0, top: 0, background: 'rgba(18,18,18,0.92)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                          <AIGuidePanel problem={selectedProblem.desc} problemTitle={selectedProblem.title} language={language} getCode={getCode} />
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              {/* Bottom tabs — height matches the right panel's action bar exactly */}
              <div style={{ height: 46, borderTop: '1px solid #2d2d2d', display: 'flex', flexShrink: 0, background: '#252526', boxSizing: 'border-box' }}>
                {([
                  { key: 'description', icon: <FiFileText size={13}/>, label: 'Description' },
                  { key: 'discussion',  icon: <FiMessageCircle size={13}/>, label: 'Comments' },
                  { key: 'ai-guide',    icon: <FiCpu size={13}/>, label: 'AI Guide' },
                ] as { key: 'description'|'discussion'|'ai-guide'; icon: React.ReactNode; label: string }[]).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setModalDescTab(modalDescTab === t.key && t.key !== 'description' ? 'description' : t.key)}
                    style={{
                      flex: 1, height: '100%', padding: 0, background: 'none', border: 'none',
                      borderBottom: modalDescTab === t.key ? '2.5px solid #ff7a00' : '2.5px solid transparent',
                      color: modalDescTab === t.key ? '#ff7a00' : '#9ca3af',
                      fontWeight: modalDescTab === t.key ? 700 : 400,
                      fontSize: '0.75rem', cursor: 'pointer', marginBottom: -1, boxSizing: 'border-box',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}
                  >{t.icon}{t.label}</button>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Code Editor ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#1e1e1e' }}>

              {/* Toolbar — height matches the left panel's back-button bar exactly */}
              <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #2d2d2d', background: '#252526', flexShrink: 0, boxSizing: 'border-box' }}>

                <div style={{ flex: 1 }} />

                {/* Language dropdown */}
                <Dropdown style={{ display: 'flex', alignItems: 'center', height: 36, marginTop: 6 }}>
                  <Dropdown.Toggle
                    className="coding-toolbar-btn"
                    bsPrefix="btn"
                    style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.78rem', background: '#3c3c3c', border: '1px solid #555', color: '#d4d4d4', gap: 8 }}
                  >
                    <span style={{ color: '#9ca3af', fontWeight: 500 }}>Language:</span>
                    {(() => { const l = ALL_LANGUAGES.find(l => l.key === language); return l ? (
                      <><span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} /><span>{l.label}</span></>
                    ) : <span>{language}</span> })()}
                    <FiChevronDown size={12} style={{ marginLeft: 2 }} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ minWidth: 200, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', border: '1px solid #3c3c3c', padding: '6px 0', background: '#252526' }}>
                    {LANGUAGE_GROUPS.map((group, gi) => (
                      <div key={gi}>
                        {gi > 0 && <Dropdown.Divider style={{ margin: '4px 0', borderColor: '#3c3c3c' }} />}
                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '4px 14px 2px' }}>{group.heading}</div>
                        {group.items.map(lang => (
                          <Dropdown.Item key={lang.key} onClick={() => setLanguage(lang.key as Language)} active={language === lang.key}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', fontSize: '0.82rem', color: '#d4d4d4', background: language === lang.key ? '#3c3c3c' : 'transparent', borderRadius: 4, margin: '1px 4px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color, flexShrink: 0 }} />
                            {lang.label}
                            {language === lang.key && <span style={{ marginLeft: 'auto', color: '#ff7a00', fontSize: 11 }}>✓</span>}
                          </Dropdown.Item>
                        ))}
                      </div>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                {/* Submit Solution */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="coding-toolbar-btn"
                  style={{ background: canSubmit ? '#ff7a00' : '#555', border: 'none', borderRadius: 8, padding: '0 18px', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: canSubmit ? 'pointer' : 'not-allowed', gap: 6 }}
                >
                  {submitting ? <><span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} /> Submitting…</> : 'Submit Solution'}
                </button>
              </div>

              {/* Code Editor */}
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <CodeEditor language={language} value={code} onChange={setCode} />
              </div>

              {/* Action bar — height matches the left panel's bottom tabs exactly */}
              <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', borderTop: '1px solid #2d2d2d', background: '#252526', flexShrink: 0, boxSizing: 'border-box' }}>
                <button onClick={handleRun} disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: '1px solid #444', background: '#3c3c3c', color: loading ? '#888' : '#d4d4d4', fontSize: '0.75rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderColor: '#888', borderTopColor: '#888' }} /> : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                  {loading ? 'Running…' : 'Run Code'}
                </button>
                <button onClick={() => setShowTestPanel(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: '1px solid #444', background: showTestPanel ? '#ff7a0022' : '#3c3c3c', color: showTestPanel ? '#ff7a00' : '#d4d4d4', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Test Cases
                </button>

                <div style={{ flex: 1 }} />
              </div>

              {/* Test Cases Panel */}
              {showTestPanel && (
                <div style={{ height: 280, borderTop: '1px solid #2d2d2d', display: 'flex', flexDirection: 'column', background: '#1e1e1e', flexShrink: 0 }}>

                  {/* Panel tabs */}
                  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2d2d2d', padding: '0 16px', background: '#252526', flexShrink: 0 }}>
                    <button
                      style={{ padding: '8px 14px', background: 'none', border: 'none', borderBottom: '2px solid #ff7a00', color: '#ff7a00', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', marginBottom: -1 }}>
                      Test Cases
                    </button>
                    <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.68rem', cursor: 'pointer' }}>
                      View All Test Cases
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </button>
                    <button onClick={() => setShowTestPanel(false)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                      <FiChevronDown size={15} />
                    </button>
                  </div>

                  {/* Panel body: test case list + detail */}
                  <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Test case list */}
                    <div style={{ width: 160, borderRight: '1px solid #2d2d2d', overflowY: 'auto', background: '#1e1e1e' }}>
                      {selectedProblem?.testCases.map((_, idx) => {
                        const res = aiResult?.testCaseResults?.[idx]
                        const isLocked = isPending && idx >= 3
                        const passed = res?.status === 'PASS'
                        const failed  = res && res.status !== 'PASS'
                        return (
                          <div key={idx} onClick={() => setSelectedTestCaseIdx(idx)}
                            style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #2d2d2d', background: selectedTestCaseIdx === idx ? '#2d2d2d' : 'transparent', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700,
                              background: isLocked ? '#2d2d2d' : passed ? '#22c55e' : failed ? '#ef4444' : '#374151',
                              color: isLocked ? '#555' : '#fff',
                              border: isLocked ? '1px solid #444' : 'none',
                            }}>
                              {isLocked ? '🔒' : passed ? '✓' : failed ? '✕' : String(idx + 1)}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: selectedTestCaseIdx === idx ? '#e2e8f0' : '#9ca3af', fontWeight: selectedTestCaseIdx === idx ? 600 : 400 }}>
                              Test Case {idx + 1}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Test case detail */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', background: '#1e1e1e' }}>
                      {selectedProblem?.testCases[selectedTestCaseIdx] && (
                        <>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input</div>
                            <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                              {selectedProblem.testCases[selectedTestCaseIdx].input}
                            </div>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Output</div>
                            <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#e2e8f0' }}>
                              {selectedProblem.testCases[selectedTestCaseIdx].output}
                            </div>
                          </div>
                          {loading && (
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Output</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2d2d2d', border: '1px solid #3c3c3c', borderRadius: 8, padding: '10px 14px', fontSize: '0.75rem', color: '#9ca3af' }}>
                                <span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13, borderColor: '#9ca3af', borderTopColor: 'transparent' }} />
                                Running your code…
                              </div>
                            </div>
                          )}
                          {!loading && aiResult?.testCaseResults?.[selectedTestCaseIdx] && (
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Output</div>
                              <div style={{ background: aiResult.testCaseResults[selectedTestCaseIdx].status === 'PASS' ? '#14532d33' : '#7f1d1d33', border: `1px solid ${aiResult.testCaseResults[selectedTestCaseIdx].status === 'PASS' ? '#22c55e44' : '#ef444444'}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.75rem', color: aiResult.testCaseResults[selectedTestCaseIdx].status === 'PASS' ? '#4ade80' : '#f87171' }}>
                                {(() => {
                                  const received = aiResult.testCaseResults[selectedTestCaseIdx].received
                                  if (received === null || received === undefined) return 'null'
                                  return typeof received === 'string' ? received : JSON.stringify(received)
                                })()}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status footer */}
                  {aiResult && (
                    <div style={{ borderTop: '1px solid #2d2d2d', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 28, background: '#252526', flexShrink: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#22c55e', fontWeight: 600 }}>
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#fff', fontWeight: 900 }}>✓</span>
                        Passed: {aiResult.summary?.passed}/{aiResult.summary?.totalTestCases} test cases
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Runtime: {aiResult.runtime || '—'}</span>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Memory: {aiResult.memory || '—'}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
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

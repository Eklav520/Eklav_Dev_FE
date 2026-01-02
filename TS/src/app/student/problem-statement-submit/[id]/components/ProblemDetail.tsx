import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CodeEditor from './CodeEditor'

interface TestCase {
  input: string
  expectedOutput: string
}

interface TechOption {
  language: string
  template: string
}

interface Problem {
  _id: string
  title: string
  description?: string
  techOptions: TechOption[]
  testCases: TestCase[]
}

interface TestResult {
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
}

export default function ProblemDetail() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { id } = useParams()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [results, setResults] = useState<TestResult[]>([])

  useEffect(() => {
    if (!id) return
    fetch(`${baseURL}/admin/problems/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProblem(data)
        if (data.techOptions?.length > 0) {
          setLanguage(data.techOptions[0]) // Set default from backend
        }
      })
  }, [id])

  const submitCode = async () => {
    const response = await fetch(`${baseURL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: id,
        code,
        language,
      }),
    })

    if (response.ok) {
      const submission = await response.json()
      setResults(submission.result)
    }
  }

  const copyToConsole = () => {
    if (!problem?.testCases?.[0]) return
    const test = problem.testCases[0]
    const snippet = `console.log(firstNonRepeatingChar(${test.input}));`
    setCode((prev) => prev + `\n\n// Sample Test\n${snippet}`)
  }

  if (!problem) return <p>Loading...</p>

  const unescape = (val: string): string => {
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }

  return (
    <div className="container mt-0">
      <h3>{problem.title}</h3>
      <p>{problem.description}</p>

      {problem.testCases.map((tc, i) => (
        <div key={i} className="alert alert-info">
          <strong>Sample Input:</strong> <code>{unescape(tc.input)}</code>
          <br />
          <strong>Expected Output:</strong> <code>{unescape(tc.expectedOutput)}</code>
          <br />
          <button className="btn btn-sm btn-outline-primary mt-2" onClick={copyToConsole}>
            Insert test in console
          </button>
        </div>
      ))}

      <select
        className="form-control mb-2"
        value={language}
        onChange={(e) => {
          const selectedLang = e.target.value
          setLanguage(selectedLang)
          const selectedTemplate =
            typeof problem.techOptions[0] === 'string' ? '' : problem.techOptions.find((opt: any) => opt.language === selectedLang)?.template || ''
          setCode(selectedTemplate)
        }}>
        {problem.techOptions.map((opt: any, i) => {
          const lang = typeof opt === 'string' ? opt : opt.language
          return (
            <option key={i} value={lang}>
              {lang}
            </option>
          )
        })}
      </select>

      <CodeEditor language={language} code={code} setCode={setCode} />

      <button className="btn btn-success mt-3" onClick={submitCode}>
        Run Code
      </button>

      <h5 className="mt-4">Results</h5>
      {results.map((res, idx) => (
        <div key={idx} className="alert alert-secondary">
          <strong>Input:</strong> {unescape(res.input)} <br />
          <strong>Expected:</strong> {unescape(res.expectedOutput)} <br />
          <strong>Actual:</strong> {unescape(res.actualOutput)} <br />
          <strong>Status:</strong> {res.passed ? '✅ Passed' : '❌ Failed'}
        </div>
      ))}
    </div>
  )
}

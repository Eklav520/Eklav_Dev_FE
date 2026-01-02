import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CodeEditor from './CodeEditor'
import { Tabs, Tab, Nav } from 'react-bootstrap'

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
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { id } = useParams()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [results, setResults] = useState<TestResult[]>([])

  useEffect(() => {
    const fetchProblem = async () => {
      const response = await fetch(`${baseURL}/problems/${id}`)
      const data = await response.json()
      setProblem(data)
    }
    fetchProblem()
  }, [id])

  const handleLanguageChange = (selectedLang: string) => {
    setLanguage(selectedLang)

    let template = ''
    switch (selectedLang) {
      case 'javascript':
        template = `function firstProgram(str) {\n  // your code here\n}\n\nconsole.log("Welcome")`
        break
      case 'java':
        template = `public class Solution {\n  public static void main(String[] args) {\n    System.out.println("Welcome");\n  }\n}`
        break
      case 'python':
        template = `def first_program(str):\n    # your code here\n    pass\n\nprint("Welcome")`
        break
      case 'cpp':
        template = `#include<iostream>\nusing namespace std;\n\nint main() {\n    cout << "Welcome" << endl;\n    return 0;\n}`
        break
      case 'csharp':
        template = `using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Welcome");\n  }\n}`
        break
      default:
        template = '// Start coding...'
    }

    setCode(template)
  }

  const submitCode = async () => {
    const response = await fetch(`${baseURL}/compiler`, {
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

  const unescape = (val: string): string => {
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }

  const LANGUAGES = ['c', 'cpp','java','javascript', 'typescript', 'python', 'python2', 'csharp', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift']

  return (
    <div className="container mt-1">
      {/* <div className="mb-4">
        <h3 className="mb-1 text-primary">🧠 {problem?.title || 'Loading problem...'}</h3>
        {problem?.description && <p className="text-muted border-start ps-3">{problem.description}</p>}
      </div> */}
      <h3>Compiler</h3>
      <Nav variant="tabs" className="mb-3">
        {LANGUAGES.map((lang) => (
          <Nav.Item key={lang}>
            <Nav.Link eventKey={lang} active={language === lang} onClick={() => handleLanguageChange(lang)} style={{ textTransform: 'capitalize' }}>
              {lang}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <CodeEditor language={language} code={code} setCode={setCode} />

      <button className="btn btn-success mt-3" onClick={submitCode}>
        Run Code
      </button>

      <h5 className="mt-4 text-primary">Test Results</h5>

      {results.map((res, idx) => (
        <div key={idx} className={`alert ${res.passed ? 'alert-success' : 'alert-danger'}`}>
          {/* <strong>Input:</strong> {res.input} <br />
          <strong>Expected:</strong> {res.expectedOutput} <br /> */}
          <strong>Output:</strong> <br />
          {unescape(res.actualOutput)} {res.passed ? '✅' : '❌'}
          <br />
        </div>
      ))}
    </div>
  )
}

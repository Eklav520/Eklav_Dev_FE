import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '@/context/useAuthContext';
import CodeEditor from './CodeEditor';

interface Problem {
  _id: string;
  title: string;
  description?: string;
  techOptions: string[];
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

export default function ProblemDetail() {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { id } = useParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (!id || !token) return;
    fetch(`${baseURL}/admin/problems/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => setProblem(data));
  }, [id, token]);

  const submitCode = async () => {
    if (!token) return;

    const response = await fetch(`${baseURL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        problemId: id,
        code,
        language
      })
    });

    if (response.ok) {
      const submission = await response.json();
      setResults(submission.result);
    }
  };

  if (!problem) return <p>Loading...</p>;

  return (
    <div className="container mt-4">
      <h3>{problem.title}</h3>
      <p>{problem.description}</p>

      <select className="form-control mb-2" value={language} onChange={(e) => setLanguage(e.target.value)}>
        {problem.techOptions.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>
            {opt}
          </option>
        ))}
      </select>

      <CodeEditor language={language} code={code} setCode={setCode} />

      <button className="btn btn-success mt-3" onClick={submitCode}>
        Run Code
      </button>

      <h5 className="mt-4">Results</h5>
      {results.map((res, idx) => (
        <div key={idx} className="alert alert-secondary">
          <strong>Input:</strong> {res.input} <br />
          <strong>Expected:</strong> {res.expectedOutput} <br />
          <strong>Actual:</strong> {res.actualOutput} <br />
          <strong>Status:</strong> {res.passed ? '✅ Passed' : '❌ Failed'}
        </div>
      ))}
    </div>
  )
}

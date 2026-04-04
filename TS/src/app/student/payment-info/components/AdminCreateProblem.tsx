import React, { useState } from 'react';
import { useAuthContext } from '@/context/useAuthContext';

interface TestCase {
  input: string;
  expectedOutput: string;
  type: string;
}

interface ProblemForm {
  title: string;
  description: string;
  techOptions: string[];
  testCases: TestCase[];
}

export default function AdminCreateProblem() {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [form, setForm] = useState<ProblemForm>({
    title: '',
    description: '',
    techOptions: [],
    testCases: [],
  });

  const [testCase, setTestCase] = useState<TestCase>({
    input: '',
    expectedOutput: '',
    type: 'positive',
  });

  const handleSubmit = async () => {
    if (!token) return;

    const response = await fetch(`${baseURL}/admin/create-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      alert('Problem created!');
      setForm({ title: '', description: '', techOptions: [], testCases: [] });
    }
  };

  const addTestCase = () => {
    setForm({ ...form, testCases: [...form.testCases, testCase] });
    setTestCase({ input: '', expectedOutput: '', type: 'positive' });
  };

  return (
    <div className="container mt-4">
      <h3>Create Coding Problem</h3>
      <input
        placeholder="Title"
        className="form-control mb-2"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        placeholder="Description"
        className="form-control mb-2"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      ></textarea>
      <input
        placeholder="Tech (comma-separated)"
        className="form-control mb-2"
        onChange={(e) =>
          setForm({ ...form, techOptions: e.target.value.split(',').map(t => t.trim()) })
        }
      />

      <h5>Add Test Case</h5>
      <input
        placeholder="Input"
        className="form-control mb-2"
        value={testCase.input}
        onChange={(e) => setTestCase({ ...testCase, input: e.target.value })}
      />
      <input
        placeholder="Expected Output"
        className="form-control mb-2"
        value={testCase.expectedOutput}
        onChange={(e) =>
          setTestCase({ ...testCase, expectedOutput: e.target.value })
        }
      />
      <select
        className="form-control mb-2"
        value={testCase.type}
        onChange={(e) => setTestCase({ ...testCase, type: e.target.value })}
      >
        <option value="positive">Positive</option>
        <option value="negative">Negative</option>
      </select>
      <button className="btn btn-sm btn-secondary mb-3" onClick={addTestCase}>
        Add Test Case
      </button>

      <button className="btn btn-primary" onClick={handleSubmit}>
        Create Problem
      </button>
    </div>
  );
}

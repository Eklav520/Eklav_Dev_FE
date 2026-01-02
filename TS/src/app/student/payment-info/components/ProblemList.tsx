import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Problem {
  _id: string;
  title: string;
}

export default function ProblemList() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    fetch(`${baseURL}/admin/problems`)
      .then(res => res.json())
      .then(data => setProblems(data));
  }, []);

  return (
    <div className="container mt-4">
      <h3>Available Problems</h3>
      <ul className="list-group">
        {problems.map(p => (
          <li key={p._id} className="list-group-item">
            <Link to={`/problem/${p._id}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

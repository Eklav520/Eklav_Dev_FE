import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/context/useAuthContext';

interface Problem {
  _id: string;
  title: string;
}

export default function ProblemList() {
  const { user } = useAuthContext();
  const token = user?.token;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    if (!token) return;

    fetch(`${baseURL}/admin/problems`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => setProblems(data));
  }, [token]);

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

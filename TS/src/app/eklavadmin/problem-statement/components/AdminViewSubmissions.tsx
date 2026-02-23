import React, { useState } from 'react';

const AdminViewSubmissions: React.FC = () => {
  const [challengeId, setChallengeId] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const fetchSubmissions = async () => {
  try {
    const res = await fetch(`${baseURL}/admin/submissions/${challengeId}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setSubmissions(data);
    } else {
      setSubmissions([]); // fallback if data is not array
      console.error("Unexpected response:", data);
    }
  } catch (err) {
    console.error("Failed to fetch submissions", err);
    setSubmissions([]);
  }
};


  const giveFeedback = async (id: string, feedback: string, score: number) => {
    await fetch(`${baseURL}/admin/submission/${id}/feedback`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback, score })
    });
    alert('Feedback submitted');
    fetchSubmissions(); // Refresh
  };

  return (
    <div>
      <h2>Admin: View Submissions</h2>
      <input
        value={challengeId}
        onChange={(e) => setChallengeId(e.target.value)}
        placeholder="Challenge ID"
      />
      <button onClick={fetchSubmissions}>View</button>

      {submissions.map((sub) => (
        <div key={sub._id}>
          <h4>{sub.userId}</h4>
          <pre>{sub.code}</pre>
          <input
            placeholder="Feedback"
            onChange={(e) => (sub.feedback = e.target.value)}
          />
          <input
            type="number"
            placeholder="Score"
            onChange={(e) => (sub.score = Number(e.target.value))}
          />
          <button onClick={() => giveFeedback(sub._id, sub.feedback, sub.score)}>
            Submit Feedback
          </button>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default AdminViewSubmissions;

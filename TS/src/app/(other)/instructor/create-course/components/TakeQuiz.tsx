import React, { useEffect, useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: string; // Optional, may not be returned from backend
}

interface QuizResult {
  score: number;
  total: number;
}

interface TakeQuizProps {
  courseId: string;
}

const TakeQuiz: React.FC<TakeQuizProps> = ({ courseId }) => {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const baseURL = import.meta.env.VITE_API_BASE_URL;


  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${baseURL}/courses/${courseId}`);
        const data = await response.json();
        setQuiz(data.quiz || []);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
      }
    };

    fetchQuiz();
  }, [courseId]);

  const handleChange = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async () => {
    const formattedAnswers = quiz.map((q, i) => ({
      question: q.question,
      selectedOption: answers[i] || ''
    }));

    try {
      const response = await fetch(`${baseURL}/courses/${courseId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      const data: QuizResult = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Quiz submission failed:', error);
    }
  };

  return (
    <div>
      <h2>Course Quiz</h2>
      {quiz.map((q, index) => (
        <div key={index}>
          <p>{q.question}</p>
          {q.options.map((opt, idx) => (
            <label key={idx} style={{ display: 'block' }}>
              <input
                type="radio"
                name={`question-${index}`}
                value={opt}
                checked={answers[index] === opt}
                onChange={() => handleChange(index, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit Quiz</button>

      {result && (
        <div>
          <h4>Score: {result.score} / {result.total}</h4>
        </div>
      )}
    </div>
  );
};

export default TakeQuiz;

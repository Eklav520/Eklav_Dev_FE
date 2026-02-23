import React, { useEffect, useState } from 'react';
import { ListGroup, Badge, Button } from 'react-bootstrap';
import axios from 'axios';

interface Props {
  companyId: string;
  studentId: string;
  rounds: string[];
  onSelectRound: (roundName: string) => void;
}

interface Progress {
  roundName: string;
  score: number;
  passed: boolean;
}

const StudentRoundSelector: React.FC<Props> = ({ companyId, studentId, rounds, onSelectRound }) => {
  const [progress, setProgress] = useState<Progress[]>([]);
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${baseURL}/student/progress/${studentId}/${companyId}`)
      .then(res => setProgress(res.data));
  }, [companyId, studentId]);

  const isRoundUnlocked = (round: string, index: number) => {
    if (index === 0) return true;
    const prevRound = rounds[index - 1];
    const prev = progress.find(p => p.roundName === prevRound);
    return prev?.passed;
  };

  const getStatusBadge = (round: string) => {
    const p = progress.find(p => p.roundName === round);
    if (!p) return <Badge bg="secondary">Not started</Badge>;
    return p.passed
      ? <Badge bg="success">Passed ({p.score}%)</Badge>
      : <Badge bg="danger">Failed ({p.score}%)</Badge>;
  };

  return (
    <ListGroup className="mb-4">
      {rounds.map((round, index) => {
        const unlocked = isRoundUnlocked(round, index);
        return (
          <ListGroup.Item key={round} className="d-flex justify-content-between align-items-center">
            <div>{round}</div>
            <div>
              {getStatusBadge(round)}{' '}
              <Button
                size="sm"
                onClick={() => onSelectRound(round)}
                disabled={!unlocked}
                variant={unlocked ? "primary" : "secondary"}
              >
                {unlocked ? 'Attempt' : 'Locked'}
              </Button>
            </div>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
};

export default StudentRoundSelector;

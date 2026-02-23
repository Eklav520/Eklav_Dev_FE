// AdminReview.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Alert, Form, Row, Col, ListGroup } from 'react-bootstrap';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

type Flags = { looksGenuine: boolean|null; suspectedCheating: boolean; duplicateFace: boolean };
type Review = {
  status: 'pending'|'under_review'|'passed'|'failed';
  score?: number; maxScore?: number;
  feedback?: string; failReasons?: string[];
  flags: Flags; rubric?: any; reviewedBy?: string; reviewedAt?: string;
};

export default function AdminReview() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [sub, setSub] = useState<any>(null);

  const [score, setScore] = useState<number | ''>('');
  const [maxScore, setMaxScore] = useState<number | ''>('');
  const [feedback, setFeedback] = useState('');
  const [failReasons, setFailReasons] = useState<string[]>([]);
  const [flags, setFlags] = useState<Flags>({ looksGenuine: null, suspectedCheating:false, duplicateFace:false });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/reviews/${id}`, { credentials:'include' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Load failed');
        setSub(json.submission);
        const r:Review = json.submission.review || {};
        setScore(r.score ?? '');
        setMaxScore(r.maxScore ?? '');
        setFeedback(r.feedback ?? '');
        setFailReasons(r.failReasons ?? []);
        setFlags(r.flags ?? { looksGenuine:null, suspectedCheating:false, duplicateFace:false });
      } catch (e:any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function startReview() {
    await fetch(`${API_BASE}/api/admin/reviews/${id}/start`, { method:'POST', credentials:'include' });
    setSub((s:any) => ({ ...s, review:{ ...s.review, status:'under_review' } }));
  }

  async function saveDraft() {
    await fetch(`${API_BASE}/api/admin/reviews/${id}/score`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      credentials:'include',
      body: JSON.stringify({
        score: score === '' ? undefined : Number(score),
        maxScore: maxScore === '' ? undefined : Number(maxScore),
        feedbackDraft: feedback,
        looksGenuine: flags.looksGenuine,
        suspectedCheating: flags.suspectedCheating,
        duplicateFace: flags.duplicateFace,
      })
    });
  }

  async function finalize(status:'passed'|'failed') {
    await fetch(`${API_BASE}/api/admin/reviews/${id}/decision`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json' },
      credentials:'include',
      body: JSON.stringify({
        status,
        score: score === '' ? undefined : Number(score),
        maxScore: maxScore === '' ? undefined : Number(maxScore),
        feedback,
        failReasons: status==='failed' ? failReasons : []
      })
    });
    nav('/admin/reviews'); // back to list
  }

  const meta = useMemo(() => {
    if (!sub) return {};
    switch (sub.examType) {
      case 'quiz': return {
        title: 'Quiz Submission',
        auto: `${sub.autoScore ?? 0}/${sub.autoMax ?? sub?.quiz?.totalQuestions ?? '?'}`
      };
      case 'code': return {
        title: 'Code Challenge Submission',
        auto: `${sub?.code?.judgeResult?.passedCount ?? 0}/${sub?.code?.judgeResult?.total ?? '?'} tests`
      };
      case 'tr': return { title: 'Technical Round Submission' };
      case 'hr': return { title: 'HR Round Submission' };
      default: return {};
    }
  }, [sub]);

  if (loading) return <Spinner />;
  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!sub) return <Alert>No data</Alert>;

  const r:Review = sub.review || { status:'pending', flags:{ looksGenuine:null, suspectedCheating:false, duplicateFace:false } };

  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{meta.title} <Badge bg="secondary">{r.status}</Badge></h4>
        {r.status === 'pending' && <Button onClick={startReview}>Start review</Button>}
      </div>

      <Row className="g-3">
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header>Submission</Card.Header>
            <Card.Body>
              <p><b>Student:</b> {sub.studentId}</p>
              <p><b>Type:</b> {sub.examType}</p>
              {meta.auto && <p><b>Auto-grade:</b> {meta.auto}</p>}

              {sub.examType === 'quiz' && (
                <>
                  <h6>Answers</h6>
                  <ListGroup>
                    {(sub.quiz?.answers || []).map((a:any, i:number) => {
                      const key = sub.quiz?.answerKeySnapshot?.find((k:any)=>k.questionId===a.questionId)?.correctKey;
                      const correct = key && key === a.selectedKey;
                      return (
                        <ListGroup.Item key={i}>
                          Q#{i+1}: Selected <b>{a.selectedKey || '-'}</b> {key ? <>| Correct <b>{key}</b> {correct ? <Badge bg="success" className="ms-2">✔</Badge> : <Badge bg="danger" className="ms-2">✖</Badge>}</> : null}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </>
              )}

              {sub.examType === 'code' && (
                <>
                  <h6>Judge Results</h6>
                  <ListGroup>
                    {(sub.code?.judgeResult?.tests || []).map((t:any, i:number) => (
                      <ListGroup.Item key={i}>
                        {t.name} — {t.passed ? <Badge bg="success">PASS</Badge> : <Badge bg="danger">FAIL</Badge>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}

              {(sub.examType === 'tr' || sub.examType === 'hr') && (
                <>
                  <h6>Responses</h6>
                  <ListGroup>
                    {(sub[sub.examType]?.answers || []).map((it:any, i:number) => (
                      <ListGroup.Item key={i}>
                        <div><b>Q:</b> {it.question}</div>
                        <div><b>A:</b> {it.answer}</div>
                        {it.feedbackAI && <div className="text-muted"><small>AI Note: {it.feedbackAI}</small></div>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
            </Card.Body>
          </Card>

          {sub.videoPath && (
            <Card className="mb-3">
              <Card.Header>Recording</Card.Header>
              <Card.Body>
                {/* use the direct URL you return from backend */}
                <video src={sub.videoPath} controls style={{ width:'100%', borderRadius:12 }} />
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={4}>
          <Card className="mb-3">
            <Card.Header>Evaluation</Card.Header>
            <Card.Body>
              <Form className="vstack gap-2">
                <Row>
                  <Col>
                    <Form.Label>Score</Form.Label>
                    <Form.Control type="number" value={score} onChange={e=>setScore(e.target.value===''?'':Number(e.target.value))} />
                  </Col>
                  <Col>
                    <Form.Label>Max</Form.Label>
                    <Form.Control type="number" value={maxScore} onChange={e=>setMaxScore(e.target.value===''?'':Number(e.target.value))} />
                  </Col>
                </Row>

                <Form.Label className="mt-2">Video authenticity</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Check type="radio" label="Looks genuine" name="gen" checked={flags.looksGenuine===true} onChange={()=>setFlags(f=>({...f, looksGenuine:true}))}/>
                  <Form.Check type="radio" label="Not genuine" name="gen" checked={flags.looksGenuine===false} onChange={()=>setFlags(f=>({...f, looksGenuine:false}))}/>
                  <Form.Check type="radio" label="Unsure" name="gen" checked={flags.looksGenuine===null} onChange={()=>setFlags(f=>({...f, looksGenuine:null}))}/>
                </div>

                <Form.Check label="Suspected cheating" checked={flags.suspectedCheating} onChange={e=>setFlags(f=>({...f, suspectedCheating:e.currentTarget.checked}))}/>
                <Form.Check label="Duplicate face" checked={flags.duplicateFace} onChange={e=>setFlags(f=>({...f, duplicateFace:e.currentTarget.checked}))}/>

                <Form.Label className="mt-2">Feedback</Form.Label>
                <Form.Control as="textarea" rows={5} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Explain what went well and what to improve..." />

                <Form.Label className="mt-2">Fail reasons (if failing)</Form.Label>
                <Form.Control placeholder="Comma separated…" value={failReasons.join(', ')} onChange={e=>setFailReasons(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />

                <div className="d-flex gap-2 mt-3">
                  <Button variant="outline-secondary" onClick={saveDraft}>Save draft</Button>
                  <Button variant="success" onClick={()=>finalize('passed')}>Mark Passed</Button>
                  <Button variant="danger" onClick={()=>finalize('failed')}>Mark Failed</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>Meta</Card.Header>
            <Card.Body>
              <div><b>Submitted:</b> {new Date(sub.createdAt).toLocaleString()}</div>
              {r.reviewedAt && <div><b>Reviewed:</b> {new Date(r.reviewedAt).toLocaleString()}</div>}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

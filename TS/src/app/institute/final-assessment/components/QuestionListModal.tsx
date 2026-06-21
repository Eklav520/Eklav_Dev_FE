import { useState, useEffect } from 'react'
import { Modal, Table, Button, Form, Spinner } from 'react-bootstrap'
import { FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

type RoundType = 'mcq' | 'tr' | 'hr'

interface Props {
  show: boolean
  onHide: () => void
  examId: string
  roundType: RoundType
  roundLabel: string
  readOnly?: boolean
}

export default function QuestionListModal({ show, onHide, examId, roundType, roundLabel, readOnly }: Props) {
  const { user } = useAuthContext()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${user?.token}` }

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/assessment/admin/exam/${examId}/questions/${roundType}`, { headers })
      const data = await res.json()
      if (data.success) setQuestions(data.questions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (show && examId) fetchQuestions()
  }, [show, examId])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return
    setDeletingId(id)
    try {
      await fetch(`${baseURL}/api/assessment/admin/questions/${roundType}/${id}`, { method: 'DELETE', headers })
      setQuestions(q => q.filter(x => x._id !== id))
    } catch {}
    setDeletingId(null)
  }

  const handleEdit = (q: any) => {
    setEditingId(q._id)
    setEditData({ topic: q.topic || '', question: q.question || q.text || '', correctAnswer: q.correctAnswer || q.correctOptionKey || '' })
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    try {
      const body = roundType === 'mcq'
        ? { text: editData.question, correctAnswer: editData.correctAnswer }
        : { topic: editData.topic, question: editData.question }
      const res = await fetch(`${baseURL}/api/assessment/admin/questions/${roundType}/${id}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        setQuestions(q => q.map(x => x._id === id ? data.question : x))
        setEditingId(null)
      }
    } catch {}
    setSaving(false)
  }

  const getQuestionText = (q: any) => q.question || q.text || ''
  const getAnswer = (q: any) => q.correctAnswer || q.correctOptionKey || ''

  return (
    <Modal show={show} onHide={onHide} fullscreen backdrop="static">
      <Modal.Header closeButton style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f' }}>
        <Modal.Title style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
          📋 {roundLabel} — Questions ({questions.length})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: '#000', padding: '1.5rem', overflowY: 'auto' }}>
        {readOnly && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444430', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
            🔒 Exam is in progress — editing is disabled.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
            <Spinner animation="border" size="sm" style={{ color: '#ff6b35' }} /> Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>No questions uploaded yet.</div>
        ) : (
          <Table style={{ color: '#ccc', borderColor: '#1f1f1f' }} bordered size="sm">
            <thead>
              <tr style={{ background: '#0a0a0a', color: '#ff6b35', borderColor: '#1f1f1f' }}>
                <th style={{ borderColor: '#1f1f1f', width: 40 }}>#</th>
                {(roundType === 'tr' || roundType === 'hr') && <th style={{ borderColor: '#1f1f1f', width: 150 }}>Topic</th>}
                <th style={{ borderColor: '#1f1f1f' }}>Question</th>
                {roundType === 'mcq' && <th style={{ borderColor: '#1f1f1f', width: 120 }}>Answer</th>}
                {!readOnly && <th style={{ borderColor: '#1f1f1f', width: 110 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q._id} style={{ borderColor: '#1f1f1f', background: editingId === q._id ? '#0d0d0d' : 'transparent' }}>
                  <td style={{ borderColor: '#1f1f1f', color: '#555', fontSize: '0.8rem' }}>{i + 1}</td>
                  {(roundType === 'tr' || roundType === 'hr') && (
                    <td style={{ borderColor: '#1f1f1f' }}>
                      {editingId === q._id ? (
                        <Form.Control size="sm" value={editData.topic} onChange={e => setEditData((d: any) => ({ ...d, topic: e.target.value }))}
                          style={{ background: '#111', border: '1px solid #333', color: '#fff' }} />
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#ff6b35' }}>{q.topic}</span>
                      )}
                    </td>
                  )}
                  <td style={{ borderColor: '#1f1f1f' }}>
                    {editingId === q._id ? (
                      <Form.Control as="textarea" rows={2} value={editData.question} onChange={e => setEditData((d: any) => ({ ...d, question: e.target.value }))}
                        style={{ background: '#111', border: '1px solid #333', color: '#fff', fontSize: '0.82rem' }} />
                    ) : (
                      <span style={{ fontSize: '0.82rem' }}>{getQuestionText(q)}</span>
                    )}
                  </td>
                  {roundType === 'mcq' && (
                    <td style={{ borderColor: '#1f1f1f' }}>
                      {editingId === q._id ? (
                        <Form.Control size="sm" value={editData.correctAnswer} onChange={e => setEditData((d: any) => ({ ...d, correctAnswer: e.target.value }))}
                          style={{ background: '#111', border: '1px solid #333', color: '#fff' }} />
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#28a745' }}>{getAnswer(q)}</span>
                      )}
                    </td>
                  )}
                  {!readOnly && (
                    <td style={{ borderColor: '#1f1f1f' }}>
                      {editingId === q._id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button size="sm" onClick={() => handleSave(q._id)} disabled={saving}
                            style={{ background: '#28a745', border: 'none', padding: '2px 8px', fontSize: '0.75rem' }}>
                            {saving ? <Spinner size="sm" animation="border" /> : <FaSave />}
                          </Button>
                          <Button size="sm" onClick={() => setEditingId(null)}
                            style={{ background: '#444', border: 'none', padding: '2px 8px', fontSize: '0.75rem' }}>
                            <FaTimes />
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Button size="sm" onClick={() => handleEdit(q)}
                            style={{ background: '#ff6b35', border: 'none', padding: '2px 8px', fontSize: '0.75rem' }}>
                            <FaEdit />
                          </Button>
                          <Button size="sm" onClick={() => handleDelete(q._id)} disabled={deletingId === q._id}
                            style={{ background: '#dc3545', border: 'none', padding: '2px 8px', fontSize: '0.75rem' }}>
                            {deletingId === q._id ? <Spinner size="sm" animation="border" /> : <FaTrash />}
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
    </Modal>
  )
}

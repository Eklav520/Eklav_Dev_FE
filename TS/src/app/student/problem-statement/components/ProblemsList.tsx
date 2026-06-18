import { useEffect, useMemo, useState } from 'react'
import { ListGroup, Card, Form } from 'react-bootstrap'
import { PersonFill, XCircleFill, LockFill } from 'react-bootstrap-icons'
import { Problem, fetchProblems } from './problems.data'

const FREE_PROBLEMS_LIMIT = 5

/* ---------------------------------------
   Difficulty Colors
--------------------------------------- */
const difficultyColor: Record<'Easy' | 'Medium' | 'Hard', string> = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
}

/* ---------------------------------------
   Rank Logic
--------------------------------------- */
const getRankLabel = (completed: number, total: number) => {
  const percent = total === 0 ? 0 : (completed / total) * 100
  if (percent >= 75) return 'Advanced'
  if (percent >= 40) return 'Intermediate'
  return 'Beginner'
}

type Props = {
  problems: Problem[]
  selectedId?: number
  completedIds: number[]
  onSelect: (p: Problem) => void
  isPending?: boolean
}

const PAGE_SIZE = 20

const ProblemsList = ({ problems, selectedId, completedIds, onSelect, isPending = false }: Props) => {
  /* -------------------- STATE -------------------- */
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] =
    useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All')


  /* -------------------- METRICS -------------------- */
  const total = problems.length
  const completed = completedIds.length
  const rank = getRankLabel(completed, total)

  /* -------------------- FILTER -------------------- */
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchSearch = p.title
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchDifficulty =
        difficulty === 'All' || p.difficulty === difficulty

      return matchSearch && matchDifficulty
    })
  }, [problems, search, difficulty])

  /* Reset page on filter change */
  useEffect(() => {
    setPage(1)
  }, [search, difficulty])

  /* -------------------- PAGINATION -------------------- */
  const totalPages = Math.ceil(filteredProblems.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const visibleProblems = filteredProblems.slice(start, start + PAGE_SIZE)


  /* -------------------- UI -------------------- */
  return (
    <>
      {/* HEADER */}
      <Card className="mb-3 bg-dark text-light border-0">
        <Card.Body className="py-3 d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small">Programs Completed</div>
            <div className="fs-5 fw-semibold">
              {completed} / {total}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 text-muted">
            <PersonFill size={14} />
            <span className="fw-medium">{rank}</span>
          </div>
        </Card.Body>
      </Card>

      {/* PENDING TRIAL BANNER */}
      {isPending && (
        <div style={{
          background: 'rgba(255,122,0,0.08)', border: '1px solid rgba(255,122,0,0.3)',
          borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
        }}>
          <LockFill style={{ color: '#ff7a00', flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#ff7a00' }}>Trial access:</strong>{' '}
            You can attempt the first <strong>{FREE_PROBLEMS_LIMIT} programs</strong> for free. Enroll to unlock all problems.
          </span>
        </div>
      )}

      {/* FILTER BAR */}
      <Card className="mb-3 border-secondary bg-dark">
        <Card.Body className="py-2">
          <div className="d-flex gap-2 align-items-center">
            {/* Search */}
            <div className="position-relative flex-grow-1">
              <Form.Control
                size="sm"
                placeholder="Search problem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pe-4"
              />

              {search && (
                <XCircleFill
                  size={14}
                  className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSearch('')}
                />
              )}
            </div>

            {/* Difficulty */}
            <Form.Select
              size="sm"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as 'All' | 'Easy' | 'Medium' | 'Hard')
              }
              style={{ maxWidth: 140 }}
            >
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      {/* LIST */}
      <ListGroup className="rounded overflow-hidden">
        {visibleProblems.length === 0 && (
          <ListGroup.Item className="text-center text-muted py-3">
            No problems found
          </ListGroup.Item>
        )}

        {visibleProblems.map((p, idx) => {
          const globalIdx = start + idx
          const isLocked = isPending && globalIdx >= FREE_PROBLEMS_LIMIT
          const isActive = p.id === selectedId
          const isCompleted = completedIds.includes(p.id)

          return (
            <ListGroup.Item
              key={p._id}
              action={!isLocked}
              onClick={() => !isLocked && onSelect(p)}
              className="d-flex align-items-center gap-3"
              style={{
                borderLeft: isLocked
                  ? '4px solid transparent'
                  : isActive
                  ? '4px solid #0d6efd'
                  : isCompleted
                  ? '4px solid #facc15'
                  : '4px solid transparent',
                background: isLocked
                  ? 'rgba(0,0,0,0.15)'
                  : isCompleted
                  ? 'rgba(250,204,21,0.07)'
                  : isActive
                  ? 'rgba(13,110,253,0.08)'
                  : undefined,
                opacity: isLocked ? 0.5 : 1,
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
            >
              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  className="fw-medium text-truncate d-block"
                  style={{ color: isLocked ? '#666' : isCompleted ? '#facc15' : undefined }}
                >
                  {!isLocked && isCompleted && <span style={{ marginRight: 5 }}>✓</span>}
                  {p.id}. {p.title}
                </span>
              </div>

              {/* Difficulty / Lock */}
              {isLocked ? (
                <LockFill size={12} style={{ color: '#555', flexShrink: 0 }} />
              ) : (
                <div
                  className="d-flex align-items-center gap-1 small text-muted"
                  style={{ flexShrink: 0 }}
                >
                  <span
                    className={`rounded-circle bg-${difficultyColor[p.difficulty]}`}
                    style={{ width: 6, height: 6 }}
                  />
                  {p.difficulty}
                </div>
              )}
            </ListGroup.Item>
          )
        })}
      </ListGroup>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3 text-muted small">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
      )}
    </>
  )
}

export default ProblemsList

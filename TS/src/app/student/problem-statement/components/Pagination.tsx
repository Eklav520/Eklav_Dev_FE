import { Button } from 'react-bootstrap'

type Props = {
  page: number
  totalPages: number
  onChange: (page: number) => void
  maxVisible?: number
  showInfo?: boolean
}

const Pagination = ({
  page,
  totalPages,
  onChange,
  maxVisible = 5,
  showInfo = false,
}: Props) => {
  const start = Math.max(1, page - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)

  return (
    <div className="d-flex align-items-center gap-2">
      {/* Prev */}
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </Button>

      {/* Pages */}
      {Array.from({ length: end - start + 1 }).map((_, i) => {
        const p = start + i
        return (
          <Button
            key={p}
            size="sm"
            variant={p === page ? 'primary' : 'outline-secondary'}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        )
      })}

      {/* Next */}
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </Button>

      {/* Optional page info */}
      {showInfo && (
        <span className="text-muted small ms-2">
          Page {page} of {totalPages}
        </span>
      )}
    </div>
  )
}

export default Pagination

type LineChartItem = {
  day: string
  hours: number
  score: number
}

type Props = {
  data: LineChartItem[]
}

const LineChart = ({ data }: Props) => {
  const maxHours = Math.max(...data.map((d) => d.hours))
  const maxScore = Math.max(...data.map((d) => d.score))

  return (
    <div style={{ height: '250px', position: 'relative', paddingLeft: '40px' }}>
      {/* Y-axis labels for Hours */}
      <div className="position-absolute start-0 top-0 h-100 d-flex flex-column justify-content-between pe-2 border-end">
        {[4, 3, 2, 1, 0].map((num) => (
          <div key={num} className="small text-muted" style={{ fontSize: 12 }}>
            {num}h
          </div>
        ))}
      </div>

      {/* Y-axis labels for Score */}
      <div className="position-absolute end-0 top-0 h-100 d-flex flex-column justify-content-between ps-2 border-start">
        {[100, 75, 50, 25, 0].map((num) => (
          <div key={num} className="small text-muted" style={{ fontSize: 12 }}>
            {num}%
          </div>
        ))}
      </div>

      {/* Chart container */}
      <div className="position-absolute start-4 end-4 top-0 h-100">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <div
            key={y}
            className="position-absolute start-0 end-0 border-top"
            style={{
              top: `${y}%`,
              opacity: 0.1,
              borderColor: '#dee2e6',
            }}
          />
        ))}

        {/* Hours line */}
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke="#667eea"
            strokeWidth="3"
            points={data
              .map(
                (d, i) =>
                  `${(i * 100) / (data.length - 1)},${
                    100 - (d.hours / maxHours) * 100
                  }`
              )
              .join(' ')}
          />

          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i * 100) / (data.length - 1)}
              cy={100 - (d.hours / maxHours) * 100}
              r="6"
              fill="#667eea"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>

        {/* Score line */}
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <polyline
            fill="none"
            stroke="#f46b45"
            strokeWidth="3"
            points={data
              .map(
                (d, i) =>
                  `${(i * 100) / (data.length - 1)},${
                    100 - (d.score / maxScore) * 100
                  }`
              )
              .join(' ')}
          />

          {data.map((d, i) => (
            <circle
              key={i}
              cx={(i * 100) / (data.length - 1)}
              cy={100 - (d.score / maxScore) * 100}
              r="6"
              fill="#f46b45"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="position-absolute bottom-0 start-0 end-0 d-flex justify-content-between mt-2">
          {data.map((d, i) => (
            <div key={i} className="small text-muted" style={{ fontSize: 12 }}>
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="position-absolute top-0 end-0 pe-3">
        <div className="d-flex align-items-center mb-2">
          <div
            className="rounded-circle me-2"
            style={{ width: 12, height: 12, background: '#667eea' }}
          />
          <small className="fw-bold" style={{ fontSize: 12 }}>
            Study Hours
          </small>
        </div>

        <div className="d-flex align-items-center">
          <div
            className="rounded-circle me-2"
            style={{ width: 12, height: 12, background: '#f46b45' }}
          />
          <small className="fw-bold" style={{ fontSize: 12 }}>
            Score %
          </small>
        </div>
      </div>
    </div>
  )
}

export default LineChart

type BarItem = {
  level: string
  solved: number
  color: string
}

type Props = {
  data: BarItem[]
}

const BarChart = ({ data }: Props) => {
  const maxSolved = Math.max(...data.map((d) => d.solved), 1)

  return (
    <div className="d-flex justify-content-between" style={{ height: 160 }}>
      {data.map((item) => {
        const heightPercent = (item.solved / maxSolved) * 100

        return (
          <div
            key={item.level}
            className="d-flex flex-column align-items-center"
            style={{ width: '30%' }}
          >
            {/* BAR CONTAINER */}
            <div
              style={{
                height: 110,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              <div
                className="rounded-top"
                style={{
                  width: '70%',
                  height: `${heightPercent}%`,
                  backgroundColor: item.color,
                  margin: '0 auto',
                  transition: 'height 0.4s ease',
                }}
              />
            </div>

            {/* VALUE */}
            <div className="fw-bold mt-2">{item.solved}</div>

            {/* LABEL */}
            <div className="text-muted small">{item.level}</div>
          </div>
        )
      })}
    </div>
  )
}

export default BarChart

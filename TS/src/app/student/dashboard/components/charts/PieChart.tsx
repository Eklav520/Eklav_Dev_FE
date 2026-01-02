type PieItem = {
  name: string
  value: number
  color: string
}

type Props = {
  data: PieItem[]
}

const PieChart = ({ data }: Props) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let cumulative = 0

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      {data.map((item, i) => {
        const percent = (item.value / total) * 100
        const startAngle = cumulative * 3.6
        cumulative += percent
        const endAngle = cumulative * 3.6

        const x1 = 60 + 50 * Math.cos((Math.PI * startAngle) / 180)
        const y1 = 60 + 50 * Math.sin((Math.PI * startAngle) / 180)
        const x2 = 60 + 50 * Math.cos((Math.PI * endAngle) / 180)
        const y2 = 60 + 50 * Math.sin((Math.PI * endAngle) / 180)

        const largeArc = percent > 50 ? 1 : 0

        return (
          <path
            key={i}
            d={`M 60 60 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={item.color}
            stroke="white"
            strokeWidth="2"
          />
        )
      })}

      <circle cx="60" cy="60" r="20" fill="white" />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dy=".3em"
        fontSize="14"
        fontWeight="bold"
      >
        {total}h
      </text>
    </svg>
  )
}

export default PieChart

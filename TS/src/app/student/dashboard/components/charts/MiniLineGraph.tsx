type Props = {
  data: number[]
  color: string
}

const MiniLineGraph = ({ data, color }: Props) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <svg width="100%" height="60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={data
          .map(
            (d, i) =>
              `${(i * 100) / (data.length - 1)},${
                60 - ((d - min) / range) * 50
              }`,
          )
          .join(' ')}
      />
    </svg>
  )
}

export default MiniLineGraph

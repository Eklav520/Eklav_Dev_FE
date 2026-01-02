import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import zoomPlugin from 'chartjs-plugin-zoom'
import { Bar, Line } from 'react-chartjs-2'
import { Spinner, Form } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import type { ChartData, ChartOptions } from 'chart.js'

// ✅ Register chart components globally
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ChartDataLabels, zoomPlugin)

type ChartType = 'bar' | 'line'

const InterviewTrendChart: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [chartType, setChartType] = useState<ChartType>('bar')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${baseURL}/self-interviews`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setRecords(data)
      } catch (err) {
        console.error('Chart load failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const topics = Array.from(new Set(records.map((r) => r.topic)))
  const filtered = selectedTopic === 'All' ? records : records.filter((r) => r.topic === selectedTopic)

  const sortedData = filtered.map((item) => ({ ...item, date: new Date(item.date) })).sort((a, b) => a.date.getTime() - b.date.getTime())

  const labels = sortedData.map((item) => item.date.toLocaleDateString())
  const scores = sortedData.map((item) => parseFloat(item.score))
  const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const averageLine = scores.map(() => average)

  // ✅ Separate chart data for each type
  const chartDataBar = {
    labels,
    datasets: [
      {
        label: 'Score',
        data: scores,
        backgroundColor: 'rgba(0,123,255,0.6)',
        borderColor: '#007bff',
        type: 'bar',
      },
      {
        label: 'Average',
        data: averageLine,
        type: 'line',
        borderColor: 'orange',
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderDash: [4, 4],
      },
    ],
  } as ChartData<'bar'>

  const chartDataLine: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Score',
        data: scores,
        backgroundColor: 'rgba(0,123,255,0.2)',
        borderColor: '#007bff',
        pointBackgroundColor: '#007bff',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Average',
        data: averageLine,
        type: 'line',
        borderColor: 'orange',
        backgroundColor: 'transparent',
        pointRadius: 0,
        borderDash: [4, 4],
      },
    ],
  }

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        anchor: 'end',
        align: 'top',
        font: { weight: 'bold' },
        formatter: (val: number) => val.toFixed(1),
      },
      legend: {
        labels: {
          color: '#ccc',
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#ccc' },
        grid: { color: '#444' },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 10,
        ticks: { color: '#ccc' },
        grid: { color: '#444' },
      },
    },
  }

  return (
    <div className="bg-dark p-4 rounded shadow-sm">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <h5 className="text-white mb-0">📈 Interview Score Trend</h5>
        <div className="d-flex gap-2">
          <Form.Select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-secondary text-white border-secondary"
            style={{ maxWidth: '160px' }}>
            <option value="All">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </Form.Select>
          <Form.Select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="bg-secondary text-white border-secondary"
            style={{ maxWidth: '140px' }}>
            <option value="bar">📊 Bar</option>
            <option value="line">📉 Line</option>
          </Form.Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-light">
          <Spinner animation="border" variant="light" />
        </div>
      ) : labels.length === 0 ? (
        <p className="text-muted text-center">No data available</p>
      ) : (
        <div style={{ height: '350px' }}>
          {chartType === 'bar' ? <Bar data={chartDataBar} options={chartOptions} /> : <Line data={chartDataLine} options={chartOptions} />}
        </div>
      )}
    </div>
  )
}

export default InterviewTrendChart

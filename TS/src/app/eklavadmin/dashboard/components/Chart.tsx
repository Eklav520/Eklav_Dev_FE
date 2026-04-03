import { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, Col, Row, Spinner, Form, Alert } from 'react-bootstrap'
import { BsArrowDown, BsArrowUp, BsExclamationTriangle, BsArrowClockwise } from 'react-icons/bs'
import { useAuthContext } from '@/context/useAuthContext'

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const currentYear = new Date().getFullYear()
const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]

interface MonthlyData {
  _id: {
    month: number
    year: number
  }
  count: number
}

const Chart = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentMonthCount, setCurrentMonthCount] = useState(0)
  const [lastMonthCount, setLastMonthCount] = useState(0)
  const [totalYearCount, setTotalYearCount] = useState(0)

  useEffect(() => {
    if (token) {
      fetchMonthlyStudents()
    } else {
      setLoading(false)
      setError('Please log in to view chart data')
    }
  }, [token, selectedYear])

  const fetchMonthlyStudents = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(
        `${baseURL}/admin/student-registrations/monthly?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!res.ok) {
        if (res.status === 401) throw new Error('Unauthorized access')
        if (res.status === 404) throw new Error('Chart data not available')
        throw new Error('Failed to fetch chart data')
      }

      const apiData: MonthlyData[] = await res.json()

      const monthlyCounts = new Array(12).fill(0)
      let total = 0

      apiData.forEach((item: MonthlyData) => {
        if (item._id && item._id.month >= 1 && item._id.month <= 12) {
          monthlyCounts[item._id.month - 1] = item.count
          total += item.count
        }
      })

      setTotalYearCount(total)

      const now = new Date()
      const isCurrentYear = selectedYear === now.getFullYear()
      const currentMonth = isCurrentYear ? now.getMonth() : 11
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1

      setCurrentMonthCount(monthlyCounts[currentMonth])
      setLastMonthCount(monthlyCounts[lastMonth])

      setSeries([
        {
          name: `Student Registrations (${selectedYear})`,
          data: monthlyCounts,
          type: 'area'
        }
      ])

      setOptions({
        chart: {
          type: 'area',
          toolbar: { 
            show: true,
            tools: {
              download: true,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true
            }
          },
          background: 'transparent',
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5,
          colors: ['#0d6efd'],
          strokeColors: '#ffffff',
          strokeWidth: 2,
          hover: {
            size: 7
          }
        },
        colors: ['#0d6efd'],
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          categories: monthNames,
          labels: { 
            style: { 
              colors: '#adb5bd',
              fontSize: '12px'
            } 
          },
          title: {
            text: 'Month',
            style: { color: '#adb5bd' }
          }
        },
        yaxis: {
          min: 0,
          tickAmount: 5,
          labels: {
            formatter: (val: number) => Math.round(val).toString(),
            style: { colors: '#adb5bd' }
          },
          title: {
            text: 'Number of Registrations',
            style: { color: '#adb5bd' }
          }
        },
        grid: {
          borderColor: '#2c2f36',
          strokeDashArray: 5,
          position: 'back'
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '11px',
            colors: ['#ffffff']
          },
          offsetY: -10,
          formatter: (val: number) => val > 0 ? val.toString() : ''
        },
        tooltip: {
          theme: 'dark',
          y: {
            formatter: (val: number) => `${val} student${val !== 1 ? 's' : ''}`
          }
        },
        legend: {
          position: 'top',
          labels: { colors: '#adb5bd' }
        }
      })
    } catch (err) {
      console.error('Failed to load chart data', err)
      setError(err instanceof Error ? err.message : 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  const growth = lastMonthCount === 0
    ? (currentMonthCount > 0 ? 100 : 0)
    : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100

  const isPositiveGrowth = growth >= 0

  return (
    <Row className="mt-5">
      <Col xs={12}>
        <Card className="card-body bg-transparent border p-4 h-100">
          {/* ===== HEADER + YEAR FILTER ===== */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h5 className="mb-1">Monthly Student Registrations</h5>
              <p className="text-muted small mb-0">
                Track student enrollment trends over time
              </p>
            </div>

            <div className="d-flex gap-2">
              <Form.Select
                size="sm"
                style={{ width: 120 }}
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                disabled={loading}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Form.Select>
              
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => fetchMonthlyStudents()}
                disabled={loading}
                title="Refresh data"
              >
                <BsArrowClockwise className={loading ? 'fa-spin' : ''} />
              </button>
            </div>
          </div>

          {/* ===== SUMMARY STATS ===== */}
          <Row className="g-4 mb-4">
            <Col sm={6} md={4}>
              <div className="p-3 bg-dark bg-opacity-25 rounded-3">
                <span className="badge bg-primary mb-2">Current Month</span>
                <h3 className="text-primary mb-2">{currentMonthCount.toLocaleString()}</h3>
                <p className="mb-0 small">
                  <span
                    className={isPositiveGrowth ? 'text-success' : 'text-danger'}
                  >
                    {Math.abs(growth).toFixed(1)}%
                    {isPositiveGrowth ? <BsArrowUp className="ms-1" /> : <BsArrowDown className="ms-1" />}
                  </span>
                  <span className="text-muted ms-1">vs last month</span>
                </p>
              </div>
            </Col>

            <Col sm={6} md={4}>
              <div className="p-3 bg-dark bg-opacity-25 rounded-3">
                <span className="badge bg-secondary mb-2">Last Month</span>
                <h3 className="mb-2">{lastMonthCount.toLocaleString()}</h3>
                <p className="mb-0 small text-muted">Student registrations</p>
              </div>
            </Col>

            <Col sm={6} md={4}>
              <div className="p-3 bg-dark bg-opacity-25 rounded-3">
                <span className="badge bg-info mb-2">Total {selectedYear}</span>
                <h3 className="mb-2">{totalYearCount.toLocaleString()}</h3>
                <p className="mb-0 small text-muted">Registered students</p>
              </div>
            </Col>
          </Row>

          {/* ===== CHART ===== */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2">Loading chart data...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="text-center">
              <BsExclamationTriangle size={24} className="mb-2" />
              <p>{error}</p>
              <button 
                className="btn btn-sm btn-outline-danger mt-2"
                onClick={() => fetchMonthlyStudents()}
              >
                Try Again
              </button>
            </Alert>
          ) : series.length > 0 && (
            <ReactApexChart
              height={380}
              series={series}
              options={options}
              type="area"
            />
          )}
          
          {/* No data message */}
          {!loading && !error && totalYearCount === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No registration data available for {selectedYear}</p>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  )
}

export default Chart
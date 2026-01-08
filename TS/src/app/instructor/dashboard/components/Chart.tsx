import { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, Col, Row, Spinner, Form } from 'react-bootstrap'
import { BsArrowDown, BsArrowUp } from 'react-icons/bs'
import { useAuthContext } from '@/context/useAuthContext'

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const currentYear = new Date().getFullYear()

const Chart = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const [currentMonthCount, setCurrentMonthCount] = useState(0)
  const [lastMonthCount, setLastMonthCount] = useState(0)

  useEffect(() => {
    if (token) fetchMonthlyStudents()
  }, [token, selectedYear])

  const fetchMonthlyStudents = async () => {
    try {
      setLoading(true)

      const res = await fetch(
        `${baseURL}/admin/student-registrations/monthly?year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const apiData = await res.json()

      const monthlyCounts = new Array(12).fill(0)

      apiData.forEach((item: any) => {
        monthlyCounts[item._id.month - 1] = item.count
      })

      const now = new Date()
      const isCurrentYear = selectedYear === now.getFullYear()
      const currentMonth = isCurrentYear ? now.getMonth() : 11
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1

      setCurrentMonthCount(monthlyCounts[currentMonth])
      setLastMonthCount(monthlyCounts[lastMonth])

      setSeries([
        {
          name: `Students (${selectedYear})`,
          data: monthlyCounts
        }
      ])

      setOptions({
        chart: {
          type: 'area',
          toolbar: { show: false }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5
        },
        colors: ['#0d6efd'],
        xaxis: {
          categories: monthNames,
          labels: { style: { colors: '#adb5bd' } }
        },
        yaxis: {
          min: 0,
          tickAmount: 5,
          labels: {
            formatter: (val: number) => Math.round(val)
          }
        },
        grid: {
          borderColor: '#2c2f36'
        },
        dataLabels: {
          enabled: true
        }
      })
    } catch (err) {
      console.error('Failed to load chart data', err)
    } finally {
      setLoading(false)
    }
  }

  const growth =
    lastMonthCount === 0
      ? 100
      : ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100

  return (
    <Row className="mt-5">
      <Col xs={12}>
        <Card className="card-body bg-transparent border p-4 h-100">

          {/* ===== HEADER + YEAR FILTER ===== */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Monthly Student Registrations</h5>

            <Form.Select
              size="sm"
              style={{ width: 120 }}
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Form.Select>
          </div>

          {/* ===== SUMMARY ===== */}
          <Row className="g-4 mb-3">
            <Col sm={6} md={4}>
              <span className="badge text-bg-dark">Current Month</span>
              <h4 className="text-primary my-2">{currentMonthCount}</h4>
              <p className="mb-0">
                <span
                  className={growth >= 0 ? 'text-success me-1' : 'text-danger me-1'}
                >
                  {Math.abs(growth).toFixed(1)}%
                  {growth >= 0 ? <BsArrowUp /> : <BsArrowDown />}
                </span>
                vs last month
              </p>
            </Col>

            <Col sm={6} md={4}>
              <span className="badge text-bg-dark">Last Month</span>
              <h4 className="my-2">{lastMonthCount}</h4>
              <p className="mb-0 text-muted">Student registrations</p>
            </Col>
          </Row>

          {/* ===== CHART ===== */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <ReactApexChart
              height={320}
              series={series}
              options={options}
              type="area"
            />
          )}
        </Card>
      </Col>
    </Row>
  )
}

export default Chart

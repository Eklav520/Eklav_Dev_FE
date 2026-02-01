import { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, Col, Row, Spinner, ButtonGroup, Button } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

type GraphPoint = {
  day: string
  count: number
}

type ReadingAttendanceChartProps = {
  college: string | null
}

const ReadingAttendanceChart = ({ college }: ReadingAttendanceChartProps) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const now = new Date()
  console.log('college:', college)

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [loading, setLoading] = useState(false)
  const [totalStudents, setTotalStudents] = useState(0)
  const [attendedStudents, setAttendedStudents] = useState(0)
  const [series, setSeries] = useState<any[]>([])
  const [options, setOptions] = useState<any>({})

  useEffect(() => {
    if (token) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, period, selectedMonth, selectedYear, college])

  /* =============================
     LABEL FORMATTER
  ============================== */
  const formatLabel = (day: string) => {
    const date = new Date(day)

    if (period === 'week')
      return date.toLocaleDateString('en-IN', { weekday: 'short' })

    if (period === 'month')
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })

    return date.toLocaleDateString('en-IN')
  }

  /* =============================
     FETCH DATA
  ============================== */
  const fetchData = async () => {
    try {
      setLoading(true)

      let query =
        period === 'month'
          ? `period=month&month=${selectedMonth}&year=${selectedYear}`
          : `period=${period}`

      // ✅ ALWAYS append college if present
      if (college) {
        query += `&college=${encodeURIComponent(college)}`
      }

      const res = await fetch(
        `${baseURL}/api/adminDashboardCharts/admin/reading/attendance?${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        if (res.status === 404) {
          setTotalStudents(0)
          setAttendedStudents(0)
          setSeries([{ name: 'Students Attended', data: [] }])
          setOptions({
            chart: { type: 'area', toolbar: { show: false } },
            stroke: { curve: 'smooth', width: 3 },
            colors: ['#6f42c1'],
            dataLabels: { enabled: false },
            xaxis: { categories: [] },
            yaxis: { min: 0, labels: { formatter: (val: number) => Math.round(val) } },
            tooltip: { y: { formatter: (val: number) => `${val} students` } },
          })
          return
        }
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json()

      setTotalStudents(data.totalStudents || 0)
      setAttendedStudents(data.attendedStudents || 0)

      const graphData = data.graph || []

      setSeries([
        {
          name: 'Students Attended',
          data: graphData.map((d: GraphPoint) => d.count || 0),
        },
      ])

      setOptions({
        chart: { type: 'area', toolbar: { show: false } },
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#6f42c1'], // purple for Reading
        dataLabels: { enabled: false },
        xaxis: {
          categories: graphData.map((d: GraphPoint) =>
            formatLabel(d.day)
          ),
        },
        yaxis: {
          min: 0,
          labels: {
            formatter: (val: number) => Math.round(val),
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => `${val} students`,
          },
        },
      })
    } catch (err) {
      console.error('Reading chart error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row className="mt-4">
      <Col xs={12}>
        <Card className="card-body border p-4 h-100">

          {/* ===== HEADER ===== */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Reading – Attendance</h5>

            <div className="d-flex align-items-center gap-2">
              <ButtonGroup size="sm">
                {(['today', 'week', 'month'] as const).map(p => (
                  <Button
                    key={p}
                    variant={period === p ? 'primary' : 'outline-primary'}
                    onClick={() => setPeriod(p)}
                  >
                    {p.toUpperCase()}
                  </Button>
                ))}
              </ButtonGroup>

              {period === 'month' && (
                <>
                  <select
                    className="form-select form-select-sm"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(0, i).toLocaleString('en-IN', {
                          month: 'long',
                        })}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select form-select-sm"
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* ===== SUMMARY ===== */}
          <Row className="g-4 mb-3">
            <Col sm={6} md={4}>
              <span className="badge text-bg-dark">Total Students</span>
              <h4 className="my-2">{totalStudents}</h4>
            </Col>

            <Col sm={6} md={4}>
              <span className="badge text-bg-dark">Attended</span>
              <h4 className="text-purple my-2">{attendedStudents}</h4>
            </Col>

            <Col sm={6} md={4}>
              <span className="badge text-bg-dark">Attendance %</span>
              <h4 className="my-2">
                {totalStudents
                  ? Math.round((attendedStudents / totalStudents) * 100)
                  : 0}
                %
              </h4>
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
              type="area"
              series={series}
              options={options}
            />
          )}
        </Card>
      </Col>
    </Row>
  )
}

export default ReadingAttendanceChart

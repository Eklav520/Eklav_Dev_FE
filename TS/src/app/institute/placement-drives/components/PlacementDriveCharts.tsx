import { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Col, Row, Spinner } from 'react-bootstrap'
import { FaBriefcase, FaBan, FaTrophy, FaChartBar } from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'

interface DriveStats {
  _id: string
  companyName: string
  role: string
  status: string
  rounds: { name: string; order: number }[]
  stats: { total: number; placed: number; eliminated: number; inProgress: number }
}

interface RoundStudent {
  isEligible: boolean
  roundResults: { order: number; status: string }[]
}

const APEX_BASE: ApexCharts.ApexOptions = {
  chart:   { background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit' },
  theme:   { mode: 'dark' },
  grid:    { borderColor: '#2a2a2a' },
  tooltip: { theme: 'dark' },
}

const PlacementDriveCharts = () => {
  const { user }  = useAuthContext()
  const baseURL   = import.meta.env.VITE_API_BASE_URL
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [drives, setDrives]               = useState<DriveStats[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedDriveId, setSelectedDriveId] = useState('')
  const [roundStudents, setRoundStudents] = useState<RoundStudent[]>([])
  const [roundLoading, setRoundLoading]   = useState(false)

  useEffect(() => {
    axios.get(`${baseURL}/api/placement-drives`, { headers: authHeader })
      .then((res) => {
        const list: DriveStats[] = res.data.drives || []
        setDrives(list)
        if (list.length) setSelectedDriveId(list[0]._id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDriveId) return
    setRoundLoading(true)
    axios.get(`${baseURL}/api/placement-drives/${selectedDriveId}/students`, { headers: authHeader })
      .then((res) => setRoundStudents(res.data.students || []))
      .catch(console.error)
      .finally(() => setRoundLoading(false))
  }, [selectedDriveId])

  // ── Aggregate totals ──
  const totals = drives.reduce(
    (a, d) => ({
      placed:     a.placed     + d.stats.placed,
      eliminated: a.eliminated + d.stats.eliminated,
      inProgress: a.inProgress + d.stats.inProgress,
      total:      a.total      + d.stats.total,
    }),
    { placed: 0, eliminated: 0, inProgress: 0, total: 0 }
  )
  const placementRate = totals.total
    ? Math.round((totals.placed / totals.total) * 100)
    : 0

  // ── Chart 1: Company overview grouped bar ──
  const overviewSeries: ApexCharts.ApexOptions['series'] = [
    { name: 'Total',       data: drives.map((d) => d.stats.total) },
    { name: 'Placed',      data: drives.map((d) => d.stats.placed) },
    { name: 'Eliminated',  data: drives.map((d) => d.stats.eliminated) },
    { name: 'In Progress', data: drives.map((d) => d.stats.inProgress) },
  ]
  const overviewOptions: ApexCharts.ApexOptions = {
    ...APEX_BASE,
    chart: { ...APEX_BASE.chart, type: 'bar' },
    colors: ['#6b7280', '#22c55e', '#ef4444', '#f59e0b'],
    plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: drives.map((d) => d.companyName),
      labels: { style: { colors: '#888', fontSize: '0.75rem' }, rotate: -30 },
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    legend: { labels: { colors: '#aaa' }, position: 'top' },
  }

  // ── Chart 2: Round funnel for selected drive ──
  const selectedDrive = drives.find((d) => d._id === selectedDriveId)
  const eligibleStudents = roundStudents.filter((s) => s.isEligible)

  const funnelData = (selectedDrive?.rounds ?? [])
    .sort((a, b) => a.order - b.order)
    .map((r) => ({
      name: r.name,
      qualified:    eligibleStudents.filter((s) => s.roundResults.find((rr) => rr.order === r.order && rr.status === 'qualified')).length,
      notQualified: eligibleStudents.filter((s) => s.roundResults.find((rr) => rr.order === r.order && rr.status === 'not_qualified')).length,
      pending:      eligibleStudents.filter((s) => s.roundResults.find((rr) => rr.order === r.order && rr.status === 'pending')).length,
    }))

  const funnelSeries: ApexCharts.ApexOptions['series'] = [
    { name: 'Qualified',     data: funnelData.map((r) => r.qualified) },
    { name: 'Not Qualified', data: funnelData.map((r) => r.notQualified) },
    { name: 'Pending',       data: funnelData.map((r) => r.pending) },
  ]
  const funnelOptions: ApexCharts.ApexOptions = {
    ...APEX_BASE,
    chart: { ...APEX_BASE.chart, type: 'bar', stacked: true },
    colors: ['#22c55e', '#ef4444', '#f59e0b'],
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
    dataLabels: { enabled: true, style: { fontSize: '0.7rem', colors: ['#fff'] } },
    xaxis: {
      categories: funnelData.map((r) => r.name),
      labels: { style: { colors: '#888', fontSize: '0.75rem' } },
    },
    yaxis: { labels: { style: { colors: '#888' } } },
    legend: { labels: { colors: '#aaa' }, position: 'top' },
    fill: { opacity: 1 },
  }

  // ── Chart 3: Overall placement donut ──
  const donutSeries  = [totals.placed, totals.eliminated, totals.inProgress]
  const donutOptions: ApexCharts.ApexOptions = {
    ...APEX_BASE,
    chart:  { ...APEX_BASE.chart, type: 'donut' },
    colors: ['#22c55e', '#ef4444', '#f59e0b'],
    labels: ['Placed', 'Eliminated', 'In Progress'],
    legend: { labels: { colors: '#aaa' }, position: 'bottom' },
    dataLabels: { style: { colors: ['#fff'] } },
    plotOptions: {
      pie: { donut: { size: '65%', labels: {
        show: true,
        total: {
          show: true, label: 'Total', color: '#aaa',
          formatter: () => String(totals.total),
        },
        value: { color: '#fff', fontSize: '1.4rem', fontWeight: 700 },
      }}},
    },
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner variant="warning" />
      </div>
    )
  }

  if (!drives.length) return null

  return (
    <div style={{ padding: '0 0 8px' }}>

      {/* ── Section Header ── */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <FaChartBar style={{ color: '#ff7a00', fontSize: '1.1rem' }} />
        <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '1rem' }}>Placement Analytics</h6>
        <div style={{ flex: 1, height: 1, background: '#2a2a2a', marginLeft: 8 }} />
      </div>

      {/* ── KPI Summary Row ── */}
      <Row xs={2} md={4} className="g-3 mb-4">
        {[
          { label: 'Total Drives',    value: drives.length,      color: '#ff7a00', icon: <FaBriefcase /> },
          { label: 'Total Placed',    value: totals.placed,      color: '#22c55e', icon: <FaTrophy /> },
          { label: 'Total Eliminated',value: totals.eliminated,  color: '#ef4444', icon: <FaBan /> },
          { label: 'Placement Rate',  value: `${placementRate}%`,color: '#f59e0b', icon: <FaChartBar /> },
        ].map(({ label, value, color, icon }) => (
          <Col key={label}>
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '1.2rem', flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── Charts Row ── */}
      <Row className="g-3">

        {/* Chart 1: Company Overview */}
        <Col lg={8}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Company-wise Overview</div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 12 }}>Total enrolled, placed, eliminated & in-progress per drive</div>
            <ReactApexChart
              type="bar"
              series={overviewSeries}
              options={overviewOptions}
              height={280}
            />
          </div>
        </Col>

        {/* Chart 3: Overall Donut */}
        <Col lg={4}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px', height: '100%' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Overall Placement Status</div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 12 }}>Across all {drives.length} drives</div>
            <ReactApexChart
              type="donut"
              series={donutSeries}
              options={donutOptions}
              height={280}
            />
          </div>
        </Col>

        {/* Chart 2: Round Funnel */}
        <Col lg={12}>
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>Round-by-Round Breakdown</div>
                <div style={{ fontSize: '0.72rem', color: '#666' }}>Qualified / Not Qualified / Pending per round for selected drive</div>
              </div>
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', minWidth: 200 }}
              >
                {drives.map((d) => (
                  <option key={d._id} value={d._id}>{d.companyName}{d.role ? ` — ${d.role}` : ''}</option>
                ))}
              </select>
            </div>

            {roundLoading ? (
              <div className="text-center py-4"><Spinner size="sm" variant="warning" /></div>
            ) : funnelData.length === 0 ? (
              <div className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>No rounds defined for this drive.</div>
            ) : (
              <ReactApexChart
                type="bar"
                series={funnelSeries}
                options={funnelOptions}
                height={260}
              />
            )}
          </div>
        </Col>

      </Row>
    </div>
  )
}

export default PlacementDriveCharts

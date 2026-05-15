import { useEffect, useState } from 'react'
import { Modal, Spinner } from 'react-bootstrap'
import { FaChartBar, FaTrophy, FaBan, FaUsers, FaChartPie } from 'react-icons/fa'
import ReactApexChart from 'react-apexcharts'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import type { PlacementDrive } from './PlacementDriveManagement'

interface RoundStudent {
  isEligible: boolean
  roundResults: { order: number; status: string }[]
}

interface Props {
  show: boolean
  drive: PlacementDrive
  onHide: () => void
}

const APEX_BASE: ApexCharts.ApexOptions = {
  chart:   { background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit' },
  theme:   { mode: 'dark' },
  grid:    { borderColor: '#2a2a2a' },
  tooltip: { theme: 'dark' },
}

const DriveChartsModal = ({ show, drive, onHide }: Props) => {
  const { user }  = useAuthContext()
  const baseURL   = import.meta.env.VITE_API_BASE_URL

  const [students, setStudents] = useState<RoundStudent[]>([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!show) return
    setLoading(true)
    axios
      .get(`${baseURL}/api/placement-drives/${drive._id}/students`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => setStudents(res.data.students || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [show, drive._id])

  const eligible = students.filter((s) => s.isEligible)
  const { total, placed, eliminated, inProgress } = drive.stats
  const placementRate = total ? Math.round((placed / total) * 100) : 0

  // Round funnel data
  const funnelData = [...drive.rounds]
    .sort((a, b) => a.order - b.order)
    .map((r) => ({
      name:         r.name,
      qualified:    eligible.filter((s) => s.roundResults.find((rr) => rr.order === r.order && rr.status === 'qualified')).length,
      notQualified: eligible.filter((s) => s.roundResults.find((rr) => rr.order === r.order && rr.status === 'not_qualified')).length,
      pending:      eligible.filter((s) => s.roundResults.find((rr) => rr.order === r.order && rr.status === 'pending')).length,
    }))

  const funnelSeries: ApexCharts.ApexOptions['series'] = [
    { name: 'Qualified',     data: funnelData.map((r) => r.qualified) },
    { name: 'Not Qualified', data: funnelData.map((r) => r.notQualified) },
    { name: 'Pending',       data: funnelData.map((r) => r.pending) },
  ]

  const funnelOptions: ApexCharts.ApexOptions = {
    ...APEX_BASE,
    chart:       { ...APEX_BASE.chart, type: 'bar', stacked: true },
    colors:      ['#22c55e', '#ef4444', '#f59e0b'],
    plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
    dataLabels:  { enabled: true, style: { fontSize: '0.72rem', colors: ['#fff'] } },
    xaxis: {
      categories: funnelData.map((r) => r.name),
      labels:     { style: { colors: '#888', fontSize: '0.75rem' } },
    },
    yaxis:  { labels: { style: { colors: '#888' } } },
    legend: { labels: { colors: '#aaa' }, position: 'top' },
    fill:   { opacity: 1 },
  }

  // Line — qualified count progression through rounds
  const lineSeries: ApexCharts.ApexOptions['series'] = [
    { name: 'Qualified', data: funnelData.map((r) => r.qualified) },
    { name: 'Eliminated', data: funnelData.map((r) => r.notQualified) },
  ]
  const lineOptions: ApexCharts.ApexOptions = {
    ...APEX_BASE,
    chart:  { ...APEX_BASE.chart, type: 'line' },
    colors: ['#22c55e', '#ef4444'],
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5, strokeWidth: 0 },
    dataLabels: { enabled: true, style: { fontSize: '0.72rem', colors: ['#22c55e', '#ef4444'] }, background: { enabled: false } },
    xaxis: {
      categories: funnelData.map((r) => r.name),
      labels:     { style: { colors: '#888', fontSize: '0.72rem' }, rotate: -20 },
    },
    yaxis:  { labels: { style: { colors: '#888' } }, min: 0 },
    legend: { labels: { colors: '#aaa' }, position: 'top' },
  }

  // Donut
  const donutSeries  = [placed, eliminated, inProgress]
  const donutOptions: ApexCharts.ApexOptions = {
    ...APEX_BASE,
    chart:  { ...APEX_BASE.chart, type: 'donut' },
    colors: ['#22c55e', '#ef4444', '#f59e0b'],
    labels: ['Placed', 'Eliminated', 'In Progress'],
    legend: { labels: { colors: '#aaa' }, position: 'bottom' },
    dataLabels: { style: { colors: ['#fff'] } },
    plotOptions: {
      pie: { donut: { size: '68%', labels: {
        show: true,
        total: { show: true, label: 'Total', color: '#aaa', formatter: () => String(total) },
        value: { color: '#fff', fontSize: '1.4rem', fontWeight: 700 },
      }}},
    },
  }

  const kpi = [
    { label: 'Total Enrolled', value: total,          color: '#60a5fa', icon: <FaUsers /> },
    { label: 'Placed',         value: placed,         color: '#22c55e', icon: <FaTrophy /> },
    { label: 'Eliminated',     value: eliminated,     color: '#ef4444', icon: <FaBan /> },
    { label: 'Placement Rate', value: `${placementRate}%`, color: '#f59e0b', icon: <FaChartPie /> },
  ]

  return (
    <Modal
      show={show}
      onHide={onHide}
      fullscreen
      contentClassName="bg-dark text-white"
    >
      <Modal.Header closeButton closeVariant="white" className="border-secondary">
        <Modal.Title style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaChartBar style={{ color: '#ff7a00' }} />
          Analytics
          <span style={{ color: '#ff7a00', fontWeight: 700 }}>{drive.companyName}</span>
          {drive.role && <span className="text-muted fw-normal fs-6">— {drive.role}</span>}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '24px' }}>
        {loading ? (
          <div className="text-center py-5">
            <Spinner variant="warning" />
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="d-flex gap-3 mb-4 flex-wrap">
              {kpi.map(({ label, value, color, icon }) => (
                <div
                  key={label}
                  style={{
                    flex: '1 1 140px', background: '#111', border: '1px solid #2a2a2a',
                    borderRadius: 12, padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color, fontSize: '1.1rem',
                    }}
                  >
                    {icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.63rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                      {value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top chart row — stacked bar (full width) */}
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
                Round-by-Round Breakdown
              </div>
              <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 12 }}>
                Qualified / Not Qualified / Pending per round
              </div>
              {funnelData.length === 0 ? (
                <div className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>
                  No rounds defined for this drive.
                </div>
              ) : (
                <ReactApexChart type="bar" series={funnelSeries} options={funnelOptions} height={260} />
              )}
            </div>

            {/* Bottom chart row — donut + line */}
            <div className="d-flex gap-3 flex-wrap">

              {/* Donut */}
              <div style={{ flex: '1 1 260px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
                  Overall Status
                </div>
                <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 12 }}>
                  Placed · Eliminated · In Progress
                </div>
                <ReactApexChart type="donut" series={donutSeries} options={donutOptions} height={240} />
              </div>

              {/* Line — round pass/fail progression */}
              <div style={{ flex: '2 1 360px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>
                  Round Progression
                </div>
                <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: 12 }}>
                  Qualified vs eliminated count across rounds
                </div>
                {funnelData.length === 0 ? (
                  <div className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>
                    No rounds defined for this drive.
                  </div>
                ) : (
                  <ReactApexChart type="line" series={lineSeries} options={lineOptions} height={240} />
                )}
              </div>

            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default DriveChartsModal

// types/kpi.ts
import { ReactNode } from 'react'

export type KPI = {
  label: string
  value: string | number
  icon: ReactNode
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger'
  bgColor: string
  trend: string
  graphData: number[]
}

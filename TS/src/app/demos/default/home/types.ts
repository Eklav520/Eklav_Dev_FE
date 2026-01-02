import type { IconType } from 'react-icons'

export type CounterType = {
  title: string
  count: number
  prefix?: string
  suffix?: string
  icon: IconType
  variant: string
}

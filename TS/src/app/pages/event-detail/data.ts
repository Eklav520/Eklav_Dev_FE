import { IconType } from 'react-icons'
import { BsGlobe, BsPeople, BsPersonPlus } from 'react-icons/bs'

export type CounterType = {
  icon: IconType
  count: number
  title: string
}

export const counterData: CounterType[] = [
  {
    icon: BsGlobe,
    count: 125,
    title: 'Visitors',
  },
  {
    icon: BsPersonPlus,
    count: 356,
    title: 'Registered',
  },
  {
    icon: BsPeople,
    count: 350,
    title: 'Attendance',
  },
]

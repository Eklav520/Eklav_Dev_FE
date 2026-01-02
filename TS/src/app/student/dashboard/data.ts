import { CounterType } from '@/types/other'
import { FaClipboardCheck, FaMedal, FaTv } from 'react-icons/fa'

//fas fa-clipboard-check fa-fw

export const counterData: CounterType[] = [
  {
    count: 59,
    title: 'Total Courses',
    icon: FaTv,
    variant: 'orange',
  },
  {
    count: 12,
    title: 'Total Communication Skill Videos',
    icon: FaClipboardCheck,
    variant: 'purple',
  },
  {
    count: 8,
    title: 'Aptitude Courses',
    icon: FaMedal,
    variant: 'success',
  },
]

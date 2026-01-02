import { FaTv, FaUserGraduate, FaUserTie } from 'react-icons/fa'
import type { CounterType } from './types'
import { BsPatchCheckFill } from 'react-icons/bs'

export const counterData: CounterType[] = [
  {
    title: 'Online Courses',
    count: 10,
    suffix: 'K',
    icon: FaTv,
    variant: 'warning',
  },
  {
    title: 'Expert Tutors',
    count: 200,
    suffix: '+',
    icon: FaUserTie,
    variant: 'blue',
  },
  {
    title: 'Online Students',
    count: 60,
    suffix: 'K+',
    icon: FaUserGraduate,
    variant: 'purple',
  },
  {
    title: 'Certified Courses',
    count: 6,
    suffix: 'K+',
    icon: BsPatchCheckFill,
    variant: 'info',
  },
]

import type { CounterType } from '@/types/other'
import { FaBookReader, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa'

import element1 from '@/assets/images/element/abc.svg'
import element2 from '@/assets/images/element/lego.svg'
import element3 from '@/assets/images/element/sport.svg'
import element4 from '@/assets/images/element/song.svg'

export type OfferCourseType = {
  image: string
  title: string
  description: String
  courses: number
}

export const counterData: CounterType[] = [
  {
    title: 'Total Students',
    count: 1,
    icon: FaUserGraduate,
    variant: 'text-info',
    suffix: 'K',
  },
  {
    title: 'Total Instructors',
    count: 105,
    icon: FaChalkboardTeacher,
    variant: 'text-purple',
  },
  {
    title: 'Total Activities',
    count: 2,
    icon: FaBookReader,
    variant: 'text-danger',
    suffix: 'K+',
  },
]

export const offerCourses: OfferCourseType[] = [
  {
    image: element1,
    title: 'Preschool',
    description: 'Man children rejoiced. Yet uncommonly his ten.',
    courses: 5,
  },
  {
    image: element2,
    title: 'Nursery',
    description: 'Children rejoiced. Yet uncommonly his ten. certainly day sweetness why cordially',
    courses: 8,
  },
  {
    image: element3,
    title: 'Sports',
    description: 'Yet uncommonly his ten. certainly day sweetness why cordially',
    courses: 6,
  },
  {
    image: element4,
    title: 'Music',
    description: 'Certainly day sweetness why cordial Man children rejoiced. Yet uncommonly his ten.',
    courses: 7,
  },
]

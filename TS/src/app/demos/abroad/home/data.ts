import type { CounterType } from '@/types/other'
import { FaGlobe, FaRegHandshake, FaUniversity } from 'react-icons/fa'

import cnFlag from '@/assets/images/flags/cn.svg'
import grFlag from '@/assets/images/flags/gr.svg'
import nzFlag from '@/assets/images/flags/nz.svg'
import ukFlag from '@/assets/images/flags/uk.svg'
import usFlag from '@/assets/images/flags/us.svg'
import auFlag from '@/assets/images/flags/au.svg'

import course23 from '@/assets/images/courses/4by3/23.jpg'
import course24 from '@/assets/images/courses/4by3/24.jpg'
import course25 from '@/assets/images/courses/4by3/25.jpg'
import course26 from '@/assets/images/courses/4by3/26.jpg'

type CountryType = {
  name: string
  flag: string
}

type AboutType = {
  title: string
  description: string
}

export type AbroadCourseType = {
  image: string
  name: string
}

export const counterData: CounterType[] = [
  {
    title: 'Universities',
    count: 400,
    icon: FaUniversity,
    variant: 'info',
    suffix: '+',
  },
  {
    title: 'Countries',
    count: 25,
    icon: FaGlobe,
    variant: 'purple',
    suffix: '+',
  },
  {
    title: 'Years of Experience',
    count: 12,
    icon: FaRegHandshake,
    variant: 'warning',
    suffix: '+',
  },
]

export const topCountries: CountryType[] = [
  {
    name: 'Canada',
    flag: cnFlag,
  },
  {
    name: 'Germany',
    flag: grFlag,
  },
  {
    name: 'New Zealand',
    flag: nzFlag,
  },
  {
    name: 'United Kingdom',
    flag: ukFlag,
  },
  {
    name: 'USA',
    flag: usFlag,
  },
  {
    name: 'Australia',
    flag: auFlag,
  },
]

export const aboutData: AboutType[] = [
  {
    title: 'Extensive tie-ups',
    description: 'Perceived end knowledge certainly day sweetness why cordially. Ask a quick six seven offer see among.',
  },
  {
    title: 'Committed to your success',
    description: 'Perceived end knowledge certainly day sweetness why cordially. Ask a quick six seven offer see among.',
  },
  {
    title: 'Affordable solutions',
    description: 'Perceived end knowledge certainly day sweetness why cordially. Ask a quick six seven offer see among.',
  },
]

export const abroadCourses: AbroadCourseType[] = [
  {
    image: course23,
    name: 'International English Language Testing System (IELTS)',
  },
  {
    image: course24,
    name: 'Duolingo English Test (DUOLINGO)',
  },
  {
    image: course25,
    name: 'Graduate Record Examination (GRE)',
  },
  {
    image: course26,
    name: 'Test of English as a Foreign Language (TOEFL)',
  },
  {
    image: course25,
    name: 'Graduate Record Examination (GRE)',
  },
]

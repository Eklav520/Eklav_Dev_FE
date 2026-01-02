import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import avatar6 from '@/assets/images/avatar/06.jpg'

import primarySchoolImg from '@/assets/images/element/primary-school.svg'
import middleSchoolImg from '@/assets/images/element/middle-school.svg'
import highSchoolImg from '@/assets/images/element/high-school.svg'
import examSchoolImg from '@/assets/images/element/exam.svg'

type TopStudentType = {
  avatar: string
  name: string
  rank: number
  standard: string
}

export type SubjectType = {
  title: string
  lessons: number
  image: string
  grades: string
  variant: string
}

type BlogType = {
  title: string
  name: string
  date: string
}

export const topStudents: TopStudentType[] = [
  {
    avatar: avatar1,
    name: 'Jacqueline Miller',
    rank: 1,
    standard: '12th',
  },
  {
    avatar: avatar3,
    name: 'Louis Ferguson',
    rank: 2,
    standard: '12th',
  },
  {
    avatar: avatar6,
    name: 'Frances Guerrero',
    rank: 1,
    standard: '10th',
  },
]

export const subjects: SubjectType[] = [
  {
    title: 'Primary school',
    lessons: 35,
    image: primarySchoolImg,
    grades: '1st to 6th grades',
    variant: 'bg-warning',
  },
  {
    title: 'Middle school',
    lessons: 54,
    image: middleSchoolImg,
    grades: '7th to 10th grades',
    variant: 'bg-purple',
  },
  {
    title: 'High school',
    lessons: 70,
    image: highSchoolImg,
    grades: '11th to 12th grades',
    variant: 'bg-orange',
  },
  {
    title: 'Exams',
    lessons: 120,
    image: examSchoolImg,
    grades: '11th to 12th grades',
    variant: 'bg-info',
  },
]

export const blogs: BlogType[] = [
  {
    date: '15',
    title: '12 worst types of business accounts you follow on Twitter',
    name: 'Jacqueline Miller',
  },
  {
    date: '12',
    title: 'How 10 worst business fails of all time could have been prevented',
    name: 'Frances Guerrero',
  },
  {
    date: '09',
    title: 'Never underestimate the influence of social media',
    name: 'Louis Ferguson',
  },
]

import type { IconType } from 'react-icons'
import { FaBusinessTime, FaCropAlt, FaHeartbeat, FaLaptopCode, FaMusic, FaPalette, FaPhotoVideo, FaTools } from 'react-icons/fa'

import courseImg1 from '@/assets/images/courses/4by3/01.jpg'
import courseImg3 from '@/assets/images/courses/4by3/03.jpg'
import courseImg5 from '@/assets/images/courses/4by3/05.jpg'
import courseImg6 from '@/assets/images/courses/4by3/06.jpg'
import courseImg7 from '@/assets/images/courses/4by3/07.jpg'
import courseImg8 from '@/assets/images/courses/4by3/08.jpg'
import courseImg9 from '@/assets/images/courses/4by3/09.jpg'
import courseImg10 from '@/assets/images/courses/4by3/10.jpg'

export type CategoryType = {
  title: string
  courses: number
  icon: IconType
  variant: string
}

export type ITCourseType = {
  name: string
  courses: number
  image: string
}

export const courseCategories: CategoryType[] = [
  {
    title: 'Math & Logic',
    courses: 89,
    icon: FaTools,
    variant: 'bg-purple text-purple',
  },
  {
    title: 'Health & Fitness',
    courses: 95,
    icon: FaHeartbeat,
    variant: 'bg-danger text-danger',
  },
  {
    title: 'Photography',
    courses: 38,
    icon: FaPhotoVideo,
    variant: 'bg-blue text-blue',
  },
  {
    title: 'Development',
    courses: 105,
    icon: FaLaptopCode,
    variant: 'bg-success text-success',
  },
  {
    title: 'Design',
    courses: 72,
    icon: FaCropAlt,
    variant: 'bg-orange text-orange',
  },
  {
    title: 'Business',
    courses: 68,
    icon: FaBusinessTime,
    variant: 'bg-primary text-primary',
  },
  {
    title: 'Music',
    courses: 51,
    icon: FaMusic,
    variant: 'bg-info text-info',
  },
  {
    title: 'Painting',
    courses: 69,
    icon: FaPalette,
    variant: 'bg-warning text-warning',
  },
]

export const topITCourses: ITCourseType[] = [
  {
    name: 'Digital Marketing',
    courses: 23,
    image: courseImg1,
  },
  {
    name: 'Figma',
    courses: 16,
    image: courseImg3,
  },
  {
    name: 'Python',
    courses: 32,
    image: courseImg5,
  },
  {
    name: 'Angular',
    courses: 48,
    image: courseImg6,
  },
  {
    name: 'React-Native',
    courses: 31,
    image: courseImg7,
  },
  {
    name: 'Sketch',
    courses: 38,
    image: courseImg8,
  },
  {
    name: 'Javascript',
    courses: 33,
    image: courseImg9,
  },
  {
    name: 'Bootstrap',
    courses: 62,
    image: courseImg10,
  },
]

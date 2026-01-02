import courses1 from '@/assets/images/courses/4by3/01.jpg'
import courses2 from '@/assets/images/courses/4by3/02.jpg'
import courses3 from '@/assets/images/courses/4by3/03.jpg'
import courses5 from '@/assets/images/courses/4by3/05.jpg'
import courses8 from '@/assets/images/courses/4by3/08.jpg'

export type CourseType = {
  name: string
  image: string
  totalLectures: number
  completedLectures: number
}

export const courseData: CourseType[] = [
  {
    name: 'Building Scalable APIs with GraphQL',
    image: courses8,
    totalLectures: 56,
    completedLectures: 40,
  },
  {
    name: 'Create a Design System in Figma',
    image: courses3,
    totalLectures: 42,
    completedLectures: 42,
  },
  {
    name: 'The Complete Web Development in python',
    image: courses5,
    totalLectures: 28,
    completedLectures: 12,
  },
  {
    name: 'Digital Marketing Masterclass',
    image: courses1,
    totalLectures: 32,
    completedLectures: 18,
  },
  {
    name: 'Graphic Design Masterclass',
    image: courses2,
    totalLectures: 16,
    completedLectures: 14,
  },
]

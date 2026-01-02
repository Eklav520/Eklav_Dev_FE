import type { IconType } from 'react-icons'
export type IdType = string

export type CourseType = {
  id: IdType
  title: string
  image: string
  description: string,
  video:string,
  badge: {
    text: string
    class: string
  }
  rating: {
    star: number
    review: number
  }
  duration: string
  lectures: number
  category: 'web-design' | 'development' | 'graphic-design' | 'marketing' | 'finance' | 'mock-interview'
  avatar: string
  studentImage: string
  name: string
  price: number
  students: number
  label: string
  role?: string
  courseDuration?: number
  date: Date
  status: 'Live' | 'pending'
  enrolled: number
  totalCourses: number
  subject: string
  action: 'accept' | 'rejected' | 'pending'
}

export type EventType = {
  id: IdType
  image: string
  description: string
  title: string
  city: string
  date: string
  hasLive?: boolean
}

export type InstructorType = {
  id: IdType
  title: string
  image: string
  students: number
  tasks: number
  name: string
  subject: string
  rating: number
  college: string
  department: string
  description: string
  totalCourses?: number
  verified?: boolean
}

export type CollegeType = {
  id: IdType
  image: string
  logo: string
  isOpen: boolean
  name: string
  category: 'Public' | 'Private'
  rating: number
  address: string
  courses: string[]
  features: string[]
}

export type CounterType = {
  title: string
  count: number
  icon?: IconType
  variant?: string
  prefix?: string
  suffix?: string
}

export type TestimonialType = {
  id: IdType
  courseId: CourseType['id']
  course?: CourseType
  description: string
  role?: string
}

export type FAQType = {
  question: string
  answer: string
}

export type CategoryType = {
  id: IdType
  title: string
  image: string
  courses: number
  variant: string
}
export type BillingHistoryType = {
  id: IdType
  name: string
  date: Date
  status: 'paid' | 'pending' | 'cancel'
  paymentMethod: {
    image: string
    type: 'master' | 'paypal'
    number?: string
  }
  price: number
  amount: number
}

export type ReviewType = {
  name: string
  rating?: number
  time: Date
  reviewOn?: string
  avatar: string
  description: string
  reply?: ReviewType[]
  courseName?: string
  id?: string
}

export type PlayListType = {
  title: string
  lectures: {
    title: string
    time: string
    isPremium?: boolean
    playing?: boolean
    isNote?: boolean
    progress?: number
  }[]
}

export interface BlogType {
  id: string | number
  _id: string; // <-- not `id`
  title: string;
  description: string;
  image: string[];
  name: string;
  createdAt: string;
  category: {
    name: string;
    variant: string;
  }
  projectFile?: string
}


export type PricingPlanType = {
  badge?: string
  title: string
  price: number
  features: {
    icon?: IconType
    name: string
    variant?: string
  }[]
  isRecommended?: boolean
}

export type PricingType = {
  duration: 'month' | 'year'
  plans: PricingPlanType[]
}

export type CourseResumeType = {
  id: IdType
  courseId: CourseType['id']
  course?: CourseType
  playlist: PlayListType[]
}

export type SupportRequestsType = {
  name: string
  description: string
  time: Date
  image?: string
}

export type NoticeBoardType = {
  title: string
  description: string
  time: Date
  icon: IconType
  variant: string
}
export type StudentType = {
  id: IdType
  courseId: CourseType['id']
  course?: CourseType
  location: string
  payments: number
  totalCourse: number
  progress: number
}

export type EventScheduleType = {
  id: IdType
  day: Date
  events: {
    avatar: string
    title: string
    time: Date
    description: string
    isCoffeeBreak?: boolean
    isLunchBreak?: boolean
  }[]
}

export type BookType = {
  id: IdType
  product: 'pdf' | 'compact-disk' | 'paperback'
  name: string
  title: string
  icon: IconType
  price: number
  image: string
}

export type NotificationType = {
  image: string
  title: string
  description: string
  isDetails?: boolean
  isTime?: boolean
}

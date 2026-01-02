import type { IconType } from 'react-icons'

export type CourseMaterialType = {
  date: string
  lectures: {
    title: string
    icon?: IconType
    features: string[]
    isSubmitted?: boolean
    isResume?: boolean
  }[]
}

export type NoteType = {
  title: string
  description: string
}

export type DiscussType = {
  name: string
  image: string
  title: string
  comment: string
  createdAt: Date
}

export type CurriculumType = {
  title: string
  lectures: {
    title: string
    time: string
    isPremium?: boolean
  }[]
}

export type CommentType = {
  name: string
  avatar: string
  comment: string
  time: Date
  like?: number
  replies?: number
  reply?: CommentType[]
}

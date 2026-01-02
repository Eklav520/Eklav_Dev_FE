export type CourseStatType = {
  title: string
  count: number
  variant: string
}

export const courseStatData: CourseStatType[] = [
  {
    title: 'Total Courses',
    count: 1200,
    variant: 'primary',
  },
  {
    title: 'Activated Courses',
    count: 996,
    variant: 'success',
  },
  {
    title: 'Pending Courses',
    count: 200,
    variant: 'warning',
  },
]

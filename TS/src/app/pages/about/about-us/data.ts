type AboutType = {
  title: string
  progress: number
}

type AwardType = {
  name: string
  year: number
}

export const aboutData: AboutType[] = [
  {
    title: 'Enterprise customer',
    progress: 85,
  },
  {
    title: 'Accurate Course',
    progress: 90,
  },
  {
    title: 'Languages',
    progress: 75,
  },
  {
    title: 'Instructors',
    progress: 95,
  },
]

export const awards: AwardType[] = [
  {
    name: 'Heroes for Children award',
    year: 2015,
  },
  {
    name: 'Education Agency of the Year',
    year: 2016,
  },
  {
    name: 'National Teacher of the Year',
    year: 2017,
  },
  {
    name: 'Best education agency 2018',
    year: 2018,
  },
  {
    name: 'Teacher of the nation (2nd place)',
    year: 2019,
  },
  {
    name: 'Best Independent Education Agency',
    year: 2020,
  },
]

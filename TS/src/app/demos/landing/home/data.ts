import dataScienceImg from '@/assets/images/element/data-science.svg'
import onlineImg from '@/assets/images/element/online.svg'
import engineeringImg from '@/assets/images/element/engineering.svg'
import codingImg from '@/assets/images/element/coding.svg'
import profitImg from '@/assets/images/element/profit.svg'
import medicalImg from '@/assets/images/element/medical.svg'
import homeImg from '@/assets/images/element/home.svg'
import artistImg from '@/assets/images/element/artist.svg'

export type TopCourseType = {
  name: string
  courses: number
  image: string
}

type FooterLinks = {
  link?: string
  name: string
}

export const topCoursesData: TopCourseType[] = [
  {
    name: 'Data Science',
    courses: 15,
    image: dataScienceImg,
  },
  {
    name: 'Computer Science',
    courses: 22,
    image: onlineImg,
  },
  {
    name: 'Engineering',
    courses: 53,
    image: engineeringImg,
  },
  {
    name: 'Web Development',
    courses: 25,
    image: codingImg,
  },
  {
    name: 'Marketing',
    courses: 20,
    image: profitImg,
  },
  {
    name: 'Medical',
    courses: 10,
    image: medicalImg,
  },
  {
    name: 'Architecture',
    courses: 30,
    image: homeImg,
  },
  {
    name: 'Art & Design',
    courses: 35,
    image: artistImg,
  },
]

export const footerItems: FooterLinks[] = [
  { name: 'Blog' },
  { name: 'About', link: '/about' },
  { name: 'Contact us', link: '/contact' },
  { name: 'Privacy Policy' },
  { name: 'Documentation' },
  { name: 'Sitemap' },
]

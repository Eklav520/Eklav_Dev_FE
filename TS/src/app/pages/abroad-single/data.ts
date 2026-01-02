import uniLogoImg3 from '@/assets/images/client/uni-logo-03.svg'
import uniLogoImg1 from '@/assets/images/client/uni-logo-01.svg'
import uniLogoImg2 from '@/assets/images/client/uni-logo-02.svg'
import uniLogoImg4 from '@/assets/images/client/uni-logo-04.svg'

export type UniversityType = {
  name: string
  description: string
  image: string
}

export const universityData: UniversityType[] = [
  {
    name: 'College of Toronto',
    description: 'A Public University In Toronto, Canada',
    image: uniLogoImg3,
  },
  {
    name: 'University Of British Columbia',
    description: 'University In Vancouver, Canada',
    image: uniLogoImg1,
  },
  {
    name: 'Indiana College of - Montreal',
    description: 'A Public University In Montreal, Canada',
    image: uniLogoImg2,
  },
  {
    name: 'Andeerson Campus',
    description: 'A Public University In Canada',
    image: uniLogoImg4,
  },
]

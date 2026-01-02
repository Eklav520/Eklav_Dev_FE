// export const testimonialData: TestimonialType[] = [

import { BootstrapVariantType } from '@/types/component-props'

// export type TestimonialType = {
//   id: IdType;
//   courseId: CourseType['id']
//   course?: CourseType,
//   description: string;
//   role?: string
// }

type ExtraVariants = 'purple' | 'orange'

export type EarningsType = {
  title: string
  amount: number
  variant: BootstrapVariantType | ExtraVariants
  isInfo: Boolean
}

export const earningsData: EarningsType[] = [
  {
    title: 'Sales this month',
    amount: 899.95,
    variant: 'primary',
    isInfo: false,
  },
  {
    title: 'To be paid ',
    amount: 750.35,
    variant: 'purple',
    isInfo: true,
  },
  {
    title: 'Lifetime Earnings',
    amount: 4882.65,
    variant: 'orange',
    isInfo: false,
  },
]

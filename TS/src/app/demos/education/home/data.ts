import type { IconType } from 'react-icons'
import { BsAlarmFill } from 'react-icons/bs'
import { FaBook, FaUniversity, FaUserTie } from 'react-icons/fa'

type FeatureType = {
  icon: IconType
  variant: string
  title: string
  description: string
}

export const features: FeatureType[] = [
  {
    icon: FaUserTie,
    variant: 'bg-orange  text-orange',
    title: 'Learn with Experts',
    description: 'In no impression assistance contrasted Manners she wishing justice hastily new anxious At discovery objection we',
  },
  {
    icon: FaBook,
    variant: 'bg-info  text-info',
    title: 'Learn Anything',
    description: 'Smile spoke total few great had never their too Amongst moments do in arrived at my replied Fat weddings believed prospect',
  },
  {
    icon: BsAlarmFill,
    variant: 'bg-success  text-success',
    title: 'Flexible Learning',
    description: 'Denote simple fat denied add worthy little use As some he so high down am week Conduct denied add worthy little use As',
  },
  {
    icon: FaUniversity,
    variant: 'bg-purple  text-purple',
    title: 'Industrial Standards',
    description: 'Pleasure and so read the was hope entire first decided the so must have as on was want up of to traveling so all',
  },
]

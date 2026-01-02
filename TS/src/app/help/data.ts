import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar2 from '@/assets/images/avatar/02.jpg'
import avatar3 from '@/assets/images/avatar/03.jpg'
import avatar4 from '@/assets/images/avatar/04.jpg'
import avatar5 from '@/assets/images/avatar/05.jpg'
import avatar8 from '@/assets/images/avatar/08.jpg'
import avatar9 from '@/assets/images/avatar/09.jpg'
import avatar10 from '@/assets/images/avatar/10.jpg'
import { IconType } from 'react-icons'
import { BsEmojiSmile, BsEnvelopeFill, BsHeadset, BsHouse, BsInfoCircle, BsLayers } from 'react-icons/bs'
import { FaTicketAlt } from 'react-icons/fa'

export type TopicType = {
  icon: IconType
  title: string
  features: string[]
  variant: string
}

export type ArticleType = {
  title: string
  subTitle: string
  description: string
  members: string[]
}

export type ActionBoxType = {
  icon: IconType
  title: string
  description: string
  actionName: string
  variant: string
}

export const topicData: TopicType[] = [
  {
    icon: BsEmojiSmile,
    title: 'Get started',
    features: [
      'Gulp and Customization',
      'Color Scheme and Logo Settings',
      'Dark mode, RTL Version and Lazy Load',
      'Sources, Credits and Changelog',
      'Updates and Support',
    ],
    variant: 'success',
  },
  {
    icon: BsLayers,
    title: 'Account Setup',
    features: [
      'Connecting to your Account',
      'Edit your profile information',
      'Connecting to other Social Media Accounts',
      'Adding your profile picture',
      'Describing your store',
    ],
    variant: 'warning',
  },
  {
    icon: BsInfoCircle,
    title: 'Other Topics',
    features: ['Security & Privacy', 'Author, Publisher Admin Guides', 'Pricing plans', 'Sales Tax & Regulatory Fees', 'Promotions & Deals'],
    variant: 'orange',
  },
  {
    icon: BsHouse,
    title: 'Advanced Usage',
    features: ['Admin & Billing', 'Become a Pro', 'Mobile application', 'Guide', 'Promotions & Deals'],
    variant: 'purple',
  },
]

export const articleData: ArticleType[] = [
  {
    title: 'The installation part',
    subTitle: '10 articles in this collection',
    description: 'Written by Carolyn Ortiz ,Billy Vasquez and Larry Lawson',
    members: [avatar1, avatar2, avatar3],
  },
  {
    title: 'Supporting Customer With Inbox',
    subTitle: '5 articles in this collection',
    description: 'Written by Dennis Barrett and Louis Ferguson',
    members: [avatar8, avatar4],
  },
  {
    title: 'Sending Effective Emails ',
    subTitle: '4 articles in this collection',
    description: 'Written by Jacqueline Miller',
    members: [avatar5],
  },
  {
    title: 'Connect With Customers',
    subTitle: '11 articles in this collection',
    description: 'Written by Lori Stevens and Samuel Bishop',
    members: [avatar9, avatar10],
  },
]

export const actionBoxData: ActionBoxType[] = [
  {
    icon: BsHeadset,
    title: 'Contact Support?',
    description: 'Delay death ask to style Me mean able conviction For every delay death ask to style',
    actionName: 'Contact Us',
    variant: 'info',
  },
  {
    icon: FaTicketAlt,
    title: 'Submit a Ticket',
    description: 'Prosperous impression had conviction For every delay death ask to style Me mean able',
    actionName: 'Submit Ticket',
    variant: 'purple',
  },
  {
    icon: BsEnvelopeFill,
    title: 'Request a feature',
    description: 'Prosperous impression had conviction For every delay death ask to style Me mean able',
    actionName: 'Request',
    variant: 'warning',
  },
]

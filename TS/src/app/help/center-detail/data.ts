import { IdType } from '@/types/other'
import { IconType } from 'react-icons'
import { BsEmojiSmile, BsHouse, BsInfoCircle, BsLayers } from 'react-icons/bs'

export type TabsType = {
  id: IdType
  title: string
  icon: IconType
}

export const tabsData: TabsType[] = [
  {
    id: '#item-1',
    icon: BsEmojiSmile,
    title: 'Get Started',
  },
  {
    id: '#item-2',
    icon: BsLayers,
    title: 'Account Setup',
  },
  {
    id: '#item-3',
    icon: BsInfoCircle,
    title: 'Other Topics',
  },
  {
    id: '#item-4',
    icon: BsHouse,
    title: 'Advance Usage',
  },
]

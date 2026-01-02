import type { HTMLAttributeAnchorTarget } from 'react'
import type { IconType } from 'react-icons'

export type MenuItemType = {
  key: string
  label: string
  isTitle?: boolean
  icon?: IconType
  url?: string
  parentKey?: string
  target?: HTMLAttributeAnchorTarget
  children?: MenuItemType[]
  divider?: boolean
  badge?: string
  isMegaMenu?: Boolean
}

export type MegaMenuType = {
  [key: string]: {
    label: string
    image?: string
    icon?: IconType
    iconClass?: string
    description?: string
  }[]
}

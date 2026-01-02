import type { IconType } from 'react-icons'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa'

type FooterLink = {
  title: string
  items: {
    name: string
    link?: string
    icon?: IconType
  }[]
}

type FooterLinkType = {
  name: string
  link?: string
}

type SocialMediaType = {
  icon: IconType
  variant: string
}

export const footerLinks: FooterLink[] = [
  {
    title: 'Company',
    items: [
      { name: 'About us', link: '/about' },
      { name: 'Contact us', link: '/contact' },
      { name: 'News and Blogs' },
      { name: 'Library' },
      { name: 'Career' },
    ],
  },
  {
    title: 'Community',
    items: [{ name: 'Documentation' }, { name: 'Faq', link: '/help/faq' }, { name: 'Form' }, { name: 'Sitemap' }],
  },
  {
    title: 'Teaching',
    items: [{ name: 'Become a teacher' }, { name: 'How to guide', link: '/help/faq' }, { name: 'Term & condition' }],
  },
]

export const footerLinks2: FooterLinkType[] = [
  {
    name: 'About',
    link: '/pages/about/about-us',
  },
  {
    name: 'Terms',
  },
  {
    name: 'Privacy',
  },
  {
    name: 'Career',
  },
  {
    name: 'Contact us',
  },
  {
    name: 'Cookies',
  },
]

export const socialMediaLinks: SocialMediaType[] = [
  {
    icon: FaFacebookF,
    variant: 'text-facebook',
  },
  {
    icon: FaInstagram,
    variant: 'text-instagram',
  },
  {
    icon: FaTwitter,
    variant: 'text-twitter',
  },
  {
    icon: FaLinkedinIn,
    variant: 'text-linkedin',
  },
]

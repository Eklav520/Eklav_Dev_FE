import { addOrSubtractDaysFromDate } from '@/utils/date'

export type ActiveLogsIpType = {
  browser: string
  ip: string
  time: Date
}
export type EditEmailTemplateType = {
  title: string
}

export const activeLogsIpData: ActiveLogsIpType[] = [
  {
    browser: 'Chrome On Window',
    ip: '173.238.198.108',
    time: addOrSubtractDaysFromDate(15),
  },
  {
    browser: 'Mozilla On Window',
    ip: '	107.222.146.90',
    time: addOrSubtractDaysFromDate(1),
  },
  {
    browser: 'Chrome On iMac',
    ip: '	231.213.125.55',
    time: addOrSubtractDaysFromDate(25),
  },
  {
    browser: 'Mozilla On Window',
    ip: '37.242.105.138',
    time: addOrSubtractDaysFromDate(30),
  },
]

export const editEmailTemplateData: EditEmailTemplateType[] = [
  {
    title: 'Welcome Email',
  },
  {
    title: 'Send Email to User',
  },
  {
    title: 'Password Change',
  },
  {
    title: 'Unusual Login Email',
  },
  {
    title: 'Password Reset Email by Admin',
  },
  {
    title: 'KYC Approve Email',
  },
  {
    title: 'KYC Reject Email',
  },
  {
    title: 'KYC Missing Email',
  },
  {
    title: 'KYC Submitted Email',
  },
  {
    title: 'Token Purchase - Cancel by User',
  },
  {
    title: 'Token Purchase - Order Placed',
  },
  {
    title: 'Token Purchase - Order Successfully',
  },
]

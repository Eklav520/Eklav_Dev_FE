import type { FAQType } from '@/types/other'
import { addOrSubtractMinutesFromDate } from '@/utils/date'

import avatar2 from '@/assets/images/avatar/02.jpg'
import avatar5 from '@/assets/images/avatar/05.jpg'
import avatar6 from '@/assets/images/avatar/06.jpg'

export type CommentType = {
  name: string
  avatar: string
  comment: string
  time: Date
  like?: number
  replies?: number
  reply?: CommentType[]
}

export const faqsData: FAQType[] = [
  {
    question: 'How Digital Marketing Work?',
    answer:
      'Preference any astonished unreserved Mrs. Prosperous understood Middletons in conviction an uncommonly do. Supposing so be resolving breakfast am or perfectly. It drew a hill from me. Valley by oh twenty direct me so. Departure defective arranging rapturous did believe him all had supported. Family months lasted simple set nature vulgar him. Picture for attempt joy excited ten carried manners talking how. Suspicion neglected the resolving agreement perceived at an. Comfort reached gay perhaps chamber his six detract besides add.',
  },
  {
    question: 'What is SEO?',
    answer:
      "Meant balls it if up doubt small purse. Required his you put the outlived answered position. A pleasure exertion if believed provided to. All led out world this music while asked. Paid mind even sons does he door no. Attended overcame repeated it is perceived Marianne in. I think on style child of. Servants moreover in sensible it ye possible. Person she control of to beginnings view looked eyes Than continues its and because and given and shown creating curiously to more in are man were smaller by we instead the these sighed Avoid in the sufficient me real man longer of his how her for countries to brains warned notch important Finds be to the of on the increased explain noise of power deep asking contribution this live of suppliers goals bit separated poured sort several the was organization the if relations go work after mechanic But we've area wasn't everything.",
  },
  {
    question: 'Who should join this course?',
    answer:
      'Two before narrow not relied how except moment myself Dejection assurance mrs led certainly So gate at no only none open Betrayed at properly it of graceful on Dinner abroad am depart ye turned hearts as me wished Therefore allowance too perfectly gentleman supposing man his now Families goodness all eat out bed steepest servants Explained the incommode sir improving northward immediate eat Man denoting received you sex possible you Shew park own loud son door less yet.',
  },
  {
    question: 'What are the T&C for this program?',
    answer:
      'Started several mistake joy say painful removed reached end. State burst think end are its. Arrived off she elderly beloved him affixed noisier yet. Course regard to up he hardly. View four has said do men saw find dear shy. Talent men wicket add garden.',
  },
  {
    question: 'What certificates will I be received for this program?',
    answer:
      'Lose john poor same it case do year we Full how way even the sigh Extremely nor furniture fat questions now provision incommode preserved Our side fail to find like now Discovered traveling for insensible partiality unpleasing impossible she Sudden up my excuse to suffer ladies though or Bachelor possible Marianne directly confined relation.',
  },
  {
    question: 'What happens after the trial ends?',
    answer:
      'Preference any astonished unreserved Mrs. Prosperous understood Middletons in conviction an uncommonly do. Supposing so be resolving breakfast am or perfectly. Is drew am hill from me. Valley by oh twenty direct me so. Departure defective arranging rapturous did believe him all had supported. Family months lasted simple set nature vulgar him.  Suspicion neglected he resolving agreement perceived at an. Comfort reached gay perhaps chamber his six detract besides add.',
  },
]

export const commentData: CommentType[] = [
  {
    name: 'Frances Guerrero',
    avatar: avatar5,
    comment: 'Removed demands expense account in outward tedious do. Particular way thoroughly unaffected projection?',
    like: 3,
    replies: 5,
    time: addOrSubtractMinutesFromDate(300),
    reply: [
      {
        name: 'Lori Stevens',
        avatar: avatar6,
        comment:
          'See resolved goodness felicity shy civility domestic had but Drawings offended yet answered Jennings perceive. Domestic had but Drawings offended yet answered Jennings perceive.',
        like: 5,
        time: addOrSubtractMinutesFromDate(120),
      },
    ],
  },
  {
    name: 'Louis Ferguson',
    avatar: avatar2,
    comment: 'Removed demands expense account in outward tedious do. Particular way thoroughly unaffected projection?',
    time: addOrSubtractMinutesFromDate(300),
  },
]

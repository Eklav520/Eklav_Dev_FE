import { addOrSubtractDaysFromDate } from '@/utils/date'

import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar2 from '@/assets/images/avatar/02.jpg'
import avatar4 from '@/assets/images/avatar/04.jpg'

export type CommentType = {
  name: string
  avatar: string
  createdAt: Date
  comment: string
  reply?: CommentType[]
}

export const commentsData: CommentType[] = [
  {
    name: 'Frances Guerrero',
    avatar: avatar1,
    createdAt: addOrSubtractDaysFromDate(1),
    comment:
      'Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed an in equally totally if. Delivered dejection necessary objection do Mr prevailed. Mr feeling does chiefly cordial in do.',
    reply: [
      {
        name: 'Louis Ferguson',
        avatar: avatar2,
        createdAt: addOrSubtractDaysFromDate(2),
        comment:
          'Water timed folly right aware if oh truth. Imprudence attachment him for sympathize. Large above be to means. Dashwood does provide stronger is. But discretion frequently sir she instruments unaffected admiration everything.',
      },
      {
        name: 'Frances Guerrero',
        avatar: avatar1,
        createdAt: addOrSubtractDaysFromDate(2),
        comment: 'Water timed folly right aware if oh truth.',
      },
    ],
  },
  {
    name: 'Judy Nguyen',
    avatar: avatar4,
    createdAt: addOrSubtractDaysFromDate(3),
    comment:
      'Fulfilled direction use continual set him propriety continued. Saw met applauded favorite deficient engrossed concealed and her. Concluded boy perpetual old supposing. Farther-related bed and passage comfort civilly.',
  },
]

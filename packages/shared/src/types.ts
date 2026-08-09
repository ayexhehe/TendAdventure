export type UserRole = 'player' | 'admin'

export type Gender = 'male' | 'female' | 'nonbinary' | 'self-describe' | 'prefer-not-to-say'

export interface UserDoc {
  displayName: string
  email: string
  photoURL: string | null
  provider: 'google.com' | 'password' | 'unknown'
  createdAt: number
  role: UserRole
  fullName: string
  sitio: string
  birthday: string | null
  gender: Gender | null
  genderSelfDescribe: string | null
  consentAcceptedAt: number | null
  quizBowl: {
    hasWon: boolean
    wonAt: number | null
  }
  tasked: {
    ticketAwarded: boolean
    completedAt: number | null
  }
}

export interface MerchantDoc {
  name: string
  description: string
  product: string
  tindaZone: string
  youthRepresentative: string
  imageURL: string | null
}

export interface ActivityDoc {
  title: string
  date: string
  committeeHead: string
  location: string
  description: string
  imageURLs: string[]
  createdAt: number
}

export interface QuestionDoc {
  merchantId: string
  text: string
}

export interface QuestionAnswerDoc {
  correctAnswer: string
}

export interface QuizBowlAttemptQuestion {
  merchantId: string
  questionId: string
  assignedAt: number
  answeredAt: number | null
  correct: boolean | null
}

export type QuizBowlAttemptStatus = 'in_progress' | 'won' | 'lost'

export interface QuizBowlAttemptDoc {
  uid: string
  status: QuizBowlAttemptStatus
  startedAt: number
  questions: QuizBowlAttemptQuestion[]
}

export interface QuizBowlTicketDoc {
  uid: string
  merchantId: string
  awardedAt: number
  redeemed: boolean
}

export interface TaskedEntrantDoc {
  personalShareSlug: string
  task1ClickCount: number
  task1CompletedAt: number | null
  task2PostLink: string | null
  task2CompletedAt: number | null
  task3MessageId: string | null
  task3CompletedAt: number | null
  allTasksCompletedAt: number | null
  ticketAwarded: boolean
  ticketNumber: number | null
}

export interface TaskedClickLogDoc {
  ownerUid: string
  clickedAt: number
}

export interface TaskedTicketDoc {
  uid: string
  merchantId: string
  awardedAt: number
  redeemed: boolean
}

export type MessageWallStatus = 'pending' | 'approved' | 'rejected'

export interface MessageWallDoc {
  uid: string
  displayName: string
  text: string
  submittedAt: number
  status: MessageWallStatus
  reviewedBy: string | null
  reviewedAt: number | null
}

export interface GameSettingsDoc {
  quizBowlOpen: boolean
  taskedOpen: boolean
  quizBowlWinThreshold: number
  taskedTicketsTotal: number
}

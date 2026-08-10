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

export interface MerchantQuestion {
  question: string
  correctAnswer: string
  dummyAnswers: string[]
}

export interface MerchantDoc {
  name: string
  description: string
  product: string
  tindaZone: string
  youthRepresentative: string
  imageURL: string | null
  questions: MerchantQuestion[]
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

export interface BannerDoc {
  imageURL: string
  caption: string
  order: number
  linkTo: string | null
  createdAt: number
}

export interface AboutDoc {
  description: string
  imageURL: string | null
  updatedAt: number
}

export interface QuizBowlAttemptQuestion {
  merchantId: string
  merchantName: string
  merchantImageURL: string | null
  merchantTindaZone: string
  question: string
  options: string[]
  correctAnswer: string
}

export type QuizBowlAttemptStatus = 'in_progress' | 'won' | 'lost'

// One doc per player — only the current/most-recent attempt matters, so
// this isn't a growing log. `round` is fixed at creation time so a page
// reload resumes with the exact same questions/option order instead of
// reshuffling, and `cooldownUntil` gates starting a new round after a loss.
export interface QuizBowlAttemptDoc {
  uid: string
  status: QuizBowlAttemptStatus
  round: QuizBowlAttemptQuestion[]
  index: number
  correctCount: number
  startedAt: number
  finishedAt: number | null
  cooldownUntil: number | null
}

export interface QuizBowlTicketDoc {
  uid: string
  merchantId: string
  awardedAt: number
  redeemed: boolean
}

// One doc per player, keyed by uid — tracks progress across all 3 taSKed
// tasks so a player can leave and resume exactly where they left off.
export interface TaskedEntrantDoc {
  uid: string
  personalShareSlug: string
  task1ClickCount: number
  task1CompletedAt: number | null
  task2PostLink: string | null
  task2CompletedAt: number | null
  task3MessageId: string | null
  task3CompletedAt: number | null
  allTasksCompletedAt: number | null
}

// Public slug -> uid pointer, so the anonymous /i/:slug redirect page can
// resolve whose personal invite link was clicked without needing read
// access to the entrant's private progress doc.
export interface TaskedSlugDoc {
  uid: string
  createdAt: number
}

// One doc per logged click on a personal invite link. `visitorId` is a
// client-generated, localStorage-persisted id used only for lightweight
// client-side de-duplication (refreshing the link shouldn't recount).
export interface TaskedClickLogDoc {
  ownerUid: string
  visitorId: string
  clickedAt: number
}

export interface TaskedTicketDoc {
  uid: string
  merchantId: string
  awardedAt: number
  redeemed: boolean
}

export interface TaskedSettingsDoc {
  inviteLink: string
  task2Hashtags: string
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

export interface QuizBowlSettingsDoc {
  noRepeatQuestions: boolean
}

// One doc per player, tracking every "merchantId:question" key they've
// ever been asked so a no-repeat round can skip questions they've
// already seen, even across separate attempts.
export interface QuizBowlSeenQuestionsDoc {
  uid: string
  seen: string[]
}

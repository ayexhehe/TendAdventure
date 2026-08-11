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
  // TindaCoupon allocation: how many game-prize coupons this merchant is
  // willing to honor, and how many have been claimed so far. `issued`
  // only ever moves via the narrowly-scoped self-service increment rule
  // used by the coupon-award transaction — never a full merchant edit.
  couponSupply: number
  couponsIssued: number
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

// Public slug -> uid pointer, so the anonymous /i/:slug invite page can
// resolve (and personalize with) whose link was opened, without any read
// access to that player's actual progress doc. `displayName` is a
// denormalized copy so the invite page doesn't need a second read (and
// doesn't need permission to read the owner's private users/{uid} doc).
export interface TaskedSlugDoc {
  uid: string
  displayName: string
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

export interface TaskedSettingsDoc {
  task1ShareMessage: string
  task2Hashtags: string
}

export type TindaCouponSource = 'quizBowl' | 'tasked' | 'voting'

// The prize for winning either game. Awarded to a random merchant with
// remaining coupon supply. `code` is just a display/reference code for
// the coupon itself — the actual redemption check happens against the
// merchant's own secret code, stored separately in MerchantCodeDoc.
export interface TindaCouponDoc {
  uid: string
  merchantId: string
  code: string
  source: TindaCouponSource
  awardedAt: number
  redeemed: boolean
  redeemedAt: number | null
  redeemedCode: string | null
}

// Kept out of the publicly-readable merchants collection on purpose — a
// coupon holder must never be able to read this directly, only prove
// they know it by having a seller type it in. Firestore rules validate
// a redemption by comparing against this doc via get(), which bypasses
// this doc's own (admin-only) read rule.
export interface MerchantCodeDoc {
  code: string
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

// Per-game admin controls, independent of each other: `Open` gates
// whether the game can be played at all; `TicketsTotal` caps how many
// TindaCoupons that game can hand out in total (0 means unlimited —
// per-merchant coupon supply is still the real constraint in that case).
// `TicketsIssued` is a public running counter (bumped by the same
// transaction that awards a coupon) so any player's client can check
// the cap without needing read access to the private tindaCoupons
// collection.
export interface GameSettingsDoc {
  quizBowlOpen: boolean
  taskedOpen: boolean
  quizBowlTicketsTotal: number
  quizBowlTicketsIssued: number
  taskedTicketsTotal: number
  taskedTicketsIssued: number
  merchantsSectionEnabled: boolean
  // Voting is the third game: a live, timed round (e.g. "SoundCheck Clash
  // People's Choice — 10 minutes") that the admin starts on the spot.
  // Everyone votes against the same shared clock — there's no per-player
  // timer. `votingWindowMinutes` is just the duration typed into the admin
  // panel; starting a round sets `votingWindowEndsAt` to `now + that many
  // minutes`, and voting is live exactly while `now < votingWindowEndsAt`.
  // TindaCoupons drop randomly *within* that live window — a few at a
  // time, never predictably — via a scheduled Cloud Function.
  // `votingTicketsIssued`, `votingWindowEndsAt`, and `nextVotingDropAt`
  // are therefore only ever written by the admin panel (to start/stop a
  // round) or that function (to award a coupon) — never by a voting player.
  votingWindowMinutes: number
  votingWindowEndsAt: number | null
  votingTicketsTotal: number
  votingTicketsIssued: number
  // Epoch ms for the next randomly-scheduled coupon drop within the
  // current live window. Recomputed after each drop (or reseeded whenever
  // a new round starts) so drops never land on a predictable cadence.
  nextVotingDropAt: number | null
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

export interface VotingCategoryDoc {
  name: string
  order: number
  // Hidden categories stay fully manageable in the admin panel (add/edit
  // performers, see results) but are excluded from the public voting flow
  // — voters never see them and don't get a vote for them.
  hidden: boolean
  createdAt: number
}

export interface VotingPerformerDoc {
  categoryId: string
  name: string
  photoURL: string | null
  description: string
  // Denormalized running tally, kept in sync by a Cloud Function trigger
  // on vote creation (never written directly by a client).
  voteCount: number
  createdAt: number
}

// One doc per (voter, category), doc id `${uid}_${categoryId}` — that
// deterministic id is what makes "one vote per category" enforceable by
// rules alone: a second attempt just collides with the existing doc,
// which the rules never allow to be updated or replaced.
export interface VoteDoc {
  uid: string
  categoryId: string
  performerId: string
  votedAt: number
}

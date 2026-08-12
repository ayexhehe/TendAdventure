export type UserRole = 'player' | 'admin'

export type Gender = 'male' | 'female' | 'nonbinary' | 'self-describe' | 'prefer-not-to-say'

export type CurrentStatus =
  | 'student'
  | 'employed'
  | 'self-employed'
  | 'looking-for-work'
  | 'not-studying-or-working'
  | 'other'

export type StudentLevel = 'junior-high' | 'senior-high' | 'college'

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
  // KK Profiling: education/employment status.
  currentStatus: CurrentStatus | null
  studentLevel: StudentLevel | null
  currentStatusOther: string | null
  // KK Profiling: skills/talents and interests, both "select all that
  // apply" — stored as the option labels themselves rather than a code,
  // with a literal 'Other' entry pointing at the matching *Other field
  // when someone picks it.
  skills: string[]
  skillsOther: string | null
  interests: string[]
  interestsOther: string | null
  // KK Profiling: open feedback on what programs/support they'd want
  // from the SK. Deliberately optional — not required to complete a
  // profile, unlike everything else on this doc.
  skVoice: string
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
  // How many quiz questions this merchant has, WITHOUT the questions
  // themselves — the real questionnaire (with correctAnswer) lives in the
  // admin-only merchantQuestions/{merchantId} doc instead. This field is
  // just enough for the public client to know a merchant is quiz-eligible,
  // without ever shipping an answer key to every visitor's browser.
  questionCount: number
  // TindaCoupon allocation: how many game-prize coupons this merchant is
  // willing to honor, and how many have been claimed so far. `issued`
  // only ever moves via the narrowly-scoped self-service increment rule
  // used by the coupon-award transaction — never a full merchant edit.
  couponSupply: number
  couponsIssued: number
}

// Admin-only, mirrors merchantCodes: the real questionnaire (including
// correctAnswer) for a merchant, kept off the public merchants collection
// entirely so quiz answers are never sent to a player's browser. Only
// read by the startQuizAttempt Cloud Function (Admin SDK) and the admin
// Merchants tab.
export interface MerchantQuestionsDoc {
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
  // Admin-set spotlight flag. Highlighted activities are sorted to the
  // front of the "Upcoming" list (on both the Calendar page and the
  // landing page preview) instead of strict date order.
  highlighted: boolean
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

// Deliberately has no correctAnswer field — this is the shape stored on
// the client-readable quizBowlAttempts/{uid} doc, so the answer key is
// never sitting in a player's browser for a question they haven't
// answered yet. Grading happens server-side, in the startQuizAttempt /
// submitQuizAnswer Cloud Functions, against QuizBowlAttemptSecretDoc.
export interface QuizBowlAttemptQuestion {
  merchantId: string
  merchantName: string
  merchantImageURL: string | null
  merchantTindaZone: string
  question: string
  options: string[]
}

export type QuizBowlAttemptStatus = 'in_progress' | 'won' | 'lost'

// One doc per player — only the current/most-recent attempt matters, so
// this isn't a growing log. `round` is fixed at creation time so a page
// reload resumes with the exact same questions/option order instead of
// reshuffling, and `cooldownUntil` gates starting a new round after a loss.
// Written only by the startQuizAttempt / submitQuizAnswer Cloud Functions
// (Admin SDK) or an admin reset — never directly by the player's client,
// so a player can never self-declare a win.
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

// The answer key for a player's current round, index-aligned with
// QuizBowlAttemptDoc.round. Lives in its own collection with NO Firestore
// rule granting any client access at all (not even the owning player, not
// even an admin) — only reachable via the Admin SDK inside the grading
// Cloud Function. This is what actually keeps quiz answers off the wire.
export interface QuizBowlAttemptSecretDoc {
  uid: string
  answers: string[]
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
  // taSKed is the only game left that awards its own TindaCoupon directly
  // from the client (Quiz Bowl and Voting both moved server-side) — this
  // is the idempotency lock the award transaction flips atomically
  // alongside creating the coupon, so a race between two open tabs/devices
  // can never result in the same player getting two coupons. See
  // lib/tindaCoupons.ts's awardTindaCoupon.
  couponAwarded: boolean
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

// One doc per (owner, real visitor account) pair, doc id
// `${ownerUid}_${visitorId}` — that deterministic id is what makes a
// click only ever countable once per real signed-in visitor: a repeat
// click just collides with the existing doc, which the rules never allow
// to be updated. `visitorId` is the *clicking visitor's own Firebase Auth
// uid* (not a spoofable client-generated id) — logging a click requires
// being signed in specifically so this can't be faked by scripting
// anonymous writes.
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
  // Caps how many merchants can be listed at all (0 means unlimited).
  // Both the landing page and the Merchants page derive their "Be one of
  // the Tindahan!" join CTA from this directly — it's shown whenever the
  // live merchant count is still under this number, alongside merchant
  // highlights (or on its own, if there are no merchants yet).
  merchantSlotsTotal: number
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
  createdAt: number
}

// One doc per performer, keyed by performerId, living in its own
// admin-only-readable collection — deliberately kept off the public
// VotingPerformerDoc so results can never be read by a voter (or anyone
// else) while a round is still live. Written only by the vote-created
// Cloud Function trigger; no client, not even an admin one, can write it
// directly.
export interface VotingResultDoc {
  voteCount: number
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

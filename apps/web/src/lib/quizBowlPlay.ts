import { httpsCallable } from 'firebase/functions'
import type { QuizBowlAttemptQuestion, QuizBowlAttemptStatus } from '@tindadventure/shared'
import { functions } from './firebase'

export interface QuizCoupon {
  id: string
  merchantId: string
  code: string
}

export interface StartQuizAttemptResult {
  round: QuizBowlAttemptQuestion[]
}

// Mirrors the response shape built by submitQuizAnswer in
// functions/src/quizBowl.ts. `finished: true` means this call arrived
// after the round had already ended (a retried/duplicate call) — the
// server replayed the current committed state instead of re-grading, so
// `correct`/`correctAnswer` aren't meaningful for it and are omitted.
export interface SubmitQuizAnswerResult {
  finished: boolean
  correct?: boolean
  correctAnswer?: string
  isLast: boolean
  correctCount: number
  status: QuizBowlAttemptStatus
  cooldownUntil: number | null
  coupon: QuizCoupon | null
  soldOut: boolean
}

// Grading lives entirely server-side (see functions/src/quizBowl.ts) —
// the client never sees an answer key, only ever the outcome of a
// specific submitted choice, and can't self-declare a win.
export async function startQuizAttempt(): Promise<StartQuizAttemptResult> {
  if (!functions) throw new Error('Functions is not configured')
  const call = httpsCallable<Record<string, never>, StartQuizAttemptResult>(functions, 'startQuizAttempt')
  const result = await call({})
  return result.data
}

export async function submitQuizAnswer(selectedOption: string): Promise<SubmitQuizAnswerResult> {
  if (!functions) throw new Error('Functions is not configured')
  const call = httpsCallable<{ selectedOption: string }, SubmitQuizAnswerResult>(
    functions,
    'submitQuizAnswer',
  )
  const result = await call({ selectedOption })
  return result.data
}

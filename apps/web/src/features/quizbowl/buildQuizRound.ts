import type { QuizBowlAttemptQuestion } from '@tindadventure/shared'
import type { MerchantWithId } from '../../lib/merchants'

export type QuizRoundQuestion = QuizBowlAttemptQuestion

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function questionKey(merchantId: string, question: string): string {
  return `${merchantId}:${question}`
}

// One random question per merchant, so every merchant with a
// questionnaire gets equal promotional exposure in a round instead of
// merchants with more submitted questions dominating the quiz.
//
// `seenKeys` — questionKey()s this player has already been asked before —
// are excluded when possible. If every question for a merchant has
// already been seen (or it only has one), a repeat is unavoidable and the
// merchant still gets included so the round stays fair.
export function buildQuizRound(
  merchants: MerchantWithId[],
  seenKeys: Set<string> = new Set(),
): QuizRoundQuestion[] {
  const round = merchants
    .filter((m) => (m.questions ?? []).length > 0)
    .map((m) => {
      const questions = m.questions ?? []
      const unseen = questions.filter((q) => !seenKeys.has(questionKey(m.id, q.question)))
      const pool = unseen.length > 0 ? unseen : questions
      const q = pool[Math.floor(Math.random() * pool.length)]
      return {
        merchantId: m.id,
        merchantName: m.name,
        merchantImageURL: m.imageURL,
        merchantTindaZone: m.tindaZone,
        question: q.question,
        options: shuffle([q.correctAnswer, ...q.dummyAnswers]),
        correctAnswer: q.correctAnswer,
      }
    })

  return shuffle(round)
}

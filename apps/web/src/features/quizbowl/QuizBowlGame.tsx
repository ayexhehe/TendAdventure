import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { HARDCODED_QUESTIONS, WIN_THRESHOLD } from './questions'

type Feedback = 'correct' | 'incorrect' | null

export function QuizBowlGame() {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const question = HARDCODED_QUESTIONS[index]
  const isLast = index === HARDCODED_QUESTIONS.length - 1

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (feedback) return // already answered, waiting for Next

    const isCorrect = input.trim().toLowerCase() === question.answer.toLowerCase()
    setFeedback(isCorrect ? 'correct' : 'incorrect')
    if (isCorrect) setCorrectCount((c) => c + 1)
  }

  const handleNext = () => {
    if (isLast) {
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setInput('')
    setFeedback(null)
  }

  if (finished) {
    const won = correctCount >= WIN_THRESHOLD
    return (
      <div className="flex flex-col items-center gap-3 text-center text-white">
        <p className="text-2xl font-semibold">
          {correctCount} / {HARDCODED_QUESTIONS.length} correct
        </p>
        <p className="text-lg">
          {won ? '🎉 You won a ticket!' : `You needed ${WIN_THRESHOLD} correct to win — try again next time.`}
        </p>
        <Link
          to="/"
          className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm text-center text-white">
      <p className="mb-1 text-xs uppercase tracking-wide text-white/60">
        Question {index + 1} of {HARDCODED_QUESTIONS.length}
      </p>
      <p className="mb-4 text-sm text-white/80">{question.merchant}</p>
      <p className="mb-6 text-lg font-medium">{question.text}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={feedback !== null}
          placeholder="Type your answer"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 disabled:opacity-60"
        />

        {feedback === null && (
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
          >
            Submit
          </button>
        )}
      </form>

      {feedback && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <p className={feedback === 'correct' ? 'text-green-300' : 'text-red-300'}>
            {feedback === 'correct' ? 'Correct!' : `Incorrect — the answer was "${question.answer}".`}
          </p>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
          >
            {isLast ? 'See result' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  )
}

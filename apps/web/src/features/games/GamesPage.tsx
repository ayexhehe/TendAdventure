import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { GameCard } from '../../components/games/GameCard'
import { QuizBowlIcon, TaskedIcon } from '../../components/games/gameIcons'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToAttempt } from '../../lib/quizBowlAttempts'
import { subscribeToEntrant } from '../../lib/tasked'

export function GamesPage() {
  const { user } = useAuth()
  const [canContinue, setCanContinue] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [taskedInProgress, setTaskedInProgress] = useState(false)

  useEffect(() => {
    if (!user) {
      setCanContinue(false)
      setCooldownUntil(null)
      return
    }
    return subscribeToAttempt(user.uid, (attempt) => {
      setCanContinue(attempt?.status === 'in_progress')
      setCooldownUntil(attempt?.status === 'lost' ? attempt.cooldownUntil : null)
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setTaskedInProgress(false)
      return
    }
    return subscribeToEntrant(user.uid, (entrant) => {
      const started = !!(entrant?.task1CompletedAt || entrant?.task2CompletedAt || entrant?.task3CompletedAt)
      setTaskedInProgress(started && !entrant?.allTasksCompletedAt)
    })
  }, [user])

  return (
    <Layout>
      <div className="flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-semibold text-white md:text-3xl">Games</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GameCard
            to="/quizbowl"
            title="Quiz Bowl"
            description="Test your merchant knowledge and win prizes."
            icon={<QuizBowlIcon />}
            continueAvailable={canContinue}
            cooldownUntil={cooldownUntil}
          />
          <GameCard
            to="/tasked"
            title="taSKed"
            description="Complete 3 tasks to win a ticket."
            icon={<TaskedIcon />}
            continueAvailable={taskedInProgress}
          />
        </div>
      </div>
    </Layout>
  )
}

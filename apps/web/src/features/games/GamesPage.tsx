import { useEffect, useState } from 'react'
import type { GameSettingsDoc } from '@tindadventure/shared'
import { Layout } from '../../components/layout/Layout'
import { GameCard } from '../../components/games/GameCard'
import { QuizBowlIcon, TaskedIcon } from '../../components/games/gameIcons'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToAttempt } from '../../lib/quizBowlAttempts'
import { subscribeToEntrant } from '../../lib/tasked'
import { subscribeToGameSettings } from '../../lib/gameSettings'
import { isGameSoldOut } from '../../lib/tindaCoupons'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'

export function GamesPage() {
  const { user } = useAuth()
  const [canContinue, setCanContinue] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [quizProgress, setQuizProgress] = useState(0)
  const [quizWon, setQuizWon] = useState(false)
  const [taskedInProgress, setTaskedInProgress] = useState(false)
  const [taskedProgress, setTaskedProgress] = useState(0)
  const [taskedWon, setTaskedWon] = useState(false)
  const [gameSettings, setGameSettings] = useState<GameSettingsDoc | null>(null)
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])

  useEffect(() => subscribeToGameSettings(setGameSettings), [])
  useEffect(() => subscribeToMerchants(setMerchants), [])

  useEffect(() => {
    if (!user) {
      setCanContinue(false)
      setCooldownUntil(null)
      setQuizProgress(0)
      setQuizWon(false)
      return
    }
    return subscribeToAttempt(user.uid, (attempt) => {
      setCanContinue(attempt?.status === 'in_progress')
      setCooldownUntil(attempt?.status === 'lost' ? attempt.cooldownUntil : null)
      setQuizWon(attempt?.status === 'won')
      if (attempt?.status === 'won') {
        setQuizProgress(1)
      } else if (attempt?.status === 'in_progress' && attempt.round.length > 0) {
        setQuizProgress(attempt.index / attempt.round.length)
      } else {
        setQuizProgress(0)
      }
    })
  }, [user])

  useEffect(() => {
    if (!user) {
      setTaskedInProgress(false)
      setTaskedProgress(0)
      setTaskedWon(false)
      return
    }
    return subscribeToEntrant(user.uid, (entrant) => {
      const completedCount = [
        entrant?.task1CompletedAt,
        entrant?.task2CompletedAt,
        entrant?.task3CompletedAt,
      ].filter(Boolean).length
      const started = completedCount > 0
      const won = !!entrant?.allTasksCompletedAt
      setTaskedInProgress(started && !won)
      setTaskedProgress(won ? 1 : completedCount / 3)
      setTaskedWon(won)
    })
  }, [user])

  const quizBowlOpen = gameSettings?.quizBowlOpen ?? true
  const taskedOpen = gameSettings?.taskedOpen ?? true
  const quizSoldOut = isGameSoldOut('quizBowl', gameSettings, merchants)
  const taskedSoldOut = isGameSoldOut('tasked', gameSettings, merchants)

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
            progress={quizProgress}
            completed={quizWon}
            closed={!quizBowlOpen}
            soldOut={quizSoldOut}
            ticketProgress={{
              issued: gameSettings?.quizBowlTicketsIssued ?? 0,
              total: gameSettings?.quizBowlTicketsTotal ?? 0,
            }}
          />
          <GameCard
            to="/tasked"
            title="taSKed"
            description="Complete 3 tasks to win a TindaCoupon."
            icon={<TaskedIcon />}
            continueAvailable={taskedInProgress}
            progress={taskedProgress}
            completed={taskedWon}
            closed={!taskedOpen}
            soldOut={taskedSoldOut}
            ticketProgress={{
              issued: gameSettings?.taskedTicketsIssued ?? 0,
              total: gameSettings?.taskedTicketsTotal ?? 0,
            }}
          />
        </div>
      </div>
    </Layout>
  )
}

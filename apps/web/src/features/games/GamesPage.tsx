import { Layout } from '../../components/layout/Layout'
import { GameCard } from '../../components/games/GameCard'
import { QuizBowlIcon, TaskedIcon } from '../../components/games/gameIcons'

export function GamesPage() {
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
          />
          <GameCard
            to="/tasked"
            title="taSKed"
            description="A new challenge is on its way."
            comingSoon
            icon={<TaskedIcon />}
          />
        </div>
      </div>
    </Layout>
  )
}

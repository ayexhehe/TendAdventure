import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from './features/landing/LandingPage'
import { AboutPage } from './features/about/AboutPage'
import { MerchantsPage } from './features/merchants/MerchantsPage'
import { BeATindahanPage } from './features/merchants/BeATindahanPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { GamesPage } from './features/games/GamesPage'
import { QuizBowlPage } from './features/quizbowl/QuizBowlPage'
import { TaskedPage } from './features/tasked/TaskedPage'
import { VotingPage } from './features/voting/VotingPage'
import { InvitePage } from './features/tasked/InvitePage'
import { MessageWallPage } from './features/messagewall/MessageWallPage'
import { AdminPage } from './features/admin/AdminPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { TicketsPage } from './features/tickets/TicketsPage'
import { LoginPage } from './features/auth/LoginPage'
import { NotFoundPage } from './components/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/merchants', element: <MerchantsPage /> },
  { path: '/be-a-tindahan', element: <BeATindahanPage /> },
  { path: '/calendar', element: <CalendarPage /> },
  { path: '/games', element: <GamesPage /> },
  { path: '/quizbowl', element: <QuizBowlPage /> },
  { path: '/tasked', element: <TaskedPage /> },
  { path: '/voting', element: <VotingPage /> },
  { path: '/i/:slug', element: <InvitePage /> },
  { path: '/wall', element: <MessageWallPage /> },
  { path: '/admin/*', element: <AdminPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/tickets', element: <TicketsPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
])

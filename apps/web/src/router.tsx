import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from './features/landing/LandingPage'
import { QuizBowlPage } from './features/quizbowl/QuizBowlPage'
import { TaskedPage } from './features/tasked/TaskedPage'
import { MessageWallPage } from './features/messagewall/MessageWallPage'
import { AdminPage } from './features/admin/AdminPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { TicketsPage } from './features/tickets/TicketsPage'
import { LoginPage } from './features/auth/LoginPage'
import { NotFoundPage } from './components/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/quizbowl', element: <QuizBowlPage /> },
  { path: '/tasked', element: <TaskedPage /> },
  { path: '/wall', element: <MessageWallPage /> },
  { path: '/admin/*', element: <AdminPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/tickets', element: <TicketsPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
])

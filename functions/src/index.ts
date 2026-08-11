import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { dropVotingTickets, onVoteCreated } from './voting'
export { startQuizAttempt, submitQuizAnswer } from './quizBowl'

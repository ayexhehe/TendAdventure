import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { dropVotingTickets, onVoteCreated } from './voting'

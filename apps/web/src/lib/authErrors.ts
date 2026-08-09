import { FirebaseError } from 'firebase/app'

export function friendlyAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'That email is already registered — try signing in instead.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.'
      case 'auth/invalid-email':
        return 'That email address looks invalid.'
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'No account found with that email and password.'
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in isn’t enabled for this project yet.'
      default:
        console.error('Unhandled Firebase auth error:', error.code, error.message)
        return `Something went wrong (${error.code}) — please try again.`
    }
  }
  return 'Something went wrong — please try again.'
}

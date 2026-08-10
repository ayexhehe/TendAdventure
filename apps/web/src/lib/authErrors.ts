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
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled — try again.'
      case 'auth/popup-blocked':
        return 'Your browser blocked the sign-in popup — try again.'
      case 'auth/account-exists-with-different-credential':
        return 'That email is already registered with a different sign-in method.'
      case 'auth/unauthorized-domain':
        return 'This site isn’t authorized for Google sign-in yet.'
      default:
        console.error('Unhandled Firebase auth error:', error.code, error.message)
        return `Something went wrong (${error.code}) — please try again.`
    }
  }
  return 'Something went wrong — please try again.'
}

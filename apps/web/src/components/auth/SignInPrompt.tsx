import { AuthOptions } from './AuthOptions'

export function SignInPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-lg text-white">Sign in to continue</p>
      <AuthOptions />
    </div>
  )
}

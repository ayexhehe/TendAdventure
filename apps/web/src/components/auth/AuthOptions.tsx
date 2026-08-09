import { EmailPasswordAuth } from './EmailPasswordAuth'
import { GoogleSignInButton } from './GoogleSignInButton'

export function AuthOptions({
  initialMode,
}: {
  initialMode?: 'register' | 'signin'
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <EmailPasswordAuth initialMode={initialMode} />
      <div className="flex w-full max-w-xs items-center gap-2 text-xs text-white/40">
        <div className="h-px flex-1 bg-white/20" />
        or
        <div className="h-px flex-1 bg-white/20" />
      </div>
      <GoogleSignInButton />
    </div>
  )
}

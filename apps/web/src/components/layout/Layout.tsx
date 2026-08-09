import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { EmailVerificationBanner } from '../auth/EmailVerificationBanner'
import bgOverlay from '../../assets/bg-overlay.svg'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#113DCB]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-repeat opacity-40"
        style={{ backgroundImage: `url(${bgOverlay})`, backgroundSize: '600px 600px' }}
      />

      <Footer />

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <Header />
        <EmailVerificationBanner />
        <main className="flex flex-1 flex-col items-center px-6 pb-[9vw]">
          {children}
        </main>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import backgroundStrip from '../../assets/background-strip.jpg'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#113DCB]">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        {children}
      </main>
      <Footer />

      <img
        src={backgroundStrip}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-auto w-full object-cover"
      />
    </div>
  )
}

import type { ReactNode } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import backgroundStrip from '../../assets/background-strip.jpg'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#113DCB]">
      <img
        src={backgroundStrip}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-auto w-full object-cover"
      />

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-6">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}

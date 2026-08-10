import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { subscribeToApprovedMessages, type MessageWithId } from '../../lib/messageWall'

export function MessageWallPage() {
  const [messages, setMessages] = useState<MessageWithId[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(
    () =>
      subscribeToApprovedMessages((m) => {
        setMessages(m)
        setLoading(false)
      }),
    [],
  )

  return (
    <Layout>
      <div className="flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Message Wall</h1>
          <p className="mt-2 text-sm text-white/60">Messages from the youth of Barangay Guadalupe.</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-white/50">No messages yet — be the first to leave one!</p>
        )}

        {!loading && messages.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-3 rounded-2xl bg-white/5 p-5">
                <p className="text-sm text-white/90">{m.text}</p>
                <p className="mt-auto text-xs font-medium text-white/50">— {m.displayName || 'Anonymous'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

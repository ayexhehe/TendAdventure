import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { subscribeToAllMessages, setMessageStatus, type MessageWithId } from '../../lib/messageWall'

const STATUS_BADGE: Record<MessageWithId['status'], string> = {
  pending: 'bg-amber-500/20 text-amber-200',
  approved: 'bg-emerald-500/20 text-emerald-200',
  rejected: 'bg-red-500/20 text-red-200',
}

export function MessageWallTab() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageWithId[]>([])

  useEffect(() => subscribeToAllMessages(setMessages), [])

  const handleSetStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return
    await setMessageStatus(id, status, user.email ?? user.uid)
  }

  const pending = messages.filter((m) => m.status === 'pending')
  const others = messages.filter((m) => m.status !== 'pending')

  return (
    <div className="w-full text-white">
      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Pending review ({pending.length})</h2>
        <div className="mt-4 flex flex-col gap-3 px-6 pb-6">
          {pending.length === 0 && <p className="text-sm text-white/50">Nothing waiting on review.</p>}
          {pending.map((m) => (
            <div key={m.id} className="flex flex-col gap-3 rounded-xl bg-white/5 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm text-white/90">{m.text}</p>
                <p className="mt-1 text-xs text-white/50">— {m.displayName || 'Anonymous'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSetStatus(m.id, 'approved')}
                  className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => void handleSetStatus(m.id, 'rejected')}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Reviewed ({others.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Message</th>
                <th className="px-6 py-3">From</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {others.map((m) => (
                <tr key={m.id} className="border-t border-white/10">
                  <td className="max-w-md px-6 py-3 text-white/80">{m.text}</td>
                  <td className="px-6 py-3 text-white/70">{m.displayName || 'Anonymous'}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[m.status]}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {others.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={3}>
                    Nothing reviewed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

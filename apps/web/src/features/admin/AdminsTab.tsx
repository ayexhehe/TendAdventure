import { useEffect, useState } from 'react'
import { addAdminEmail, subscribeToAdminEmails } from '../../lib/adminEmails'

export function AdminsTab() {
  const [emails, setEmails] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeToAdminEmails(setEmails), [])

  const handleAdd = async () => {
    setError(null)
    try {
      await addAdminEmail(input)
      setInput('')
    } catch {
      setError('Could not add that email.')
    }
  }

  return (
    <div className="w-full text-white">
      <h2 className="mb-2 text-lg font-semibold">Admins</h2>
      <ul className="mb-4 space-y-1 text-sm text-white/80">
        {emails.map((email) => (
          <li key={email}>{email}</li>
        ))}
      </ul>
      <div className="flex max-w-sm gap-2">
        <input
          type="email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="name@example.com"
          className="flex-1 rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}

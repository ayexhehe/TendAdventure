import { useEffect, useState } from 'react'
import { subscribeToUsers, type UserWithId } from '../../lib/users'

const PROVIDER_LABEL: Record<UserWithId['provider'], string> = {
  'google.com': 'Google',
  password: 'Email/password',
  unknown: 'Unknown',
}

export function UsersTab() {
  const [users, setUsers] = useState<UserWithId[]>([])

  useEffect(() => subscribeToUsers(setUsers), [])

  return (
    <div className="w-full text-white">
      <h2 className="mb-2 text-lg font-semibold">Users ({users.length})</h2>
      <div className="overflow-hidden rounded-lg bg-white/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10 text-white/60">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Signed in via</th>
              <th className="px-3 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="px-3 py-2">{u.displayName || '—'}</td>
                <td className="px-3 py-2 text-white/70">{u.email}</td>
                <td className="px-3 py-2 text-white/70">{PROVIDER_LABEL[u.provider]}</td>
                <td className="px-3 py-2 text-white/70">{u.role}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-white/50" colSpan={4}>
                  No registered users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { subscribeToUsers, type UserWithId } from '../../lib/users'
import { calculateAge } from '../../lib/age'

const PROVIDER_LABEL: Record<UserWithId['provider'], string> = {
  'google.com': 'Google',
  password: 'Email/password',
  unknown: 'Unknown',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  nonbinary: 'Non-binary',
  'self-describe': 'Prefer to self-describe',
  'prefer-not-to-say': 'Prefer not to say',
}

function formatGender(u: UserWithId): string {
  if (!u.gender) return '—'
  if (u.gender === 'self-describe' && u.genderSelfDescribe) return u.genderSelfDescribe
  return GENDER_LABEL[u.gender] ?? '—'
}

export function UsersTab() {
  const [users, setUsers] = useState<UserWithId[]>([])

  useEffect(() => subscribeToUsers(setUsers), [])

  return (
    <div className="w-full text-white">
      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Users ({users.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Sitio</th>
                <th className="px-6 py-3">Age</th>
                <th className="px-6 py-3">Gender</th>
                <th className="px-6 py-3">Signed in via</th>
                <th className="px-6 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-6 py-3">{u.displayName || '—'}</td>
                  <td className="px-6 py-3 text-white/70">{u.email}</td>
                  <td className="px-6 py-3 text-white/70">{u.sitio || '—'}</td>
                  <td className="px-6 py-3 text-white/70">{calculateAge(u.birthday) ?? '—'}</td>
                  <td className="px-6 py-3 text-white/70">{formatGender(u)}</td>
                  <td className="px-6 py-3 text-white/70">{PROVIDER_LABEL[u.provider]}</td>
                  <td className="px-6 py-3 text-white/70">{u.role}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={7}>
                    No registered users yet.
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

import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { RequireAdmin } from '../../components/auth/RequireAdmin'
import { MerchantsTab } from './MerchantsTab'
import { UsersTab } from './UsersTab'
import { AdminsTab } from './AdminsTab'

const TABS = ['Merchants', 'Users', 'Admins'] as const
type Tab = (typeof TABS)[number]

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('Merchants')

  return (
    <Layout>
      <RequireAdmin>
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex justify-center gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  tab === t ? 'bg-white text-[#113DCB]' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Merchants' && <MerchantsTab />}
          {tab === 'Users' && <UsersTab />}
          {tab === 'Admins' && <AdminsTab />}
        </div>
      </RequireAdmin>
    </Layout>
  )
}

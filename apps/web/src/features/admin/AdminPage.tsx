import { useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { RequireAdmin } from '../../components/auth/RequireAdmin'
import { MerchantsTab } from './MerchantsTab'
import { UsersTab } from './UsersTab'
import { AdminsTab } from './AdminsTab'
import { CalendarTab } from './CalendarTab'
import { BannersTab } from './BannersTab'
import { AboutUsTab } from './AboutUsTab'

const TABS = ['Merchants', 'Calendar', 'Banners', 'About Us', 'Users', 'Admins'] as const
type Tab = (typeof TABS)[number]

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('Merchants')

  return (
    <Layout>
      <RequireAdmin>
        <div className="w-full max-w-5xl px-4">
          <h1 className="mb-6 text-2xl font-semibold text-white">Admin Panel</h1>

          <div className="mb-6 flex gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  tab === t ? 'bg-white text-[#113DCB]' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'Merchants' && <MerchantsTab />}
          {tab === 'Calendar' && <CalendarTab />}
          {tab === 'Banners' && <BannersTab />}
          {tab === 'About Us' && <AboutUsTab />}
          {tab === 'Users' && <UsersTab />}
          {tab === 'Admins' && <AdminsTab />}
        </div>
      </RequireAdmin>
    </Layout>
  )
}

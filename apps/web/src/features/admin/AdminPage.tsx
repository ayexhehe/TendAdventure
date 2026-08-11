import { useEffect, useState } from 'react'
import { Layout } from '../../components/layout/Layout'
import { RequireAdmin } from '../../components/auth/RequireAdmin'
import { MerchantsTab } from './MerchantsTab'
import { VotingTab } from './VotingTab'
import { UsersTab } from './UsersTab'
import { AdminsTab } from './AdminsTab'
import { CalendarTab } from './CalendarTab'
import { BannersTab } from './BannersTab'
import { AboutUsTab } from './AboutUsTab'
import { GeneralTab } from './GeneralTab'
import { MessageWallTab } from './MessageWallTab'
import { TicketsTab } from './TicketsTab'
import { subscribeToAllCoupons } from '../../lib/tindaCoupons'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import { CouponResetSettings } from './CouponResetSettings'

const TABS = [
  'General',
  'Merchants',
  'Voting',
  'Calendar',
  'Banners',
  'About Us',
  'Message Wall',
  'Tickets',
  'Users',
  'Admins',
] as const
type Tab = (typeof TABS)[number]

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('General')
  const [couponsIssued, setCouponsIssued] = useState(0)
  const [couponsRedeemed, setCouponsRedeemed] = useState(0)
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])

  useEffect(
    () =>
      subscribeToAllCoupons((coupons) => {
        setCouponsIssued(coupons.length)
        setCouponsRedeemed(coupons.filter((c) => c.redeemed).length)
      }),
    [],
  )

  useEffect(() => subscribeToMerchants(setMerchants), [])

  const couponsTotal = merchants.reduce((sum, m) => sum + (m.couponSupply ?? 0), 0)

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

          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-white/5 px-5 py-3 text-sm">
            <span className="font-semibold text-white">🎟️ TindaCoupons</span>
            <span className="text-white/70">
              Total: <strong className="text-white">{couponsTotal}</strong>
            </span>
            <span className="text-white/70">
              Issued: <strong className="text-white">{couponsIssued}</strong>
            </span>
            <span className="text-white/70">
              Redeemed: <strong className="text-emerald-300">{couponsRedeemed}</strong>
            </span>
            <span className="text-white/70">
              Outstanding: <strong className="text-amber-300">{couponsIssued - couponsRedeemed}</strong>
            </span>
            <CouponResetSettings merchants={merchants} />
          </div>

          {tab === 'General' && <GeneralTab />}
          {tab === 'Merchants' && <MerchantsTab />}
          {tab === 'Voting' && <VotingTab />}
          {tab === 'Calendar' && <CalendarTab />}
          {tab === 'Banners' && <BannersTab />}
          {tab === 'About Us' && <AboutUsTab />}
          {tab === 'Message Wall' && <MessageWallTab />}
          {tab === 'Tickets' && <TicketsTab />}
          {tab === 'Users' && <UsersTab />}
          {tab === 'Admins' && <AdminsTab />}
        </div>
      </RequireAdmin>
    </Layout>
  )
}

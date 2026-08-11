import { useEffect, useState } from 'react'
import { deleteCoupon, subscribeToAllCoupons, type TindaCouponWithId } from '../../lib/tindaCoupons'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import { subscribeToUsers, type UserWithId } from '../../lib/users'
import { Pagination } from '../../components/Pagination'

const PAGE_SIZE = 10

const SOURCE_LABEL: Record<TindaCouponWithId['source'], string> = {
  quizBowl: 'Quiz Bowl',
  tasked: 'taSKed',
  voting: 'Voting',
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function DeleteCell({
  coupon,
  confirming,
  confirmText,
  deleting,
  onOpenConfirm,
  onChangeConfirmText,
  onConfirm,
  onCancel,
}: {
  coupon: TindaCouponWithId
  confirming: boolean
  confirmText: string
  deleting: boolean
  onOpenConfirm: () => void
  onChangeConfirmText: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  if (confirming) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-white/50">Type DELETE to confirm</span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => onChangeConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
            className="w-24 rounded-md bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/30"
          />
          <button
            type="button"
            aria-label="Confirm delete"
            onClick={onConfirm}
            disabled={deleting || confirmText.trim().toUpperCase() !== 'DELETE'}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 0 1.415l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.79-6.79a1 1 0 0 1 1.414-.006Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Cancel delete"
            onClick={onCancel}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Delete coupon ${coupon.code}`}
      onClick={onOpenConfirm}
      disabled={deleting}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-red-200 disabled:opacity-50"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M8.75 1a.75.75 0 0 0-.75.75V3H4.5a.75.75 0 0 0 0 1.5h.322l.734 10.276A2.75 2.75 0 0 0 8.298 17h3.404a2.75 2.75 0 0 0 2.742-2.224L15.178 4.5H15.5a.75.75 0 0 0 0-1.5H12v-1.25a.75.75 0 0 0-.75-.75h-2.5ZM10 4.5h2.5-5H10Zm-2.984 1.5.719 10.06a1.25 1.25 0 0 0 1.246 1.16h3.038a1.25 1.25 0 0 0 1.246-1.16L13.984 6H7.016Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}

export function TicketsTab() {
  const [coupons, setCoupons] = useState<TindaCouponWithId[]>([])
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [users, setUsers] = useState<UserWithId[]>([])
  const [unclaimedPage, setUnclaimedPage] = useState(0)
  const [claimedPage, setClaimedPage] = useState(0)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => subscribeToAllCoupons(setCoupons), [])
  useEffect(() => subscribeToMerchants(setMerchants), [])
  useEffect(() => subscribeToUsers(setUsers), [])

  const openConfirm = (id: string) => {
    setConfirmDeleteId(id)
    setDeleteConfirmText('')
  }

  const closeConfirm = () => {
    setConfirmDeleteId(null)
    setDeleteConfirmText('')
  }

  const handleDelete = async (coupon: TindaCouponWithId) => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return
    closeConfirm()
    setDeletingId(coupon.id)
    setDeleteError(null)
    try {
      await deleteCoupon(coupon)
    } catch {
      setDeleteError('Could not delete that coupon.')
    } finally {
      setDeletingId(null)
    }
  }

  const merchantsById = Object.fromEntries(merchants.map((m) => [m.id, m]))
  const usersById = Object.fromEntries(users.map((u) => [u.id, u]))

  const unclaimed = [...coupons].filter((c) => !c.redeemed).sort((a, b) => b.awardedAt - a.awardedAt)
  const claimed = [...coupons]
    .filter((c) => c.redeemed)
    .sort((a, b) => (b.redeemedAt ?? 0) - (a.redeemedAt ?? 0))

  const unclaimedPageCount = Math.max(1, Math.ceil(unclaimed.length / PAGE_SIZE))
  const claimedPageCount = Math.max(1, Math.ceil(claimed.length / PAGE_SIZE))

  useEffect(() => {
    if (unclaimedPage >= unclaimedPageCount) setUnclaimedPage(0)
  }, [unclaimedPage, unclaimedPageCount])

  useEffect(() => {
    if (claimedPage >= claimedPageCount) setClaimedPage(0)
  }, [claimedPage, claimedPageCount])

  const playerLabel = (uid: string) => {
    const u = usersById[uid]
    return u?.displayName || u?.email || uid
  }

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Unclaimed TindaCoupons ({unclaimed.length})</h2>
        {deleteError && <p className="px-6 pt-2 text-xs text-red-300">{deleteError}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Player</th>
                <th className="px-6 py-3">Tindahan</th>
                <th className="px-6 py-3">Game</th>
                <th className="px-6 py-3">Awarded</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {unclaimed.slice(unclaimedPage * PAGE_SIZE, unclaimedPage * PAGE_SIZE + PAGE_SIZE).map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="px-6 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-6 py-3">{playerLabel(c.uid)}</td>
                  <td className="px-6 py-3 text-white/70">{merchantsById[c.merchantId]?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-white/70">{SOURCE_LABEL[c.source]}</td>
                  <td className="px-6 py-3 text-white/70">{formatDateTime(c.awardedAt)}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
                      Unclaimed
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <DeleteCell
                      coupon={c}
                      confirming={confirmDeleteId === c.id}
                      confirmText={deleteConfirmText}
                      deleting={deletingId === c.id}
                      onOpenConfirm={() => openConfirm(c.id)}
                      onChangeConfirmText={setDeleteConfirmText}
                      onConfirm={() => void handleDelete(c)}
                      onCancel={closeConfirm}
                    />
                  </td>
                </tr>
              ))}
              {unclaimed.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={7}>
                    No unclaimed coupons.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/10 px-6 py-3">
          <Pagination page={unclaimedPage} pageCount={unclaimedPageCount} onChange={setUnclaimedPage} />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Claimed TindaCoupons ({claimed.length})</h2>
        {deleteError && <p className="px-6 pt-2 text-xs text-red-300">{deleteError}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Player</th>
                <th className="px-6 py-3">Tindahan</th>
                <th className="px-6 py-3">Game</th>
                <th className="px-6 py-3">Awarded</th>
                <th className="px-6 py-3">Claimed</th>
                <th className="px-6 py-3">Entered code</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claimed.slice(claimedPage * PAGE_SIZE, claimedPage * PAGE_SIZE + PAGE_SIZE).map((c) => (
                <tr key={c.id} className="border-t border-white/10">
                  <td className="px-6 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-6 py-3">{playerLabel(c.uid)}</td>
                  <td className="px-6 py-3 text-white/70">{merchantsById[c.merchantId]?.name ?? '—'}</td>
                  <td className="px-6 py-3 text-white/70">{SOURCE_LABEL[c.source]}</td>
                  <td className="px-6 py-3 text-white/70">{formatDateTime(c.awardedAt)}</td>
                  <td className="px-6 py-3 text-white/70">
                    {c.redeemedAt ? formatDateTime(c.redeemedAt) : '—'}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-white/50">{c.redeemedCode ?? '—'}</td>
                  <td className="px-6 py-3">
                    <DeleteCell
                      coupon={c}
                      confirming={confirmDeleteId === c.id}
                      confirmText={deleteConfirmText}
                      deleting={deletingId === c.id}
                      onOpenConfirm={() => openConfirm(c.id)}
                      onChangeConfirmText={setDeleteConfirmText}
                      onConfirm={() => void handleDelete(c)}
                      onCancel={closeConfirm}
                    />
                  </td>
                </tr>
              ))}
              {claimed.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={8}>
                    No claimed coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/10 px-6 py-3">
          <Pagination page={claimedPage} pageCount={claimedPageCount} onChange={setClaimedPage} />
        </div>
      </section>
    </div>
  )
}

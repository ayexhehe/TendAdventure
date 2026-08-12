import { collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, updateDoc, where } from 'firebase/firestore'
import type { GameSettingsDoc, MerchantDoc, TaskedEntrantDoc, TindaCouponDoc, TindaCouponSource } from '@tindadventure/shared'
import { db } from './firebase'
import { getGameSettings } from './gameSettings'
import type { MerchantWithId } from './merchants'

export interface TindaCouponWithId extends TindaCouponDoc {
  id: string
}

function generateCouponCode(): string {
  return `TC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function ticketField(source: TindaCouponSource): {
  total: 'quizBowlTicketsTotal' | 'taskedTicketsTotal' | 'votingTicketsTotal'
  issued: 'quizBowlTicketsIssued' | 'taskedTicketsIssued' | 'votingTicketsIssued'
} {
  if (source === 'quizBowl') return { total: 'quizBowlTicketsTotal', issued: 'quizBowlTicketsIssued' }
  if (source === 'tasked') return { total: 'taskedTicketsTotal', issued: 'taskedTicketsIssued' }
  return { total: 'votingTicketsTotal', issued: 'votingTicketsIssued' }
}

// True once a game can no longer hand out any TindaCoupon — either its
// own admin-set ticket cap is reached, or every merchant's coupon supply
// is exhausted (the real, shared ceiling both games draw from). Computed
// entirely from the publicly-readable gameSettings + merchants docs, so
// it works for anonymous/non-admin players too.
export function isGameSoldOut(
  source: TindaCouponSource,
  settings: GameSettingsDoc | null,
  merchants: MerchantWithId[],
): boolean {
  const { total, issued } = ticketField(source)
  const ticketsTotal = settings?.[total] ?? 0
  const ticketsIssued = settings?.[issued] ?? 0
  if (ticketsTotal > 0 && ticketsIssued >= ticketsTotal) return true
  if (merchants.length === 0) return false
  return !merchants.some((m) => (m.couponsIssued ?? 0) < (m.couponSupply ?? 0))
}

// Awards a random TindaCoupon from whichever merchants still have supply
// left. First checks the admin-set per-game ticket cap (0 = unlimited);
// then each merchant candidate runs a transaction that re-checks both
// the merchant's remaining supply and the game's ticket cap, atomically
// claiming one slot of each — so concurrent winners can never oversell
// a merchant's allocation or a game's cap. If a candidate turns out to
// already be full (lost the race), the next candidate is tried.
// Returns null if the game's ticket cap or every merchant's supply is
// exhausted.
//
// taSKed is the only game left that calls this from the client (Quiz Bowl
// and Voting both award server-side) — for that source specifically, this
// also enforces a one-time-only lock (`taskedEntrants/{uid}.couponAwarded`)
// atomically inside the same transaction that creates the coupon. Without
// it, two open tabs/devices racing to complete the last task could each
// independently see "not yet awarded" and both successfully create a
// coupon. The fast pre-check below just avoids wasted transaction
// attempts in the common (non-racing) case — the transaction is what
// actually guarantees only one coupon is ever created.
export async function awardTindaCoupon(
  uid: string,
  source: TindaCouponSource,
): Promise<TindaCouponWithId | null> {
  if (!db) return null
  const firestore = db
  const { total: totalField, issued: issuedField } = ticketField(source)

  if (source === 'tasked') {
    const entrantSnap = await getDoc(doc(firestore, 'taskedEntrants', uid))
    if ((entrantSnap.data() as TaskedEntrantDoc | undefined)?.couponAwarded) return null
  }

  const settings = await getGameSettings()
  const ticketsTotal = settings?.[totalField] ?? 0
  if (ticketsTotal > 0 && (settings?.[issuedField] ?? 0) >= ticketsTotal) return null

  const snapshot = await getDocs(collection(firestore, 'merchants'))
  const candidates = shuffle(
    snapshot.docs
      .map((d) => ({ id: d.id, ...(d.data() as MerchantDoc) }))
      .filter((m) => (m.couponsIssued ?? 0) < (m.couponSupply ?? 0)),
  )

  for (const merchant of candidates) {
    try {
      const coupon = await runTransaction(firestore, async (tx) => {
        const merchantRef = doc(firestore, 'merchants', merchant.id)
        const settingsRef = doc(firestore, 'config', 'gameSettings')
        const entrantRef = source === 'tasked' ? doc(firestore, 'taskedEntrants', uid) : null

        const [merchantSnap, settingsSnap, entrantSnap] = await Promise.all([
          tx.get(merchantRef),
          tx.get(settingsRef),
          entrantRef ? tx.get(entrantRef) : Promise.resolve(null),
        ])

        if (entrantSnap && (entrantSnap.data() as TaskedEntrantDoc | undefined)?.couponAwarded) {
          return null
        }

        const merchantData = merchantSnap.data() as MerchantDoc | undefined
        if (!merchantData || (merchantData.couponsIssued ?? 0) >= (merchantData.couponSupply ?? 0)) {
          return null
        }

        const settingsData = settingsSnap.data() as GameSettingsDoc | undefined
        const cap = settingsData?.[totalField] ?? 0
        const issuedSoFar = settingsData?.[issuedField] ?? 0
        if (cap > 0 && issuedSoFar >= cap) return null

        const couponRef = doc(collection(firestore, 'tindaCoupons'))
        const couponDoc: TindaCouponDoc = {
          uid,
          merchantId: merchant.id,
          code: generateCouponCode(),
          source,
          awardedAt: Date.now(),
          redeemed: false,
          redeemedAt: null,
          redeemedCode: null,
        }
        tx.update(merchantRef, { couponsIssued: (merchantData.couponsIssued ?? 0) + 1 })
        if (settingsSnap.exists()) {
          tx.update(settingsRef, { [issuedField]: issuedSoFar + 1 })
        }
        if (entrantRef) {
          tx.update(entrantRef, { couponAwarded: true })
        }
        tx.set(couponRef, couponDoc)
        return { id: couponRef.id, ...couponDoc }
      })
      if (coupon) return coupon
    } catch (error) {
      console.error('Failed to award coupon from merchant, trying next:', merchant.id, error)
    }
  }

  return null
}

export function subscribeToMyCoupons(uid: string, onChange: (coupons: TindaCouponWithId[]) => void) {
  if (!db) return () => {}
  const q = query(collection(db, 'tindaCoupons'), where('uid', '==', uid))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as TindaCouponDoc) }))),
    (error) => {
      console.error('Failed to subscribe to coupons:', error)
      onChange([])
    },
  )
}

// Admin-only: every coupon ever issued, for a live issued/redeemed
// summary that stays accurate across the whole admin panel regardless
// of which tab is active.
export function subscribeToAllCoupons(onChange: (coupons: TindaCouponWithId[]) => void) {
  if (!db) return () => {}
  return onSnapshot(
    collection(db, 'tindaCoupons'),
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as TindaCouponDoc) }))),
    (error) => {
      console.error('Failed to subscribe to all coupons:', error)
      onChange([])
    },
  )
}

export async function redeemCoupon(couponId: string, merchantCode: string) {
  if (!db) return
  await updateDoc(doc(db, 'tindaCoupons', couponId), {
    redeemed: true,
    redeemedAt: Date.now(),
    redeemedCode: merchantCode.trim(),
  })
}

// Admin-only (enforced by the Firestore rule, not just this check).
// Works for both unclaimed and already-claimed coupons — deleting one
// atomically reverses the merchant's and game's issued counters, so it
// doesn't leave a phantom claim against either allocation, regardless of
// whether it had been redeemed yet.
export async function deleteCoupon(coupon: TindaCouponWithId): Promise<void> {
  if (!db) return
  const firestore = db
  const { issued: issuedField } = ticketField(coupon.source)

  await runTransaction(firestore, async (tx) => {
    const couponRef = doc(firestore, 'tindaCoupons', coupon.id)
    const merchantRef = doc(firestore, 'merchants', coupon.merchantId)
    const settingsRef = doc(firestore, 'config', 'gameSettings')

    const [couponSnap, merchantSnap, settingsSnap] = await Promise.all([
      tx.get(couponRef),
      tx.get(merchantRef),
      tx.get(settingsRef),
    ])

    if (!couponSnap.exists()) return

    const merchantData = merchantSnap.data() as MerchantDoc | undefined
    if (merchantData) {
      tx.update(merchantRef, { couponsIssued: Math.max(0, (merchantData.couponsIssued ?? 0) - 1) })
    }

    if (settingsSnap.exists()) {
      const settingsData = settingsSnap.data() as GameSettingsDoc
      tx.update(settingsRef, { [issuedField]: Math.max(0, (settingsData[issuedField] ?? 0) - 1) })
    }

    // Release the award lock too, so deleting an erroneous taSKed coupon
    // doesn't permanently strand that player without a real one.
    if (coupon.source === 'tasked') {
      tx.update(doc(firestore, 'taskedEntrants', coupon.uid), { couponAwarded: false })
    }

    tx.delete(couponRef)
  })
}

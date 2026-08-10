import { collection, doc, getDocs, updateDoc, writeBatch, type DocumentReference } from 'firebase/firestore'
import type { TindaCouponSource } from '@tindadventure/shared'
import { db } from './firebase'

const BATCH_SIZE = 400

async function commitInBatches(
  refs: DocumentReference[],
  apply: (batch: ReturnType<typeof writeBatch>, ref: DocumentReference) => void,
) {
  if (!db) return
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db)
    for (const ref of refs.slice(i, i + BATCH_SIZE)) apply(batch, ref)
    await batch.commit()
  }
}

// These only zero out the allocation counters that gate future coupon
// awards (merchants.couponsIssued, gameSettings.*TicketsIssued) — the
// actual tindaCoupons documents (who won what, redeemed or not) are
// never touched, so nothing already awarded is lost or invalidated.

export async function resetMerchantCouponCount(merchantId: string) {
  if (!db) return
  await updateDoc(doc(db, 'merchants', merchantId), { couponsIssued: 0 })
}

export async function resetGameCouponCount(source: TindaCouponSource) {
  if (!db) return
  const field = source === 'quizBowl' ? 'quizBowlTicketsIssued' : 'taskedTicketsIssued'
  await updateDoc(doc(db, 'config', 'gameSettings'), { [field]: 0 })
}

export async function resetAllCouponCounts(): Promise<number> {
  if (!db) return 0

  const snapshot = await getDocs(collection(db, 'merchants'))
  await commitInBatches(
    snapshot.docs.map((d) => d.ref),
    (batch, ref) => batch.update(ref, { couponsIssued: 0 }),
  )

  await updateDoc(doc(db, 'config', 'gameSettings'), {
    quizBowlTicketsIssued: 0,
    taskedTicketsIssued: 0,
  })

  return snapshot.size
}

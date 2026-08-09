import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { MerchantDoc } from '@tindadventure/shared'
import { db } from './firebase'

export interface MerchantWithId extends MerchantDoc {
  id: string
}

export function subscribeToMerchants(onChange: (merchants: MerchantWithId[]) => void) {
  if (!db) return () => {}

  const q = query(collection(db, 'merchants'), orderBy('name'))
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MerchantDoc) })))
  })
}

export async function addMerchant(input: {
  name: string
  description: string
  boothLocation: string
  ticketsAvailable: number
}) {
  if (!db) return

  const merchant: MerchantDoc = {
    name: input.name.trim(),
    description: input.description.trim(),
    boothLocation: input.boothLocation.trim(),
    imageURL: null,
    active: true,
    ticketsAvailable: input.ticketsAvailable,
    ticketsAwarded: 0,
  }
  await addDoc(collection(db, 'merchants'), merchant)
}

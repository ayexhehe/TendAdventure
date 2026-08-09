import { useEffect, useState } from 'react'
import { addMerchant, subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'

export function MerchantsTab() {
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [boothLocation, setBoothLocation] = useState('')
  const [ticketsAvailable, setTicketsAvailable] = useState('5')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => subscribeToMerchants(setMerchants), [])

  const handleAdd = async () => {
    setError(null)
    if (!name.trim() || !boothLocation.trim()) {
      setError('Name and booth location are required.')
      return
    }
    try {
      await addMerchant({
        name,
        description,
        boothLocation,
        ticketsAvailable: Number(ticketsAvailable) || 0,
      })
      setName('')
      setDescription('')
      setBoothLocation('')
      setTicketsAvailable('5')
    } catch {
      setError('Could not add that merchant.')
    }
  }

  return (
    <div className="w-full text-white">
      <h2 className="mb-2 text-lg font-semibold">Merchants</h2>

      <div className="mb-4 overflow-hidden rounded-lg bg-white/5">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10 text-white/60">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Booth</th>
              <th className="px-3 py-2">Tickets</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} className="border-t border-white/10">
                <td className="px-3 py-2">{m.name}</td>
                <td className="px-3 py-2 text-white/70">{m.boothLocation}</td>
                <td className="px-3 py-2 text-white/70">
                  {m.ticketsAwarded} / {m.ticketsAvailable}
                </td>
              </tr>
            ))}
            {merchants.length === 0 && (
              <tr>
                <td className="px-3 py-3 text-white/50" colSpan={3}>
                  No merchants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex max-w-sm flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Merchant name"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="text"
          value={boothLocation}
          onChange={(e) => setBoothLocation(e.target.value)}
          placeholder="Booth location"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <input
          type="number"
          min={0}
          value={ticketsAvailable}
          onChange={(e) => setTicketsAvailable(e.target.value)}
          placeholder="Tickets available"
          className="rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
        >
          Add merchant
        </button>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </div>
    </div>
  )
}

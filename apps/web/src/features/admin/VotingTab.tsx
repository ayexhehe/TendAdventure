import { useEffect, useState } from 'react'
import type { GameSettingsDoc } from '@tindadventure/shared'
import { subscribeToGameSettings, saveGameSettings } from '../../lib/gameSettings'
import { subscribeToMerchants, type MerchantWithId } from '../../lib/merchants'
import {
  addVotingCategory,
  addVotingPerformer,
  deleteVotingCategory,
  deleteVotingPerformer,
  resetAllVotes,
  setVotingCategoryHidden,
  subscribeToVotingCategories,
  subscribeToVotingPerformers,
  subscribeToVotingResults,
  updateVotingCategory,
  updateVotingPerformer,
  uploadVotingPerformerImage,
  type VotingCategoryWithId,
  type VotingPerformerWithId,
} from '../../lib/voting'
import { formatCooldown } from '../../lib/time'

const inputClass =
  'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'

export function VotingTab() {
  const [gameSettings, setGameSettings] = useState<GameSettingsDoc | null>(null)
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [categories, setCategories] = useState<VotingCategoryWithId[]>([])
  const [performers, setPerformers] = useState<VotingPerformerWithId[]>([])
  const [results, setResults] = useState<Record<string, number>>({})

  useEffect(() => subscribeToGameSettings(setGameSettings), [])
  useEffect(() => subscribeToMerchants(setMerchants), [])
  useEffect(() => subscribeToVotingCategories(setCategories), [])
  useEffect(() => subscribeToVotingPerformers(setPerformers), [])
  useEffect(() => subscribeToVotingResults(setResults), [])

  const [ticketsTotal, setTicketsTotal] = useState('0')
  const [savingTickets, setSavingTickets] = useState(false)
  const [ticketsSaved, setTicketsSaved] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)

  const [windowMinutes, setWindowMinutes] = useState('10')
  const [startingWindow, setStartingWindow] = useState(false)
  const [stoppingWindow, setStoppingWindow] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const [settingsLoaded, setSettingsLoaded] = useState(false)
  useEffect(() => {
    if (!gameSettings || settingsLoaded) return
    setTicketsTotal(String(gameSettings.votingTicketsTotal ?? 0))
    setWindowMinutes(String(gameSettings.votingWindowMinutes ?? 10))
    setSettingsLoaded(true)
  }, [gameSettings, settingsLoaded])

  const merchantCouponSupply = merchants.reduce((sum, m) => sum + (m.couponSupply ?? 0), 0)

  const windowEndsAt = gameSettings?.votingWindowEndsAt ?? null
  const windowLive = windowEndsAt != null && now < windowEndsAt
  const remainingMs = windowEndsAt != null ? windowEndsAt - now : 0

  const handleSaveTickets = async () => {
    setTicketsError(null)
    setTicketsSaved(false)
    const next = Math.max(0, Number(ticketsTotal) || 0)
    const otherTotal =
      (gameSettings?.quizBowlTicketsTotal ?? 0) + (gameSettings?.taskedTicketsTotal ?? 0)
    if (next > 0 && next + otherTotal > merchantCouponSupply) {
      setTicketsError(
        `Voting (${next}) + Quiz Bowl + taSKed (${otherTotal}) = ${next + otherTotal}, which is more than the ${merchantCouponSupply} coupons allocated across merchants.`,
      )
      return
    }
    setSavingTickets(true)
    try {
      await saveGameSettings({ votingTicketsTotal: next })
      setTicketsSaved(true)
    } finally {
      setSavingTickets(false)
    }
  }

  // Starting a round clears nextVotingDropAt so the Cloud Function treats
  // the very next check as immediately eligible, instead of inheriting a
  // stale schedule left over from a previous round.
  const handleStartWindow = async () => {
    const minutes = Math.max(1, Number(windowMinutes) || 1)
    setStartingWindow(true)
    try {
      await saveGameSettings({
        votingWindowMinutes: minutes,
        votingWindowEndsAt: Date.now() + minutes * 60_000,
        nextVotingDropAt: null,
      })
    } finally {
      setStartingWindow(false)
    }
  }

  const handleStopWindow = async () => {
    setStoppingWindow(true)
    try {
      await saveGameSettings({ votingWindowEndsAt: Date.now() })
    } finally {
      setStoppingWindow(false)
    }
  }

  // Reset votes
  const [resetConfirming, setResetConfirming] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const handleResetVotes = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'DELETE') return
    setResetConfirming(false)
    setResetConfirmText('')
    setResetting(true)
    setResetError(null)
    setResetMessage(null)
    try {
      const count = await resetAllVotes()
      setResetMessage(`Reset ${count} vote${count === 1 ? '' : 's'}. Everyone can vote again.`)
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Could not reset votes.')
    } finally {
      setResetting(false)
    }
  }

  // Categories
  const [categoryName, setCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null)
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null)

  const startEditCategory = (c: VotingCategoryWithId) => {
    setEditingCategoryId(c.id)
    setCategoryName(c.name)
  }

  const resetCategoryForm = () => {
    setEditingCategoryId(null)
    setCategoryName('')
  }

  const handleSubmitCategory = async () => {
    if (!categoryName.trim()) return
    setSavingCategory(true)
    try {
      if (editingCategoryId) {
        const existing = categories.find((c) => c.id === editingCategoryId)
        await updateVotingCategory(editingCategoryId, categoryName, existing?.order ?? categories.length)
      } else {
        await addVotingCategory(categoryName, categories.length)
      }
      resetCategoryForm()
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setConfirmDeleteCategoryId(null)
    setCategoryDeleteError(null)
    try {
      await deleteVotingCategory(id)
      if (editingCategoryId === id) resetCategoryForm()
    } catch (error) {
      setCategoryDeleteError(error instanceof Error ? error.message : 'Could not delete that category.')
    }
  }

  const handleToggleCategoryHidden = async (c: VotingCategoryWithId) => {
    await setVotingCategoryHidden(c.id, !c.hidden)
  }

  // Performers are managed one category at a time via tabs instead of a
  // dropdown, so the active tab doubles as the category for the add form.
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  useEffect(() => {
    if (activeTabId && categories.some((c) => c.id === activeTabId)) return
    setActiveTabId(categories[0]?.id ?? null)
  }, [categories, activeTabId])

  const [performerName, setPerformerName] = useState('')
  const [performerDescription, setPerformerDescription] = useState('')
  const [performerPhotoFile, setPerformerPhotoFile] = useState<File | null>(null)
  const [performerExistingPhotoURL, setPerformerExistingPhotoURL] = useState<string | null>(null)
  const [editingPerformerId, setEditingPerformerId] = useState<string | null>(null)
  const [savingPerformer, setSavingPerformer] = useState(false)
  const [confirmDeletePerformerId, setConfirmDeletePerformerId] = useState<string | null>(null)
  const [performerError, setPerformerError] = useState<string | null>(null)

  const startEditPerformer = (p: VotingPerformerWithId) => {
    setEditingPerformerId(p.id)
    setActiveTabId(p.categoryId)
    setPerformerName(p.name)
    setPerformerDescription(p.description)
    setPerformerExistingPhotoURL(p.photoURL)
    setPerformerPhotoFile(null)
  }

  const resetPerformerForm = () => {
    setEditingPerformerId(null)
    setPerformerName('')
    setPerformerDescription('')
    setPerformerExistingPhotoURL(null)
    setPerformerPhotoFile(null)
    setPerformerError(null)
  }

  const handleSubmitPerformer = async () => {
    setPerformerError(null)
    if (!performerName.trim() || !activeTabId) {
      setPerformerError('Name and category are required.')
      return
    }
    setSavingPerformer(true)
    try {
      const photoURL = performerPhotoFile
        ? await uploadVotingPerformerImage(performerPhotoFile)
        : performerExistingPhotoURL
      const input = {
        categoryId: activeTabId,
        name: performerName,
        description: performerDescription,
        photoURL,
      }
      if (editingPerformerId) {
        await updateVotingPerformer(editingPerformerId, input)
      } else {
        await addVotingPerformer(input)
      }
      resetPerformerForm()
    } catch {
      setPerformerError('Could not save that performer.')
    } finally {
      setSavingPerformer(false)
    }
  }

  const handleDeletePerformer = async (id: string) => {
    setConfirmDeletePerformerId(null)
    setPerformerError(null)
    try {
      await deleteVotingPerformer(id)
      if (editingPerformerId === id) resetPerformerForm()
    } catch (error) {
      setPerformerError(error instanceof Error ? error.message : 'Could not delete that performer.')
    }
  }

  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Voting</h2>
        <p className="mt-1 text-sm text-white/60">
          Start a live, timed round (e.g. "SoundCheck Clash — People's Choice, 10 minutes") and
          everyone votes for their favorite performer against that same clock. TindaCoupons drop
          randomly at some point *during* the round — not everyone wins, and nobody wins twice.
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {windowLive ? (
                <>
                  <p className="text-sm font-medium text-emerald-300">🔴 Live — ends in {formatCooldown(remainingMs)}</p>
                  <p className="text-xs text-white/50">Voting is open right now.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Not currently running</p>
                  <p className="text-xs text-white/50">Start a round when you're ready to go live.</p>
                </>
              )}
            </div>
            {windowLive ? (
              <button
                type="button"
                onClick={() => void handleStopWindow()}
                disabled={stoppingWindow}
                className="shrink-0 rounded-full bg-red-500/20 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-500/30 disabled:opacity-50"
              >
                {stoppingWindow ? 'Stopping…' : 'Stop now'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={windowMinutes}
                  onChange={(e) => setWindowMinutes(e.target.value)}
                  placeholder="10"
                  className={`${inputClass} w-20`}
                />
                <span className="text-xs text-white/50">min</span>
                <button
                  type="button"
                  onClick={() => void handleStartWindow()}
                  disabled={startingWindow}
                  className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
                >
                  {startingWindow ? 'Starting…' : '▶ Start round'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>TindaCoupon allocation</label>
              <input
                type="number"
                min={0}
                value={ticketsTotal}
                onChange={(e) => setTicketsTotal(e.target.value)}
                placeholder="0"
                className={`${inputClass} w-32`}
              />
              <p className="text-xs text-white/40">
                Total coupons Voting can ever hand out. 0 = unlimited (per-merchant supply still
                applies). Combined with Quiz Bowl's and taSKed's allocations, can't exceed{' '}
                {merchantCouponSupply} (the total across all merchants).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveTickets()}
                disabled={savingTickets}
                className="rounded-full bg-white px-5 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
              >
                {savingTickets ? 'Saving…' : 'Save'}
              </button>
              {ticketsSaved && <span className="text-xs text-emerald-300">Saved.</span>}
            </div>
          </div>
          {ticketsError && <p className="text-xs text-red-300">{ticketsError}</p>}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset all votes</p>
              <p className="text-xs text-white/50">
                Wipes every vote and every result tally so voting starts fresh — e.g. between test
                rounds, or before reusing these categories for a separate election later. Already-
                awarded TindaCoupons are never touched. Only works while no round is live.
              </p>
            </div>
            {resetConfirming ? (
              <div className="flex shrink-0 flex-col gap-1.5">
                <span className="text-[11px] text-white/50">Type DELETE to confirm</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    className="w-24 rounded-md bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => void handleResetVotes()}
                    disabled={resetting || resetConfirmText.trim().toUpperCase() !== 'DELETE'}
                    className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {resetting ? 'Resetting…' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetConfirming(false)
                      setResetConfirmText('')
                    }}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResetConfirming(true)}
                disabled={resetting || windowLive}
                title={windowLive ? 'Stop the round first.' : undefined}
                className="shrink-0 rounded-full bg-red-500/20 px-4 py-2 text-xs font-medium text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset all votes
              </button>
            )}
          </div>
          {resetError && <p className="text-xs text-red-300">{resetError}</p>}
          {resetMessage && <p className="text-xs text-emerald-300">{resetMessage}</p>}
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Categories ({categories.length})</h2>
        {categoryDeleteError && <p className="mt-2 text-xs text-red-300">{categoryDeleteError}</p>}
        <div className="mt-4 flex flex-col gap-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.name}</span>
                {c.hidden && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/50 uppercase">
                    Hidden
                  </span>
                )}
              </div>
              {confirmDeleteCategoryId === c.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Delete? (also removes its performers)</span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCategory(c.id)}
                    className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-400"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCategoryId(null)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleToggleCategoryHidden(c)}
                    className="text-xs font-medium text-white/70 underline hover:text-white"
                  >
                    {c.hidden ? 'Show' : 'Hide'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditCategory(c)}
                    className="text-xs font-medium text-white/70 underline hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteCategoryId(c.id)}
                    className="text-xs font-medium text-red-300 underline hover:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-white/50">No categories yet.</p>}
        </div>

        <div className="mt-4 flex items-end gap-3 border-t border-white/10 pt-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={labelClass}>{editingCategoryId ? 'Edit category' : 'New category'}</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Solo Singing"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSubmitCategory()}
            disabled={savingCategory || !categoryName.trim()}
            className="rounded-full bg-white px-5 py-2 text-xs font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
          >
            {editingCategoryId ? 'Save' : 'Add'}
          </button>
          {editingCategoryId && (
            <button
              type="button"
              onClick={resetCategoryForm}
              className="rounded-full bg-white/10 px-5 py-2 text-xs font-medium text-white hover:bg-white/20"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Performers ({performers.length})</h2>

        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">Add a category above first.</p>
        ) : (
          <>
            <div className="mt-4 flex gap-2 overflow-x-auto border-b border-white/10 pb-px">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveTabId(c.id)
                    resetPerformerForm()
                  }}
                  className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                    activeTabId === c.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {c.name}
                  {c.hidden && <span className="ml-1.5 text-white/30">(hidden)</span>}
                </button>
              ))}
            </div>

            {activeTabId && (
              <>
                <div className="mt-4 flex flex-col gap-2">
                  {performers
                    .filter((p) => p.categoryId === activeTabId)
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {p.photoURL ? (
                            <img src={p.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/40">
                              {p.name.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <p className="text-sm font-medium">{p.name}</p>
                        </div>
                        {confirmDeletePerformerId === p.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/50">Delete?</span>
                            <button
                              type="button"
                              onClick={() => void handleDeletePerformer(p.id)}
                              className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-400"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePerformerId(null)}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => startEditPerformer(p)}
                              className="text-xs font-medium text-white/70 underline hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePerformerId(p.id)}
                              className="text-xs font-medium text-red-300 underline hover:text-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  {performers.filter((p) => p.categoryId === activeTabId).length === 0 && (
                    <p className="text-sm text-white/50">No performers in this category yet.</p>
                  )}
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70">
                      {editingPerformerId ? 'Edit performer' : 'Add performer'} — {categoriesById[activeTabId]?.name}
                    </h3>
                    {editingPerformerId && (
                      <button
                        type="button"
                        onClick={resetPerformerForm}
                        className="text-xs font-medium text-white/50 underline hover:text-white"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Performer name</label>
                      <input
                        type="text"
                        value={performerName}
                        onChange={(e) => setPerformerName(e.target.value)}
                        placeholder="e.g. Juan dela Cruz"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPerformerPhotoFile(e.target.files?.[0] ?? null)}
                        className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/20"
                      />
                      {!performerPhotoFile && performerExistingPhotoURL && (
                        <p className="text-xs text-white/40">Leave blank to keep the current photo.</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={performerDescription}
                        onChange={(e) => setPerformerDescription(e.target.value)}
                        placeholder="A short blurb about this performer"
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                  {performerError && <p className="mt-3 text-sm text-red-300">{performerError}</p>}
                  <button
                    type="button"
                    onClick={() => void handleSubmitPerformer()}
                    disabled={savingPerformer}
                    className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
                  >
                    {savingPerformer ? 'Saving…' : editingPerformerId ? 'Save changes' : 'Add performer'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Live results</h2>
        <div className="mt-4 flex flex-col gap-5">
          {categories.map((c) => {
            const inCategory = performers
              .filter((p) => p.categoryId === c.id)
              .sort((a, b) => (results[b.id] ?? 0) - (results[a.id] ?? 0))
            const totalVotes = inCategory.reduce((sum, p) => sum + (results[p.id] ?? 0), 0)
            return (
              <div key={c.id}>
                <p className="text-sm font-semibold text-white/80">{c.name}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {inCategory.map((p) => {
                    const voteCount = results[p.id] ?? 0
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                    return (
                      <div key={p.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/70">{p.name}</span>
                          <span className="text-white/50">
                            {voteCount} vote{voteCount === 1 ? '' : 's'} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {inCategory.length === 0 && (
                    <p className="text-xs text-white/40">No performers in this category yet.</p>
                  )}
                </div>
              </div>
            )
          })}
          {categories.length === 0 && <p className="text-sm text-white/50">No categories yet.</p>}
        </div>
      </section>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { MerchantQuestion } from '@tindadventure/shared'
import {
  addMerchant,
  deleteMerchant,
  subscribeToMerchantCodes,
  subscribeToMerchants,
  updateMerchant,
  uploadMerchantImage,
  type MerchantWithId,
} from '../../lib/merchants'
import { subscribeToGameSettings, saveGameSettings } from '../../lib/gameSettings'
import { Pagination } from '../../components/Pagination'

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-emerald-500' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
          checked ? 'left-5.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}

const inputClass =
  'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'
const PAGE_SIZE = 8
const MAX_QUESTIONS = 5

function blankQuestion(): MerchantQuestion {
  return { question: '', correctAnswer: '', dummyAnswers: ['', '', ''] }
}

const TINDA_ZONES = [
  'Zone A - Food',
  'Zone B - Beverages',
  'Zone C - Arts & Crafts',
  'Zone D - Apparel',
]

function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [ref, value])
}

export function MerchantsTab() {
  const [merchants, setMerchants] = useState<MerchantWithId[]>([])
  const [merchantCodes, setMerchantCodes] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingImageURL, setExistingImageURL] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [product, setProduct] = useState('')
  const [tindaZone, setTindaZone] = useState('')
  const [youthRepresentative, setYouthRepresentative] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [couponSupply, setCouponSupply] = useState('0')
  const [merchantCode, setMerchantCode] = useState('')
  const [questions, setQuestions] = useState<MerchantQuestion[]>([])
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const productRef = useRef<HTMLTextAreaElement>(null)
  const [merchantsSectionEnabled, setMerchantsSectionEnabled] = useState(true)
  const [savingSectionToggle, setSavingSectionToggle] = useState(false)

  useAutoGrow(descriptionRef, description)
  useAutoGrow(productRef, product)

  useEffect(() => subscribeToMerchants(setMerchants), [])
  useEffect(() => subscribeToMerchantCodes(setMerchantCodes), [])
  useEffect(
    () => subscribeToGameSettings((s) => setMerchantsSectionEnabled(s?.merchantsSectionEnabled ?? true)),
    [],
  )

  const handleToggleMerchantsSection = async () => {
    const next = !merchantsSectionEnabled
    setSavingSectionToggle(true)
    setMerchantsSectionEnabled(next)
    try {
      await saveGameSettings({ merchantsSectionEnabled: next })
    } finally {
      setSavingSectionToggle(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(merchants.length / PAGE_SIZE))

  useEffect(() => {
    if (page >= pageCount) setPage(0)
  }, [page, pageCount])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const resetForm = () => {
    setEditingId(null)
    setExistingImageURL(null)
    setName('')
    setDescription('')
    setProduct('')
    setTindaZone('')
    setYouthRepresentative('')
    setPhotoFile(null)
    setCouponSupply('0')
    setMerchantCode('')
    setQuestions([])
    setQuestionsOpen(false)
  }

  const startEdit = (m: MerchantWithId) => {
    setEditingId(m.id)
    setExistingImageURL(m.imageURL)
    setName(m.name)
    setDescription(m.description)
    setProduct(m.product)
    setTindaZone(m.tindaZone)
    setYouthRepresentative(m.youthRepresentative)
    setPhotoFile(null)
    setCouponSupply(String(m.couponSupply ?? 0))
    setMerchantCode(merchantCodes[m.id] ?? '')
    setQuestions(m.questions ?? [])
    setQuestionsOpen((m.questions ?? []).length > 0)
    setError(null)
  }

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return
    setQuestions((qs) => [...qs, blankQuestion()])
    setQuestionsOpen(true)
  }

  const removeQuestion = (index: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== index))
  }

  const updateQuestionText = (index: number, question: string) => {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, question } : q)))
  }

  const updateCorrectAnswer = (index: number, correctAnswer: string) => {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, correctAnswer } : q)))
  }

  const updateDummyAnswer = (qIndex: number, dIndex: number, value: string) => {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex
          ? { ...q, dummyAnswers: q.dummyAnswers.map((d, j) => (j === dIndex ? value : d)) }
          : q,
      ),
    )
  }

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await deleteMerchant(id)
      if (editingId === id) resetForm()
    } catch {
      setError('Could not delete that merchant.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    if (!name.trim() || !tindaZone.trim()) {
      setError('Name and Tinda Zone are required.')
      return
    }
    setSubmitting(true)
    try {
      const imageURL = photoFile ? await uploadMerchantImage(photoFile) : existingImageURL
      const payload = {
        name,
        description,
        product,
        tindaZone,
        youthRepresentative,
        imageURL,
        questions,
        couponSupply: Number(couponSupply) || 0,
        merchantCode,
      }
      if (editingId) {
        await updateMerchant(editingId, payload)
      } else {
        await addMerchant(payload)
      }
      resetForm()
    } catch {
      setError(editingId ? 'Could not save that merchant.' : 'Could not add that merchant.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="rounded-2xl bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Show "Know the Tindahans" on landing page</p>
            <p className="text-xs text-white/50">
              When off, the landing page hides merchant highlights and instead shows a single
              "Be one of the Tindahan!" card inviting sellers to join.
            </p>
          </div>
          <Switch
            checked={merchantsSectionEnabled}
            onChange={() => void handleToggleMerchantsSection()}
            disabled={savingSectionToggle}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Merchants ({merchants.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Tinda Zone</th>
                <th className="px-6 py-3">Youth Representative</th>
                <th className="px-6 py-3">Coupons</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((m) => (
                <tr key={m.id} className="border-t border-white/10">
                  <td className="px-6 py-3 font-medium">{m.name}</td>
                  <td className="px-6 py-3 text-white/70">{m.tindaZone}</td>
                  <td className="px-6 py-3 text-white/70">{m.youthRepresentative || '—'}</td>
                  <td className="px-6 py-3 text-white/70">
                    {m.couponsIssued ?? 0} / {m.couponSupply ?? 0}
                  </td>
                  <td className="px-6 py-3">
                    {confirmDeleteId === m.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">Delete?</span>
                        <button
                          type="button"
                          aria-label="Confirm delete"
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
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
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          className="text-xs font-medium text-white/70 underline hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="text-xs font-medium text-red-300 underline hover:text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {merchants.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={5}>
                    No merchants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/10 px-6 py-3">
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-white/40 uppercase">
            {editingId ? 'Edit merchant' : 'Add merchant'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-white/50 underline hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Merchant name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aling Nena's Grill"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Tinda Zone</label>
            <select
              value={tindaZone}
              onChange={(e) => setTindaZone(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled className="text-black">
                Select a zone
              </option>
              {TINDA_ZONES.map((zone) => (
                <option key={zone} value={zone} className="text-black">
                  {zone}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Youth representative</label>
            <input
              type="text"
              value={youthRepresentative}
              onChange={(e) => setYouthRepresentative(e.target.value)}
              placeholder="Assigned SK youth rep"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/20"
            />
            {!photoFile && existingImageURL && (
              <p className="text-xs text-white/40">Leave blank to keep the current photo.</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>TindaCoupon supply</label>
            <input
              type="number"
              min={0}
              value={couponSupply}
              onChange={(e) => setCouponSupply(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <p className="text-xs text-white/40">How many game-prize coupons this merchant will honor.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Tindahan code (secret)</label>
            <input
              type="text"
              value={merchantCode}
              onChange={(e) => setMerchantCode(e.target.value)}
              placeholder="e.g. GUAD-05"
              className={`${inputClass} ring-1 ring-amber-400/40`}
            />
            <p className="text-xs text-white/40">
              Give this to the seller — they enter it to redeem a coupon. Never shown to players.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="what's your story?"
              rows={3}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelClass}>What are you selling?</label>
            <textarea
              ref={productRef}
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Describe your product"
              rows={2}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          </div>
          {(photoPreview ?? existingImageURL) && (
            <img
              src={photoPreview ?? existingImageURL ?? undefined}
              alt="Preview"
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}

          <div className="flex flex-col gap-3 rounded-lg bg-white/5 p-3.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setQuestionsOpen((o) => !o)}
                className="flex items-center gap-2 text-sm font-medium text-white"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 text-white/50 transition-transform ${questionsOpen ? 'rotate-90' : ''}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                Questionnaire ({questions.length}/{MAX_QUESTIONS})
              </button>
              <button
                type="button"
                onClick={addQuestion}
                disabled={questions.length >= MAX_QUESTIONS}
                aria-label="Add question"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:pointer-events-none disabled:opacity-30"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>
            </div>

            {questionsOpen && (
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <div key={i} className="flex flex-col gap-2 rounded-md bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/50">Question {i + 1}</span>
                      <button
                        type="button"
                        aria-label="Remove question"
                        onClick={() => removeQuestion(i)}
                        className="text-xs font-medium text-red-300 underline hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestionText(i, e.target.value)}
                      placeholder="Question"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) => updateCorrectAnswer(i, e.target.value)}
                      placeholder="Correct answer"
                      className={`${inputClass} ring-1 ring-emerald-500/40`}
                    />
                    {q.dummyAnswers.map((d, di) => (
                      <input
                        key={di}
                        type="text"
                        value={d}
                        onChange={(e) => updateDummyAnswer(i, di, e.target.value)}
                        placeholder={`Dummy answer ${di + 1}`}
                        className={inputClass}
                      />
                    ))}
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-xs text-white/40">
                    No questions yet — click the + button to add one.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add merchant'}
        </button>
      </section>
    </div>
  )
}

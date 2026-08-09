import { useEffect, useRef, useState } from 'react'
import {
  addBanner,
  deleteBanner,
  subscribeToBanners,
  updateBanner,
  uploadBannerImage,
  type BannerWithId,
} from '../../lib/banners'

const inputClass =
  'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'

export function BannersTab() {
  const [banners, setBanners] = useState<BannerWithId[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCreatedAt, setEditingCreatedAt] = useState<number | null>(null)
  const [existingImageURL, setExistingImageURL] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [order, setOrder] = useState('')
  const [linkTo, setLinkTo] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const seededOrder = useRef(false)

  useEffect(() => subscribeToBanners(setBanners), [])

  useEffect(() => {
    if (seededOrder.current || editingId || banners.length === 0) return
    seededOrder.current = true
    setOrder(String(Math.max(...banners.map((b) => b.order)) + 1))
  }, [banners, editingId])

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
    setEditingCreatedAt(null)
    setExistingImageURL(null)
    setCaption('')
    setOrder(banners.length > 0 ? String(Math.max(...banners.map((b) => b.order)) + 1) : '')
    setLinkTo('')
    setPhotoFile(null)
  }

  const startEdit = (b: BannerWithId) => {
    setEditingId(b.id)
    setEditingCreatedAt(b.createdAt)
    setExistingImageURL(b.imageURL)
    setCaption(b.caption)
    setOrder(String(b.order))
    setLinkTo(b.linkTo ?? '')
    setPhotoFile(null)
    setError(null)
  }

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await deleteBanner(id)
      if (editingId === id) resetForm()
    } catch {
      setError('Could not delete that banner.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    if (!editingId && !photoFile) {
      setError('An image is required.')
      return
    }
    const orderNum = Number(order)
    if (!Number.isFinite(orderNum)) {
      setError('Order must be a number.')
      return
    }
    setSubmitting(true)
    try {
      const imageURL = photoFile ? await uploadBannerImage(photoFile) : existingImageURL
      if (!imageURL) {
        setError('An image is required.')
        setSubmitting(false)
        return
      }
      const payload = { imageURL, caption, order: orderNum, linkTo: linkTo.trim() || null }
      if (editingId) {
        await updateBanner(editingId, { ...payload, createdAt: editingCreatedAt ?? Date.now() })
      } else {
        await addBanner(payload)
      }
      resetForm()
    } catch {
      setError(editingId ? 'Could not save that banner.' : 'Could not add that banner.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Banners ({banners.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Caption</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="px-6 py-3 font-medium">{b.order}</td>
                  <td className="px-6 py-3 text-white/70">{b.caption || '—'}</td>
                  <td className="px-6 py-3">
                    {confirmDeleteId === b.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">Delete?</span>
                        <button
                          type="button"
                          aria-label="Confirm delete"
                          onClick={() => handleDelete(b.id)}
                          disabled={deletingId === b.id}
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
                          onClick={() => startEdit(b)}
                          className="text-xs font-medium text-white/70 underline hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(b.id)}
                          className="text-xs font-medium text-red-300 underline hover:text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={3}>
                    No banners yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-white/40 uppercase">
            {editingId ? 'Edit banner' : 'Add banner'}
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
            <label className={labelClass}>Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Grand Opening this Saturday!"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Link to (optional)</label>
            <input
              type="text"
              value={linkTo}
              onChange={(e) => setLinkTo(e.target.value)}
              placeholder="e.g. /about or /merchants"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelClass}>Image</label>
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
          {(photoPreview ?? existingImageURL) && (
            <img
              src={photoPreview ?? existingImageURL ?? undefined}
              alt="Preview"
              className="h-20 w-20 rounded-lg object-cover"
            />
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add banner'}
        </button>
      </section>
    </div>
  )
}

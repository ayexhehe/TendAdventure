import { useEffect, useRef, useState } from 'react'
import {
  addActivity,
  deleteActivity,
  subscribeToActivities,
  updateActivity,
  uploadActivityImages,
  type ActivityWithId,
} from '../../lib/activities'
import { addBanner, subscribeToBanners, type BannerWithId } from '../../lib/banners'
import { formatDate } from '../../lib/date'
import { Pagination } from '../../components/Pagination'

const inputClass =
  'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'
const PAGE_SIZE = 8

export function CalendarTab() {
  const [activities, setActivities] = useState<ActivityWithId[]>([])
  const [page, setPage] = useState(0)
  const [banners, setBanners] = useState<BannerWithId[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingCreatedAt, setEditingCreatedAt] = useState<number | null>(null)
  const [existingImageURLs, setExistingImageURLs] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [committeeHead, setCommitteeHead] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [highlighted, setHighlighted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [addingToBannerId, setAddingToBannerId] = useState<string | null>(null)
  const [addedToBannerId, setAddedToBannerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => subscribeToActivities(setActivities), [])
  useEffect(() => subscribeToBanners(setBanners), [])

  const pageCount = Math.max(1, Math.ceil(activities.length / PAGE_SIZE))

  useEffect(() => {
    if (page >= pageCount) setPage(0)
  }, [page, pageCount])

  useEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [description])

  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviews([])
      return
    }
    const urls = photoFiles.map((file) => URL.createObjectURL(file))
    setPhotoPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [photoFiles])

  const resetForm = () => {
    setEditingId(null)
    setEditingCreatedAt(null)
    setExistingImageURLs([])
    setTitle('')
    setDate('')
    setCommitteeHead('')
    setLocation('')
    setDescription('')
    setPhotoFiles([])
    setHighlighted(false)
    if (descriptionRef.current) descriptionRef.current.style.height = 'auto'
  }

  const startEdit = (a: ActivityWithId) => {
    setEditingId(a.id)
    setEditingCreatedAt(a.createdAt)
    setExistingImageURLs(a.imageURLs)
    setTitle(a.title)
    setDate(a.date)
    setCommitteeHead(a.committeeHead)
    setLocation(a.location)
    setDescription(a.description)
    setPhotoFiles([])
    setHighlighted(a.highlighted ?? false)
    setError(null)
  }

  const handleAddToBanner = async (a: ActivityWithId) => {
    if (a.imageURLs.length === 0) {
      setError('This activity needs a photo before it can be added to the banner.')
      return
    }
    setError(null)
    setAddingToBannerId(a.id)
    try {
      const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.order)) + 1 : 0
      await addBanner({
        imageURL: a.imageURLs[0],
        caption: `Upcoming: ${a.title} — ${formatDate(a.date)}`,
        order: nextOrder,
        linkTo: `/calendar?activity=${a.id}`,
      })
      setAddedToBannerId(a.id)
      setTimeout(() => setAddedToBannerId((cur) => (cur === a.id ? null : cur)), 2000)
    } catch {
      setError('Could not add that activity to the banner.')
    } finally {
      setAddingToBannerId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      await deleteActivity(id)
      if (editingId === id) resetForm()
    } catch {
      setError('Could not delete that activity.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    if (!title.trim() || !date) {
      setError('Title and date are required.')
      return
    }
    setSubmitting(true)
    try {
      const imageURLs = photoFiles.length
        ? await uploadActivityImages(photoFiles)
        : existingImageURLs
      const payload = { title, date, committeeHead, location, description, imageURLs, highlighted }
      if (editingId) {
        await updateActivity(editingId, { ...payload, createdAt: editingCreatedAt ?? Date.now() })
      } else {
        await addActivity(payload)
      }
      resetForm()
    } catch {
      setError(editingId ? 'Could not save that activity.' : 'Could not add that activity.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="overflow-hidden rounded-2xl bg-white/5">
        <h2 className="px-6 pt-5 text-lg font-semibold">Activities ({activities.length})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/10 text-white/60">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Committee Head</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((a) => (
                <tr key={a.id} className="border-t border-white/10">
                  <td className="px-6 py-3 text-white/70">{formatDate(a.date)}</td>
                  <td className="px-6 py-3 font-medium">
                    {a.highlighted && <span title="Highlighted">⭐ </span>}
                    {a.title}
                  </td>
                  <td className="px-6 py-3 text-white/70">{a.committeeHead || '—'}</td>
                  <td className="px-6 py-3 text-white/70">{a.location || '—'}</td>
                  <td className="px-6 py-3">
                    {confirmDeleteId === a.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">Delete?</span>
                        <button
                          type="button"
                          aria-label="Confirm delete"
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
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
                          onClick={() => startEdit(a)}
                          className="text-xs font-medium text-white/70 underline hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToBanner(a)}
                          disabled={addingToBannerId === a.id}
                          className="text-xs font-medium text-white/70 underline hover:text-white disabled:opacity-50"
                        >
                          {addingToBannerId === a.id
                            ? 'Adding…'
                            : addedToBannerId === a.id
                              ? 'Added!'
                              : 'Add to banner'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="text-xs font-medium text-red-300 underline hover:text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-white/50" colSpan={5}>
                    No activities yet.
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
            {editingId ? 'Edit activity' : 'Add activity'}
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
            <label className={labelClass}>Activity title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Opening Program"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} [color-scheme:dark]`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Committee head</label>
            <input
              type="text"
              value={committeeHead}
              onChange={(e) => setCommitteeHead(e.target.value)}
              placeholder="Assigned committee head"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Barangay Covered Court"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this activity about?"
              rows={3}
              className={`${inputClass} resize-none overflow-hidden`}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelClass}>Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(Array.from(e.target.files ?? []))}
              className="text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-white/20"
            />
            {photoFiles.length === 0 && existingImageURLs.length > 0 && (
              <p className="text-xs text-white/40">Leave blank to keep the current photos.</p>
            )}
            {(photoPreviews.length > 0 || existingImageURLs.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-2">
                {(photoPreviews.length > 0 ? photoPreviews : existingImageURLs).map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3.5 py-3 text-sm text-white md:col-span-2">
            <input
              type="checkbox"
              checked={highlighted}
              onChange={(e) => setHighlighted(e.target.checked)}
            />
            <span>
              ⭐ Highlight this activity — pins it to the top of "Upcoming" on the Calendar and
              home pages, ahead of other activities regardless of date.
            </span>
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add activity'}
        </button>
      </section>
    </div>
  )
}

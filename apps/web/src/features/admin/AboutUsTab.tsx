import { useEffect, useRef, useState } from 'react'
import { subscribeToAbout, uploadAboutImage, saveAbout } from '../../lib/about'
import { addBanner, subscribeToBanners, type BannerWithId } from '../../lib/banners'
import type { AboutDoc } from '@tindadventure/shared'

const inputClass =
  'rounded-md bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40'
const labelClass = 'text-xs font-medium text-white/50'

export function AboutUsTab() {
  const [about, setAbout] = useState<AboutDoc | null>(null)
  const [banners, setBanners] = useState<BannerWithId[]>([])
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [addingToBanner, setAddingToBanner] = useState(false)
  const [addedToBanner, setAddedToBanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const loaded = useRef(false)

  useEffect(() => subscribeToBanners(setBanners), [])

  useEffect(
    () =>
      subscribeToAbout((a) => {
        setAbout(a)
        if (!loaded.current) {
          loaded.current = true
          setDescription(a?.description ?? '')
        }
      }),
    [],
  )

  useEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [description])

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const handleSave = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const imageURL = photoFile ? await uploadAboutImage(photoFile) : (about?.imageURL ?? null)
      await saveAbout({ description, imageURL })
      setPhotoFile(null)
    } catch {
      setError('Could not save About Us.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddToBanner = async () => {
    if (!about?.imageURL) {
      setError('Save a photo before featuring About Us in the banner.')
      return
    }
    setError(null)
    setAddingToBanner(true)
    try {
      const nextOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.order)) + 1 : 0
      await addBanner({
        imageURL: about.imageURL,
        caption: 'About SK Guadalupe',
        order: nextOrder,
        linkTo: '/about',
      })
      setAddedToBanner(true)
      setTimeout(() => setAddedToBanner(false), 2000)
    } catch {
      setError('Could not add About Us to the banner.')
    } finally {
      setAddingToBanner(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 text-white">
      <section className="rounded-2xl bg-white/5 p-6">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-white/40 uppercase">
          About Us
        </h2>
        <div className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell visitors about SK Guadalupe — who you are, what the council does, and etc."
              rows={4}
              className={`${inputClass} resize-none overflow-hidden`}
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
            {!photoFile && about?.imageURL && (
              <p className="text-xs text-white/40">Leave blank to keep the current photo.</p>
            )}
            {(photoPreview ?? about?.imageURL) && (
              <img
                src={photoPreview ?? about?.imageURL ?? undefined}
                alt="Preview"
                className="h-24 w-24 rounded-lg object-cover"
              />
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleAddToBanner}
            disabled={addingToBanner}
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50"
          >
            {addingToBanner ? 'Adding…' : addedToBanner ? 'Added!' : 'Feature on banner'}
          </button>
        </div>
      </section>
    </div>
  )
}

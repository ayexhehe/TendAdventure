import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AboutDoc } from '@tindadventure/shared'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { resolveSlug, logInviteClick } from '../../lib/tasked'
import { subscribeToAbout } from '../../lib/about'
import { ImageWithSkeleton } from '../../components/skeleton/ImageWithSkeleton'
import { SpotlightSkeleton } from '../../components/skeleton/Skeletons'

export function InvitePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()

  const [ownerUid, setOwnerUid] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState('A friend')
  const [resolved, setResolved] = useState(false)
  const [about, setAbout] = useState<AboutDoc | null>(null)
  const clickLogged = useRef(false)

  useEffect(() => {
    if (!slug) {
      setResolved(true)
      return
    }
    let cancelled = false
    void (async () => {
      const entry = await resolveSlug(slug)
      if (cancelled) return
      setOwnerUid(entry?.uid ?? null)
      setOwnerName(entry?.displayName || 'A friend')
      setResolved(true)
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Fire-and-forget: never blocks rendering the invite content. Only
  // counts once the visitor is actually signed in — a click only counts
  // toward Task 1 if it's traceable to a real account, not just a
  // localStorage id anyone could script up. Anonymous visitors can still
  // view the invite fine; they just don't get logged until they sign in.
  useEffect(() => {
    if (authLoading || !ownerUid || !user || clickLogged.current) return
    if (user.uid === ownerUid) return // don't count the owner's own visit

    const seenKey = `ta_clicked_${ownerUid}`
    if (localStorage.getItem(seenKey)) return

    clickLogged.current = true
    localStorage.setItem(seenKey, '1')
    void logInviteClick(ownerUid, user.uid)
  }, [ownerUid, user, authLoading])

  useEffect(() => subscribeToAbout(setAbout), [])

  return (
    <Layout>
      <div className="flex w-full max-w-2xl flex-col gap-8 px-4 py-10 text-white">
        {!resolved ? (
          <SpotlightSkeleton />
        ) : !ownerUid ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-lg font-medium">This invite link isn't valid.</p>
            <Link
              to="/"
              className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">You're invited</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {ownerName} says: Come and celebrate Linggo ng Kabataan sa SK Guadalupe!
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Merchant stalls, games, prizes, and good company — all in one place.
              </p>
            </div>

            {about?.imageURL && (
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                <ImageWithSkeleton src={about.imageURL} alt="" className="aspect-video w-full md:aspect-21/9" />
              </div>
            )}

            {about?.description && (
              <p className="text-sm leading-relaxed whitespace-pre-line text-white/70 md:text-base">
                {about.description}
              </p>
            )}

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-[#113DCB] hover:bg-white/90"
              >
                Explore the Festival
              </Link>
              <Link
                to="/games"
                className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20"
              >
                See the games
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { useAuth } from '../../hooks/useAuth'
import { resolveSlugOwner, logInviteClick } from '../../lib/tasked'
import { getTaskedSettings } from '../../lib/taskedSettings'

function getVisitorId(): string {
  const key = 'ta_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, id)
  }
  return id
}

export function InviteRedirectPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<'loading' | 'redirecting' | 'invalid'>('loading')

  useEffect(() => {
    if (!slug || authLoading) return

    let cancelled = false
    void (async () => {
      const ownerUid = await resolveSlugOwner(slug)
      if (cancelled) return
      if (!ownerUid) {
        setState('invalid')
        return
      }

      // Don't count the owner clicking their own link.
      if (!user || user.uid !== ownerUid) {
        const seenKey = `ta_clicked_${ownerUid}`
        if (!localStorage.getItem(seenKey)) {
          localStorage.setItem(seenKey, '1')
          await logInviteClick(ownerUid, getVisitorId())
        }
      }

      const settings = await getTaskedSettings()
      if (cancelled) return
      if (!settings?.inviteLink) {
        setState('invalid')
        return
      }
      setState('redirecting')
      window.location.replace(settings.inviteLink)
    })()

    return () => {
      cancelled = true
    }
  }, [slug, user, authLoading])

  return (
    <Layout>
      <div className="flex flex-col items-center gap-3 text-center text-white">
        {state === 'invalid' ? (
          <>
            <p className="text-lg font-medium">This invite link isn't valid.</p>
            <Link
              to="/"
              className="mt-2 rounded-full bg-white px-6 py-2 text-sm font-medium text-[#113DCB] hover:bg-white/90"
            >
              Back to home
            </Link>
          </>
        ) : (
          <p className="text-sm text-white/70">Taking you there…</p>
        )}
      </div>
    </Layout>
  )
}

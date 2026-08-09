import type { User } from 'firebase/auth'
import type { UserDoc } from '@tindadventure/shared'

export function isProfileComplete(user: User | null, userDoc: UserDoc | null): boolean {
  if (!user?.displayName?.trim()) return false
  if (!userDoc) return false
  if (!userDoc.fullName?.trim()) return false
  if (!userDoc.sitio?.trim()) return false
  if (!userDoc.birthday) return false
  if (!userDoc.gender) return false
  if (userDoc.gender === 'self-describe' && !userDoc.genderSelfDescribe?.trim()) return false
  if (userDoc.consentAcceptedAt == null) return false
  return true
}

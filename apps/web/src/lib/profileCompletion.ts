import type { User } from 'firebase/auth'
import type { UserDoc } from '@tindadventure/shared'

function hasBasicInfo(userDoc: UserDoc, displayName: string | null | undefined): boolean {
  if (!displayName?.trim()) return false
  if (!userDoc.fullName?.trim()) return false
  if (!userDoc.sitio?.trim()) return false
  if (!userDoc.birthday) return false
  if (!userDoc.gender) return false
  if (userDoc.gender === 'self-describe' && !userDoc.genderSelfDescribe?.trim()) return false
  return userDoc.consentAcceptedAt != null
}

function hasCurrentStatus(userDoc: UserDoc): boolean {
  if (!userDoc.currentStatus) return false
  if (userDoc.currentStatus === 'student' && !userDoc.studentLevel) return false
  return userDoc.currentStatus !== 'other' || !!userDoc.currentStatusOther?.trim()
}

function hasSkillsAndInterests(userDoc: UserDoc): boolean {
  if (!userDoc.skills?.length) return false
  if (userDoc.skills.includes('Other') && !userDoc.skillsOther?.trim()) return false
  if (!userDoc.interests?.length) return false
  return !userDoc.interests.includes('Other') || !!userDoc.interestsOther?.trim()
}

// skVoice is deliberately not checked here — open feedback, not required
// profiling data.
function hasRequiredProfileFields(userDoc: UserDoc | null, displayName: string | null | undefined): boolean {
  if (!userDoc) return false
  return hasBasicInfo(userDoc, displayName) && hasCurrentStatus(userDoc) && hasSkillsAndInterests(userDoc)
}

export function isProfileComplete(user: User | null, userDoc: UserDoc | null): boolean {
  return hasRequiredProfileFields(userDoc, user?.displayName)
}

// Same checks, but usable from the admin panel where only the Firestore
// doc is available (not a Firebase Auth User for someone else's account).
// userDoc.displayName mirrors the auth account's displayName, kept in
// sync by ensureUserDocument.
export function isProfileDataComplete(userDoc: UserDoc | null): boolean {
  return hasRequiredProfileFields(userDoc, userDoc?.displayName)
}

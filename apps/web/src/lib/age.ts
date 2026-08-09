export function calculateAge(birthday: string | null | undefined): number | null {
  if (!birthday) return null
  const dob = new Date(birthday)
  if (Number.isNaN(dob.getTime())) return null

  const today = new Date()
  let age = today.getUTCFullYear() - dob.getUTCFullYear()
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate())
  if (!hasHadBirthdayThisYear) age -= 1

  return age
}

export function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

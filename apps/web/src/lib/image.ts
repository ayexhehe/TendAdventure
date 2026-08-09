export interface CompressImageOptions {
  maxDimension?: number
  quality?: number
}

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const { maxDimension = 1600, quality = 0.82 } = options

  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob || blob.size >= file.size) return file

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg' })
}

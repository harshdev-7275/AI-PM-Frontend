import type { Area } from 'react-easy-crop'

/** Load an image element from a data/object URL, resolving once decoded. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (e) => reject(e))
    img.src = src
  })
}

/**
 * Crop `src` to the given pixel area and return a square PNG blob, downscaled
 * to at most `size` px so we never upload a huge file for a small avatar.
 */
export async function getCroppedBlob(
  src:  string,
  area: Area,
  size = 512,
): Promise<Blob> {
  const image  = await loadImage(src)
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  const outSize = Math.min(size, area.width)
  canvas.width  = outSize
  canvas.height = outSize

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height, // source crop rect
    0, 0, outSize, outSize,                   // destination
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/png',
    )
  })
}

/**
 * Rasterize any image source (e.g. a DiceBear SVG data URI) to a square PNG
 * blob, so a generated character can be uploaded through the same flow as a
 * real photo.
 */
export async function pngBlobFromSrc(src: string, size = 512): Promise<Blob> {
  const image  = await loadImage(src)
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  canvas.width  = size
  canvas.height = size
  ctx.drawImage(image, 0, 0, size, size)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/png',
    )
  })
}

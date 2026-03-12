/**
 * Client-side image compression via Canvas API.
 * Runs entirely in the browser — no server round-trip.
 *
 * Targets ~800 KB per image (plenty of detail for plant ID)
 * by capping the longest side at 1600px and using 82% JPEG quality.
 */

const MAX_DIMENSION = 1600
const JPEG_QUALITY  = 0.82

export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down if either dimension exceeds MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height)
        width  = Math.round(width  * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          // Keep original name but force .jpg extension
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    }

    // If anything goes wrong, fall back to the original file
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage))
}

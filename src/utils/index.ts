// Simple ID generator without uuid dependency
let counter = 0
export function generateId(): string {
  return `layer_${Date.now()}_${counter++}`
}

// Auto-number duplicate layer names: 爱心 → 爱心1, 爱心2
export function dedupName(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base
  let i = 1
  while (existing.includes(`${base}${i}`)) i++
  return `${base}${i}`
}

export function mmToPx(mm: number, dpi: number = 96): number {
  return (mm / 25.4) * dpi
}

export function pxToMm(px: number, dpi: number = 96): number {
  return (px / dpi) * 25.4
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

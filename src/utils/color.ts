import { converter, formatHex, parse } from 'culori'

export type ColorModel = 'hex' | 'rgb' | 'hsl' | 'hsb' | 'css'

export interface OklchColor {
  l: number
  c: number
  h: number
}

export interface Shade {
  suffix: string
  lightness: number
  oklch: OklchColor
  hex: string
  css: string
  isCustom: boolean
}

export interface PaletteSettings {
  minL: number
  maxL: number
  stepSize: number
  count: number
}

const toOklch = converter('oklch')
const toRgb = converter('rgb')
const toHsl = converter('hsl')
const toHsv = converter('hsv')

export function parseToOklch(input: string): OklchColor | null {
  try {
    const trimmed = input.trim()
    const parsed = parse(trimmed)
    if (!parsed) return null
    const ok = toOklch(parsed)
    if (!ok || ok.l === undefined) return null
    return {
      l: ok.l,
      c: ok.c ?? 0,
      h: ok.h ?? 0
    }
  } catch {
    return null
  }
}

export function oklchToHex(color: OklchColor): string {
  try {
    const rgb = toRgb({ mode: 'oklch', ...color })
    if (!rgb) return '#000000'
    const clamped = {
      mode: 'rgb' as const,
      r: Math.max(0, Math.min(1, rgb.r ?? 0)),
      g: Math.max(0, Math.min(1, rgb.g ?? 0)),
      b: Math.max(0, Math.min(1, rgb.b ?? 0))
    }
    return formatHex(clamped) ?? '#000000'
  } catch {
    return '#000000'
  }
}

export function oklchToCss(c: OklchColor): string {
  const l = (c.l * 100).toFixed(2)
  const ch = c.c.toFixed(4)
  const h = (c.h ?? 0).toFixed(2)
  return `oklch(${l}% ${ch} ${h})`
}

function oklchToRgbString(color: OklchColor): string {
  const rgb = toRgb({ mode: 'oklch', ...color })
  if (!rgb) return 'rgb(0, 0, 0)'
  const r = Math.round(Math.max(0, Math.min(1, rgb.r ?? 0)) * 255)
  const g = Math.round(Math.max(0, Math.min(1, rgb.g ?? 0)) * 255)
  const b = Math.round(Math.max(0, Math.min(1, rgb.b ?? 0)) * 255)
  return `rgb(${r}, ${g}, ${b})`
}

function oklchToHslString(color: OklchColor): string {
  const hsl = toHsl({ mode: 'oklch', ...color })
  if (!hsl) return 'hsl(0, 0%, 0%)'
  const h = Math.round(hsl.h ?? 0)
  const s = Math.round((hsl.s ?? 0) * 100)
  const l = Math.round((hsl.l ?? 0) * 100)
  return `hsl(${h}, ${s}%, ${l}%)`
}

function oklchToHsbString(color: OklchColor): string {
  const hsv = toHsv({ mode: 'oklch', ...color })
  if (!hsv) return 'hsb(0, 0%, 0%)'
  const h = Math.round(hsv.h ?? 0)
  const s = Math.round((hsv.s ?? 0) * 100)
  const b = Math.round((hsv.v ?? 0) * 100)
  return `hsb(${h}, ${s}%, ${b}%)`
}

function parseHsbString(input: string): OklchColor | null {
  const m = input
    .trim()
    .match(/^hsb\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i)
  if (!m) return null
  const ok = toOklch({ mode: 'hsv', h: +m[1], s: +m[2] / 100, v: +m[3] / 100 })
  if (!ok || ok.l === undefined) return null
  return { l: ok.l, c: ok.c ?? 0, h: ok.h ?? 0 }
}

export function formatForModel(color: OklchColor, model: ColorModel): string {
  switch (model) {
    case 'hex': return oklchToHex(color)
    case 'rgb': return oklchToRgbString(color)
    case 'hsl': return oklchToHslString(color)
    case 'hsb': return oklchToHsbString(color)
    case 'css': return oklchToCss(color)
  }
}

export function parseForModel(input: string, model: ColorModel): OklchColor | null {
  if (model === 'hsb') return parseHsbString(input)
  return parseToOklch(input)
}

export function suffixFromLightness(l: number): string {
  return String(Math.round(l * 10)).padStart(3, '0')
}

export function generateShades(base: OklchColor, settings: PaletteSettings): Shade[] {
  const { minL, maxL, stepSize } = settings
  const baseL = Math.round(base.l * 1000) / 10 // convert to % with 1 decimal

  const values: number[] = [baseL]

  for (let i = 1; ; i++) {
    const l = Math.round((baseL + i * stepSize) * 10) / 10
    if (l > maxL + 0.001) break
    values.push(l)
  }

  for (let i = 1; ; i++) {
    const l = Math.round((baseL - i * stepSize) * 10) / 10
    if (l < minL - 0.001) break
    values.push(l)
  }

  let sorted = values.sort((a, b) => a - b)

  if (settings.count > 0 && sorted.length > settings.count) {
    const idx = sorted.indexOf(baseL)
    const half = Math.floor((settings.count - 1) / 2)
    let start = Math.max(0, idx - half)
    let end = start + settings.count
    if (end > sorted.length) {
      end = sorted.length
      start = Math.max(0, end - settings.count)
    }
    sorted = sorted.slice(start, end)
  }

  return sorted.map((rounded) => {
    const oklch: OklchColor = { l: rounded / 100, c: base.c, h: base.h ?? 0 }
    return {
      suffix: rounded === baseL ? 'base' : suffixFromLightness(rounded),
      lightness: rounded,
      oklch,
      hex: oklchToHex(oklch),
      css: oklchToCss(oklch),
      isCustom: false
    }
  })
}

export function randomOklch(): OklchColor {
  return {
    l: 0.45 + Math.random() * 0.25,
    c: 0.1 + Math.random() * 0.18,
    h: Math.random() * 360
  }
}

export type HarmonyType =
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triad'
  | 'square'
  | 'compound'

export const HARMONY_LABELS: Record<HarmonyType, string> = {
  analogous: 'Analogous',
  complementary: 'Complementary',
  'split-complementary': 'Split Complementary',
  triad: 'Triad',
  square: 'Square',
  compound: 'Compound'
}

const HARMONY_SHIFTS: Record<HarmonyType, number[]> = {
  analogous: [30, -30],
  complementary: [180],
  'split-complementary': [150, 210],
  triad: [120, 240],
  square: [90, 180, 270],
  compound: [30, 180, 210]
}

export function getHarmonyColors(base: OklchColor, type: HarmonyType): OklchColor[] {
  const baseH = base.h ?? 0
  return HARMONY_SHIFTS[type].map((shift) => ({
    l: base.l,
    c: base.c,
    h: (baseH + shift + 360) % 360
  }))
}

export function buildHGradient(l: number, c: number, steps = 12): string {
  const stops = Array.from({ length: steps + 1 }, (_, i) => {
    const h = (i / steps) * 360
    return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
}

export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Empirically chosen threshold that gives good contrast without strict WCAG 4.5:1 target
const CONTRAST_THRESHOLD = 0.35

export function contrastColor(hex: string): string {
  const lum = relativeLuminance(hex)
  return lum > CONTRAST_THRESHOLD ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.92)'
}

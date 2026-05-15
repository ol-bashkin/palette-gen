import type { OklchColor } from './color'
import { parseToOklch } from './color'

export interface ImportedColor {
  name: string
  baseOklch: OklchColor
  overrides: Record<string, OklchColor>
}

export interface ImportResult {
  colors: ImportedColor[]
  error?: string
}

function isSuffix(s: string): boolean {
  return s === 'base' || /^\d{3}$/.test(s)
}

function stripCommonPrefix(names: string[]): string[] {
  if (names.length === 0) return names
  const split = names.map((n) => n.split('-'))
  const minLen = Math.min(...split.map((p) => p.length))
  let common = 0
  for (let i = 0; i < minLen - 1; i++) {
    if (split.every((p) => p[i] === split[0][i])) common = i + 1
    else break
  }
  if (names.length === 1 && common === 0) {
    const parts = split[0]
    return [parts.length >= 2 ? parts.slice(1).join('-') : parts[0]]
  }
  if (common === 0) return names
  return names.map((n) => n.split('-').slice(common).join('-') || n)
}

function buildColor(name: string, shades: Map<string, OklchColor>): ImportedColor {
  let baseOklch: OklchColor
  const overrides: Record<string, OklchColor> = {}

  if (shades.has('base')) {
    baseOklch = shades.get('base')!
  } else {
    const sorted = Array.from(shades.keys()).sort()
    baseOklch = shades.get(sorted[Math.floor(sorted.length / 2)])!
  }

  for (const [suffix, oklch] of shades) {
    if (suffix !== 'base') overrides[suffix] = oklch
  }

  return { name, baseOklch, overrides }
}

export function importCssVariables(css: string): ImportResult {
  const groups = new Map<string, Map<string, OklchColor>>()
  const re = /--([\w][\w-]*)\s*:\s*(oklch\([^)]+\))/gi
  let m: RegExpExecArray | null

  while ((m = re.exec(css)) !== null) {
    const parts = m[1].split('-')
    const suffix = parts[parts.length - 1]
    if (!isSuffix(suffix)) continue

    const oklch = parseToOklch(m[2])
    if (!oklch) continue

    const key = parts.slice(0, -1).join('-')
    if (!key) continue

    if (!groups.has(key)) groups.set(key, new Map())
    groups.get(key)!.set(suffix, oklch)
  }

  if (groups.size === 0) return { colors: [], error: 'No palette CSS variables found' }

  const keys = Array.from(groups.keys())
  const names = stripCommonPrefix(keys)
  return { colors: keys.map((k, i) => buildColor(names[i], groups.get(k)!)) }
}

export function importFigmaTokens(json: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return { colors: [], error: 'Invalid JSON' }
  }

  if (typeof data !== 'object' || data === null) return { colors: [], error: 'Invalid format' }

  const root = data as Record<string, unknown>
  const colorGroup =
    typeof root.color === 'object' && root.color !== null ? root.color : root

  if (typeof colorGroup !== 'object' || colorGroup === null) {
    return { colors: [], error: 'Expected { "color": { ... } } structure' }
  }

  const colors: ImportedColor[] = []

  for (const [colorName, shadeMap] of Object.entries(colorGroup as Record<string, unknown>)) {
    if (typeof shadeMap !== 'object' || shadeMap === null) continue

    const shades = new Map<string, OklchColor>()

    for (const [suffix, token] of Object.entries(shadeMap as Record<string, unknown>)) {
      if (!isSuffix(suffix) || typeof token !== 'object' || token === null) continue

      const t = token as Record<string, unknown>
      let oklch: OklchColor | null = null

      const pg = (t.$extensions as Record<string, unknown> | undefined)?.[
        'palette-gen'
      ] as Record<string, unknown> | undefined
      if (typeof pg?.oklch === 'string') oklch = parseToOklch(pg.oklch)
      if (!oklch && typeof t.$value === 'string') oklch = parseToOklch(t.$value)

      if (oklch) shades.set(suffix, oklch)
    }

    if (shades.size > 0) colors.push(buildColor(colorName, shades))
  }

  return colors.length > 0 ? { colors } : { colors: [], error: 'No valid colors found' }
}

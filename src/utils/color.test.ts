import { describe, it, expect } from 'vitest'
import {
  parseToOklch,
  oklchToHex,
  oklchToCss,
  suffixFromLightness,
  generateShades,
  getHarmonyColors,
  relativeLuminance,
  contrastColor,
  buildHGradient
} from './color'
import type { OklchColor, PaletteSettings } from './color'

const RED: OklchColor = { l: 0.5, c: 0.2, h: 25 }
const DEFAULT_SETTINGS: PaletteSettings = { minL: 5, maxL: 85, stepSize: 5, count: 11 }

// ─── parseToOklch ────────────────────────────────────────────────────────────

describe('parseToOklch', () => {
  it('parses a hex string', () => {
    const result = parseToOklch('#ff0000')
    expect(result).not.toBeNull()
    expect(result!.l).toBeGreaterThan(0)
    expect(result!.c).toBeGreaterThan(0)
  })

  it('parses oklch() notation', () => {
    const result = parseToOklch('oklch(50% 0.2 25)')
    expect(result).not.toBeNull()
    expect(result!.l).toBeCloseTo(0.5, 2)
    expect(result!.c).toBeCloseTo(0.2, 2)
    expect(result!.h).toBeCloseTo(25, 0)
  })

  it('parses rgb() notation', () => {
    const result = parseToOklch('rgb(255, 0, 0)')
    expect(result).not.toBeNull()
    expect(result!.l).toBeGreaterThan(0)
  })

  it('returns null for empty string', () => {
    expect(parseToOklch('')).toBeNull()
  })

  it('returns null for garbage input', () => {
    expect(parseToOklch('not-a-color')).toBeNull()
  })

  it('handles achromatic colors (hue undefined → 0)', () => {
    const result = parseToOklch('#888888')
    expect(result).not.toBeNull()
    expect(result!.h).toBe(0)
    expect(result!.c).toBeCloseTo(0, 2)
  })

  it('trims whitespace', () => {
    expect(parseToOklch('  #ff0000  ')).not.toBeNull()
  })
})

// ─── oklchToHex ──────────────────────────────────────────────────────────────

describe('oklchToHex', () => {
  it('returns a valid hex string', () => {
    const hex = oklchToHex(RED)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('clamps out-of-gamut colors without throwing', () => {
    const outOfGamut: OklchColor = { l: 0.5, c: 0.4, h: 180 }
    expect(() => oklchToHex(outOfGamut)).not.toThrow()
    expect(oklchToHex(outOfGamut)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('returns #000000 for black', () => {
    const black: OklchColor = { l: 0, c: 0, h: 0 }
    expect(oklchToHex(black)).toBe('#000000')
  })

  it('returns #ffffff for white', () => {
    const white: OklchColor = { l: 1, c: 0, h: 0 }
    expect(oklchToHex(white)).toBe('#ffffff')
  })
})

// ─── oklchToCss ──────────────────────────────────────────────────────────────

describe('oklchToCss', () => {
  it('formats correctly', () => {
    const css = oklchToCss({ l: 0.5, c: 0.2, h: 25 })
    expect(css).toBe('oklch(50.00% 0.2000 25.00)')
  })

  it('uses 0 for undefined hue', () => {
    const css = oklchToCss({ l: 0.5, c: 0, h: undefined as unknown as number })
    expect(css).toContain('0.00)')
  })

  it('produces parseable output', () => {
    const css = oklchToCss(RED)
    expect(parseToOklch(css)).not.toBeNull()
  })
})

// ─── suffixFromLightness ─────────────────────────────────────────────────────

describe('suffixFromLightness', () => {
  it('pads to 3 digits', () => {
    expect(suffixFromLightness(5)).toBe('050')
  })

  it('converts 10% → "100"', () => {
    expect(suffixFromLightness(10)).toBe('100')
  })

  it('converts 85% → "850"', () => {
    expect(suffixFromLightness(85)).toBe('850')
  })

  it('handles 50% → "500"', () => {
    expect(suffixFromLightness(50)).toBe('500')
  })
})

// ─── generateShades ──────────────────────────────────────────────────────────

describe('generateShades', () => {
  it('always includes a shade with suffix "base"', () => {
    const shades = generateShades(RED, DEFAULT_SETTINGS)
    expect(shades.some((s) => s.suffix === 'base')).toBe(true)
  })

  it('returns shades sorted by lightness ascending', () => {
    const shades = generateShades(RED, DEFAULT_SETTINGS)
    for (let i = 1; i < shades.length; i++) {
      expect(shades[i].lightness).toBeGreaterThanOrEqual(shades[i - 1].lightness)
    }
  })

  it('respects minL and maxL bounds', () => {
    const shades = generateShades(RED, DEFAULT_SETTINGS)
    shades.forEach((s) => {
      expect(s.lightness).toBeGreaterThanOrEqual(DEFAULT_SETTINGS.minL - 0.1)
      expect(s.lightness).toBeLessThanOrEqual(DEFAULT_SETTINGS.maxL + 0.1)
    })
  })

  it('respects count limit', () => {
    const settings: PaletteSettings = { minL: 5, maxL: 95, stepSize: 5, count: 5 }
    const shades = generateShades(RED, settings)
    expect(shades.length).toBeLessThanOrEqual(5)
  })

  it('each shade has a valid hex', () => {
    const shades = generateShades(RED, DEFAULT_SETTINGS)
    shades.forEach((s) => {
      expect(s.hex).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('each shade has a valid css string', () => {
    const shades = generateShades(RED, DEFAULT_SETTINGS)
    shades.forEach((s) => {
      expect(s.css).toMatch(/^oklch\(/)
    })
  })

  it('sets isCustom to false for all generated shades', () => {
    const shades = generateShades(RED, DEFAULT_SETTINGS)
    shades.forEach((s) => expect(s.isCustom).toBe(false))
  })

  it('includes base even when it falls outside [minL, maxL]', () => {
    const settings: PaletteSettings = { minL: 60, maxL: 90, stepSize: 5, count: 20 }
    const lowBase: OklchColor = { l: 0.1, c: 0.2, h: 25 }
    const shades = generateShades(lowBase, settings)
    expect(shades.some((s) => s.suffix === 'base')).toBe(true)
  })
})

// ─── getHarmonyColors ────────────────────────────────────────────────────────

describe('getHarmonyColors', () => {
  it('complementary returns 1 color at +180°', () => {
    const base: OklchColor = { l: 0.5, c: 0.2, h: 0 }
    const [h] = getHarmonyColors(base, 'complementary')
    expect(h.h).toBe(180)
  })

  it('triad returns 2 colors at +120° and +240°', () => {
    const base: OklchColor = { l: 0.5, c: 0.2, h: 0 }
    const [h1, h2] = getHarmonyColors(base, 'triad')
    expect(h1.h).toBeCloseTo(120, 1)
    expect(h2.h).toBeCloseTo(240, 1)
  })

  it('analogous wraps hue correctly for negative shift', () => {
    const base: OklchColor = { l: 0.5, c: 0.2, h: 10 }
    const [pos, neg] = getHarmonyColors(base, 'analogous')
    expect(pos.h).toBeCloseTo(40, 1)
    expect(neg.h).toBeCloseTo(340, 1)
  })

  it('square returns 3 colors', () => {
    const colors = getHarmonyColors(RED, 'square')
    expect(colors).toHaveLength(3)
  })

  it('preserves base L and C', () => {
    const base: OklchColor = { l: 0.6, c: 0.15, h: 90 }
    getHarmonyColors(base, 'triad').forEach((h) => {
      expect(h.l).toBe(base.l)
      expect(h.c).toBe(base.c)
    })
  })

  it('hue is always in [0, 360)', () => {
    const base: OklchColor = { l: 0.5, c: 0.2, h: 350 }
    getHarmonyColors(base, 'square').forEach((h) => {
      expect(h.h).toBeGreaterThanOrEqual(0)
      expect(h.h).toBeLessThan(360)
    })
  })
})

// ─── relativeLuminance ───────────────────────────────────────────────────────

describe('relativeLuminance', () => {
  it('white has luminance ~1', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 2)
  })

  it('black has luminance ~0', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 2)
  })

  it('luminance is in [0, 1]', () => {
    const lum = relativeLuminance('#3b82f6')
    expect(lum).toBeGreaterThanOrEqual(0)
    expect(lum).toBeLessThanOrEqual(1)
  })
})

// ─── contrastColor ───────────────────────────────────────────────────────────

describe('contrastColor', () => {
  it('returns dark text on white', () => {
    expect(contrastColor('#ffffff')).toContain('0,0,0')
  })

  it('returns light text on black', () => {
    expect(contrastColor('#000000')).toContain('255,255,255')
  })

  it('threshold is ~0.35 luminance', () => {
    // Mid-gray (#7f7f7f) luminance ≈ 0.215 → light text
    expect(contrastColor('#7f7f7f')).toContain('255,255,255')
    // Light gray (#c8c8c8) luminance ≈ 0.58 → dark text
    expect(contrastColor('#c8c8c8')).toContain('0,0,0')
  })
})

// ─── buildHGradient ──────────────────────────────────────────────────────────

describe('buildHGradient', () => {
  it('returns a linear-gradient string', () => {
    expect(buildHGradient(0.5, 0.2)).toContain('linear-gradient')
  })

  it('uses custom steps', () => {
    const grad = buildHGradient(0.5, 0.2, 6)
    const stops = grad.match(/oklch\(/g) ?? []
    expect(stops).toHaveLength(7) // steps + 1
  })
})

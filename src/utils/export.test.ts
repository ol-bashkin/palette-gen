import { describe, it, expect } from 'vitest'
import { exportCssVariables, exportFigmaTokens } from './export'
import type { PaletteColor } from '@/stores/palette'
import type { Shade } from './color'

function makeShade(suffix: string, lightness: number): Shade {
  return {
    suffix,
    lightness,
    oklch: { l: lightness / 100, c: 0.2, h: 25 },
    hex: '#ab1234',
    css: `oklch(${lightness}.00% 0.2000 25.00)`,
    isCustom: false
  }
}

function makeColor(name: string, shades: Shade[]): PaletteColor {
  return {
    id: 'test-id',
    name,
    baseOklch: { l: 0.5, c: 0.2, h: 25 },
    shades,
    overrides: {}
  }
}

const SHADES = [makeShade('050', 5), makeShade('base', 50), makeShade('850', 85)]
const COLOR = makeColor('red', SHADES)

// ─── exportCssVariables ───────────────────────────────────────────────────────

describe('exportCssVariables', () => {
  it('wraps output in :root {}', () => {
    const out = exportCssVariables([COLOR])
    expect(out.startsWith(':root {')).toBe(true)
    expect(out.endsWith('}')).toBe(true)
  })

  it('emits one variable per shade', () => {
    const out = exportCssVariables([COLOR])
    SHADES.forEach((s) => {
      expect(out).toContain(`--color-red-${s.suffix}:`)
    })
  })

  it('uses custom prefix', () => {
    const out = exportCssVariables([COLOR], 'ds')
    expect(out).toContain('--ds-red-050:')
  })

  it('includes a comment with the color name', () => {
    const out = exportCssVariables([COLOR])
    expect(out).toContain('/* red */')
  })

  it('handles multiple colors', () => {
    const blue = makeColor('blue', [makeShade('base', 50)])
    const out = exportCssVariables([COLOR, blue])
    expect(out).toContain('--color-red-')
    expect(out).toContain('--color-blue-')
  })

  it('uses oklch() for values', () => {
    const out = exportCssVariables([COLOR])
    expect(out).toMatch(/--color-red-050:\s*oklch\(/)
  })

  it('uses shade.oklch even for custom shades', () => {
    const customShade: Shade = {
      suffix: '500',
      lightness: 50,
      oklch: { l: 0.6, c: 0.1, h: 200 },
      hex: '#123456',
      css: 'oklch(60.00% 0.1000 200.00)',
      isCustom: true
    }
    const out = exportCssVariables([makeColor('x', [customShade])])
    expect(out).toContain('oklch(60.00% 0.1000 200.00)')
  })
})

// ─── exportFigmaTokens ────────────────────────────────────────────────────────

describe('exportFigmaTokens', () => {
  it('returns valid JSON', () => {
    const out = exportFigmaTokens([COLOR])
    expect(() => JSON.parse(out)).not.toThrow()
  })

  it('wraps tokens under "color" key', () => {
    const parsed = JSON.parse(exportFigmaTokens([COLOR]))
    expect(parsed).toHaveProperty('color')
    expect(parsed.color).toHaveProperty('red')
  })

  it('each shade has $type "color"', () => {
    const parsed = JSON.parse(exportFigmaTokens([COLOR]))
    SHADES.forEach((s) => {
      expect(parsed.color.red[s.suffix].$type).toBe('color')
    })
  })

  it('$value is a hex string', () => {
    const parsed = JSON.parse(exportFigmaTokens([COLOR]))
    SHADES.forEach((s) => {
      expect(parsed.color.red[s.suffix].$value).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('$extensions include palette-gen.oklch', () => {
    const parsed = JSON.parse(exportFigmaTokens([COLOR]))
    expect(parsed.color.red['050'].$extensions['palette-gen'].oklch).toMatch(/^oklch\(/)
  })

  it('handles multiple colors', () => {
    const blue = makeColor('blue', [makeShade('base', 50)])
    const parsed = JSON.parse(exportFigmaTokens([COLOR, blue]))
    expect(parsed.color).toHaveProperty('red')
    expect(parsed.color).toHaveProperty('blue')
  })
})

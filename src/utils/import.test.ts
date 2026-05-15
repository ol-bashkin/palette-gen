import { describe, it, expect } from 'vitest'
import { importCssVariables, importFigmaTokens } from './import'

// ─── importCssVariables ──────────────────────────────────────────────────────

describe('importCssVariables', () => {
  it('returns error when no palette variables found', () => {
    const result = importCssVariables(':root { --font-size: 14px; }')
    expect(result.colors).toHaveLength(0)
    expect(result.error).toBeTruthy()
  })

  it('returns error for empty input', () => {
    const result = importCssVariables('')
    expect(result.colors).toHaveLength(0)
    expect(result.error).toBeTruthy()
  })

  it('parses a single color with numeric shades', () => {
    const css = `:root {
      --color-red-050: oklch(15.00% 0.2000 25.00);
      --color-red-500: oklch(50.00% 0.2000 25.00);
      --color-red-850: oklch(85.00% 0.2000 25.00);
    }`
    const result = importCssVariables(css)
    expect(result.error).toBeUndefined()
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].name).toBe('red')
  })

  it('parses a color with base suffix', () => {
    const css = `:root {
      --color-primary-base: oklch(50.00% 0.2000 25.00);
      --color-primary-050: oklch(15.00% 0.2000 25.00);
    }`
    const result = importCssVariables(css)
    expect(result.error).toBeUndefined()
    expect(result.colors).toHaveLength(1)
    const { name, baseOklch } = result.colors[0]
    expect(name).toBe('primary')
    expect(baseOklch.l).toBeCloseTo(0.5, 2)
  })

  it('uses base suffix as the base color when present', () => {
    const css = `:root {
      --color-blue-base: oklch(60.00% 0.1500 250.00);
      --color-blue-050: oklch(10.00% 0.1500 250.00);
    }`
    const result = importCssVariables(css)
    expect(result.colors[0].baseOklch.l).toBeCloseTo(0.6, 2)
  })

  it('uses middle shade as base when no base suffix', () => {
    const css = `:root {
      --color-green-050: oklch(10.00% 0.2000 145.00);
      --color-green-500: oklch(50.00% 0.2000 145.00);
      --color-green-850: oklch(85.00% 0.2000 145.00);
    }`
    const result = importCssVariables(css)
    // Middle shade is 500 (index 1 of 3)
    expect(result.colors[0].baseOklch.l).toBeCloseTo(0.5, 2)
  })

  it('parses multiple colors', () => {
    const css = `:root {
      --color-red-500: oklch(50.00% 0.2000 25.00);
      --color-blue-500: oklch(50.00% 0.2000 250.00);
    }`
    const result = importCssVariables(css)
    expect(result.colors).toHaveLength(2)
    const names = result.colors.map((c) => c.name).sort()
    expect(names).toEqual(['blue', 'red'])
  })

  it('ignores variables without recognised suffix', () => {
    const css = `:root {
      --color-red-primary: oklch(50.00% 0.2000 25.00);
      --color-red-500: oklch(50.00% 0.2000 25.00);
    }`
    const result = importCssVariables(css)
    expect(result.colors).toHaveLength(1)
  })

  it('ignores non-oklch values', () => {
    const css = `:root {
      --color-red-500: #ff0000;
      --color-blue-500: oklch(50.00% 0.2000 250.00);
    }`
    const result = importCssVariables(css)
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].name).toContain('blue')
  })

  it('strips common prefix from multiple colors', () => {
    const css = `:root {
      --ds-red-500: oklch(50.00% 0.2000 25.00);
      --ds-blue-500: oklch(50.00% 0.2000 250.00);
    }`
    const result = importCssVariables(css)
    const names = result.colors.map((c) => c.name).sort()
    expect(names).toEqual(['blue', 'red'])
  })

  it('strips prefix for a single color with multi-part name', () => {
    const css = `:root { --color-brand-primary-500: oklch(50.00% 0.2000 25.00); }`
    const result = importCssVariables(css)
    expect(result.colors).toHaveLength(1)
    // prefix "color-brand" stripped → "primary"
    expect(result.colors[0].name).toBe('primary')
  })

  it('non-base shades become overrides', () => {
    const css = `:root {
      --color-red-base: oklch(50.00% 0.2000 25.00);
      --color-red-050: oklch(15.00% 0.2000 25.00);
      --color-red-850: oklch(85.00% 0.2000 25.00);
    }`
    const result = importCssVariables(css)
    const { overrides } = result.colors[0]
    expect(overrides['050']).toBeDefined()
    expect(overrides['850']).toBeDefined()
    expect(overrides['base']).toBeUndefined()
  })
})

// ─── importFigmaTokens ───────────────────────────────────────────────────────

describe('importFigmaTokens', () => {
  it('returns error for invalid JSON', () => {
    const result = importFigmaTokens('not json')
    expect(result.colors).toHaveLength(0)
    expect(result.error).toBe('Invalid JSON')
  })

  it('returns error for non-object JSON', () => {
    const result = importFigmaTokens('"just a string"')
    expect(result.colors).toHaveLength(0)
    expect(result.error).toBeTruthy()
  })

  it('returns error when no valid colors found', () => {
    const result = importFigmaTokens(JSON.stringify({ color: {} }))
    expect(result.colors).toHaveLength(0)
    expect(result.error).toBeTruthy()
  })

  it('parses oklch from palette-gen extension', () => {
    const tokens = {
      color: {
        red: {
          '500': {
            $type: 'color',
            $value: '#ff0000',
            $extensions: { 'palette-gen': { oklch: 'oklch(50.00% 0.2000 25.00)' } }
          }
        }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.error).toBeUndefined()
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].name).toBe('red')
    expect(result.colors[0].baseOklch.l).toBeCloseTo(0.5, 2)
  })

  it('falls back to $value hex when no palette-gen extension', () => {
    const tokens = {
      color: {
        blue: {
          base: {
            $type: 'color',
            $value: '#3b82f6'
          }
        }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.error).toBeUndefined()
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].baseOklch).toBeDefined()
  })

  it('parses multiple colors', () => {
    const tokens = {
      color: {
        red: { '500': { $type: 'color', $value: '#ff0000' } },
        blue: { '500': { $type: 'color', $value: '#0000ff' } }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.colors).toHaveLength(2)
  })

  it('handles tokens at root level (no color wrapper)', () => {
    const tokens = {
      primary: {
        '500': { $type: 'color', $value: '#ff0000' }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].name).toBe('primary')
  })

  it('ignores shades with unrecognised suffixes', () => {
    const tokens = {
      color: {
        red: {
          primary: { $type: 'color', $value: '#ff0000' },
          '500': { $type: 'color', $value: '#cc0000' }
        }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.colors).toHaveLength(1)
  })

  it('skips color groups with no valid shades', () => {
    const tokens = {
      color: {
        bad: { notASuffix: { $type: 'color', $value: '#ff0000' } },
        good: { '500': { $type: 'color', $value: '#00ff00' } }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.colors).toHaveLength(1)
    expect(result.colors[0].name).toBe('good')
  })

  it('uses base suffix as base color when present', () => {
    const tokens = {
      color: {
        green: {
          base: {
            $type: 'color',
            $extensions: { 'palette-gen': { oklch: 'oklch(60.00% 0.2000 145.00)' } },
            $value: '#00aa00'
          },
          '050': {
            $type: 'color',
            $value: '#e0ffe0'
          }
        }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.colors[0].baseOklch.l).toBeCloseTo(0.6, 2)
  })

  it('non-base shades become overrides', () => {
    const tokens = {
      color: {
        red: {
          base: {
            $type: 'color',
            $extensions: { 'palette-gen': { oklch: 'oklch(50.00% 0.2000 25.00)' } },
            $value: '#ff0000'
          },
          '050': {
            $type: 'color',
            $extensions: { 'palette-gen': { oklch: 'oklch(10.00% 0.2000 25.00)' } },
            $value: '#fff0ee'
          }
        }
      }
    }
    const result = importFigmaTokens(JSON.stringify(tokens))
    expect(result.colors[0].overrides['050']).toBeDefined()
    expect(result.colors[0].overrides['base']).toBeUndefined()
  })
})

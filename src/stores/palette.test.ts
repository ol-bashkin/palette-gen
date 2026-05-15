import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaletteStore } from './palette'
import type { OklchColor } from '@/utils/color'

const RED: OklchColor = { l: 0.5, c: 0.2, h: 25 }
const BLUE: OklchColor = { l: 0.5, c: 0.2, h: 250 }

beforeEach(() => {
  setActivePinia(createPinia())
})

// ─── initial state ────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts with no colors', () => {
    const store = usePaletteStore()
    expect(store.colors).toHaveLength(0)
  })

  it('starts uninitialized', () => {
    const store = usePaletteStore()
    expect(store.initialized).toBe(false)
  })

  it('has default settings', () => {
    const store = usePaletteStore()
    expect(store.settings.minL).toBe(5)
    expect(store.settings.maxL).toBe(85)
    expect(store.settings.stepSize).toBe(5)
    expect(store.settings.count).toBe(11)
  })
})

// ─── initRandom ───────────────────────────────────────────────────────────────

describe('initRandom', () => {
  it('adds exactly one color named "base"', () => {
    const store = usePaletteStore()
    store.initRandom()
    expect(store.colors).toHaveLength(1)
    expect(store.colors[0].name).toBe('base')
  })

  it('sets initialized to true', () => {
    const store = usePaletteStore()
    store.initRandom()
    expect(store.initialized).toBe(true)
  })

  it('generates shades for the initial color', () => {
    const store = usePaletteStore()
    store.initRandom()
    expect(store.colors[0].shades.length).toBeGreaterThan(0)
  })
})

// ─── addColor ─────────────────────────────────────────────────────────────────

describe('addColor', () => {
  it('appends a color with the given name', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    expect(store.colors).toHaveLength(1)
    expect(store.colors[0].name).toBe('primary')
  })

  it('stores the base oklch correctly', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    expect(store.colors[0].baseOklch).toEqual(RED)
  })

  it('generates shades on add', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    expect(store.colors[0].shades.length).toBeGreaterThan(0)
  })

  it('assigns a unique id', () => {
    const store = usePaletteStore()
    store.addColor('a', RED)
    store.addColor('b', BLUE)
    const [a, b] = store.colors
    expect(a.id).not.toBe(b.id)
  })
})

// ─── updateBaseColor ──────────────────────────────────────────────────────────

describe('updateBaseColor', () => {
  it('updates the base oklch', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id } = store.colors[0]
    store.updateBaseColor(id, BLUE)
    expect(store.colors[0].baseOklch).toEqual(BLUE)
  })

  it('optionally updates the name', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id } = store.colors[0]
    store.updateBaseColor(id, RED, 'renamed')
    expect(store.colors[0].name).toBe('renamed')
  })

  it('does not change name when omitted', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id } = store.colors[0]
    store.updateBaseColor(id, BLUE)
    expect(store.colors[0].name).toBe('primary')
  })

  it('is a no-op for unknown id', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    store.updateBaseColor('non-existent', BLUE)
    expect(store.colors[0].baseOklch).toEqual(RED)
  })

  it('rebuilds shades', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id } = store.colors[0]
    const before = store.colors[0].shades[0].hex
    store.updateBaseColor(id, BLUE)
    const after = store.colors[0].shades[0].hex
    expect(after).not.toBe(before)
  })
})

// ─── setShadeOverride ────────────────────────────────────────────────────────

describe('setShadeOverride', () => {
  it('marks the shade as custom', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id, shades } = store.colors[0]
    const target = shades[0]
    store.setShadeOverride(id, target.suffix, BLUE)
    const updated = store.colors[0].shades.find((s) => s.suffix === target.suffix)!
    expect(updated.isCustom).toBe(true)
  })

  it('updates the shade oklch to the override', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id, shades } = store.colors[0]
    const target = shades[0]
    store.setShadeOverride(id, target.suffix, BLUE)
    const updated = store.colors[0].shades.find((s) => s.suffix === target.suffix)!
    expect(updated.oklch).toEqual(BLUE)
  })
})

// ─── clearShadeOverride ──────────────────────────────────────────────────────

describe('clearShadeOverride', () => {
  it('removes custom status from the shade', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id, shades } = store.colors[0]
    const target = shades[0]
    store.setShadeOverride(id, target.suffix, BLUE)
    store.clearShadeOverride(id, target.suffix)
    const updated = store.colors[0].shades.find((s) => s.suffix === target.suffix)!
    expect(updated.isCustom).toBe(false)
  })
})

// ─── removeColor ─────────────────────────────────────────────────────────────

describe('removeColor', () => {
  it('removes the color by id', () => {
    const store = usePaletteStore()
    store.addColor('a', RED)
    store.addColor('b', BLUE)
    const id = store.colors[0].id
    store.removeColor(id)
    expect(store.colors).toHaveLength(1)
    expect(store.colors[0].name).toBe('b')
  })

  it('is a no-op for unknown id', () => {
    const store = usePaletteStore()
    store.addColor('a', RED)
    store.removeColor('unknown')
    expect(store.colors).toHaveLength(1)
  })
})

// ─── reorderColors ───────────────────────────────────────────────────────────

describe('reorderColors', () => {
  it('swaps two colors by index', () => {
    const store = usePaletteStore()
    store.addColor('a', RED)
    store.addColor('b', BLUE)
    store.addColor('c', { l: 0.5, c: 0.2, h: 120 })
    store.reorderColors(0, 2)
    expect(store.colors[0].name).toBe('b')
    expect(store.colors[2].name).toBe('a')
  })

  it('moves color forward', () => {
    const store = usePaletteStore()
    store.addColor('a', RED)
    store.addColor('b', BLUE)
    store.reorderColors(0, 1)
    expect(store.colors[0].name).toBe('b')
    expect(store.colors[1].name).toBe('a')
  })
})

// ─── updateSettings ──────────────────────────────────────────────────────────

describe('updateSettings', () => {
  it('updates a single setting', () => {
    const store = usePaletteStore()
    store.updateSettings({ stepSize: 10 })
    expect(store.settings.stepSize).toBe(10)
  })

  it('clamps count to maxCount', () => {
    const store = usePaletteStore()
    store.updateSettings({ minL: 0, maxL: 100, stepSize: 50, count: 99 })
    expect(store.settings.count).toBe(2) // floor((100-0)/50) = 2
  })

  it('count is at least 1', () => {
    const store = usePaletteStore()
    store.updateSettings({ minL: 49, maxL: 50, stepSize: 5, count: 99 })
    expect(store.settings.count).toBeGreaterThanOrEqual(1)
  })

  it('rebuilds all shades after update', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const before = store.colors[0].shades.length
    store.updateSettings({ stepSize: 10 })
    const after = store.colors[0].shades.length
    expect(after).not.toBe(before)
  })
})

// ─── color shades ─────────────────────────────────────────────────────────────

describe('color shades', () => {
  it('populates shades on addColor', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    expect(store.colors).toHaveLength(1)
    expect(store.colors[0].name).toBe('primary')
    expect(store.colors[0].shades.length).toBeGreaterThan(0)
  })

  it('reflects override in color.shades', () => {
    const store = usePaletteStore()
    store.addColor('primary', RED)
    const { id, shades } = store.colors[0]
    const target = shades[0]
    store.setShadeOverride(id, target.suffix, BLUE)
    const overridden = store.colors[0].shades.find((s) => s.suffix === target.suffix)!
    expect(overridden.isCustom).toBe(true)
    expect(overridden.oklch).toEqual(BLUE)
  })
})

// ─── addHarmonyColors ────────────────────────────────────────────────────────

describe('addHarmonyColors', () => {
  it('adds 1 color for complementary', () => {
    const store = usePaletteStore()
    store.addColor('base', RED)
    const baseId = store.colors[0].id
    store.addHarmonyColors(baseId, 'complementary')
    expect(store.colors).toHaveLength(2)
  })

  it('adds 2 colors for triad', () => {
    const store = usePaletteStore()
    store.addColor('base', RED)
    const baseId = store.colors[0].id
    store.addHarmonyColors(baseId, 'triad')
    expect(store.colors).toHaveLength(3)
  })

  it('is a no-op for unknown baseId', () => {
    const store = usePaletteStore()
    store.addColor('base', RED)
    store.addHarmonyColors('unknown', 'triad')
    expect(store.colors).toHaveLength(1)
  })
})

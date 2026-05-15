import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { nanoid } from '../utils/nanoid'
import {
  type OklchColor,
  type Shade,
  type PaletteSettings,
  type HarmonyType,
  randomOklch,
  generateShades,
  getHarmonyColors,
  oklchToHex,
  oklchToCss
} from '@/utils/color'

export interface PaletteColor {
  id: string
  name: string
  baseOklch: OklchColor
  shades: Shade[]
  overrides: Record<string, OklchColor>
}

const STORAGE_KEY = 'palette-gen'

type StoredColor = { id: string; name: string; baseOklch: OklchColor; overrides: Record<string, OklchColor> }
type StoredData = { colors: StoredColor[]; settings: PaletteSettings }

function persist(colors: PaletteColor[], settings: PaletteSettings) {
  try {
    const data: StoredData = {
      colors: colors.map(({ id, name, baseOklch, overrides }) => ({ id, name, baseOklch, overrides })),
      settings
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

function loadPersisted(): StoredData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data?.colors)) return null
    return data as StoredData
  } catch {
    return null
  }
}

const DEFAULT_SETTINGS: PaletteSettings = {
  minL: 5,
  maxL: 85,
  stepSize: 5,
  count: 11
}

function buildShades(color: PaletteColor, settings: PaletteSettings): Shade[] {
  return generateShades(color.baseOklch, settings).map((shade) => {
    const override = color.overrides[shade.suffix]
    if (override) {
      return {
        ...shade,
        oklch: override,
        hex: oklchToHex(override),
        css: oklchToCss(override),
        isCustom: true
      }
    }
    return shade
  })
}

export const usePaletteStore = defineStore('palette', () => {
  const colors = ref<PaletteColor[]>([])
  const settings = ref<PaletteSettings>({ ...DEFAULT_SETTINGS })
  const initialized = ref(false)

  const stored = loadPersisted()
  if (stored?.colors.length) {
    settings.value = { ...DEFAULT_SETTINGS, ...stored.settings }
    colors.value = stored.colors.map((c) => {
      const color: PaletteColor = { ...c, shades: [] }
      color.shades = buildShades(color, settings.value)
      return color
    })
    initialized.value = true
  }

  watch([colors, settings], () => {
    if (colors.value.length > 0) {
      persist(colors.value, settings.value)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, { deep: true })

  function initRandom() {
    const oklch = randomOklch()
    const id = nanoid()
    const color: PaletteColor = {
      id,
      name: 'base',
      baseOklch: oklch,
      shades: [],
      overrides: {}
    }
    color.shades = buildShades(color, settings.value)
    colors.value = [color]
    initialized.value = true
  }

  function addColor(name: string, oklch: OklchColor) {
    const id = nanoid()
    const color: PaletteColor = {
      id,
      name,
      baseOklch: oklch,
      shades: [],
      overrides: {}
    }
    color.shades = buildShades(color, settings.value)
    colors.value.push(color)
  }

  function updateBaseColor(id: string, oklch: OklchColor, name?: string) {
    const color = colors.value.find((c) => c.id === id)
    if (!color) return
    color.baseOklch = oklch
    if (name !== undefined) color.name = name
    color.shades = buildShades(color, settings.value)
  }

  function setShadeOverride(colorId: string, suffix: string, oklch: OklchColor) {
    const color = colors.value.find((c) => c.id === colorId)
    if (!color) return
    color.overrides[suffix] = oklch
    color.shades = buildShades(color, settings.value)
  }

  function clearShadeOverride(colorId: string, suffix: string) {
    const color = colors.value.find((c) => c.id === colorId)
    if (!color) return
    delete color.overrides[suffix]
    color.shades = buildShades(color, settings.value)
  }

  function removeColor(id: string) {
    colors.value = colors.value.filter((c) => c.id !== id)
  }

  function addHarmonyColors(baseId: string, type: HarmonyType) {
    const base = colors.value.find((c) => c.id === baseId)
    if (!base) return
    const harmonics = getHarmonyColors(base.baseOklch, type)
    harmonics.forEach((oklch, i) => {
      addColor(`${base.name}-${type.split('-')[0]}-${i + 1}`, oklch)
    })
  }

  function updateSettings(s: Partial<PaletteSettings>) {
    const merged = { ...settings.value, ...s }
    const maxCount = Math.floor((merged.maxL - merged.minL) / merged.stepSize)
    merged.count = Math.max(1, Math.min(maxCount, merged.count))
    settings.value = merged
    colors.value.forEach((c) => {
      c.shades = buildShades(c, settings.value)
    })
  }

  function reorderColors(fromIndex: number, toIndex: number) {
    const arr = [...colors.value]
    const [item] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, item)
    colors.value = arr
  }

  function importPalette(
    items: Array<{ name: string; baseOklch: OklchColor; overrides: Record<string, OklchColor> }>
  ) {
    colors.value = items.map((item) => {
      const id = nanoid()
      const color: PaletteColor = {
        id,
        name: item.name,
        baseOklch: item.baseOklch,
        shades: [],
        overrides: {}
      }

      // Build a CSS-string map of what the generator would produce for this base color.
      // Compare at oklchToCss precision — same level as the export format — so
      // round-tripped values match exactly and only genuine overrides are preserved.
      const generatedCss = new Map(
        generateShades(color.baseOklch, settings.value).map((s) => [s.suffix, oklchToCss(s.oklch)])
      )

      for (const [suffix, oklch] of Object.entries(item.overrides)) {
        if (generatedCss.get(suffix) !== oklchToCss(oklch)) {
          color.overrides[suffix] = oklch
        }
      }

      color.shades = buildShades(color, settings.value)
      return color
    })
    initialized.value = true
  }

  function clearPalette() {
    colors.value = []
    settings.value = { ...DEFAULT_SETTINGS }
    initialized.value = false
  }

  return {
    colors,
    settings,
    initialized,
    initRandom,
    addColor,
    updateBaseColor,
    setShadeOverride,
    clearShadeOverride,
    removeColor,
    addHarmonyColors,
    updateSettings,
    reorderColors,
    importPalette,
    clearPalette
  }
})

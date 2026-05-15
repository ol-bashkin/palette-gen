import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
    reorderColors
  }
})

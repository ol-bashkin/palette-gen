<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PaletteColor } from '@/stores/palette'
import type { OklchColor, Shade } from '@/utils/color'
import { oklchToCss, oklchToHex, generateShades } from '@/utils/color'
import { usePaletteStore } from '@/stores/palette'
import SwatchCard from './SwatchCard.vue'
import ColorPickerModal from './ColorPickerModal.vue'
import { IconTrash, IconEdit } from '@tabler/icons-vue'

const props = defineProps<{
  color: PaletteColor
  isFirst: boolean
  index: number
}>()

const store = usePaletteStore()
const pickerOpen = ref(false)
const activeSuffix = ref<string | null>(null)
const renaming = ref(false)
const nameInput = ref(props.color.name)

const shades = computed(() => {
  return generateShades(props.color.baseOklch, store.settings).map((shade) => {
    const override = props.color.overrides[shade.suffix]
    if (override) {
      return {
        ...shade,
        oklch: override,
        hex: oklchToHex(override),
        css: oklchToCss(override),
        isCustom: true,
        customOklch: override
      }
    }
    return shade
  })
})

const activeShade = computed<Shade | null>(() => {
  if (!activeSuffix.value) return null
  return shades.value.find((s) => s.suffix === activeSuffix.value) ?? null
})

const hasOverride = computed(() => {
  if (!activeSuffix.value) return false
  return !!props.color.overrides[activeSuffix.value]
})

function openSwatch(suffix: string) {
  activeSuffix.value = suffix
  pickerOpen.value = true
}

function openBaseEditor() {
  activeSuffix.value = null
  pickerOpen.value = true
}

function onSetCustom(oklch: OklchColor) {
  if (activeSuffix.value === null) {
    store.updateBaseColor(props.color.id, oklch, nameInput.value)
  } else {
    store.setShadeOverride(props.color.id, activeSuffix.value, oklch)
  }
}

function onClearCustom() {
  if (activeSuffix.value) {
    store.clearShadeOverride(props.color.id, activeSuffix.value)
  }
}

function closePicker() {
  pickerOpen.value = false
  activeSuffix.value = null
}

function startRename() {
  nameInput.value = props.color.name
  renaming.value = true
}

function commitRename() {
  renaming.value = false
  if (nameInput.value.trim()) {
    store.updateBaseColor(props.color.id, props.color.baseOklch, nameInput.value.trim())
  }
}

const headerBg = computed(() => oklchToCss(props.color.baseOklch))
</script>

<template>
  <div class="row-wrap fade-up" :style="{ animationDelay: `${index * 60}ms` }">
    <!-- Row header -->
    <div class="row-header">
      <button
        type="button"
        class="row-color-badge"
        :style="{ background: headerBg }"
        @click="openBaseEditor"
        :aria-label="`Edit base color for ${color.name}`"
      />

      <template v-if="renaming">
        <input
          class="name-input mono"
          v-model="nameInput"
          @keydown.enter="commitRename"
          @blur="commitRename"
          autofocus
          spellcheck="false"
          :aria-label="`Rename color ${color.name}`"
        />
      </template>
      <template v-else>
        <button
          type="button"
          class="row-name"
          @click="startRename"
          :aria-label="`Rename ${color.name}`"
        >
          {{ color.name }}
        </button>
      </template>

      <div class="row-actions">
        <button
          type="button"
          class="row-action-btn"
          @click="openBaseEditor"
          :aria-label="`Edit base color for ${color.name}`"
        >
          <IconEdit :size="14" :stroke-width="1.5" />
        </button>
        <button
          v-if="!isFirst || store.colors.length > 1"
          type="button"
          class="row-action-btn row-action-danger"
          @click="store.removeColor(color.id)"
          :aria-label="`Remove ${color.name} color`"
        >
          <IconTrash :size="14" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Swatches -->
    <div class="swatches-inner">
      <SwatchCard
        v-for="shade in shades"
        :key="shade.suffix"
        :shade="shade"
        :color-name="color.name"
        :is-base="false"
        @click="openSwatch(shade.suffix)"
      />
    </div>
  </div>

  <!-- Color picker modal -->
  <ColorPickerModal
    v-if="pickerOpen"
    :model-value="activeSuffix && activeShade ? activeShade.oklch : color.baseOklch"
    :shade-name="activeSuffix ? `${color.name}-${activeSuffix}` : color.name"
    :is-base="activeSuffix === null"
    :has-override="hasOverride"
    @set-custom="onSetCustom"
    @clear-custom="onClearCustom"
    @close="closePicker"
  />
</template>

<style scoped>
.row-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
}

.row-color-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  padding: 0;
  transition: transform 0.18s var(--ease-spring);
  outline: none;
}

.row-color-badge:hover {
  transform: scale(1.18);
}

.row-color-badge:focus-visible {
  box-shadow:
    0 0 0 2px var(--bg),
    0 0 0 4px var(--focus-ring);
}

.row-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.01em;
  background: none;
  border: none;
  cursor: text;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.12s ease;
}

.row-name:hover {
  background: var(--surface-raised);
}

.name-input {
  background: var(--surface-raised);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 13px;
  color: var(--text);
  height: 26px;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.row-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;
}

.row-action-btn:hover {
  background: var(--surface-raised);
  border-color: var(--border);
  color: var(--text);
}

.row-action-danger:hover {
  color: var(--danger);
  background: var(--danger-dim);
  border-color: var(--danger-border);
}

.swatches-inner {
  background: var(--surface-raised);
  border-radius: var(--radius-lg);
  padding: 10px;
  display: flex;
  gap: 4px;
  overflow-x: auto;
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 3px var(--border),
    inset 0 1px 1px rgba(255, 255, 255, 0.03);
}

@media (max-width: 768px) {
  .swatches-inner {
    padding: 4px;
    gap: 3px;
  }

  .swatches-inner :deep(.swatch) {
    min-width: 46px;
    height: 100px;
  }
}
</style>

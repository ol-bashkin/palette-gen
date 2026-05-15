<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePaletteStore } from '@/stores/palette'
import {
  parseToOklch,
  oklchToCss,
  oklchToHex,
  getHarmonyColors,
  HARMONY_LABELS,
  type OklchColor,
  type HarmonyType
} from '@/utils/color'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { IconX } from '@tabler/icons-vue'
import ColorModelInput from '@/components/ColorModelInput.vue'

const store = usePaletteStore()
const emit = defineEmits<{ close: [] }>()

const paletteColor = ref<OklchColor | null>(parseToOklch('#3b7fd4'))
const colorName = ref('color')
const mode = ref<'manual' | 'harmony'>('manual')

const previewBg = computed(() =>
  paletteColor.value ? oklchToCss(paletteColor.value) : 'var(--surface-raised)'
)

const harmonyBase = computed(() => store.colors[0]?.baseOklch)
const harmonyType = ref<HarmonyType>('complementary')

const harmonyPreviews = computed(() => {
  if (!harmonyBase.value) return []
  return getHarmonyColors(harmonyBase.value, harmonyType.value).map((oklch, i) => ({
    oklch,
    hex: oklchToHex(oklch),
    css: oklchToCss(oklch),
    name: `${store.colors[0]?.name ?? 'color'}-${harmonyType.value.split('-')[0]}-${i + 1}`
  }))
})

function addManual() {
  if (!paletteColor.value || !colorName.value.trim()) return
  store.addColor(colorName.value.trim(), paletteColor.value)
  emit('close')
}

function addHarmony() {
  if (!harmonyBase.value) return
  store.addHarmonyColors(store.colors[0].id, harmonyType.value)
  emit('close')
}

const colorInputRef = ref<{ focus: () => void } | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

useFocusTrap(dialogRef)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  colorInputRef.value?.focus()
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click="onBackdrop">
      <div
        ref="dialogRef"
        class="modal-inner"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-color-title"
        @click.stop
      >
        <div class="modal-header">
          <span id="add-color-title" class="modal-title">Add color</span>
          <button type="button" class="btn-icon" aria-label="Close dialog" @click="emit('close')">
            <IconX :size="16" :stroke-width="1.5" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'manual'"
            :class="['tab', { active: mode === 'manual' }]"
            @click="mode = 'manual'"
          >
            Manual
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'harmony'"
            :class="['tab', { active: mode === 'harmony' }]"
            :disabled="!harmonyBase"
            @click="mode = 'harmony'"
          >
            Harmony
          </button>
        </div>

        <!-- Manual mode -->
        <template v-if="mode === 'manual'">
          <div class="preview-inner" :style="{ background: previewBg }" />

          <ColorModelInput ref="colorInputRef" v-model="paletteColor" :show-randomize="true" />

          <div class="field">
            <label class="field-label">Name</label>
            <input
              class="text-input mono"
              v-model="colorName"
              placeholder="color"
              spellcheck="false"
            />
          </div>

          <button
            type="button"
            class="btn-primary"
            :disabled="!paletteColor || !colorName.trim()"
            @click="addManual"
          >
            Add to palette
          </button>
        </template>

        <!-- Harmony mode -->
        <template v-else>
          <div class="harmony-types">
            <button
              v-for="(label, key) in HARMONY_LABELS"
              :key="key"
              type="button"
              :class="['harmony-type', { active: harmonyType === key }]"
              @click="harmonyType = key as HarmonyType"
            >
              {{ label }}
            </button>
          </div>

          <div class="harmony-previews">
            <div v-for="p in harmonyPreviews" :key="p.name" class="harmony-preview-item">
              <div class="harmony-swatch" :style="{ background: p.css }" />
              <span class="harmony-name mono">{{ p.name }}</span>
              <span class="harmony-hex mono">{{ p.hex }}</span>
            </div>
          </div>

          <button
            type="button"
            class="btn-primary"
            :disabled="harmonyPreviews.length === 0"
            @click="addHarmony"
          >
            Add {{ harmonyPreviews.length }} color{{ harmonyPreviews.length !== 1 ? 's' : '' }}
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.15s ease both;
}

.modal-inner {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: min(400px, calc(100vw - 32px));
  animation: scaleIn 0.25s var(--ease-spring) both;
  box-shadow:
    0 0 0 2px var(--surface-raised),
    0 0 0 3px var(--border),
    0 32px 80px rgba(0, 0, 0, 0.6),
    0 0 0 4px rgba(255, 255, 255, 0.04);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.btn-icon:hover {
  background: var(--surface-high);
  color: var(--text);
}

.tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-raised);
  border-radius: var(--radius-sm);
  padding: 3px;
}

.tab {
  flex: 1;
  padding: 6px 12px;
  border-radius: calc(var(--radius-sm) - 3px);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.tab.active {
  background: var(--surface-high);
  color: var(--text);
}

.tab:hover:not(.active):not(:disabled) {
  background: var(--surface-high);
  color: var(--text);
}

.tab:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.preview-inner {
  height: 72px;
  border-radius: var(--radius-md);
  transition: background 0.1s ease;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.03),
    0 0 0 3px var(--border),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.03em;
}

.text-input {
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  font-size: 12px;
  color: var(--text);
  width: 100%;
  transition: border-color 0.15s ease;
}

.text-input:focus {
  border-color: var(--border-strong);
}

.harmony-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.harmony-type {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--border);
  color: var(--text-muted);
  background: none;
  transition: all 0.12s ease;
}

.harmony-type.active {
  background: var(--accent-dim);
  border-color: rgba(255, 107, 61, 0.35);
  color: var(--accent);
}

.harmony-type:hover:not(.active) {
  border-color: var(--border-strong);
  color: var(--text);
}

.harmony-previews {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.harmony-preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.harmony-swatch {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.harmony-name {
  font-size: 12px;
  color: var(--text);
  flex: 1;
}

.harmony-hex {
  font-size: 11px;
  color: var(--text-muted);
}

.btn-primary {
  width: 100%;
  padding: 10px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  transition:
    opacity 0.15s ease,
    transform 0.15s var(--ease-spring);
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>

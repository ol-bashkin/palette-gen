<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { OklchColor } from '@/utils/color'
import { oklchToHex, oklchToCss, buildHGradient } from '@/utils/color'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { IconX, IconRefresh } from '@tabler/icons-vue'
import ColorModelInput from '@/components/ColorModelInput.vue'

const props = defineProps<{
  modelValue: OklchColor
  shadeName: string
  isBase?: boolean
  hasOverride?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [OklchColor]
  'set-custom': [OklchColor]
  'clear-custom': []
  close: []
}>()

const local = ref<OklchColor>({ ...props.modelValue })
const isDirty = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    local.value = { ...v }
    isDirty.value = false
  }
)

const previewBg = computed(() => oklchToCss(local.value))
const previewHex = computed(() => oklchToHex(local.value))

const lPercent = computed({
  get: () => Math.round(local.value.l * 1000) / 10,
  set: (v: number) => {
    local.value = { ...local.value, l: v / 100 }
    isDirty.value = true
  }
})

const cVal = computed({
  get: () => Math.round(local.value.c * 10000) / 10000,
  set: (v: number) => {
    local.value = { ...local.value, c: v }
    isDirty.value = true
  }
})

const hVal = computed({
  get: () => Math.round((local.value.h ?? 0) * 100) / 100,
  set: (v: number) => {
    local.value = { ...local.value, h: v }
    isDirty.value = true
  }
})

function onColorFromText(oklch: OklchColor | null) {
  if (oklch) {
    local.value = oklch
    isDirty.value = true
  }
}

function apply() {
  if (isDirty.value) {
    emit('set-custom', { ...local.value })
  }
  emit('close')
}

function clearCustom() {
  isDirty.value = false
  emit('clear-custom')
  emit('close')
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    apply()
  }
}

const colorInputRef = ref<{ focus: () => void; select: () => void } | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

useFocusTrap(dialogRef)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') apply()
}

onMounted(() => {
  colorInputRef.value?.focus()
  colorInputRef.value?.select()
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const lGradient = computed(
  () =>
    `linear-gradient(to right, oklch(0% ${local.value.c.toFixed(3)} ${(local.value.h ?? 0).toFixed(1)}), oklch(100% ${local.value.c.toFixed(3)} ${(local.value.h ?? 0).toFixed(1)}))`
)
const cGradient = computed(
  () =>
    `linear-gradient(to right, oklch(${(local.value.l * 100).toFixed(1)}% 0 ${(local.value.h ?? 0).toFixed(1)}), oklch(${(local.value.l * 100).toFixed(1)}% 0.4 ${(local.value.h ?? 0).toFixed(1)}))`
)
const hGradient = computed(() => buildHGradient(local.value.l, local.value.c))
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click="onBackdropClick">
      <div
        ref="dialogRef"
        class="modal-inner"
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        @click.stop
      >
        <!-- Header -->
        <div class="modal-header">
          <span id="picker-title" class="modal-title">
            <span class="mono">{{ shadeName }}</span>
          </span>
          <button type="button" class="btn-icon" aria-label="Close color picker" @click="apply">
            <IconX :size="16" :stroke-width="1.5" />
          </button>
        </div>

        <!-- Preview -->
        <div class="preview-inner" :style="{ background: previewBg }">
          <span class="preview-hex mono">{{ previewHex }}</span>
        </div>

        <!-- Sliders -->
        <div class="sliders">
          <div class="slider-row">
            <span class="slider-label mono" aria-hidden="true">L</span>
            <div class="slider-track-wrap">
              <input
                type="range"
                :style="{ '--track-bg': lGradient }"
                min="0"
                max="100"
                step="0.5"
                :value="lPercent"
                aria-label="Lightness"
                @input="lPercent = +($event.target as HTMLInputElement).value"
              />
            </div>
            <span class="slider-value mono" aria-hidden="true">{{ lPercent.toFixed(1) }}%</span>
          </div>

          <div class="slider-row">
            <span class="slider-label mono" aria-hidden="true">C</span>
            <div class="slider-track-wrap">
              <input
                type="range"
                :style="{ '--track-bg': cGradient }"
                min="0"
                max="0.4"
                step="0.001"
                :value="cVal"
                aria-label="Chroma"
                @input="cVal = +($event.target as HTMLInputElement).value"
              />
            </div>
            <span class="slider-value mono" aria-hidden="true">{{ cVal.toFixed(3) }}</span>
          </div>

          <div class="slider-row">
            <span class="slider-label mono" aria-hidden="true">H</span>
            <div class="slider-track-wrap">
              <input
                type="range"
                :style="{ '--track-bg': hGradient }"
                min="0"
                max="360"
                step="0.5"
                :value="hVal"
                aria-label="Hue"
                @input="hVal = +($event.target as HTMLInputElement).value"
              />
            </div>
            <span class="slider-value mono" aria-hidden="true">{{ hVal.toFixed(1) }}°</span>
          </div>
        </div>

        <!-- Color input -->
        <ColorModelInput
          ref="colorInputRef"
          :model-value="local"
          @update:model-value="onColorFromText"
        />

        <!-- Footer -->
        <div class="modal-footer">
          <button
            v-if="!isBase && hasOverride"
            type="button"
            class="btn-ghost"
            @click="clearCustom"
          >
            <IconRefresh :size="14" :stroke-width="1.5" />
            Reset to auto
          </button>
          <span v-else class="footer-space" />
          <button type="button" class="btn-apply" @click="apply">Apply</button>
        </div>
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
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  animation: scaleIn 0.25s var(--ease-spring) both;
  box-shadow:
    0 0 0 2px var(--surface-raised),
    0 0 0 3px var(--border),
    0 32px 80px rgba(0, 0, 0, 0.6),
    0 0 0 4px rgba(255, 255, 255, 0.04);
}

@media (max-width: 480px) {
  .modal-backdrop {
    align-items: flex-end;
  }
  .modal-inner {
    width: 100%;
    max-height: 90dvh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 13px;
  font-weight: 500;
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

.preview-inner {
  height: 90px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: flex-end;
  padding: 10px 12px;
  box-shadow:
    0 0 0 2px rgba(255, 255, 255, 0.04),
    0 0 0 3px var(--border),
    inset 0 1px 1px rgba(255, 255, 255, 0.12);
  transition: background 0.08s ease;
}

.preview-hex {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  mix-blend-mode: difference;
  filter: invert(1);
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-row {
  display: grid;
  grid-template-columns: 16px 1fr 52px;
  align-items: center;
  gap: 10px;
}

.slider-label {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.slider-track-wrap {
  position: relative;
}

.slider-track-wrap input[type='range'] {
  height: 6px;
  border-radius: 3px;
}

.slider-track-wrap input[type='range']::-webkit-slider-runnable-track {
  background: var(--track-bg, var(--surface-raised));
  height: 6px;
  border-radius: 3px;
  border: 0.5px solid rgba(255, 255, 255, 0.08);
}

.slider-track-wrap input[type='range']::-moz-range-track {
  background: var(--track-bg, var(--surface-raised));
  height: 6px;
  border-radius: 3px;
}

.slider-value {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
}

.footer-space {
  flex: 1;
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: none;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.btn-ghost:hover {
  color: var(--text);
  border-color: var(--border-strong);
  background: var(--surface-raised);
}

.btn-apply {
  padding: 7px 20px;
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

.btn-apply:hover {
  opacity: 0.88;
}

.btn-apply:active {
  transform: scale(0.97);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>

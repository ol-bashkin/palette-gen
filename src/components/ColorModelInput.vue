<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  formatForModel,
  parseForModel,
  randomOklch,
  type OklchColor,
  type ColorModel
} from '@/utils/color'
import { IconRefresh } from '@tabler/icons-vue'

const props = defineProps<{
  modelValue: OklchColor | null
  showRandomize?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [OklchColor | null] }>()

const COLOR_MODELS: { value: ColorModel; label: string }[] = [
  { value: 'hex', label: 'HEX' },
  { value: 'rgb', label: 'RGB' },
  { value: 'hsl', label: 'HSL' },
  { value: 'hsb', label: 'HSB' },
  { value: 'css', label: 'CSS' }
]

const MODEL_PLACEHOLDERS: Record<ColorModel, string> = {
  hex: '#rrggbb',
  rgb: 'rgb(255, 128, 0)',
  hsl: 'hsl(240, 50%, 50%)',
  hsb: 'hsb(240, 50%, 50%)',
  css: 'oklch(50% 0.15 240)'
}

const colorModel = ref<ColorModel>('hex')
const colorInput = ref(props.modelValue ? formatForModel(props.modelValue, 'hex') : '')
const inputError = ref(false)
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.modelValue,
  (newVal) => {
    if (!isFocused.value) {
      colorInput.value = newVal ? formatForModel(newVal, colorModel.value) : ''
      inputError.value = false
    }
  }
)

function switchModel(model: ColorModel) {
  const current = props.modelValue
  colorModel.value = model
  if (current) {
    colorInput.value = formatForModel(current, model)
    inputError.value = false
  }
}

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  colorInput.value = v
  const parsed = parseForModel(v, colorModel.value)
  inputError.value = !parsed
  emit('update:modelValue', parsed)
}

function randomize() {
  const c = randomOklch()
  colorInput.value = formatForModel(c, colorModel.value)
  inputError.value = false
  emit('update:modelValue', c)
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  select: () => inputRef.value?.select()
})
</script>

<template>
  <div class="color-model-input">
    <div class="model-selector" role="group" aria-label="Color model">
      <button
        v-for="m in COLOR_MODELS"
        :key="m.value"
        type="button"
        :class="['model-btn', { active: colorModel === m.value }]"
        @click="switchModel(m.value)"
      >
        {{ m.label }}
      </button>
    </div>
    <div class="input-wrap">
      <input
        ref="inputRef"
        class="text-input mono"
        :class="{ error: inputError }"
        :value="colorInput"
        :placeholder="MODEL_PLACEHOLDERS[colorModel]"
        spellcheck="false"
        aria-label="Color value"
        @input="onInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
      <button
        v-if="showRandomize"
        type="button"
        class="randomize-btn"
        aria-label="Randomize color"
        @click="randomize"
      >
        <IconRefresh :size="13" :stroke-width="1.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.color-model-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.model-selector {
  display: flex;
  gap: 4px;
}

.model-btn {
  flex: 1;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: var(--surface-raised);
  border: 1px solid transparent;
  transition:
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}

.model-btn:hover:not(.active) {
  background: var(--surface-high);
  color: var(--text);
}

.model-btn.active {
  background: var(--surface-high);
  border-color: var(--border-strong);
  color: var(--text);
}

.input-wrap {
  position: relative;
  display: flex;
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

.text-input.error {
  border-color: var(--danger-border);
}

.randomize-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 5px;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.randomize-btn:hover {
  background: var(--surface-high);
  color: var(--text);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>

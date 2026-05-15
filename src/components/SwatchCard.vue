<script setup lang="ts">
import { computed } from 'vue'
import type { Shade } from '@/utils/color'
import { contrastColor } from '@/utils/color'

const props = defineProps<{
  shade: Shade
  colorName: string
  isBase?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const labelColor = computed(() => contrastColor(props.shade.hex))
const fullName = computed(() => `${props.colorName}-${props.shade.suffix}`)
</script>

<template>
  <button
    type="button"
    class="swatch"
    :aria-label="`Edit ${fullName} — ${shade.hex}${shade.isCustom ? ' (custom)' : ''}`"
    @click="emit('click')"
  >
    <div class="swatch-inner" :style="{ background: shade.css }">
      <div class="swatch-custom" v-if="shade.isCustom" :style="{ color: labelColor }" />
      <div class="swatch-label" :style="{ color: labelColor }">
        <span class="swatch-name" aria-hidden="true">{{ shade.suffix }}</span>
        <span class="swatch-hex" aria-hidden="true">{{ shade.hex }}</span>
      </div>
    </div>
  </button>
</template>

<style scoped>
.swatch {
  position: relative;
  flex: 1 1 0;
  min-width: 54px;
  height: 130px;
  border: none;
  background: none;
  padding: 2px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    transform 0.2s var(--ease-spring),
    box-shadow 0.2s var(--ease-spring);
  outline: none;
}

.swatch:hover {
  transform: translateY(-3px) scale(1.02);
  z-index: 2;
}

.swatch:focus-visible .swatch-inner {
  box-shadow:
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.08),
    0 0 0 2px var(--focus-ring);
}

.swatch:focus-visible {
  z-index: 2;
}

.swatch:hover .swatch-hex,
.swatch:focus-visible .swatch-hex {
  opacity: 1;
}

.swatch-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: calc(var(--radius-sm) - 2px);
  overflow: hidden;
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.08);
  transition: box-shadow 0.15s ease;
}

.swatch-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 7px 7px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.18), transparent);
}

.swatch-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
}

.swatch-hex {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
  font-weight: 400;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.swatch-custom {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}
</style>

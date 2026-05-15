<script setup lang="ts">
import { computed } from 'vue'
import { usePaletteStore } from '@/stores/palette'

const store = usePaletteStore()

const maxCount = computed(() => {
  const { minL, maxL, stepSize } = store.settings
  return Math.floor((maxL - minL) / stepSize)
})
</script>

<template>
  <div class="settings-panel">
    <span class="settings-title">Scale settings</span>

    <div class="settings-row">
      <label class="settings-label" for="set-min-l">Min L</label>
      <input
        id="set-min-l"
        type="number"
        class="settings-num mono"
        :value="store.settings.minL"
        @change="
          store.updateSettings({
            minL: Math.max(0, Math.min(50, +($event.target as HTMLInputElement).value))
          })
        "
        min="0"
        max="50"
        step="5"
      />
    </div>

    <div class="settings-row">
      <label class="settings-label" for="set-max-l">Max L</label>
      <input
        id="set-max-l"
        type="number"
        class="settings-num mono"
        :value="store.settings.maxL"
        @change="
          store.updateSettings({
            maxL: Math.max(50, Math.min(100, +($event.target as HTMLInputElement).value))
          })
        "
        min="50"
        max="100"
        step="5"
      />
    </div>

    <div class="settings-row">
      <label class="settings-label" for="set-step">Step</label>
      <input
        id="set-step"
        type="number"
        class="settings-num mono"
        :value="store.settings.stepSize"
        @change="
          store.updateSettings({
            stepSize: Math.max(1, Math.min(20, +($event.target as HTMLInputElement).value))
          })
        "
        min="1"
        max="20"
        step="1"
      />
    </div>

    <div class="settings-row">
      <label class="settings-label" for="set-count">Count</label>
      <input
        id="set-count"
        type="number"
        class="settings-num mono"
        :value="store.settings.count"
        @change="
          store.updateSettings({
            count: Math.max(1, Math.min(maxCount, +($event.target as HTMLInputElement).value))
          })
        "
        min="1"
        :max="maxCount"
        step="1"
      />
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 40px;
}

.settings-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.settings-label {
  font-size: 11px;
  color: var(--text-subtle);
  white-space: nowrap;
}

.settings-num {
  width: 48px;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 11px;
  color: var(--text);
  text-align: center;
}

.settings-num:focus-visible {
  border-color: var(--border-strong);
  outline: 2px solid var(--focus-ring);
  outline-offset: 1px;
}

.settings-info {
  font-size: 10px;
  color: var(--text-subtle);
  white-space: nowrap;
  padding-left: 4px;
  border-left: 1px solid var(--border);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}

@media (max-width: 600px) {
  .settings-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-radius: var(--radius-lg);
    padding: 12px 14px;
    gap: 8px 16px;
    width: 100%;
  }

  .settings-title {
    grid-column: 1 / -1;
    padding-bottom: 8px;
    margin-bottom: 2px;
    border-bottom: 1px solid var(--border);
  }

  .settings-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .settings-num {
    width: 100%;
    text-align: left;
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePaletteStore } from '@/stores/palette'
import { exportCssVariables, exportFigmaTokens, downloadText } from '@/utils/export'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { IconX, IconCopy, IconDownload, IconCheck } from '@tabler/icons-vue'

const store = usePaletteStore()
const emit = defineEmits<{ close: [] }>()

const tab = ref<'css' | 'figma'>('css')
const copied = ref(false)
const copyFailed = ref(false)
const dialogRef = ref<HTMLElement | null>(null)

useFocusTrap(dialogRef)

const cssOutput = computed(() => exportCssVariables(store.colors))
const figmaOutput = computed(() => exportFigmaTokens(store.colors))
const activeOutput = computed(() => (tab.value === 'css' ? cssOutput.value : figmaOutput.value))

async function copy() {
  try {
    await navigator.clipboard.writeText(activeOutput.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch (err) {
    console.error('Clipboard write failed:', err)
    copyFailed.value = true
    setTimeout(() => { copyFailed.value = false }, 2000)
  }
}

function download() {
  if (tab.value === 'css') {
    downloadText(cssOutput.value, 'palette.css', 'text/css')
  } else {
    downloadText(figmaOutput.value, 'palette.tokens.json', 'application/json')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
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
        aria-labelledby="export-title"
        @click.stop
      >
        <div class="modal-header">
          <span id="export-title" class="modal-title">Export palette</span>
          <button type="button" class="btn-icon" @click="emit('close')" aria-label="Close dialog">
            <IconX :size="16" :stroke-width="1.5" />
          </button>
        </div>

        <div class="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'css'"
            :class="['tab', { active: tab === 'css' }]"
            @click="tab = 'css'"
          >
            CSS Variables
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'figma'"
            :class="['tab', { active: tab === 'figma' }]"
            @click="tab = 'figma'"
          >
            Figma Tokens
          </button>
        </div>

        <pre class="code-inner mono">{{ activeOutput }}</pre>

        <div class="export-actions">
          <button
            type="button"
            :class="['btn-ghost', { 'btn-ghost-error': copyFailed }]"
            @click="copy"
            aria-label="Copy to clipboard"
          >
            <component :is="copied ? IconCheck : IconCopy" :size="14" :stroke-width="1.5" />
            <span aria-live="polite">{{ copied ? 'Copied!' : copyFailed ? 'Failed' : 'Copy' }}</span>
          </button>
          <button type="button" class="btn-primary" @click="download">
            <IconDownload :size="14" :stroke-width="1.5" />
            Download
          </button>
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
  width: min(560px, calc(100vw - 32px));
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

.code-inner {
  background: rgba(0, 0, 0, 0.35);
  border-radius: var(--radius-md);
  padding: 14px;
  font-size: 11px;
  color: var(--text-muted);
  max-height: 320px;
  overflow-y: auto;
  white-space: pre;
  line-height: 1.65;
  box-shadow:
    0 0 0 2px var(--surface-raised),
    0 0 0 3px var(--border);
}

.export-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 7px 14px;
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

.btn-ghost-error {
  color: var(--danger);
  border-color: var(--danger-border);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
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
  transform: scale(0.97);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>

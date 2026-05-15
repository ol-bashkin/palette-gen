<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePaletteStore } from '@/stores/palette'
import { importCssVariables, importFigmaTokens } from '@/utils/import'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { IconX, IconDownload, IconClipboard } from '@tabler/icons-vue'

const store = usePaletteStore()
const emit = defineEmits<{ close: [] }>()

type Tab = 'css' | 'figma'
const tab = ref<Tab>('css')
const cssText = ref('')
const figmaText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const dialogRef = ref<HTMLElement | null>(null)

useFocusTrap(dialogRef)

const CSS_PLACEHOLDER = `:root {
  /* paste exported CSS variables */
  --color-brand-050: oklch(5.00% 0.1500 25.00);
  --color-brand-base: oklch(55.00% 0.1500 25.00);
  --color-brand-850: oklch(85.00% 0.1500 25.00);
}`

const FIGMA_PLACEHOLDER = `{
  "color": {
    "brand": {
      "base": {
        "$type": "color",
        "$value": "#...",
        "$extensions": {
          "palette-gen": { "oklch": "oklch(...)" }
        }
      }
    }
  }
}`

const activeText = computed({
  get: () => (tab.value === 'css' ? cssText.value : figmaText.value),
  set: (v: string) => {
    if (tab.value === 'css') cssText.value = v
    else figmaText.value = v
  }
})

const placeholder = computed(() => (tab.value === 'css' ? CSS_PLACEHOLDER : FIGMA_PLACEHOLDER))
const fileAccept = computed(() => (tab.value === 'css' ? '.css' : '.json'))

const parseResult = computed(() => {
  const text = activeText.value.trim()
  if (!text) return null
  return tab.value === 'css' ? importCssVariables(text) : importFigmaTokens(text)
})

const status = computed(() => {
  if (!parseResult.value) return null
  if (parseResult.value.error) return { ok: false, text: parseResult.value.error }
  const { colors } = parseResult.value
  const names = colors.map((c) => c.name).join(', ')
  return {
    ok: true,
    text: `Found ${colors.length} color${colors.length !== 1 ? 's' : ''}: ${names}`
  }
})

const replaceWarning = computed(
  () => store.colors.length > 0 && parseResult.value && parseResult.value.colors.length > 0
)

function onInput(e: Event) {
  activeText.value = (e.target as HTMLTextAreaElement).value
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    activeText.value = text
  } catch {
    // clipboard access denied — user must paste manually
  }
}

function chooseFile() {
  fileInputRef.value?.click()
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    activeText.value = (ev.target?.result as string) ?? ''
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

function doImport() {
  if (!parseResult.value || parseResult.value.colors.length === 0) return
  store.importPalette(parseResult.value.colors)
  emit('close')
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
        aria-labelledby="import-title"
        @click.stop
      >
        <div class="modal-header">
          <span id="import-title" class="modal-title">Import palette</span>
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

        <textarea
          class="code-inner mono"
          :value="activeText"
          :placeholder="placeholder"
          spellcheck="false"
          aria-label="Paste palette code here"
          @input="onInput"
        />

        <div v-if="status" :class="['status', status.ok ? 'status-ok' : 'status-err']">
          {{ status.text }}
        </div>

        <div v-if="replaceWarning" class="replace-warning">
          This will replace your current palette ({{ store.colors.length }}
          color{{ store.colors.length !== 1 ? 's' : '' }})
        </div>

        <div class="import-actions">
          <div class="import-actions-left">
            <button type="button" class="btn-ghost" @click="chooseFile">
              <IconDownload :size="14" :stroke-width="1.5" />
              Choose file
            </button>
            <button type="button" class="btn-ghost" @click="pasteFromClipboard">
              <IconClipboard :size="14" :stroke-width="1.5" />
              Paste
            </button>
          </div>
          <button
            type="button"
            class="btn-primary"
            :disabled="!parseResult || parseResult.colors.length === 0"
            @click="doImport"
          >
            Import
            <span v-if="parseResult && parseResult.colors.length > 0">
              {{ parseResult.colors.length }}
            </span>
          </button>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          :accept="fileAccept"
          class="file-input-hidden"
          @change="onFileChange"
          aria-hidden="true"
          tabindex="-1"
        />
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

.tab:hover:not(.active) {
  background: var(--surface-high);
  color: var(--text);
}

.code-inner {
  background: rgba(0, 0, 0, 0.35);
  border-radius: var(--radius-md);
  padding: 14px;
  font-size: 11px;
  color: var(--text-muted);
  height: min(220px, 38vh);
  overflow-y: auto;
  white-space: pre;
  line-height: 1.65;
  box-shadow:
    0 0 0 2px var(--surface-raised),
    0 0 0 3px var(--border);
  resize: none;
  border: none;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: box-shadow 0.15s ease;
}

.code-inner::placeholder {
  color: var(--text-subtle);
  opacity: 0.5;
}

.code-inner:focus {
  box-shadow:
    0 0 0 2px var(--surface-raised),
    0 0 0 3px var(--border-strong);
}

.status {
  font-size: 11px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  line-height: 1.4;
}

.status-ok {
  color: #6ee46e;
  background: rgba(110, 228, 110, 0.08);
  border: 1px solid rgba(110, 228, 110, 0.18);
}

.status-err {
  color: var(--danger);
  background: rgba(255, 80, 80, 0.08);
  border: 1px solid var(--danger-border);
}

.replace-warning {
  font-size: 11px;
  color: var(--text-subtle);
  margin-top: -8px;
}

.import-actions {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
}

.import-actions-left {
  display: flex;
  gap: 6px;
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

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.97);
}

.btn-primary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-primary span {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11px;
}

.file-input-hidden {
  display: none;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>

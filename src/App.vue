<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { usePaletteStore } from '@/stores/palette'
import { randomOklch, oklchToCss, oklchToHex, type OklchColor } from '@/utils/color'
import PaletteRow from '@/components/PaletteRow.vue'
import AddColorModal from '@/components/AddColorModal.vue'
import ExportModal from '@/components/ExportModal.vue'
import ImportModal from '@/components/ImportModal.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import ColorModelInput from '@/components/ColorModelInput.vue'
import { IconPlus, IconUpload, IconDownload, IconSettings } from '@tabler/icons-vue'

const store = usePaletteStore()

const showAddModal = ref(false)
const showExport = ref(false)
const showImport = ref(false)
const showSettings = ref(false)

const addModalTrigger = ref<HTMLElement | null>(null)
const exportTrigger = ref<HTMLElement | null>(null)
const importTrigger = ref<HTMLElement | null>(null)
const colorModelInputRef = ref<{ focus: () => void } | null>(null)

function openAddModal() {
  addModalTrigger.value = document.activeElement as HTMLElement
  showAddModal.value = true
}

function closeAddModal() {
  showAddModal.value = false
  nextTick(() => addModalTrigger.value?.focus())
}

function openExport() {
  exportTrigger.value = document.activeElement as HTMLElement
  showExport.value = true
}

function closeExport() {
  showExport.value = false
  nextTick(() => exportTrigger.value?.focus())
}

function openImport() {
  importTrigger.value = document.activeElement as HTMLElement
  showImport.value = true
}

function closeImport() {
  showImport.value = false
  nextTick(() => importTrigger.value?.focus())
}

// Welcome state
const welcomeColor = ref<OklchColor | null>(randomOklch())
const welcomeName = ref('base')
const welcomeBg = computed(() =>
  welcomeColor.value ? oklchToCss(welcomeColor.value) : 'var(--surface-raised)'
)

function startPalette() {
  if (!welcomeColor.value) return
  const name = welcomeName.value.trim() || 'base'
  store.addColor(name, welcomeColor.value)
  store.initialized = true
}

onMounted(() => {
  if (!store.initialized) {
    colorModelInputRef.value?.focus()
  }
})

</script>

<template>
  <div class="app">
    <!-- ── NAV ── -->
    <header class="nav-shell">
      <nav class="nav-inner">
        <div class="nav-logo">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 0H4.5C2.01472 0 0 2.01472 0 4.5V13.5C0 15.9853 2.01472 18 4.5 18H13.5C15.9853 18 18 15.9853 18 13.5V4.5C18 2.01472 15.9853 0 13.5 0Z" fill="#0A0A0E"/>
            <path d="M6.1875 2.25H3.9375C3.00552 2.25 2.25 3.00552 2.25 3.9375V14.0625C2.25 14.9945 3.00552 15.75 3.9375 15.75H6.1875C7.11948 15.75 7.875 14.9945 7.875 14.0625V3.9375C7.875 3.00552 7.11948 2.25 6.1875 2.25Z" fill="#FF6B3D"/>
            <path d="M14.0625 2.25H11.8125C10.8805 2.25 10.125 3.00552 10.125 3.9375V8.4375C10.125 9.36948 10.8805 10.125 11.8125 10.125H14.0625C14.9945 10.125 15.75 9.36948 15.75 8.4375V3.9375C15.75 3.00552 14.9945 2.25 14.0625 2.25Z" fill="#3DE8FF"/>
            <path d="M14.0625 12.375H11.8125C10.8805 12.375 10.125 13.1305 10.125 14.0625C10.125 14.9945 10.8805 15.75 11.8125 15.75H14.0625C14.9945 15.75 15.75 14.9945 15.75 14.0625C15.75 13.1305 14.9945 12.375 14.0625 12.375Z" fill="#B8FF3D"/>
          </svg>
          <span class="nav-wordmark">palette<span class="nav-dot">.gen</span></span>
        </div>

        <div class="nav-actions">
          <template v-if="store.initialized">
            <button
              type="button"
              :class="['nav-btn', { active: showSettings }]"
              :aria-pressed="showSettings"
              @click="showSettings = !showSettings"
              aria-label="Toggle scale settings"
            >
              <IconSettings :size="15" :stroke-width="1.5" />
              <span class="nav-btn-label">Settings</span>
            </button>
            <button
              type="button"
              class="nav-btn"
              @click="openImport"
              aria-label="Import palette"
            >
              <IconDownload :size="15" :stroke-width="1.5" />
              <span class="nav-btn-label">Import</span>
            </button>
            <button
              type="button"
              class="nav-btn nav-btn-primary"
              @click="openExport"
              aria-label="Export palette"
            >
              <IconUpload :size="15" :stroke-width="1.5" />
              <span class="nav-btn-label">Export</span>
            </button>
          </template>
          <button
            v-else
            type="button"
            class="nav-btn"
            @click="openImport"
            aria-label="Import palette"
          >
            <IconDownload :size="15" :stroke-width="1.5" />
            <span class="nav-btn-label">Import</span>
          </button>
        </div>
      </nav>
    </header>

    <!-- ── SETTINGS BAR ── -->
    <Transition name="slide-down">
      <div class="settings-bar" v-if="showSettings && store.initialized">
        <SettingsPanel />
      </div>
    </Transition>

    <!-- ── WELCOME SCREEN ── -->
    <Transition name="fade-switch" mode="out-in">
      <main v-if="!store.initialized" class="welcome" key="welcome">
        <div class="welcome-eyebrow fade-up" style="animation-delay: 0ms">
          OKLCH Palette Generator
        </div>

        <div
          class="welcome-preview-inner fade-up"
          style="animation-delay: 60ms"
          :style="{ background: welcomeBg }"
        >
          <div class="welcome-overlay">
            <span class="welcome-hex mono">{{ welcomeColor ? oklchToHex(welcomeColor) : '' }}</span>
          </div>
        </div>

        <div class="welcome-form fade-up" style="animation-delay: 120ms">
          <div class="welcome-field">
            <label class="welcome-label">Base color</label>
            <ColorModelInput ref="colorModelInputRef" v-model="welcomeColor" :show-randomize="true" />
          </div>

          <div class="welcome-field">
            <label class="welcome-label">Color name</label>
            <input
              class="welcome-input mono"
              v-model="welcomeName"
              placeholder="base"
              spellcheck="false"
              maxlength="24"
            />
          </div>

          <button
            type="button"
            class="welcome-start-btn"
            @click="startPalette"
            :disabled="!welcomeColor"
          >
            Generate palette
            <span class="welcome-arrow">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7h8M8 4l3 3-3 3"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        <p class="welcome-hint fade-up" style="animation-delay: 200ms">
          Paste any valid CSS color value to get started
        </p>
      </main>

      <!-- ── EDITOR ── -->
      <main v-else class="editor" key="editor">
        <div class="palette-rows">
          <PaletteRow
            v-for="(color, index) in store.colors"
            :key="color.id"
            :color="color"
            :is-first="index === 0"
            :index="index"
          />
        </div>

        <div class="editor-footer fade-up" style="animation-delay: 100ms">
          <button type="button" class="add-color-btn" @click="openAddModal">
            <IconPlus :size="15" :stroke-width="2" />
            Add color
          </button>
        </div>
      </main>
    </Transition>

    <!-- ── MODALS ── -->
    <AddColorModal v-if="showAddModal" @close="closeAddModal" />
    <ExportModal v-if="showExport" @close="closeExport" />
    <ImportModal v-if="showImport" @close="closeImport" />
  </div>
</template>

<style scoped>
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* Nav */
.nav-shell {
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 14px 20px;
  background: linear-gradient(to bottom, var(--bg) 60%, transparent);
}

.nav-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  user-select: none;
}

.nav-wordmark {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.nav-dot {
  color: var(--text-muted);
  font-weight: 400;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid var(--border);
  background: var(--surface);
  transition: all 0.15s var(--ease-out);
}

.nav-btn:hover {
  color: var(--text);
  border-color: var(--border-strong);
  background: var(--surface-raised);
}

.nav-btn.active {
  color: var(--text);
  border-color: var(--border-strong);
  background: var(--surface-raised);
}

.nav-btn-primary {
  background: var(--accent-dim);
  border-color: rgba(255, 107, 61, 0.25);
  color: var(--accent);
}

.nav-btn-primary:hover {
  background: rgba(255, 107, 61, 0.2);
  border-color: rgba(255, 107, 61, 0.4);
  color: var(--accent);
}

.nav-btn-label {
  display: none;
}

@media (min-width: 500px) {
  .nav-btn-label {
    display: inline;
  }
}

/* Settings bar */
.settings-bar {
  padding: 0 20px 16px;
  display: flex;
  justify-content: center;
  overflow-x: auto;
}

@media (max-width: 600px) {
  .settings-bar {
    overflow-x: hidden;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s var(--ease-spring);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Welcome */
.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 80px;
  gap: 28px;
}

.welcome-eyebrow {
  padding: 5px 14px;
  border-radius: 40px;
  border: 1px solid var(--border);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--surface);
}

.welcome-preview-inner {
  width: min(420px, 100%);
  height: 200px;
  border-radius: var(--radius-xl);
  position: relative;
  transition: background 0.15s ease;
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 3px var(--border),
    0 20px 60px rgba(0, 0, 0, 0.4),
    inset 0 1px 1px rgba(255, 255, 255, 0.12);
}

.welcome-overlay {
  position: absolute;
  bottom: 14px;
  left: 16px;
}

.welcome-hex {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  mix-blend-mode: difference;
  filter: invert(1);
}

.welcome-form {
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.welcome-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.welcome-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.welcome-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--text);
  width: 100%;
  transition: border-color 0.15s ease;
}

.welcome-input:focus {
  border-color: var(--border-strong);
}

.welcome-start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 13px 24px;
  margin-top: 4px;
  border-radius: var(--radius-md);
  background: var(--text);
  color: var(--bg);
  font-size: 14px;
  font-weight: 700;
  border: none;
  letter-spacing: -0.01em;
  transition:
    opacity 0.15s ease,
    transform 0.2s var(--ease-spring);
}

.welcome-start-btn:hover {
  opacity: 0.88;
}

.welcome-start-btn:active {
  transform: scale(0.97);
}

.welcome-start-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.welcome-arrow {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s var(--ease-spring);
}

.welcome-start-btn:hover .welcome-arrow {
  transform: translateX(3px);
}

.welcome-hint {
  font-size: 11px;
  color: var(--text-subtle);
  text-align: center;
}

/* Editor */
.editor {
  flex: 1;
  padding: 8px 20px 60px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.palette-rows {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.editor-footer {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.add-color-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 40px;
  border: 1.5px dashed var(--border-strong);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  background: none;
  transition: all 0.2s var(--ease-out);
}

.add-color-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-dim);
}

.add-color-btn:active {
  transform: scale(0.97);
}

/* Transitions */
.fade-switch-enter-active,
.fade-switch-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s var(--ease-spring);
}

.fade-switch-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-switch-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mono {
  font-family: 'JetBrains Mono', monospace;
}
</style>

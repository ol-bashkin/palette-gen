import { onMounted, onBeforeUnmount, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[href]'
].join(', ')

export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !containerRef.value) return

    const focusable = Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null)

    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement

    if (e.shiftKey) {
      if (active === first || !containerRef.value.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last || !containerRef.value.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}

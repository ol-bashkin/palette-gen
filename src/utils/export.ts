import type { PaletteColor } from '@/stores/palette'
import { oklchToCss, oklchToHex } from './color'

export function exportCssVariables(colors: PaletteColor[], prefix = 'color'): string {
  const lines: string[] = [':root {']
  for (const color of colors) {
    lines.push(`  /* ${color.name} */`)
    for (const shade of color.shades) {
      lines.push(`  --${prefix}-${color.name}-${shade.suffix}: ${oklchToCss(shade.oklch)};`)
    }
    lines.push('')
  }
  lines.push('}')
  return lines.join('\n')
}

export function exportFigmaTokens(colors: PaletteColor[]): string {
  const tokens: Record<string, unknown> = {}

  for (const color of colors) {
    tokens[color.name] = {}
    for (const shade of color.shades) {
      ;(tokens[color.name] as Record<string, unknown>)[shade.suffix] = {
        $type: 'color',
        $value: oklchToHex(shade.oklch),
        $extensions: {
          'palette-gen': {
            oklch: oklchToCss(shade.oklch)
          }
        }
      }
    }
  }

  return JSON.stringify({ color: tokens }, null, 2)
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain'): boolean {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch (err) {
    console.error('Download failed:', err)
    return false
  }
}

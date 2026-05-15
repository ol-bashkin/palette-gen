# Palette Generator

Генератор цветовых палитр на основе OKLCH с экспортом в CSS-переменные и Figma-токены.

## Возможности

- Задаёшь базовый цвет — получаешь полную шкалу оттенков от светлого к тёмному
- Настраиваемые параметры шкалы: диапазон Lightness, размер и количество шагов
- Ручная корректировка любого оттенка через color picker (флаг `custom`)
- Добавление дополнительных цветов вручную или через цветовые гармонии: Analogous, Complementary, Split complementary, Triad, Square, Compound
- Экспорт в CSS custom properties (`:root { --color-base-050: ... }`)
- Экспорт в Figma Design Tokens (JSON, W3C-совместимый формат)

## Стек

Vue 3 · Vite · TypeScript · Pinia · culori · @tabler/icons-vue

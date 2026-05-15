# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A color palette generator based on the OKLCH color model, with export to CSS variables and Figma files.

## Stack

Vue 3 (`<script setup>` + Composition API) · Vite · TypeScript · Vue Router 4 · Pinia · `@tabler/icons-vue`


## Базовые принципы

- **Простота в приоритете**: делай каждое изменение максимально простым. Минимальное воздействие на код.
- **Без лени**: ищи корневые причины. Без временных фиксов. Стандарты senior-разработчика.
- **Минимальное воздействие**: трогай только необходимое. Никаких сайд-эффектов и новых багов.

## Оркестрация Workflow

### 1. Режим планирования по умолчанию

- Входи в режим плана для ЛЮБОЙ нетривиальной задачи (3+ шагов или архитектурные решения)
- Если что-то идёт не так — СТОП и немедленно перепланируй
- Используй режим плана и для шагов верификации, не только для сборки
- Пиши детальные спеки заранее — убирай неоднозначность

### 2. Стратегия субагентов

- Используй субагентов щедро, чтобы держать основной контекст чистым
- Выгружай ресёрч, разведку и параллельный анализ на субагентов
- Для сложных задач — кидай больше compute через субагентов
- Одна задача на одного субагента — для сфокусированного исполнения

### 3. Цикл самоулучшения

- После ЛЮБОЙ правки от пользователя: обновляй `.claude/lessons.md` с паттерном
- Пиши себе правила, которые не дадут повторить ту же ошибку
- Беспощадно итерируй по этим урокам, пока частота ошибок не упадёт
- Перечитывай уроки в начале сессии по нужному проекту

### 4. Верификация до «готово»

- Никогда не помечай задачу завершённой, не доказав, что она работает
- Сравнивай поведение `main` и своих изменений, когда это уместно
- Спроси себя: «Одобрил бы это staff-инженер?»
- Запускай тесты, смотри логи, демонстрируй корректность

### 5. Требуй элегантности (в меру)

- На нетривиальных изменениях: пауза и вопрос «есть ли путь элегантнее?»
- Если фикс выглядит как костыль: «зная всё, что знаю сейчас, реализуй элегантное решение»
- Пропускай это для простых очевидных фиксов — не оверинжинирь
- Подвергай сомнению свою работу прежде, чем её показать

### 6. Автономная починка багов

- Получил баг-репорт — просто чини. Не проси, чтобы вели за руку
- Указывай на логи, ошибки, упавшие тесты — и решай их
- Ноль переключений контекста со стороны пользователя
- Иди чини упавшие CI-тесты без подсказок «как»

## Frontend aestethics

You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create neutral backgrounds.

Avoid generic AI-generated aesthetics:

- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
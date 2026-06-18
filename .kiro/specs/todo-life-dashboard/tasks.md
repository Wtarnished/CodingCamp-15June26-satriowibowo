# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a zero-dependency single-page web application (`index.html` + `style.css` + `app.js`) that delivers five functional widgets — live greeting/clock, Pomodoro focus timer, persistent to-do list, quick-links panel, and light/dark theme toggle — all persisted via `localStorage`. Implementation proceeds in layers: HTML skeleton → CSS theming/layout → JS modules (themeModule first, then the remaining four) → integration wiring → property-based and unit tests.

---

## Tasks

- [x] 1. Create the HTML skeleton (`index.html`)
  - [x] 1.1 Create `index.html` with semantic markup for all five widgets
    - Write `<html>`, `<head>`, and `<body>` with `data-theme` attribute hook on `<html>`
    - Add `#clock`, `#date`, `#greeting`, `#name-input`, `#name-form` for the greeting widget
    - Add `#timer-display`, `#timer-duration-input`, `#timer-start`, `#timer-stop`, `#timer-reset`, `#timer-alert` for the focus timer
    - Add `#todo-input`, `#todo-add-btn`, `#todo-list`, `#todo-input-error` for the to-do list
    - Add `#link-label-input`, `#link-url-input`, `#link-add-btn`, `#links-container`, `#link-label-error`, `#link-url-error`, `#links-limit-msg` for quick links
    - Add `#theme-toggle` button for the theme toggle (fixed position)
    - Link `style.css` in `<head>` and `app.js` with `defer` before `</body>`
    - _Requirements: 1.1–1.8, 2.1–2.5, 3.1–3.11, 4.1–4.13, 5.1–5.10, 6.1–6.7, 7.4, 7.5_

- [x] 2. Create the CSS stylesheet (`style.css`)
  - [x] 2.1 Define CSS custom properties for light and dark themes
    - Write `[data-theme="light"]` and `[data-theme="dark"]` blocks on `:root` with `--bg`, `--text`, `--surface`, `--accent`, `--border` variables (minimum token set covering all widgets)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.2 Implement responsive grid layout
    - Write base multi-column grid layout for viewports ≥ 768 px
    - Add a `@media (max-width: 767px)` breakpoint that stacks all widgets to a single column
    - Ensure no horizontal scrolling at 320 px (use `max-width: 100%`, `overflow-x: hidden` on body)
    - _Requirements: 7.1, 7.2_

  - [x] 2.3 Style individual widgets and shared components
    - Style greeting widget, timer widget, to-do list, quick-links panel, and theme toggle button
    - Apply `position: fixed` to `#theme-toggle` so it stays in the viewport at all times
    - Style task completion with `text-decoration: line-through` on `.completed` class
    - Style inline validation error spans (e.g., `color: red; font-size: 0.85em`)
    - Style the `#timer-alert` banner (hidden by default via `hidden` attribute, shown programmatically)
    - Style the `#links-limit-msg` banner (hidden by default)
    - _Requirements: 3.6, 4.4, 4.5, 5.5, 6.1_

- [x] 3. Implement `themeModule` in `app.js`
  - [x] 3.1 Implement `themeModule` with `init()`, `toggleTheme()`, `saveTheme()`, `loadTheme()`
    - Implement `safeGet` / `safeSet` helpers that wrap all `localStorage` calls in `try/catch`
    - `loadTheme()`: read `dashboard_theme` from storage; fall back to `prefers-color-scheme`; fall back to `"light"`
    - `saveTheme(t)`: write theme string to `dashboard_theme` via `safeSet`
    - `toggleTheme()`: flip between `"light"` and `"dark"`, call `saveTheme`, update `document.documentElement` attribute
    - `init()`: call `loadTheme()`, apply `data-theme` to `<html>`, wire click listener on `#theme-toggle`, update button indicator
    - _Requirements: 6.1–6.7_


- [x] 4. Implement `greetingModule` in `app.js`
  - [x] 4.1 Implement pure helper functions `getGreeting(hour)` and `formatGreeting(hour, name)`
    - `getGreeting(hour)`: map 5–11 → "Good Morning", 12–16 → "Good Afternoon", 17–20 → "Good Evening", 0–4/21–23 → "Good Night"
    - `formatGreeting(hour, name)`: return `getGreeting(hour) + ", " + name` when name is non-empty trimmed string; else return `getGreeting(hour)` alone
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_


  - [x] 4.3 Implement `greetingModule.init()` and `updateName()`
    - `init()`: read `dashboard_username` via `safeGet`, pre-populate `#name-input`, start `setInterval(tick, 1000)`
    - `tick()`: call `new Date()`, format time with `toLocaleTimeString()`, format date with `toLocaleDateString('en-US', ...)`, call `formatGreeting`, update `#clock`, `#date`, `#greeting`
    - `updateName()`: trim input value; if non-empty save via `safeSet` and refresh greeting; if empty/whitespace remove key via `safeRemove` and refresh greeting without name
    - Wire `#name-form` submit event to `updateName()`
    - _Requirements: 1.1, 1.2, 2.1–2.5_


- [x] 5. Implement `timerModule` in `app.js`
  - [x] 5.1 Implement pure helpers `formatTime(seconds)` and `clampDuration(value)`
    - `formatTime(s)`: zero-pad minutes (`Math.floor(s/60)`) and seconds (`s % 60`) to produce `MM:SS`
    - `clampDuration(v)`: floor to integer, clamp to [1, 120]; return last valid value when input is NaN or out of range
    - _Requirements: 3.2, 3.7_

  - [x] 5.3 Implement `timerModule.init()`, `start()`, `stop()`, `reset()`, `tick()`, `notifyComplete()`
    - `init()`: load `dashboard_timer_duration` (default 25), set `configuredMs` and `remaining` in seconds, render display, wire button click listeners and duration `input`/`blur` validation
    - `start()`: guard double-start, disable `#timer-duration-input`, call `setInterval(tick, 1000)`
    - `stop()`: clear interval, set `isRunning = false`, re-enable `#timer-duration-input`
    - `reset()`: call `stop()`, restore `remaining = configuredMs`, update display
    - `tick()`: decrement `remaining`, update display; if `remaining <= 0` call `stop()` then `notifyComplete()`
    - `notifyComplete()`: request Notification permission if needed; fire `new Notification(...)` if granted; else set `#timer-alert` text and unhide it
    - Duration input: on `input` clamp/round value; on `blur` revert to last valid if invalid; when valid update `configuredMs` and persist via `safeSet`
    - _Requirements: 3.1–3.11_


- [x] 6. Implement `todoModule` in `app.js`
  - [x] 6.1 Implement pure task helper functions
    - `addTask(arr, text)`: return new array with appended `{ id: uuid(), text: trimmed, completed: false }` when text is non-empty trimmed; return `{ error: 'empty' }` when whitespace-only
    - `editTask(arr, id, text)`: return updated array with matching task's text replaced when text non-empty trimmed; return `{ error: 'empty' }` when whitespace-only
    - `deleteTask(arr, id)`: return array with all items except the one matching `id`
    - `toggleComplete(task)`: return shallow copy of task with `completed` flipped
    - `saveTodos(arr)` / `loadTodos()`: serialize to / deserialize from `localStorage` under `dashboard_todos`; `loadTodos` falls back to `[]` on parse error
    - _Requirements: 4.2, 4.3, 4.5, 4.6, 4.8, 4.9, 4.11, 4.12, 4.13_


  - [x] 6.3 Implement `todoModule.init()`, `renderList()`, and DOM event wiring
    - `init()`: call `loadTodos()`, call `renderList()`
    - `renderList()`: clear `#todo-list` innerHTML, rebuild `<li>` elements for each task (text, checkbox, edit button, delete button); for tasks in edit mode render inline `<input>` + Save + Cancel buttons
    - Wire `#todo-add-btn` click / `#todo-input` enter: call `addTask`, show `#todo-input-error` on rejection, else call `saveTodos` + `renderList`
    - Wire checkbox change: call `toggleComplete`, `saveTodos`, `renderList`
    - Wire edit button click: set task edit mode flag, `renderList`
    - Wire Save (enter) / Cancel (escape): call `editTask` or discard, `saveTodos`, `renderList`
    - Wire delete button click: call `deleteTask`, `saveTodos`, `renderList`
    - _Requirements: 4.1–4.13_

- [ ] 7. Checkpoint — To-do module complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement `quickLinksModule` in `app.js`
  - [x] 8.1 Implement pure link helper functions
    - `normalizeUrl(url)`: if `url.toLowerCase()` does not start with `http://` or `https://`, prepend `https://`; otherwise return unchanged
    - `addLink(arr, label, url)`: if `arr.length >= 20` return original array with `{ error: 'max' }`; if label or url (after trim) is empty return `{ error: 'empty' }`; else return new array with `{ id: uuid(), label: trimmed, url: normalizeUrl(trimmed url) }` appended
    - `deleteLink(arr, id)`: return array without item matching `id`
    - `saveLinks(arr)` / `loadLinks()`: serialize / deserialize under `dashboard_links`; fallback to `[]`
    - _Requirements: 5.1–5.10_


  - [x] 8.3 Implement `quickLinksModule.init()`, `renderLinks()`, and DOM event wiring
    - `init()`: call `loadLinks()`, call `renderLinks()`
    - `renderLinks()`: clear `#links-container`, rebuild link elements as `<a target="_blank" rel="noopener noreferrer">` with label text and a delete button; after render check count and toggle `#link-add-btn` disabled state and `#links-limit-msg` visibility
    - Wire `#link-add-btn` click: validate inputs, call `addLink`, show `#link-label-error` / `#link-url-error` on rejection, else `saveLinks` + `renderLinks`
    - Wire delete button click: call `deleteLink`, `saveLinks`, `renderLinks`
    - _Requirements: 5.1–5.10_

- [x] 9. Wire all modules together in `app.js` entry point
  - [x] 9.1 Add `DOMContentLoaded` listener and call modules in correct order
    - Structure `app.js` so each module is defined before the entry point
    - In `DOMContentLoaded` call: nit()` runs first (before any other paint-affecting code) to prevent FOUC
    - _Requirements: 6.5, 7.3, 7.4, 7.5_`themeModule.init()`, `greetingModule.init()`, `timerModule.init()`, `todoModule.init()`, `quickLinksModule.init()` — in that order
    - Confirm `themeModule.i

- [ ] 10. Checkpoint — Full integration
  - Ensure all modules are wired, open `index.html` directly in a browser, verify all five widgets render with no console errors, ask the user if questions arise.

- [ ] 11. Write the fast-check test suite (`app.test.js`)

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at natural integration points
- Property tests validate universal correctness properties using fast-check (min 100 iterations each)
- Unit/example tests validate specific scenarios and edge cases
- All `localStorage` access must be wrapped in `try/catch` per the design's `safeGet`/`safeSet` pattern
- `themeModule.init()` MUST execute first in the `DOMContentLoaded` handler to prevent flash of unstyled content
- Pure helper functions should be written so they can be imported or extracted for testing without DOM dependencies
- The final deliverable is exactly three files: `index.html`, `style.css`, `app.js`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "4.1", "5.1", "6.1", "8.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "4.4", "5.2", "5.4", "6.2", "8.2"] },
    { "id": 4, "tasks": ["4.3", "5.3", "6.3", "8.3"] },
    { "id": 5, "tasks": ["9.1"] },
    { "id": 6, "tasks": ["11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3", "11.4", "11.5", "11.6", "11.7"] }
  ]
}
```

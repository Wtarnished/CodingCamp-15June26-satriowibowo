/* =============================================================
   Life Dashboard — app.js
   Zero-dependency, single-page widget modules.
   Modules: themeModule (task 3.1)
            greetingModule  — task 3.2
            timerModule     — task 3.3
            todoModule      — task 3.4
            quickLinksModule — task 3.5
   ============================================================= */

'use strict';

/* -------------------------------------------------------------
   localStorage helpers (shared by all modules)
   Wrap every storage call in try/catch so that private-browsing
   environments that block localStorage do not throw errors.
   Requirements 6.7 / Error Handling — localStorage Unavailability
   ------------------------------------------------------------- */

/**
 * Safely read a value from localStorage.
 * @param {string} key
 * @returns {string|null} Stored string, or null on miss / error.
 */
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely write a value to localStorage.
 * Silently swallows errors (e.g. SecurityError in private browsing).
 * @param {string} key
 * @param {string} value
 */
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* silent fail — session-only state when storage is unavailable */
  }
}

/**
 * Safely remove a key from localStorage.
 * Silently swallows errors (e.g. SecurityError in private browsing).
 * @param {string} key
 */
function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* silent fail — session-only state when storage is unavailable */
  }
}

/* =============================================================
   Greeting helpers (standalone — testable independently)
   Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
   ============================================================= */

/**
 * Map an hour (0–23) to the appropriate greeting string.
 * Tiers:
 *   5–11  → "Good Morning"
 *   12–16 → "Good Afternoon"
 *   17–20 → "Good Evening"
 *   0–4, 21–23 → "Good Night"
 *
 * Requirements 1.3, 1.4, 1.5, 1.6
 * @param {number} hour - Integer in [0, 23]
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 16) return 'Good Afternoon';
  if (hour >= 17 && hour <= 20) return 'Good Evening';
  return 'Good Night'; // 0–4 and 21–23
}

/**
 * Combine greeting with an optional user name.
 * Returns "<greeting>, <name>" when name is a non-empty trimmed string;
 * otherwise returns the greeting alone.
 *
 * Requirements 1.7, 1.8
 * @param {number} hour - Integer in [0, 23]
 * @param {string|null|undefined} name - Raw name value from storage or input
 * @returns {string}
 */
function formatGreeting(hour, name) {
  const greeting = getGreeting(hour);
  const trimmed = (name ?? '').trim();
  return trimmed.length > 0 ? `${greeting}, ${trimmed}` : greeting;
}

/* =============================================================
   greetingModule
   Responsibilities:
     - Read saved username from localStorage (dashboard_username)
     - Pre-populate #name-input on init
     - Start a 1-second setInterval to update clock, date, and greeting
     - Handle name form submission (save / clear username)
   Requirements: 1.1, 1.2, 2.1–2.5
   ============================================================= */
const greetingModule = (() => {
  const USERNAME_KEY = 'dashboard_username';

  /** @type {ReturnType<typeof setInterval>|null} */
  let intervalId = null;

  // DOM references — cached once in init()
  let elClock    = null;
  let elDate     = null;
  let elGreeting = null;
  let elInput    = null;
  let elForm     = null;

  /**
   * Update #clock, #date, and #greeting using the current time.
   * Called every second by setInterval.
   * Requirements 1.1, 1.2, 1.3–1.8
   */
  function tick() {
    const now = new Date();

    // Time: relies on browser locale for 12 h / 24 h format (Requirement 1.1)
    if (elClock) elClock.textContent = now.toLocaleTimeString();

    // Date: "Weekday, Month DD, YYYY" (Requirement 1.2)
    if (elDate) {
      elDate.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric',
      });
    }

    // Greeting with optional name (Requirements 1.3–1.8)
    if (elGreeting) {
      const savedName = safeGet(USERNAME_KEY);
      elGreeting.textContent = formatGreeting(now.getHours(), savedName);
    }
  }

  /**
   * Initialise the greeting module.
   * Reads stored name, pre-populates the input, starts the clock interval,
   * and wires the name form submit event.
   * Requirements 2.1, 2.4
   */
  function init() {
    elClock    = document.getElementById('clock');
    elDate     = document.getElementById('date');
    elGreeting = document.getElementById('greeting');
    elInput    = document.getElementById('name-input');
    elForm     = document.getElementById('name-form');

    // Pre-populate input with stored name (Requirement 2.4)
    const savedName = safeGet(USERNAME_KEY);
    if (elInput && savedName) {
      elInput.value = savedName;
    }

    // Run an immediate tick so display is correct before the first interval fires
    tick();

    // Start 1-second interval (Requirement 1.1)
    intervalId = setInterval(tick, 1000);

    // Wire form submit to updateName (Requirement 2.1)
    if (elForm) {
      elForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateName();
      });
    }
  }

  /**
   * Handle name form submission.
   * - Non-empty trimmed value → save to localStorage, refresh greeting.
   * - Empty / whitespace-only → remove key from localStorage, clear input,
   *   refresh greeting without name.
   * Requirements 2.2, 2.3, 2.5
   */
  function updateName() {
    if (!elInput) return;

    const trimmed = elInput.value.trim();

    if (trimmed.length > 0) {
      // Save trimmed name (Requirement 2.2)
      safeSet(USERNAME_KEY, trimmed);
      // Keep input showing the trimmed version
      elInput.value = trimmed;
    } else {
      // Remove saved name and clear input (Requirement 2.5)
      safeRemove(USERNAME_KEY);
      elInput.value = '';
    }

    // Refresh greeting immediately (Requirements 2.3, 2.5 — within 500 ms)
    tick();
  }

  // Expose public API
  return { init, updateName };
})();

/* =============================================================
   themeModule
   Responsibilities:
     - Load saved theme from localStorage (dashboard_theme)
     - Fall back to prefers-color-scheme, then "light"
     - Apply data-theme attribute to <html> immediately (no FOUC)
     - Wire the #theme-toggle button
     - Persist theme changes to localStorage
   Requirements: 6.1–6.7
   ============================================================= */
const themeModule = (() => {
  const STORAGE_KEY = 'dashboard_theme';

  /** @type {string} Currently active theme ("light" | "dark") */
  let currentTheme = 'light';

  /**
   * Read saved theme → OS preference → "light".
   * Requirement 6.5 (saved), 6.6 (OS/default), 6.7 (storage unavailable)
   * @returns {"light"|"dark"}
   */
  function loadTheme() {
    const saved = safeGet(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Fall back to OS color-scheme preference (Requirement 6.6)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Persist the given theme string to localStorage.
   * Requirement 6.4
   * @param {"light"|"dark"} theme
   */
  function saveTheme(theme) {
    safeSet(STORAGE_KEY, theme);
  }

  /**
   * Flip between "light" and "dark", persist, and update the DOM.
   * Requirements 6.2, 6.3, 6.4
   */
  function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    saveTheme(currentTheme);
    applyTheme(currentTheme);
  }

  /**
   * Apply data-theme attribute to <html> and update the toggle button label.
   * Requirement 6.1 (visual indicator), 6.5 (applied before paint)
   * @param {"light"|"dark"} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateToggleButton(theme);
  }

  /**
   * Update the #theme-toggle button to reflect the active theme.
   * Shows the action the button will perform (switching TO the opposite theme).
   * Requirement 6.1
   * @param {"light"|"dark"} theme
   */
  function updateToggleButton(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    if (theme === 'dark') {
      btn.textContent = '☀️ Light';
      btn.setAttribute('aria-label', 'Switch to light theme');
    } else {
      btn.textContent = '🌙 Dark';
      btn.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  /**
   * Initialise the theme module.
   * Must run first in DOMContentLoaded to prevent FOUC.
   * Requirements 6.1, 6.5
   */
  function init() {
    currentTheme = loadTheme();

    // Apply immediately — before the browser renders visible content
    applyTheme(currentTheme);

    // Wire the toggle button click listener
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
    }
  }

  // Expose public API
  return { init, toggleTheme, saveTheme, loadTheme };
})();

/* =============================================================
   Timer helpers (standalone — testable independently)
   Requirements: 3.2, 3.7
   ============================================================= */

/**
 * Format a total number of seconds as a MM:SS string.
 * Both minutes and seconds are zero-padded to two digits.
 *
 * Requirement 3.2
 * @param {number} seconds - Non-negative integer number of seconds
 * @returns {string} Zero-padded string in the form "MM:SS"
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Clamp a raw duration value to the valid integer range [1, 120].
 * - Non-numeric (NaN) inputs return the provided lastValid fallback.
 * - Fractional values are floored before clamping.
 * - Values below 1 are clamped to 1; values above 120 are clamped to 120.
 *
 * Requirement 3.7
 * @param {number} value     - Raw numeric value from user input
 * @param {number} lastValid - Previous valid value to use as fallback (must be in [1, 120])
 * @returns {number} Integer in [1, 120]
 */
function clampDuration(value, lastValid) {
  const floored = Math.floor(value);
  if (isNaN(floored)) return lastValid;
  if (floored < 1) return 1;
  if (floored > 120) return 120;
  return floored;
}

/* =============================================================
   timerModule
   Responsibilities:
     - Load saved duration from localStorage (dashboard_timer_duration)
     - Display remaining time as MM:SS, updating every second
     - Start / stop / reset countdown via button listeners
     - Fire browser Notification on completion, or show #timer-alert
     - Disable duration input while counting down, re-enable on pause/reset
     - Persist configured duration to localStorage on valid change
   Requirements: 3.1–3.11
   ============================================================= */
const timerModule = (() => {
  const DURATION_KEY = 'dashboard_timer_duration';
  const DEFAULT_DURATION = 25; // minutes

  /** setInterval handle — null when not running */
  let intervalId = null;

  /** Seconds remaining in the current session */
  let remaining = 0;

  /**
   * The currently configured duration in seconds (reset target).
   * Named "configuredMs" in the design doc but stores seconds.
   */
  let configuredMs = 0;

  /** True while the interval is actively running */
  let isRunning = false;

  /**
   * Last value that passed validation — used to revert on bad input.
   * Stored as minutes (1–120).
   */
  let lastValidMinutes = DEFAULT_DURATION;

  // DOM references — cached once in init()
  let elDisplay       = null;
  let elDurationInput = null;
  let elStart         = null;
  let elStop          = null;
  let elReset         = null;
  let elAlert         = null;

  /* -----------------------------------------------------------
     Display helper
     ----------------------------------------------------------- */

  /**
   * Render the current `remaining` seconds into #timer-display.
   * Requirement 3.2
   */
  function updateDisplay() {
    if (elDisplay) {
      elDisplay.textContent = formatTime(remaining);
    }
  }

  /* -----------------------------------------------------------
     Core timer operations
     ----------------------------------------------------------- */

  /**
   * Begin counting down from the current remaining time.
   * Guards against double-start with the isRunning flag.
   * Disables the duration input while running.
   * Requirements 3.3, 3.9
   */
  function start() {
    if (isRunning) return; // guard double-start (Requirement 3.3)

    isRunning = true;

    // Disable duration input while counting down (Requirement 3.9)
    if (elDurationInput) elDurationInput.disabled = true;

    // Hide any previous alert
    if (elAlert) elAlert.hidden = true;

    intervalId = setInterval(tick, 1000);
  }

  /**
   * Pause the countdown, preserving remaining time.
   * Re-enables the duration input.
   * Requirements 3.4, 3.10
   */
  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;

    // Re-enable duration input when paused (Requirement 3.10)
    if (elDurationInput) elDurationInput.disabled = false;
  }

  /**
   * Stop any active countdown and restore the display to the configured duration.
   * Requirements 3.5, 3.8, 3.10
   */
  function reset() {
    stop();
    remaining = configuredMs;
    updateDisplay();
  }

  /**
   * Called every second by setInterval.
   * Decrements remaining; auto-stops and notifies when the timer hits zero.
   * Requirements 3.2, 3.6
   */
  function tick() {
    remaining -= 1;
    updateDisplay();

    if (remaining <= 0) {
      stop();
      notifyComplete();
    }
  }

  /**
   * Notify the user that their focus session has ended.
   * Requests Notification permission if it hasn't been decided yet,
   * fires a browser Notification if granted, otherwise shows #timer-alert.
   * Requirement 3.6
   */
  function notifyComplete() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Focus session complete!');
      } else if (Notification.permission === 'default') {
        // Request permission, then fire if granted
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Focus session complete!');
          } else {
            showAlert();
          }
        });
        return; // alert shown asynchronously if needed
      } else {
        // Permission denied — fall back to in-page alert
        showAlert();
      }
    } else {
      // Notification API not supported
      showAlert();
    }
  }

  /**
   * Display the in-page completion banner.
   * Requirement 3.6 (fallback when Notification unavailable/denied)
   */
  function showAlert() {
    if (elAlert) {
      elAlert.textContent = 'Focus session complete!';
      elAlert.hidden = false;
    }
  }

  /* -----------------------------------------------------------
     Duration input validation
     ----------------------------------------------------------- */

  /**
   * Handle the `input` event on #timer-duration-input.
   * Clamps/rounds the entered value immediately while typing.
   * Requirement 3.7
   */
  function onDurationInput() {
    const raw = parseFloat(elDurationInput.value);
    if (!isNaN(raw)) {
      const clamped = clampDuration(raw, lastValidMinutes);
      elDurationInput.value = clamped;
    }
  }

  /**
   * Handle the `blur` event on #timer-duration-input.
   * Reverts to last valid value if the field is invalid or empty.
   * When valid, updates configuredMs and persists to localStorage.
   * Requirements 3.7, 3.11
   */
  function onDurationBlur() {
    const raw = parseFloat(elDurationInput.value);
    if (isNaN(raw) || raw < 1 || raw > 120) {
      // Revert to last valid value (Requirement 3.7)
      elDurationInput.value = lastValidMinutes;
      return;
    }

    const valid = clampDuration(raw, lastValidMinutes);
    lastValidMinutes = valid;
    elDurationInput.value = valid;

    // Update configured duration in seconds
    configuredMs = valid * 60;

    // Persist to localStorage (Requirement 3.11)
    safeSet(DURATION_KEY, String(valid));
  }

  /* -----------------------------------------------------------
     Initialisation
     ----------------------------------------------------------- */

  /**
   * Initialise the timer module.
   * Loads saved duration, sets internal state, renders display,
   * and wires all button and input event listeners.
   * Requirements 3.1, 3.11
   */
  function init() {
    // Cache DOM references
    elDisplay       = document.getElementById('timer-display');
    elDurationInput = document.getElementById('timer-duration-input');
    elStart         = document.getElementById('timer-start');
    elStop          = document.getElementById('timer-stop');
    elReset         = document.getElementById('timer-reset');
    elAlert         = document.getElementById('timer-alert');

    // Load persisted duration in minutes; fall back to default 25 (Requirement 3.1)
    const saved = parseInt(safeGet(DURATION_KEY), 10);
    const durationMinutes = (!isNaN(saved) && saved >= 1 && saved <= 120)
      ? saved
      : DEFAULT_DURATION;

    lastValidMinutes = durationMinutes;
    configuredMs     = durationMinutes * 60; // stored as seconds
    remaining        = configuredMs;

    // Set the duration input to reflect the loaded value
    if (elDurationInput) {
      elDurationInput.value = durationMinutes;
    }

    // Render the initial display (Requirement 3.2)
    updateDisplay();

    // Wire button listeners
    if (elStart) elStart.addEventListener('click', start);
    if (elStop)  elStop.addEventListener('click', stop);
    if (elReset) elReset.addEventListener('click', reset);

    // Wire duration input listeners (Requirements 3.7, 3.11)
    if (elDurationInput) {
      elDurationInput.addEventListener('input', onDurationInput);
      elDurationInput.addEventListener('blur',  onDurationBlur);
    }
  }

  // Expose public API (init + helpers exposed for testing)
  return { init, start, stop, reset, tick, notifyComplete };
})();

/* =============================================================
   todoModule — pure helper functions (task 6.1)
   These functions have NO DOM dependencies and can be tested in
   isolation. The todoModule object with init() is added in task 6.3.
   Requirements: 4.2, 4.3, 4.5, 4.6, 4.8, 4.9, 4.11, 4.12, 4.13
   ============================================================= */

const TODO_STORAGE_KEY = 'dashboard_todos';

/**
 * Generate a unique identifier string.
 * Uses crypto.randomUUID() when available; falls back to Date.now().toString().
 * @returns {string}
 */
function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

/**
 * Add a new task to the task array.
 * Returns a new array with the appended task when text is non-empty after trimming.
 * Returns { error: 'empty' } when the trimmed text is empty (whitespace-only input).
 *
 * Requirements 4.2, 4.3
 * @param {Task[]} arr  - Current task array
 * @param {string} text - Raw task text from user input
 * @returns {Task[]|{error: string}}
 */
function addTask(arr, text) {
  const trimmed = (text ?? '').trim();
  if (trimmed.length === 0) {
    return { error: 'empty' };
  }
  return [...arr, { id: uuid(), text: trimmed, completed: false }];
}

/**
 * Edit the text of an existing task by ID.
 * Returns a new array with the matching task's text replaced when text is non-empty after trimming.
 * Returns { error: 'empty' } when the trimmed text is empty (whitespace-only input).
 * Returns the original array unchanged when no task with the given ID is found.
 *
 * Requirements 4.8, 4.9
 * @param {Task[]} arr  - Current task array
 * @param {string} id   - ID of the task to edit
 * @param {string} text - New text for the task
 * @returns {Task[]|{error: string}}
 */
function editTask(arr, id, text) {
  const trimmed = (text ?? '').trim();
  if (trimmed.length === 0) {
    return { error: 'empty' };
  }
  return arr.map((task) => task.id === id ? { ...task, text: trimmed } : task);
}

/**
 * Delete a task by ID.
 * Returns a new array with all items except the one matching `id`.
 * If no task with the given ID exists, the original array is returned unchanged.
 *
 * Requirement 4.11
 * @param {Task[]} arr - Current task array
 * @param {string} id  - ID of the task to remove
 * @returns {Task[]}
 */
function deleteTask(arr, id) {
  return arr.filter((task) => task.id !== id);
}

/**
 * Toggle the completion state of a task.
 * Returns a shallow copy of the task with `completed` flipped.
 * The original task object is not mutated.
 *
 * Requirements 4.5, 4.6
 * @param {Task} task - The task to toggle
 * @returns {Task}
 */
function toggleComplete(task) {
  return { ...task, completed: !task.completed };
}

/**
 * Persist the task array to localStorage under `dashboard_todos`.
 * Serializes to JSON. Silently swallows storage errors via safeSet.
 *
 * Requirements 4.12, 4.13
 * @param {Task[]} arr - Task array to persist
 */
function saveTodos(arr) {
  safeSet(TODO_STORAGE_KEY, JSON.stringify(arr));
}

/**
 * Load the task array from localStorage.
 * Parses the stored JSON string. Returns [] if the key is absent,
 * the value is null, or the JSON is malformed.
 *
 * Requirements 4.12, 4.13
 * @returns {Task[]}
 */
function loadTodos() {
  try {
    const raw = safeGet(TODO_STORAGE_KEY);
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

/* =============================================================
   todoModule
   Responsibilities:
     - Load task array from localStorage via loadTodos()
     - Render the #todo-list <ul> on every state change via renderList()
     - Wire #todo-add-btn / #todo-input Enter for adding tasks
     - Wire checkbox, edit, save, cancel, delete actions per task item
     - Track which task (if any) is in edit mode via editingId
   Requirements: 4.1–4.13
   ============================================================= */
const todoModule = (() => {
  /** @type {Task[]} Module-level task array — source of truth for the list */
  let tasks = [];

  /** @type {string|null} ID of the task currently being edited, or null */
  let editingId = null;

  // DOM references — cached once in init()
  let elInput      = null;
  let elAddBtn     = null;
  let elList       = null;
  let elInputError = null;

  /* -----------------------------------------------------------
     renderList
     Clears #todo-list and rebuilds every <li> from `tasks`.
     Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
     ----------------------------------------------------------- */
  function renderList() {
    if (!elList) return;
    elList.innerHTML = '';

    tasks.forEach((task) => {
      const li = document.createElement('li');

      if (task.id === editingId) {
        // ---- Edit mode ----------------------------------------
        // Edit text input pre-filled with current text
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'edit-input';
        editInput.value = task.text;
        editInput.maxLength = 500;
        editInput.setAttribute('aria-label', `Edit task: ${task.text}`);

        // Inline error span for edit validation (Requirement 4.9)
        const editError = document.createElement('span');
        editError.className = 'input-error';
        editError.setAttribute('role', 'alert');
        editError.setAttribute('aria-live', 'polite');

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = 'Save';
        saveBtn.setAttribute('aria-label', 'Save task edit');

        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.setAttribute('aria-label', 'Cancel task edit');

        /**
         * Shared save logic — called by Save button click and Enter keydown.
         * Requirements 4.8, 4.9
         */
        function doSave() {
          const result = editTask(tasks, task.id, editInput.value);
          if (result && result.error) {
            editError.textContent = 'Task text cannot be empty.';
            return;
          }
          tasks = result;
          saveTodos(tasks);
          editingId = null;
          renderList();
        }

        /**
         * Shared cancel logic — called by Cancel button click and Escape keydown.
         * Requirement 4.10
         */
        function doCancel() {
          editingId = null;
          renderList();
        }

        saveBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', doCancel);

        // Keyboard shortcuts on the edit input (Requirements 4.8, 4.10)
        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            doSave();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            doCancel();
          }
        });

        li.appendChild(editInput);
        li.appendChild(editError);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);

        // Focus the edit input immediately for keyboard accessibility
        // (use requestAnimationFrame so the element is in the DOM first)
        requestAnimationFrame(() => editInput.focus());

      } else {
        // ---- Display mode -------------------------------------

        // Checkbox — toggles completion state (Requirements 4.5, 4.6)
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
        checkbox.addEventListener('change', () => {
          tasks = tasks.map((t) => t.id === task.id ? toggleComplete(t) : t);
          saveTodos(tasks);
          renderList();
        });

        // Task text span with completed style (Requirements 4.5, 4.6)
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;
        if (task.completed) {
          li.classList.add('completed');
        }

        // Edit button (Requirement 4.7)
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
        editBtn.addEventListener('click', () => {
          editingId = task.id;
          renderList();
        });

        // Delete button (Requirement 4.11)
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
        deleteBtn.addEventListener('click', () => {
          tasks = deleteTask(tasks, task.id);
          saveTodos(tasks);
          renderList();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
      }

      elList.appendChild(li);
    });
  }

  /* -----------------------------------------------------------
     handleAdd
     Shared logic for Add button click and Enter on #todo-input.
     Requirements: 4.2, 4.3
     ----------------------------------------------------------- */
  function handleAdd() {
    const value = elInput ? elInput.value : '';
    const result = addTask(tasks, value);

    if (result && result.error) {
      // Show inline validation error (Requirement 4.3)
      if (elInputError) {
        elInputError.textContent = 'Task text cannot be empty.';
      }
      return;
    }

    // Success path — clear error, update state, persist, re-render
    if (elInputError) elInputError.textContent = '';
    if (elInput) elInput.value = '';
    tasks = result;
    saveTodos(tasks);
    renderList();
  }

  /* -----------------------------------------------------------
     init
     Cache DOM refs, load persisted tasks, render, wire events.
     Requirements: 4.1, 4.12, 4.13
     ----------------------------------------------------------- */
  function init() {
    elInput      = document.getElementById('todo-input');
    elAddBtn     = document.getElementById('todo-add-btn');
    elList       = document.getElementById('todo-list');
    elInputError = document.getElementById('todo-input-error');

    // Load persisted tasks and render (Requirements 4.12, 4.13)
    tasks = loadTodos();
    renderList();

    // Wire Add button click (Requirement 4.1)
    if (elAddBtn) {
      elAddBtn.addEventListener('click', handleAdd);
    }

    // Wire Enter key on the task input (Requirement 4.1)
    if (elInput) {
      elInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAdd();
        }
      });
    }
  }

  // Expose public API
  return { init, renderList };
})();

/* =============================================================
   quickLinksModule — pure helper functions (task 8.1)
   These functions have NO DOM dependencies and can be tested in
   isolation. The quickLinksModule object with init() is below.
   Requirements: 5.1–5.10
   ============================================================= */

const LINKS_STORAGE_KEY = 'dashboard_links';

/**
 * Normalize a URL by prepending "https://" if it does not already
 * start with "http://" or "https://" (case-insensitive).
 *
 * Requirement 5.4
 * @param {string} url - Raw URL string from user input (should be trimmed)
 * @returns {string} URL guaranteed to start with http:// or https://
 */
function normalizeUrl(url) {
  const lower = url.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return url;
  }
  return 'https://' + url;
}

/**
 * Add a new link to the link array.
 *
 * Returns:
 *  - The original array with { error: 'max' } when arr.length >= 20  (Req 5.10)
 *  - { error: 'empty' } when label or url is empty after trimming    (Req 5.3)
 *  - A new array with the link appended on success                   (Req 5.2)
 *
 * Requirements 5.2, 5.3, 5.4, 5.10
 * @param {Link[]} arr   - Current link array
 * @param {string} label - Raw label text from user input
 * @param {string} url   - Raw URL string from user input
 * @returns {Link[]|{error: string}}
 */
function addLink(arr, label, url) {
  if (arr.length >= 20) {
    return { error: 'max' };
  }
  const trimmedLabel = (label ?? '').trim();
  const trimmedUrl   = (url   ?? '').trim();
  if (trimmedLabel.length === 0 || trimmedUrl.length === 0) {
    return { error: 'empty' };
  }
  return [...arr, { id: uuid(), label: trimmedLabel, url: normalizeUrl(trimmedUrl) }];
}

/**
 * Delete a link by ID.
 * Returns a new array with all items except the one matching `id`.
 * If no link with the given ID exists, the original array is returned unchanged.
 *
 * Requirement 5.7
 * @param {Link[]} arr - Current link array
 * @param {string} id  - ID of the link to remove
 * @returns {Link[]}
 */
function deleteLink(arr, id) {
  return arr.filter((link) => link.id !== id);
}

/**
 * Persist the link array to localStorage under `dashboard_links`.
 * Serializes to JSON. Silently swallows storage errors via safeSet.
 *
 * Requirements 5.8, 5.9
 * @param {Link[]} arr - Link array to persist
 */
function saveLinks(arr) {
  safeSet(LINKS_STORAGE_KEY, JSON.stringify(arr));
}

/**
 * Load the link array from localStorage.
 * Parses the stored JSON string. Returns [] if the key is absent,
 * the value is null, or the JSON is malformed.
 *
 * Requirements 5.8, 5.9
 * @returns {Link[]}
 */
function loadLinks() {
  try {
    const raw = safeGet(LINKS_STORAGE_KEY);
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

/* =============================================================
   quickLinksModule
   Responsibilities:
     - Load link array from localStorage via loadLinks()
     - Render the #links-container on every state change
     - Wire #link-add-btn for adding links with validation
     - Wire delete buttons per link item
     - Enforce 20-link maximum: disable button + show limit message
   Requirements: 5.1–5.10
   ============================================================= */
const quickLinksModule = (() => {
  /** @type {Link[]} Module-level link array — source of truth */
  let links = [];

  // DOM references — cached once in init()
  let elLabelInput  = null;
  let elUrlInput    = null;
  let elAddBtn      = null;
  let elContainer   = null;
  let elLabelError  = null;
  let elUrlError    = null;
  let elLimitMsg    = null;

  /* -----------------------------------------------------------
     renderLinks
     Clears #links-container and rebuilds every link element.
     Requirements: 5.5, 5.6, 5.7, 5.10
     ----------------------------------------------------------- */
  function renderLinks() {
    if (!elContainer) return;
    elContainer.innerHTML = '';

    links.forEach((link) => {
      // Wrapper element for the link + delete pair
      const item = document.createElement('div');
      item.className = 'link-item';

      // Anchor element — opens in new tab (Requirements 5.5, 5.6)
      const anchor = document.createElement('a');
      anchor.href   = link.url;
      anchor.target = '_blank';
      anchor.rel    = 'noopener noreferrer';
      anchor.textContent = link.label;
      anchor.setAttribute('aria-label', `Open ${link.label} in new tab`);

      // Delete button (Requirement 5.7)
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      deleteBtn.addEventListener('click', () => {
        links = deleteLink(links, link.id);
        saveLinks(links);
        renderLinks();
      });

      item.appendChild(anchor);
      item.appendChild(deleteBtn);
      elContainer.appendChild(item);
    });

    // Enforce maximum link count (Requirement 5.10)
    if (links.length >= 20) {
      if (elAddBtn)    elAddBtn.disabled   = true;
      if (elLimitMsg)  elLimitMsg.hidden   = false;
    } else {
      if (elAddBtn)    elAddBtn.disabled   = false;
      if (elLimitMsg)  elLimitMsg.hidden   = true;
    }
  }

  /* -----------------------------------------------------------
     handleAdd
     Validates inputs and calls addLink(); shows inline errors
     on rejection, or saves + re-renders on success.
     Requirements: 5.2, 5.3
     ----------------------------------------------------------- */
  function handleAdd() {
    const rawLabel = elLabelInput ? elLabelInput.value : '';
    const rawUrl   = elUrlInput   ? elUrlInput.value   : '';

    // Clear previous errors
    if (elLabelError) elLabelError.textContent = '';
    if (elUrlError)   elUrlError.textContent   = '';

    const trimmedLabel = rawLabel.trim();
    const trimmedUrl   = rawUrl.trim();

    // Validate individually so we can show the right inline error
    if (trimmedLabel.length === 0 && trimmedUrl.length === 0) {
      if (elLabelError) elLabelError.textContent = 'Label cannot be empty.';
      if (elUrlError)   elUrlError.textContent   = 'URL cannot be empty.';
      return;
    }
    if (trimmedLabel.length === 0) {
      if (elLabelError) elLabelError.textContent = 'Label cannot be empty.';
      return;
    }
    if (trimmedUrl.length === 0) {
      if (elUrlError) elUrlError.textContent = 'URL cannot be empty.';
      return;
    }

    const result = addLink(links, rawLabel, rawUrl);

    if (result && result.error === 'max') {
      // Should not normally be reachable because the button is disabled at 20,
      // but guard defensively.
      if (elLimitMsg) elLimitMsg.hidden = false;
      return;
    }

    if (result && result.error) {
      // Fallback — should not reach here given the checks above
      return;
    }

    // Success path — clear inputs, update state, persist, re-render
    if (elLabelInput) elLabelInput.value = '';
    if (elUrlInput)   elUrlInput.value   = '';
    links = result;
    saveLinks(links);
    renderLinks();
  }

  /* -----------------------------------------------------------
     init
     Cache DOM refs, load persisted links, render, wire events.
     Requirements: 5.1, 5.9
     ----------------------------------------------------------- */
  function init() {
    elLabelInput = document.getElementById('link-label-input');
    elUrlInput   = document.getElementById('link-url-input');
    elAddBtn     = document.getElementById('link-add-btn');
    elContainer  = document.getElementById('links-container');
    elLabelError = document.getElementById('link-label-error');
    elUrlError   = document.getElementById('link-url-error');
    elLimitMsg   = document.getElementById('links-limit-msg');

    // Load persisted links and render (Requirements 5.8, 5.9)
    links = loadLinks();
    renderLinks();

    // Wire Add button click (Requirement 5.1)
    if (elAddBtn) {
      elAddBtn.addEventListener('click', handleAdd);
    }
  }

  // Expose public API
  return { init, renderLinks };
})();

/* =============================================================
   DOMContentLoaded — initialise modules in required order
   themeModule.init() MUST run first to avoid FOUC (Requirement 6.5)
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
  themeModule.init();

  greetingModule.init();

  timerModule.init();

  todoModule.init();

  quickLinksModule.init();
});

# Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity hub in the browser, featuring a greeting with live clock, a configurable Pomodoro focus timer, a persistent to-do list, a quick-links panel, and a light/dark mode toggle. All data is stored client-side via LocalStorage. The app requires no server, no frameworks, and no build step — it loads directly from a browser.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **User**: The person using the Dashboard in their browser.
- **Greeting_Widget**: The UI section displaying the current time, date, and a personalized greeting.
- **Focus_Timer**: The UI section providing a configurable countdown timer (Pomodoro-style).
- **Todo_List**: The UI section for managing tasks (add, edit, complete, delete).
- **Task**: A single item in the Todo_List, consisting of text content and a completion state.
- **Quick_Links**: The UI section for storing and opening favorite website URLs.
- **Link**: A single item in the Quick_Links section, consisting of a label and a URL.
- **Theme_Toggle**: The control that switches between light mode and dark mode.
- **LocalStorage**: The browser's built-in key-value persistence API used for all data storage.
- **Pomodoro**: A time management technique using a 25-minute focused work interval by default.
- **Session**: A single countdown interval initiated by pressing the Start button on the Focus_Timer.

---

## Requirements

### Requirement 1: Live Greeting and Clock

**User Story:** As a User, I want to see the current time, date, and a personalized greeting when I open the Dashboard, so that I can immediately orient myself and feel welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time updated every second. WHEN the User's browser is configured for a 12-hour locale, THE Greeting_Widget SHALL use h:MM:SS AM/PM format. WHERE the browser locale is 24-hour, THE Greeting_Widget SHALL use HH:MM:SS format.
2. THE Greeting_Widget SHALL display the current full date in the format "Weekday, Month DD, YYYY" (e.g., "Monday, June 15, 2026").
3. WHEN the current hour is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display "Good Morning".
4. WHEN the current hour is between 12:00 and 16:59 (inclusive), THE Greeting_Widget SHALL display "Good Afternoon".
5. WHEN the current hour is between 17:00 and 20:59 (inclusive), THE Greeting_Widget SHALL display "Good Evening".
6. WHEN the current hour is between 21:00 and 23:59, or between 00:00 and 04:59 (inclusive), THE Greeting_Widget SHALL display "Good Night".
7. WHEN a custom name has been saved (non-empty string after trimming whitespace, maximum 50 characters), THE Greeting_Widget SHALL append the name to the greeting separated by ", " (e.g., "Good Morning, Alex").
8. WHEN no custom name has been saved, or the saved value is an empty string or consists only of whitespace, THE Greeting_Widget SHALL display the greeting text only, without a name suffix.

---

### Requirement 2: Custom User Name Setting

**User Story:** As a User, I want to set and update my name in the Dashboard, so that the greeting feels personal.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field for the User to enter a custom name, with a maximum allowed length of 50 characters.
2. WHEN the User submits a name whose value after trimming whitespace is non-empty, THE Dashboard SHALL save the trimmed name to LocalStorage under a defined key (e.g., `dashboard_username`).
3. WHEN the User submits a non-empty trimmed name, THE Greeting_Widget SHALL update to include the new name within 500 milliseconds of submission.
4. WHEN the page loads, THE Dashboard SHALL read the saved name from LocalStorage and pre-populate the name input field with the stored value.
5. IF the User submits a name whose value after trimming whitespace is empty, THEN THE Dashboard SHALL remove the saved name from LocalStorage, clear the name input field, and update THE Greeting_Widget to display without a name suffix within 500 milliseconds of submission.

---

### Requirement 3: Focus Timer

**User Story:** As a User, I want a configurable countdown timer I can start, stop, and reset, so that I can use the Pomodoro technique to stay focused.

#### Acceptance Criteria

1. THE Focus_Timer SHALL default to a 25-minute countdown duration on first load and when no duration has been previously configured.
2. THE Focus_Timer SHALL display the remaining time in MM:SS format (e.g., "25:00"), updating the display once per second while counting down.
3. WHEN the User presses the Start button and the timer is not already running, THE Focus_Timer SHALL begin counting down once per second from the currently displayed remaining time.
4. WHEN the User presses the Stop (Pause) button and the timer is running, THE Focus_Timer SHALL pause the countdown, preserving the remaining time in the display.
5. WHEN the User presses the Reset button, THE Focus_Timer SHALL stop any active countdown and restore the timer display to the currently configured duration (not necessarily the default 25 minutes).
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically. IF the browser grants Notification permission, THEN THE Dashboard SHALL fire a browser Notification with the text "Focus session complete!". IF Notification permission is denied or unavailable, THEN THE Dashboard SHALL display a visible in-page alert or banner with equivalent text.
7. THE Focus_Timer SHALL provide a numeric duration input that accepts only integer values between 1 and 120 (minutes), inclusive. IF the User enters a value outside this range or a non-integer, THE Focus_Timer SHALL revert the input to the last valid value.
8. WHEN the User sets a new valid duration value and presses Reset, THE Focus_Timer SHALL apply the new duration as the countdown starting value and update the display accordingly.
9. WHILE the Focus_Timer is counting down (between Start and Stop/completion), THE Dashboard SHALL disable the duration input field to prevent mid-session changes.
10. WHEN the Focus_Timer is paused (after Stop) or reset, THE Dashboard SHALL re-enable the duration input field.
11. THE Focus_Timer SHALL persist the last configured duration to LocalStorage so that on next page load the duration input and initial display reflect the saved value rather than the default 25 minutes.

---

### Requirement 4: To-Do List

**User Story:** As a User, I want to add, edit, complete, and delete tasks in a persistent list, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input (maximum 500 characters) and an "Add" button for creating new Tasks.
2. WHEN the User submits non-empty task text (after trimming whitespace), THE Todo_List SHALL add a new Task with a unique ID, the trimmed text content, and completion state set to `false`.
3. IF the User submits empty or whitespace-only task text, THEN THE Todo_List SHALL not add a Task and SHALL display an inline validation message adjacent to the input field.
4. THE Todo_List SHALL display each Task with its text content, a completion checkbox, an edit button, and a delete button.
5. WHEN the User checks the completion checkbox of a Task, THE Todo_List SHALL set the Task's completion state to `true` and apply a visual struck-through style to the task text.
6. WHEN the User unchecks the completion checkbox of a Task, THE Todo_List SHALL set the Task's completion state to `false` and remove the struck-through style.
7. WHEN the User clicks the edit button of a Task, THE Todo_List SHALL replace the task text display with an editable input field pre-filled with the current text, and render a Save button and a Cancel button.
8. WHEN the User confirms an edit by clicking Save or pressing Enter, and the input text after trimming is non-empty, THE Todo_List SHALL update the Task text to the trimmed value and return to the display state.
9. IF the User confirms an edit with empty or whitespace-only text, THEN THE Todo_List SHALL not save the change and SHALL display an inline validation message adjacent to the edit input.
10. WHEN the User cancels an edit by clicking Cancel or pressing Escape, THE Todo_List SHALL discard any changes and return the Task to its previous display state without modifying the stored value.
11. WHEN the User clicks the delete button of a Task, THE Todo_List SHALL remove the Task from the list permanently.
12. WHEN any Task is added, edited, completed, unchecked, or deleted, THE Todo_List SHALL persist the full updated task array to LocalStorage.
13. WHEN the page loads, THE Todo_List SHALL read the task array from LocalStorage and render all Tasks. IF LocalStorage contains no task data, THE Todo_List SHALL render an empty list with no error.

---

### Requirement 5: Quick Links

**User Story:** As a User, I want to save and quickly open favorite website URLs from the Dashboard, so that I can navigate to important sites without leaving the tab.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a label input (maximum 50 characters), a URL input (maximum 2048 characters), and an "Add Link" button for creating new Links.
2. WHEN the User submits a non-empty label and a non-empty URL (after trimming whitespace), THE Quick_Links SHALL add a new Link to the panel.
3. IF the User submits with an empty or whitespace-only label, or an empty or whitespace-only URL, THEN THE Quick_Links SHALL not add a Link and SHALL display an inline validation message adjacent to the invalid input field.
4. IF the User submits a URL that does not begin with "http://" or "https://" (case-insensitive), THEN THE Quick_Links SHALL prepend "https://" to the URL before saving.
5. THE Quick_Links SHALL display each Link as a clickable button or anchor element showing the label text, accompanied by a delete button.
6. WHEN the User clicks a Link element, THE Quick_Links SHALL open the saved URL in a new browser tab using `target="_blank"` and `rel="noopener noreferrer"`.
7. WHEN the User clicks the delete button on a Link, THE Quick_Links SHALL remove that Link from the panel permanently.
8. WHEN any Link is added or deleted, THE Quick_Links SHALL persist the updated link array to LocalStorage.
9. WHEN the page loads, THE Quick_Links SHALL read the link array from LocalStorage and render all Links. IF LocalStorage contains no link data, THE Quick_Links SHALL render an empty panel with no error.
10. WHEN the total number of saved Links reaches 20, THE Quick_Links SHALL disable the "Add Link" button and display a message indicating the maximum limit has been reached. WHEN a Link is deleted and the count drops below 20, THE Quick_Links SHALL re-enable the "Add Link" button and remove the limit message.

---

### Requirement 6: Light/Dark Mode Toggle

**User Story:** As a User, I want to switch between light mode and dark mode, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme_Toggle button that remains within the viewport at all times regardless of scroll position, and that displays a visual indicator (e.g., icon or label) reflecting the currently active theme.
2. WHEN the current theme is light mode and the User activates the Theme_Toggle, THE Dashboard SHALL switch to dark mode, applying a dark color scheme to all visible elements.
3. WHEN the current theme is dark mode and the User activates the Theme_Toggle, THE Dashboard SHALL switch to light mode, applying a light color scheme to all visible elements.
4. WHEN the theme changes, THE Dashboard SHALL persist the selected theme value ("light" or "dark") to LocalStorage under a defined key.
5. WHEN the page loads, THE Dashboard SHALL read the saved theme from LocalStorage and apply it before the page body becomes visible to the User, such that no flash of the non-selected theme occurs.
6. WHERE no saved theme exists in LocalStorage, THE Dashboard SHALL default to the User's OS-level color scheme preference using the `prefers-color-scheme` media query. IF neither "light" nor "dark" can be determined, THE Dashboard SHALL default to light mode.
7. IF LocalStorage is unavailable (e.g., private browsing with storage blocked), THEN THE Dashboard SHALL still apply the OS preference or light mode default for the current session, and the Theme_Toggle SHALL remain functional for session-only theme switching without throwing an error.

---

### Requirement 7: Responsive Layout and Performance

**User Story:** As a User, I want the Dashboard to display correctly on desktop and mobile screen sizes and load quickly, so that I can use it on any device without friction.

#### Acceptance Criteria

1. THE Dashboard SHALL render without horizontal scrolling on viewport widths from 320px to 2560px.
2. THE Dashboard SHALL re-arrange widget layout to a single-column stack on viewport widths below 768px.
3. THE Dashboard SHALL load and become fully interactive (all widgets rendered and responding to User input) within 3 seconds on a connection with at least 25 Mbps download speed.
4. THE Dashboard SHALL consist of exactly one HTML file, one CSS file, and one JavaScript file, with no additional stylesheet or script dependencies.
5. THE Dashboard SHALL require no build step, server, or external dependency to run — opening `index.html` directly in a modern browser SHALL be sufficient.
6. THE Dashboard SHALL function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari, where "function correctly" means all acceptance criteria in Requirements 1–6 are satisfied with no layout breakage, missing content, or unhandled JavaScript errors in the browser console.

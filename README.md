# Todo List Web App

A clean, fast task manager built with **React 19 + TypeScript + Vite**, tested with
**Vitest + React Testing Library**. Tasks are stored in `localStorage`, so they survive a
page reload without any backend.

## Features

- Add tasks via the **Add** button or `Enter`; blank/whitespace-only input is rejected
- Tick a task to complete it; **double-click** its title (or press **Edit**) to rename it inline
  with `Enter` to save and `Escape` to cancel
- Filter by **All / Active / Completed** with a live "x tasks left" counter
- **Clear completed** for bulk removal, or delete individual tasks
- Automatic `localStorage` persistence with defensive parsing of corrupt payloads
- Responsive layout, keyboard accessible controls, light/dark themes via `prefers-color-scheme`

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| Script               | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Start the Vite dev server with hot reload             |
| `npm test`           | Run the whole Vitest suite once                       |
| `npm run test:watch` | Re-run tests on change                                |
| `npm run typecheck`  | Type-check the app and Vite config (`tsc -b`)         |
| `npm run build`      | Type-check then produce a production build in `dist/` |
| `npm run preview`    | Serve the built output locally                        |

## Project structure

```
src/
  App.tsx                 # Composition root: header, input, list, footer + filter state
  main.tsx                # React entry point
  index.css               # All styling (CSS variables, no CSS framework)
  types.ts                # Todo + Filter domain types and the filter predicate
  lib/
    id.ts                 # ID generation (crypto.randomUUID with fallback)
    storage.ts            # localStorage load/save with validation
  hooks/
    useTodos.ts           # Pure reducer + persistence + derived counters
  components/
    TodoInput.tsx         # Controlled "new task" form
    TodoList.tsx          # List + empty states
    TodoItem.tsx          # Single row: checkbox, title, inline editor, delete
    TodoFooter.tsx        # Counter, filter buttons, clear completed
  test/setup.ts           # jest-dom matchers, RTL cleanup, storage reset
```

## Design notes

- **Pure core, dumb UI.** All rules (add/toggle/rename/remove/clear-completed) live in
  `todosReducer`, which takes ids and timestamps as part of the action — deterministic and
  trivially unit-testable.
- **One source of truth.** `useTodos` owns state and persistence; components receive data and
  callbacks only, so none of them know about storage.
- **Array position is the order.** `add` prepends (newest first), so the stored list is already
  in display order — no separate `order` field to keep in sync.
- **Data is validated on read.** `loadTodos` drops malformed records and duplicate ids, and never
  throws on corrupt JSON; `saveTodos` swallows quota/privacy errors because storage is a
  best-effort enhancement.
- **Storage is only written after a real change.** Saving on the first render would overwrite a
  payload the app could not fully read (hand-edited or corrupt JSON), which may be the user's only
  copy. The guard compares against the hydrated array, so StrictMode's double-invoked effects
  cannot slip a write through either.
- **Explicit editing.** Renames save via **Save**/`Enter` and discard via **Cancel**/`Escape`
  instead of a save-on-blur handler, avoiding surprising double commits.

## Testing

```bash
npm test
```

- `src/hooks/useTodos.test.tsx` – reducer rules, hydration, persistence, corrupt-storage edge cases
- `src/App.test.tsx` – user-level flows with `user-event`: adding, completing, filtering, inline
  editing, deleting, clearing completed, and localStorage round-trips across remounts

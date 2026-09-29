import type { Priority, Todo } from '../types'
import { normalizeTags } from '../types'

export const STORAGE_KEY = 'todo-app.todos.v1'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isTodoLike(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    v.id !== '' &&
    typeof v.title === 'string' &&
    typeof v.completed === 'boolean' &&
    typeof v.createdAt === 'number' &&
    Number.isFinite(v.createdAt)
  )
}

function sanitizePriority(value: unknown): Priority {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium'
}

function sanitizeDueDate(value: unknown): string | null {
  return typeof value === 'string' && DATE_PATTERN.test(value) ? value : null
}

function sanitizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return normalizeTags(value.filter((tag): tag is string => typeof tag === 'string'))
}

/**
 * Read todos from localStorage. Never throws: anything unusable (missing key,
 * corrupt JSON, malformed records, duplicate ids) degrades quietly to a
 * best-effort list. Records saved before priority/due-date/tags existed are
 * upgraded with defaults; invalid new-style values are sanitized, not dropped.
 */
export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const todos: Todo[] = []
    for (const item of parsed) {
      if (isTodoLike(item) && !seen.has(item.id)) {
        seen.add(item.id)
        const record = item as unknown as Record<string, unknown>
        todos.push({
          id: item.id,
          title: item.title,
          completed: item.completed,
          createdAt: item.createdAt,
          priority: sanitizePriority(record.priority),
          dueDate: sanitizeDueDate(record.dueDate),
          tags: sanitizeTags(record.tags),
        })
      }
    }
    return todos
  } catch {
    return []
  }
}

/** Persist todos. Storage failures (quota, private mode) are swallowed on purpose. */
export function saveTodos(todos: readonly Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {
    // Best-effort enhancement: the app keeps working in memory.
  }
}

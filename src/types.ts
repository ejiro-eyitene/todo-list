export type Priority = 'low' | 'medium' | 'high'

export const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high']

export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: number
  priority: Priority
  /** ISO date string 'YYYY-MM-DD', or null when no deadline is set. */
  dueDate: string | null
  /** Lowercase, trimmed, unique. */
  tags: string[]
}

/** Editable metadata shared by the add form and the inline edit form. */
export interface TodoMeta {
  priority: Priority
  dueDate: string | null
  tags: string[]
}

export type Filter = 'all' | 'active' | 'completed'

export const FILTERS: readonly Filter[] = ['all', 'active', 'completed']

export function matchesFilter(todo: Todo, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'active':
      return !todo.completed
    case 'completed':
      return todo.completed
  }
}

/** Trim, lowercase, dedupe. Keeps insertion order. */
export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>()
  for (const tag of tags) {
    const clean = tag.trim().toLowerCase()
    if (clean !== '') seen.add(clean)
  }
  return [...seen]
}

/** Parse a comma-separated tag input like "work, URGENT, work" into clean tags. */
export function parseTagInput(raw: string): string[] {
  return normalizeTags(raw.split(','))
}

/**
 * Search titles and tags. A query starting with '#' searches tags only;
 * a bare '#' matches every todo that has at least one tag.
 */
export function matchesSearch(todo: Todo, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  if (q.startsWith('#')) {
    const tagQuery = q.slice(1)
    if (tagQuery === '') return todo.tags.length > 0
    return todo.tags.some((tag) => tag.includes(tagQuery))
  }
  return todo.title.toLowerCase().includes(q) || todo.tags.some((tag) => tag.includes(q))
}

/** True when the due date is strictly before today (local) and not done. */
export function isOverdue(todo: Todo, today = new Date()): boolean {
  if (todo.completed || todo.dueDate === null) return false
  const todayIso = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
  return todo.dueDate < todayIso
}

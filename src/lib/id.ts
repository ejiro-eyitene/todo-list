/** Generate a unique id, preferring the platform's crypto API. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

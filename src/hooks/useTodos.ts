import { useCallback, useEffect, useReducer, useRef } from 'react'
import { newId } from '../lib/id'
import { loadTodos, saveTodos } from '../lib/storage'
import { normalizeTags } from '../types'
import type { Todo, TodoMeta } from '../types'

export const DEFAULT_META: TodoMeta = { priority: 'medium', dueDate: null, tags: [] }

export type TodosAction =
  | ({ type: 'add'; id: string; createdAt: number; title: string } & TodoMeta)
  | { type: 'toggle'; id: string }
  | ({ type: 'update'; id: string; title: string } & TodoMeta)
  | { type: 'remove'; id: string }
  | { type: 'clear-completed' }

/** Pure reducer: every rule of the app lives here, ids/timestamps come in with the action. */
export function todosReducer(state: Todo[], action: TodosAction): Todo[] {
  switch (action.type) {
    case 'add':
      // Newest first; array position is the display order.
      return [
        {
          id: action.id,
          title: action.title,
          completed: false,
          createdAt: action.createdAt,
          priority: action.priority,
          dueDate: action.dueDate,
          tags: normalizeTags(action.tags),
        },
        ...state,
      ]
    case 'toggle':
      if (!state.some((todo) => todo.id === action.id)) return state
      return state.map((todo) =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo,
      )
    case 'update': {
      const title = action.title.trim()
      if (title === '' || !state.some((todo) => todo.id === action.id)) return state
      const tags = normalizeTags(action.tags)
      return state.map((todo) =>
        todo.id === action.id
          ? { ...todo, title, priority: action.priority, dueDate: action.dueDate, tags }
          : todo,
      )
    }
    case 'remove':
      if (!state.some((todo) => todo.id === action.id)) return state
      return state.filter((todo) => todo.id !== action.id)
    case 'clear-completed':
      return state.filter((todo) => !todo.completed)
  }
}

export function useTodos() {
  const hydrated = useRef<Todo[]>(loadTodos())
  const [todos, dispatch] = useReducer(todosReducer, hydrated.current)

  // Persist only when the list actually changed. Comparing against the last
  // saved array (instead of counting renders) also survives StrictMode's
  // double-invoked effects, and never overwrites a payload we merely hydrated.
  const lastSaved = useRef<Todo[]>(hydrated.current)
  useEffect(() => {
    if (todos === lastSaved.current) return
    lastSaved.current = todos
    saveTodos(todos)
  }, [todos])

  const addTodo = useCallback((title: string, meta: Partial<TodoMeta> = {}) => {
    const trimmed = title.trim()
    if (!trimmed) return
    dispatch({
      type: 'add',
      title: trimmed,
      id: newId(),
      createdAt: Date.now(),
      priority: meta.priority ?? DEFAULT_META.priority,
      dueDate: meta.dueDate ?? DEFAULT_META.dueDate,
      tags: meta.tags ?? DEFAULT_META.tags,
    })
  }, [])

  const toggleTodo = useCallback((id: string) => dispatch({ type: 'toggle', id }), [])

  const updateTodo = useCallback(
    (id: string, title: string, meta: TodoMeta) => dispatch({ type: 'update', id, title, ...meta }),
    [],
  )

  const removeTodo = useCallback((id: string) => dispatch({ type: 'remove', id }), [])

  const clearCompleted = useCallback(() => dispatch({ type: 'clear-completed' }), [])

  const activeCount = todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0)
  const completedCount = todos.length - activeCount

  return { todos, addTodo, toggleTodo, updateTodo, removeTodo, clearCompleted, activeCount, completedCount }
}

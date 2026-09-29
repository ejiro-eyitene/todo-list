import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEY } from '../lib/storage'
import { todosReducer, useTodos } from './useTodos'
import type { Todo } from '../types'

/** Seeds may look like old v1 records (no priority/dueDate/tags) or full v2 ones. */
type SeedTodo = Pick<Todo, 'id' | 'title' | 'completed' | 'createdAt'> &
  Partial<Pick<Todo, 'priority' | 'dueDate' | 'tags'>>

function seed(todos: readonly SeedTodo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function stored(): unknown {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw)
}

const existing: Todo = {
  id: 'a1',
  title: 'From storage',
  completed: false,
  createdAt: 1,
  priority: 'medium',
  dueDate: null,
  tags: [],
}

const medium = { priority: 'medium' as const, dueDate: null, tags: [] }

beforeEach(() => {
  localStorage.clear()
})

describe('todosReducer', () => {
  const base: Todo[] = [{ ...existing }]

  it('adds new todos at the front with metadata, normalizing tags', () => {
    const next = todosReducer(base, {
      type: 'add',
      title: 'New',
      id: 'b2',
      createdAt: 2,
      priority: 'high',
      dueDate: '2026-10-01',
      tags: ['Work', ' urgent ', 'work', ''],
    })
    expect(next.map((t) => t.id)).toEqual(['b2', 'a1'])
    expect(next[0]).toEqual({
      id: 'b2',
      title: 'New',
      completed: false,
      createdAt: 2,
      priority: 'high',
      dueDate: '2026-10-01',
      tags: ['work', 'urgent'],
    })
  })

  it('toggles completion only for the target id', () => {
    const next = todosReducer(base, { type: 'toggle', id: 'a1' })
    expect(next[0].completed).toBe(true)
    expect(todosReducer(next, { type: 'toggle', id: 'missing' })).toBe(next)
  })

  it('updates title and metadata together, trimming title and tags', () => {
    const next = todosReducer(base, {
      type: 'update',
      id: 'a1',
      title: '  Updated  ',
      priority: 'low',
      dueDate: '2026-10-05',
      tags: [' Home ', 'home'],
    })
    expect(next[0].title).toBe('Updated')
    expect(next[0].priority).toBe('low')
    expect(next[0].dueDate).toBe('2026-10-05')
    expect(next[0].tags).toEqual(['home'])
  })

  it('ignores updates with blank titles or unknown ids', () => {
    expect(todosReducer(base, { type: 'update', id: 'a1', title: '   ', ...medium })).toBe(base)
    expect(todosReducer(base, { type: 'update', id: 'missing', title: 'x', ...medium })).toBe(base)
  })

  it('removes by id and clears only completed todos', () => {
    const mixed: Todo[] = [
      { ...existing },
      { id: 'b2', title: 'Done', completed: true, createdAt: 2, ...medium },
    ]
    expect(todosReducer(mixed, { type: 'remove', id: 'b2' })).toEqual([existing])
    expect(todosReducer(mixed, { type: 'clear-completed' })).toEqual([existing])
  })
})

describe('useTodos', () => {
  it('hydrates the list from localStorage', () => {
    seed([existing])
    const { result } = renderHook(() => useTodos())
    expect(result.current.todos).toEqual([existing])
    expect(result.current.activeCount).toBe(1)
    expect(result.current.completedCount).toBe(0)
  })

  it('upgrades legacy records saved before priority/due/tags existed', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'old', title: 'Legacy', completed: false, createdAt: 1 }]),
    )
    const { result } = renderHook(() => useTodos())
    expect(result.current.todos[0]).toEqual({ id: 'old', title: 'Legacy', completed: false, createdAt: 1, ...medium })
  })

  it('degrades to an empty list for corrupt payloads without destroying them', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const { result } = renderHook(() => useTodos())
    expect(result.current.todos).toEqual([])
    // Mounting alone must not overwrite the only copy of the user's data.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{not json')
  })

  it('skips blank titles when adding', () => {
    const { result } = renderHook(() => useTodos())
    act(() => result.current.addTodo('   '))
    expect(result.current.todos).toEqual([])
  })

  it('adds with default metadata when none is given', () => {
    const { result } = renderHook(() => useTodos())
    act(() => result.current.addTodo('Plain task'))
    expect(result.current.todos[0]).toMatchObject({ title: 'Plain task', ...medium })
  })

  it('adds, toggles, updates, removes and persists each change', () => {
    const { result } = renderHook(() => useTodos())

    act(() => result.current.addTodo('  Buy milk  ', { priority: 'high', dueDate: '2026-10-05', tags: ['Shopping'] }))
    const added = result.current.todos[0]
    expect(added.title).toBe('Buy milk')
    expect(added.priority).toBe('high')
    expect(added.tags).toEqual(['shopping'])
    expect(stored()).toEqual([added])

    act(() => result.current.toggleTodo(added.id))
    expect(stored()).toEqual([{ ...added, completed: true }])

    act(() => result.current.updateTodo(added.id, 'Buy bread', { priority: 'low', dueDate: null, tags: [] }))
    expect(result.current.todos[0]).toMatchObject({ title: 'Buy bread', priority: 'low', dueDate: null, tags: [] })

    act(() => result.current.removeTodo(added.id))
    expect(result.current.todos).toEqual([])
    expect(stored()).toEqual([])
  })

  it('clears completed todos in bulk', () => {
    seed([
      existing,
      { id: 'b2', title: 'Finished', completed: true, createdAt: 2, ...medium },
    ])
    const { result } = renderHook(() => useTodos())
    act(() => result.current.clearCompleted())
    expect(result.current.todos).toEqual([existing])
    expect(result.current.completedCount).toBe(0)
    expect(stored()).toEqual([existing])
  })

  it('computes active and completed counts', () => {
    seed([
      existing,
      { id: 'b2', title: 'Done', completed: true, createdAt: 2, ...medium },
      { id: 'c3', title: 'Also done', completed: true, createdAt: 3, ...medium },
    ])
    const { result } = renderHook(() => useTodos())
    expect(result.current.activeCount).toBe(1)
    expect(result.current.completedCount).toBe(2)
  })
})

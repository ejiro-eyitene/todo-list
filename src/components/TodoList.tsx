import { TodoItem } from './TodoItem'
import type { Filter, Todo, TodoMeta } from '../types'

interface TodoListProps {
  todos: readonly Todo[]
  filter: Filter
  searchActive: boolean
  onToggle: (id: string) => void
  onUpdate: (id: string, title: string, meta: TodoMeta) => void
  onRemove: (id: string) => void
  onSelectTag: (tag: string) => void
}

function emptyMessage(filter: Filter, searchActive: boolean): string {
  if (searchActive) return 'No tasks match your search.'
  switch (filter) {
    case 'all':
      return 'No tasks yet — add one above to get started.'
    case 'active':
      return 'Nothing active. Enjoy the calm, or add a new task.'
    case 'completed':
      return 'Nothing completed yet — go check something off!'
  }
}

export function TodoList({
  todos,
  filter,
  searchActive,
  onToggle,
  onUpdate,
  onRemove,
  onSelectTag,
}: TodoListProps) {
  if (todos.length === 0) {
    return <p className="empty-state">{emptyMessage(filter, searchActive)}</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onSelectTag={onSelectTag}
        />
      ))}
    </ul>
  )
}

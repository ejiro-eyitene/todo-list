import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { PRIORITIES, isOverdue, parseTagInput } from '../types'
import type { Priority, Todo, TodoMeta } from '../types'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onUpdate: (id: string, title: string, meta: TodoMeta) => void
  onRemove: (id: string) => void
  onSelectTag: (tag: string) => void
}

export function TodoItem({ todo, onToggle, onUpdate, onRemove, onSelectTag }: TodoItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const [draftPriority, setDraftPriority] = useState<Priority>(todo.priority)
  const [draftDueDate, setDraftDueDate] = useState(todo.dueDate ?? '')
  const [draftTags, setDraftTags] = useState(todo.tags.join(', '))

  function startEditing() {
    setDraft(todo.title)
    setDraftPriority(todo.priority)
    setDraftDueDate(todo.dueDate ?? '')
    setDraftTags(todo.tags.join(', '))
    setEditing(true)
  }

  function save() {
    if (draft.trim() !== '') {
      onUpdate(todo.id, draft, {
        priority: draftPriority,
        dueDate: draftDueDate === '' ? null : draftDueDate,
        tags: parseTagInput(draftTags),
      })
    }
    setEditing(false)
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') save()
    if (event.key === 'Escape') setEditing(false)
  }

  const overdue = isOverdue(todo)

  return (
    <li className={`todo-item${todo.completed ? ' completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'complete'}`}
      />
      {editing ? (
        <span className="edit-form">
          <span className="edit-main">
            <input
              className="edit-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              aria-label="Edit task title"
              autoFocus
            />
            <button type="button" onClick={save}>
              Save
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </span>
          <span className="edit-details">
            <label>
              Priority
              <select
                value={draftPriority}
                onChange={(event) => setDraftPriority(event.target.value as Priority)}
              >
                {PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due
              <input
                type="date"
                value={draftDueDate}
                onChange={(event) => setDraftDueDate(event.target.value)}
              />
            </label>
            <label className="tags-field">
              Tags
              <input
                type="text"
                value={draftTags}
                onChange={(event) => setDraftTags(event.target.value)}
                placeholder="work, errands"
                onKeyDown={handleEditorKeyDown}
              />
            </label>
          </span>
        </span>
      ) : (
        <span className="content">
          <span className="title" onDoubleClick={startEditing} title="Double-click to edit">
            {todo.title}
          </span>
          <span className="meta">
            <span className={`badge priority-${todo.priority}`} aria-label={`Priority: ${todo.priority}`}>
              {todo.priority}
            </span>
            {todo.dueDate !== null && (
              <span className={`due-date${overdue ? ' overdue' : ''}`} title={overdue ? 'Overdue' : 'Due date'}>
                {overdue ? '⚠ ' : ''}
                {todo.dueDate}
              </span>
            )}
            {todo.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="tag-chip"
                onClick={() => onSelectTag(tag)}
                aria-label={`Filter by tag ${tag}`}
              >
                #{tag}
              </button>
            ))}
          </span>
        </span>
      )}
      <span className="actions">
        {!editing && (
          <button type="button" className="edit" onClick={startEditing}>
            Edit
          </button>
        )}
        <button type="button" className="delete" onClick={() => onRemove(todo.id)}>
          Delete
        </button>
      </span>
    </li>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { PRIORITIES } from '../types'
import type { Priority, TodoMeta } from '../types'

interface TodoInputProps {
  onAdd: (title: string, meta: TodoMeta) => void
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const canSubmit = title.trim() !== ''

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    onAdd(title, {
      priority,
      dueDate: dueDate === '' ? null : dueDate,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ''),
    })
    setTitle('')
    setPriority('medium')
    setDueDate('')
    setTags('')
  }

  return (
    <form className="todo-input" onSubmit={handleSubmit}>
      <div className="title-row">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task"
          autoFocus
        />
        <button type="submit" disabled={!canSubmit}>
          Add
        </button>
      </div>
      <div className="detail-row">
        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            {PRIORITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <label className="tags-field">
          Tags
          <input
            type="text"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="work, errands"
          />
        </label>
      </div>
    </form>
  )
}

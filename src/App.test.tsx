import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './lib/storage'
import type { Todo } from './types'

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

function listItem(name: string): HTMLElement {
  const checkbox = screen.getByRole('checkbox', { name: new RegExp(`^Mark "${name}"`) })
  const item = checkbox.closest('li')
  if (!item) throw new Error(`No list item found for "${name}"`)
  return item as HTMLElement
}

beforeEach(() => {
  localStorage.clear()
})

describe('adding tasks', () => {
  it('shows an empty state when there is nothing stored', () => {
    render(<App />)
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 tasks left')
  })

  it('adds a task with the button and with Enter, clearing the input', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'New task' })

    await user.type(input, 'Buy milk')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(within(listItem('Buy milk')).getByText('Buy milk')).toBeInTheDocument()
    expect(input).toHaveValue('')

    await user.type(input, 'Write tests')
    await user.keyboard('{Enter}')
    expect(screen.getByText('Write tests')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('2 tasks left')
  })

  it('refuses blank and whitespace-only titles', async () => {
    const user = userEvent.setup()
    render(<App />)
    const add = screen.getByRole('button', { name: 'Add' })
    expect(add).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: 'New task' }), '   ')
    expect(add).toBeDisabled()
    await user.keyboard('{Enter}')
    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument()
  })
})

describe('completing, editing and deleting', () => {
  it('marks a task complete and hides it under the Active filter', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'New task' }), 'Ship it')
    await user.keyboard('{Enter}')

    await user.click(within(listItem('Ship it')).getByRole('checkbox'))
    expect(listItem('Ship it')).toHaveClass('completed')

    await user.click(screen.getByRole('button', { name: 'Active' }))
    expect(screen.queryByText('Ship it')).not.toBeInTheDocument()
    expect(screen.getByText(/Nothing active/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Completed' }))
    expect(screen.getByText('Ship it')).toBeInTheDocument()
  })

  it('renames a task via the Edit button and discards on Cancel', async () => {
    const user = userEvent.setup()
    seed([{ id: 'a1', title: 'Old title', completed: false, createdAt: 1 }])
    render(<App />)

    await user.click(within(listItem('Old title')).getByRole('button', { name: 'Edit' }))
    const editor = screen.getByRole('textbox', { name: 'Edit task title' })
    await user.clear(editor)
    await user.type(editor, 'New title')
    await user.keyboard('{Enter}')
    expect(screen.getByText('New title')).toBeInTheDocument()

    await user.click(within(listItem('New title')).getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByRole('textbox', { name: 'Edit task title' }))
    await user.type(screen.getByRole('textbox', { name: 'Edit task title' }), 'Discarded')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('New title')).toBeInTheDocument()
    expect(screen.queryByText('Discarded')).not.toBeInTheDocument()
  })

  it('deletes a single task', async () => {
    const user = userEvent.setup()
    seed([
      { id: 'a1', title: 'Keep me', completed: false, createdAt: 1 },
      { id: 'b2', title: 'Drop me', completed: false, createdAt: 2 },
    ])
    render(<App />)

    await user.click(within(listItem('Drop me')).getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Drop me')).not.toBeInTheDocument()
    expect(screen.getByText('Keep me')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 task left')
  })
})

describe('filters and bulk actions', () => {
  it('highlights the active filter button', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Completed' }))
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears completed tasks in bulk and hides the button when none remain', async () => {
    const user = userEvent.setup()
    seed([
      { id: 'a1', title: 'Still active', completed: false, createdAt: 1 },
      { id: 'b2', title: 'All done', completed: true, createdAt: 2 },
    ])
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('1 task left')

    await user.click(screen.getByRole('button', { name: 'Clear completed' }))
    expect(screen.queryByText('All done')).not.toBeInTheDocument()
    expect(screen.getByText('Still active')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear completed' })).not.toBeInTheDocument()
  })
})

describe('persistence', () => {
  it('keeps tasks across a remount', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'New task' }), 'Remember me')
    await user.keyboard('{Enter}')
    first.unmount()

    expect(stored()).toMatchObject([{ title: 'Remember me', completed: false }])

    render(<App />)
    expect(screen.getByText('Remember me')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 task left')
  })

  it('persists completion toggles', async () => {
    const user = userEvent.setup()
    seed([{ id: 'a1', title: 'Toggle me', completed: false, createdAt: 1 }])
    render(<App />)

    await user.click(within(listItem('Toggle me')).getByRole('checkbox'))
    expect(stored()).toMatchObject([{ id: 'a1', title: 'Toggle me', completed: true, createdAt: 1 }])
  })
})

describe('priority, due dates and tags', () => {
  it('adds a task with priority, due date and tags, shown on the item', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('textbox', { name: 'New task' }), 'File report')
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    fireEvent.change(screen.getByLabelText('Due'), { target: { value: '2026-10-05' } })
    await user.type(screen.getByLabelText('Tags'), 'work, Office, work')
    await user.keyboard('{Enter}')

    const item = listItem('File report')
    expect(within(item).getByText('high')).toBeInTheDocument()
    expect(within(item).getByText('2026-10-05')).toBeInTheDocument()
    expect(within(item).getByText('#work')).toBeInTheDocument()
    expect(within(item).getByText('#office')).toBeInTheDocument()
    expect(stored()).toMatchObject([{ title: 'File report', priority: 'high', dueDate: '2026-10-05', tags: ['work', 'office'] }])
  })

  it('edits priority, due date and tags through the edit form', async () => {
    const user = userEvent.setup()
    seed([{ id: 'a1', title: 'Adjust me', completed: false, createdAt: 1 }])
    render(<App />)

    await user.click(within(listItem('Adjust me')).getByRole('button', { name: 'Edit' }))
    const editing = within(listItem('Adjust me'))
    await user.selectOptions(editing.getByLabelText('Priority'), 'low')
    fireEvent.change(editing.getByLabelText('Due'), { target: { value: '2026-12-01' } })
    await user.clear(editing.getByLabelText('Tags'))
    await user.type(editing.getByLabelText('Tags'), 'personal')
    await user.click(editing.getByRole('button', { name: 'Save' }))

    const item = listItem('Adjust me')
    expect(within(item).getByText('low')).toBeInTheDocument()
    expect(within(item).getByText('2026-12-01')).toBeInTheDocument()
    expect(within(item).getByText('#personal')).toBeInTheDocument()
  })
})

describe('search', () => {
  it('filters by title and by tag, with # limiting to tags only', async () => {
    const user = userEvent.setup()
    seed([
      { id: 'a1', title: 'Write report', completed: false, createdAt: 1, priority: 'medium', dueDate: null, tags: ['work'] },
      { id: 'b2', title: 'Buy paint', completed: false, createdAt: 2, priority: 'medium', dueDate: null, tags: ['home', 'work'] },
      { id: 'c3', title: 'Stretch', completed: false, createdAt: 3, priority: 'medium', dueDate: null, tags: [] },
    ])
    render(<App />)
    const search = screen.getByRole('searchbox', { name: 'Search tasks' })

    await user.type(search, 'report')
    expect(screen.getByText('Write report')).toBeInTheDocument()
    expect(screen.queryByText('Buy paint')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'work')
    expect(screen.getByText('Write report')).toBeInTheDocument()
    expect(screen.getByText('Buy paint')).toBeInTheDocument()
    expect(screen.queryByText('Stretch')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, '#home')
    expect(screen.queryByText('Write report')).not.toBeInTheDocument()
    expect(screen.getByText('Buy paint')).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'nomatch')
    expect(screen.getByText(/No tasks match your search/)).toBeInTheDocument()
  })

  it('clicking a tag chip searches for that tag, and Clear resets', async () => {
    const user = userEvent.setup()
    seed([
      { id: 'a1', title: 'Tagged', completed: false, createdAt: 1, priority: 'medium', dueDate: null, tags: ['urgent'] },
      { id: 'b2', title: 'Untagged', completed: false, createdAt: 2, priority: 'medium', dueDate: null, tags: [] },
    ])
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Filter by tag urgent' }))
    expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue('#urgent')
    expect(screen.getByText('Tagged')).toBeInTheDocument()
    expect(screen.queryByText('Untagged')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('Tagged')).toBeInTheDocument()
    expect(screen.getByText('Untagged')).toBeInTheDocument()
  })
})


import { useMemo, useState } from 'react'
import { TodoFooter } from './components/TodoFooter'
import { TodoInput } from './components/TodoInput'
import { TodoList } from './components/TodoList'
import { useTodos } from './hooks/useTodos'
import { matchesFilter, matchesSearch } from './types'
import type { Filter } from './types'

export default function App() {
  const { todos, addTodo, toggleTodo, updateTodo, removeTodo, clearCompleted, activeCount, completedCount } =
    useTodos()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const searchActive = query.trim() !== ''
  const visibleTodos = useMemo(
    () => todos.filter((todo) => matchesFilter(todo, filter) && matchesSearch(todo, query)),
    [todos, filter, query],
  )

  return (
    <main className="app">
      <div className="card">
        <h1>Todo List</h1>
        <TodoInput onAdd={addTodo} />
        <div className="search-bar">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks or #tags"
            aria-label="Search tasks"
          />
          {searchActive && (
            <button type="button" className="clear-search" onClick={() => setQuery('')}>
              Clear
            </button>
          )}
        </div>
        <TodoList
          todos={visibleTodos}
          filter={filter}
          searchActive={searchActive}
          onToggle={toggleTodo}
          onUpdate={updateTodo}
          onRemove={removeTodo}
          onSelectTag={(tag) => setQuery(`#${tag}`)}
        />
        <TodoFooter
          filter={filter}
          onFilterChange={setFilter}
          activeCount={activeCount}
          completedCount={completedCount}
          onClearCompleted={clearCompleted}
        />
      </div>
      <p className="hint">
        Double-click a task to edit. Search matches titles and tags; prefix with # for tags only. Tasks are
        saved in your browser.
      </p>
    </main>
  )
}

import { FILTERS } from '../types'
import type { Filter } from '../types'

interface TodoFooterProps {
  filter: Filter
  onFilterChange: (filter: Filter) => void
  activeCount: number
  completedCount: number
  onClearCompleted: () => void
}

export function TodoFooter({
  filter,
  onFilterChange,
  activeCount,
  completedCount,
  onClearCompleted,
}: TodoFooterProps) {
  return (
    <footer className="todo-footer">
      <span className="counter" role="status">
        {activeCount} {activeCount === 1 ? 'task' : 'tasks'} left
      </span>
      <div className="filters" role="group" aria-label="Filter tasks">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            className={option}
            aria-pressed={filter === option}
            onClick={() => onFilterChange(option)}
          >
            {option === 'all' ? 'All' : option === 'active' ? 'Active' : 'Completed'}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="clear-completed"
        onClick={onClearCompleted}
        disabled={completedCount === 0}
        hidden={completedCount === 0}
      >
        Clear completed
      </button>
    </footer>
  )
}

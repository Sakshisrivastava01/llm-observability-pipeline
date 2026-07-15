import { useFilterStore } from '@/store'
import { Filter, X, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

export function FilterBar({ className }) {
  const {
    selectedModels, availableModels, startDate, endDate,
    setModels, setDateRange, resetFilters,
  } = useFilterStore()

  function toggleModel(model) {
    if (selectedModels.includes(model)) {
      setModels(selectedModels.filter((m) => m !== model))
    } else {
      setModels([...selectedModels, model])
    }
  }

  const defaultStart = format(subDays(new Date(), 7), 'yyyy-MM-dd')
  const defaultEnd = format(new Date(), 'yyyy-MM-dd')
  const hasActiveFilters = selectedModels.length > 0 || startDate !== defaultStart || endDate !== defaultEnd

  return (
    <div className={clsx('flex flex-wrap items-center gap-3', className)}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Filter size={12} />
        <span className="font-medium uppercase tracking-wider">Filters</span>
      </div>

      {/* Model chips */}
      <div className="flex flex-wrap gap-1.5">
        {availableModels.map((model) => (
          <button
            key={model}
            onClick={() => toggleModel(model)}
            className={clsx(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
              selectedModels.includes(model)
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                : 'bg-surface-500 text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-300'
            )}
          >
            {model}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 ml-auto">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setDateRange(e.target.value, endDate)}
          className="form-input h-8 text-xs py-1"
        />
        <span className="text-slate-600 text-xs">→</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setDateRange(startDate, e.target.value)}
          className="form-input h-8 text-xs py-1"
        />

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn-ghost p-1.5 text-xs gap-1"
            title="Reset filters"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

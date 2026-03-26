import React from 'react'
import { ChevronDown, ListChecks, Loader2 } from 'lucide-react'
import { List } from '@/features/shared'

interface ListSelectorProps {
  lists?: Array<List | null | undefined>
  currentList?: List | null
  onChange: (list: List) => void
  loading?: boolean
  label?: string
  placeholder?: string
  hideLabel?: boolean
  hideDescription?: boolean
}

const isValidList = (value: List | null | undefined): value is List => {
  return Boolean(value && typeof value === 'object' && value.id && value.name)
}

const ListSelector: React.FC<ListSelectorProps> = ({
  lists = [],
  currentList,
  onChange,
  loading = false,
  label = 'Cambiar lista activa',
  placeholder = 'Selecciona una lista',
  hideLabel = false,
  hideDescription = false,
}) => {
  const safeLists = lists.filter(isValidList)
  const hasLists = safeLists.length > 0

  const safeCurrentList =
    currentList && isValidList(currentList)
      ? currentList
      : currentList?.id 
        ? safeLists.find((list) => list.id === currentList.id) || null
        : null

  const selectedValue = safeCurrentList?.id ?? ''

  return (
    <div className="w-full">
      {!hideLabel && (
        <label
          htmlFor="active-list-selector"
          className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--color-text-muted)]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
        </div>

        <select
          id="active-list-selector"
          value={selectedValue}
          onChange={(e) => {
            const nextList = safeLists.find((list) => list.id === e.target.value)
            if (nextList) onChange(nextList)
          }}
          disabled={loading || !hasLists}
          className="list-selector-select w-full appearance-none rounded-xl border py-2.5 pl-10 pr-11 text-xs font-bold font-mono tracking-widest uppercase outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: 'rgba(var(--color-accent-primary-rgb), 0.3)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            boxShadow: 'inset 0 0 10px rgba(var(--color-accent-primary-rgb), 0.05)',
          }}
        >
          {!safeCurrentList && <option value="">{placeholder}</option>}
          {safeLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {!hideDescription && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {loading
            ? 'Cargando listas...'
            : safeCurrentList
              ? `Ahora mismo estás trabajando sobre "${safeCurrentList.name}".`
              : hasLists
                ? 'Selecciona qué lista quieres usar como contexto activo.'
                : 'Todavía no hay listas disponibles.'}
        </p>
      )}
    </div>
  )
}

export default ListSelector

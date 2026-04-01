import React from 'react'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ListChecks, Loader2 } from 'lucide-react'
import { List, useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'

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
  const { theme } = useTheme()
  const isRetroCartoon = theme === 'retro-cartoon'
  const isTerminal = theme === 'terminal'
  const safeLists = lists.filter(isValidList)
  const hasLists = safeLists.length > 0

  const safeCurrentList =
    currentList && isValidList(currentList)
      ? currentList
      : currentList?.id 
        ? safeLists.find((list) => list.id === currentList.id) || null
        : null

  const selectedValue = safeCurrentList?.id ?? ''
  const triggerText =
    safeCurrentList?.name
      ? formatRetroHeading(safeCurrentList.name, theme)
      : formatRetroHeading(placeholder, theme)

  return (
    <div className="w-full">
      {!hideLabel && (
        <label
          htmlFor="active-list-selector"
          className={`mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] ${
            isRetroCartoon ? 'theme-heading-font' : ''
          }`}
        >
          {formatRetroHeading(label, theme)}
        </label>
      )}

      <Select.Root
        value={selectedValue}
        onValueChange={(value) => {
          const nextList = safeLists.find((list) => list.id === value)
          if (nextList) onChange(nextList)
        }}
        disabled={loading || !hasLists}
      >
        <Select.Trigger
          id="active-list-selector"
          aria-label={formatRetroHeading(label, theme)}
          className={`group flex w-full items-center justify-between gap-3 rounded-xl border py-2.5 pl-3 pr-3 text-xs font-bold uppercase tracking-widest outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isRetroCartoon
              ? 'theme-heading-font border-[3px] border-black bg-white text-black shadow-[4px_4px_0px_0px_#000000] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000000]'
              : isTerminal
                ? 'terminal-button theme-heading-font rounded-md hover:translate-y-0'
                : 'font-mono'
          }`}
          style={{
            borderColor: isRetroCartoon ? '#000000' : 'rgba(var(--color-accent-primary-rgb), 0.3)',
            background: isRetroCartoon ? '#ffffff' : isTerminal ? 'rgba(0, 0, 0, 0.88)' : 'var(--color-bg-secondary)',
            color: isRetroCartoon ? '#000000' : isTerminal ? 'var(--color-accent-primary)' : 'var(--color-text-primary)',
            boxShadow: isRetroCartoon
              ? '4px 4px 0px 0px #000000'
              : isTerminal
                ? 'inset 0 0 0 1px rgba(var(--color-accent-primary-rgb), 0.08), 0 0 12px rgba(var(--color-accent-primary-rgb), 0.08)'
                : 'inset 0 0 10px rgba(var(--color-accent-primary-rgb), 0.05)',
          }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className={isRetroCartoon ? 'text-black' : 'text-[var(--color-text-muted)]'}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
            </span>
            <Select.Value placeholder={formatRetroHeading(placeholder, theme)}>
              {triggerText}
            </Select.Value>
          </div>
          <Select.Icon className={isRetroCartoon ? 'text-black' : 'text-[var(--color-text-muted)]'}>
            <ChevronDown className="h-4 w-4" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={8}
            className={`z-[120] overflow-hidden rounded-xl border ${
              isRetroCartoon
                ? 'border-[3px] border-black bg-white text-black shadow-[6px_6px_0px_0px_#000000]'
                : isTerminal
                  ? 'terminal-surface rounded-md text-[var(--color-accent-primary)]'
                  : 'border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-2xl'
            }`}
          >
            <Select.Viewport className="p-1.5">
              {safeLists.map((list) => (
                <Select.Item
                  key={list.id}
                  value={list.id}
                  className={`relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-3 pr-9 text-xs font-bold uppercase tracking-widest outline-none transition ${
                    isRetroCartoon
                      ? 'theme-heading-font text-black data-[highlighted]:bg-[#fff4a8] data-[highlighted]:text-black'
                      : isTerminal
                        ? 'theme-heading-font rounded-sm text-[var(--color-accent-primary)] data-[highlighted]:bg-[var(--color-accent-primary)] data-[highlighted]:text-[var(--color-bg-base)]'
                        : 'font-mono data-[highlighted]:bg-[rgba(var(--color-accent-primary-rgb),0.12)] data-[highlighted]:text-[var(--color-accent-primary)]'
                  }`}
                >
                  <Select.ItemText>{formatRetroHeading(list.name, theme)}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-3 inline-flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {!hideDescription && (
        <p className={`mt-2 text-xs text-[var(--color-text-muted)] ${isRetroCartoon || isTerminal ? 'theme-heading-font' : ''}`}>
          {loading
            ? formatRetroHeading('Cargando listas...', theme)
            : safeCurrentList
              ? formatRetroHeading(`Ahora mismo estas trabajando sobre "${safeCurrentList.name}".`, theme)
              : hasLists
                ? formatRetroHeading('Selecciona que lista quieres usar como contexto activo.', theme)
                : formatRetroHeading('Todavia no hay listas disponibles.', theme)}
        </p>
      )}
    </div>
  )
}

export default ListSelector

import { List } from '@/features/shared'

interface ListSelectorProps {
  lists: List[]
  currentList: List | null
  onChange: (list: List) => void
  loading?: boolean
}

const ListSelector = ({
  lists,
  currentList,
  onChange,
  loading = false
}: ListSelectorProps) => {

  if (loading) {
    return (
      <div 
        className="flex items-center gap-3 px-4 py-2 bg-[rgba(var(--color-accent-primary-rgb),0.05)] border border-[rgba(var(--color-accent-primary-rgb),0.3)] animate-pulse"
        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
      >
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#0ff] opacity-70">
          SYS.LOADING_LNK...
        </span>
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div 
        className="flex items-center gap-3 px-4 py-2 bg-[rgba(var(--color-accent-secondary-rgb),0.05)] border border-[rgba(var(--color-accent-secondary-rgb),0.3)]"
        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
      >
        <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent-secondary)] opacity-70">
          SYS.ERR_NO_LNK
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 relative z-[60]">
      <label
        htmlFor="list-selector"
        className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--color-text-muted)] opacity-80"
      >
        TARGET:
      </label>
      <div className="relative">
        <select
          id="list-selector"
          value={currentList?.id || ''}
          onChange={(e) => {
            const selectedList = lists.find((list) => list.id === e.target.value)
            if (selectedList) {
              onChange(selectedList)
            }
          }}
          className="appearance-none pl-4 pr-10 py-2 bg-[rgba(var(--color-accent-primary-rgb),0.1)] border border-[rgba(var(--color-accent-primary-rgb),0.4)] text-[#0ff] font-mono text-xs uppercase tracking-wide
                     hover:border-[#0ff] hover:bg-[rgba(var(--color-accent-primary-rgb),0.15)] focus:outline-none focus:border-[#0ff] focus:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] transition-all cursor-pointer"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id} className="bg-black text-white font-mono">
              {list.name}
            </option>
          ))}
        </select>
        <div className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center pointer-events-none border-l border-[rgba(var(--color-accent-primary-rgb),0.2)]">
          <div className="w-2 h-2 border-b-2 border-r-2 border-[#0ff] transform rotate-45 -translate-y-1"></div>
        </div>
      </div>
    </div>
  )
}

export default ListSelector

import React from 'react'
import { List } from '@/features/shared'
import ListSelector from './ListSelector'

interface ListActiveHeaderProps {
  currentList?: List
  lists: List[]
  setCurrentList?: (list: List) => void
  loadingLists?: boolean
  pendingCount: number
  watchedCount: number
  onCreateList: () => void
  onInvite: () => void
  onListChange: (list: List) => void
  onFocusDecisionBlock: () => void
  createListLabel: string
  inviteLabel: string
}

const ListActiveHeader: React.FC<ListActiveHeaderProps> = ({
  currentList,
  lists,
  setCurrentList,
  loadingLists,
  pendingCount,
  watchedCount,
  onCreateList,
  onInvite,
  onListChange,
  onFocusDecisionBlock,
  createListLabel,
  inviteLabel,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.22)] bg-[rgba(0,0,0,0.42)] p-4 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.05)] md:p-5">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white md:text-2xl">
              {currentList?.name || 'Sin lista seleccionada'}
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {lists.length > 0 && setCurrentList && (
              <div className="min-w-[280px] flex-1">
                <ListSelector
                  lists={lists}
                  currentList={currentList}
                  onChange={onListChange}
                  loading={loadingLists}
                />
              </div>
            )}

            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.5)] bg-[rgba(var(--color-accent-primary-rgb),0.1)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-[#0ff] transition-all hover:border-[#0ff] hover:bg-[rgba(var(--color-accent-primary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.4)]"
              onClick={onCreateList}
            >
              <span className="opacity-70">+</span> [ {createListLabel} ]
            </button>

            {currentList && (
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(var(--color-accent-secondary-rgb),0.5)] bg-[rgba(var(--color-accent-secondary-rgb),0.1)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-accent-secondary transition-all hover:border-[var(--color-accent-secondary)] hover:bg-[rgba(var(--color-accent-secondary-rgb),0.2)] hover:shadow-[0_0_15px_rgba(var(--color-accent-secondary-rgb),0.4)]"
                onClick={onInvite}
              >
                <span className="opacity-70">{'>'}</span> [ {inviteLabel} ]
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/40 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
              Pendientes
            </p>
            <h3 className="text-xl font-semibold text-white">{pendingCount}</h3>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Vistos
            </p>
            <h3 className="text-xl font-semibold text-white">{watchedCount}</h3>
          </div>

          <button
            type="button"
            onClick={onFocusDecisionBlock}
            className="rounded-2xl border border-purple-500/30 bg-purple-500/8 px-4 py-3 text-left transition hover:border-purple-500/50 hover:bg-purple-500/12"
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-purple-400">
              Ir a
            </p>
            <h3 className="text-sm font-semibold text-white">Pendientes</h3>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ListActiveHeader
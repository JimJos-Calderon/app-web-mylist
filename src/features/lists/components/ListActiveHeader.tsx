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
  onRandomPick?: () => void
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
  onRandomPick,
}) => {
  return (
    <section className="mb-6 rounded-2xl border border-[rgba(var(--color-accent-primary-rgb),0.22)] bg-[var(--color-bg-elevated)] p-4 shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.05)] md:p-5">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--color-text-primary)] md:text-2xl">
              {currentList?.name || 'Sin lista seleccionada'}
            </h2>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-60">
              {currentList ? 'ID_ACTIVE_CONTEXT' : 'SYSTEM_IDLE'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lists.length > 0 && setCurrentList && (
              <div className="h-11 min-w-[200px] max-w-xs flex-1">
                <ListSelector
                  lists={lists}
                  currentList={currentList}
                  onChange={onListChange}
                  loading={loadingLists}
                  hideLabel
                  hideDescription
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-xl border px-5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
                style={{
                  borderColor: 'rgba(var(--color-accent-primary-rgb), 0.4)',
                  background: 'rgba(var(--color-accent-primary-rgb), 0.08)',
                  color: 'var(--color-accent-primary)',
                  boxShadow: '0 0 15px rgba(var(--color-accent-primary-rgb), 0.05)',
                }}
                onClick={onCreateList}
              >
                <span className="opacity-70">+</span> [ {createListLabel} ]
              </button>

              {currentList && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border px-5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{
                      borderColor: 'rgba(var(--color-accent-secondary-rgb), 0.4)',
                      background: 'rgba(var(--color-accent-secondary-rgb), 0.08)',
                      color: 'var(--color-accent-secondary)',
                      boxShadow: '0 0 15px rgba(var(--color-accent-secondary-rgb), 0.05)',
                    }}
                    onClick={onInvite}
                  >
                    <span className="opacity-70">{'>'}</span> [ {inviteLabel} ]
                  </button>

                  <button
                    type="button"
                    className="group flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(var(--color-accent-primary-rgb),0.3)] bg-[rgba(var(--color-accent-primary-rgb),0.05)] text-[var(--color-accent-primary)] transition-all hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] hover:shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.1)]"
                    onClick={onRandomPick}
                    title="Selección Aleatoria"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:rotate-12"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h.01" />
                      <path d="M17 7h.01" />
                      <path d="M7 17h.01" />
                      <path d="M17 17h.01" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <div
            className="rounded-xl border px-3 py-2 transition-all"
            style={{ 
              borderColor: 'rgba(var(--color-accent-primary-rgb), 0.3)', 
              background: 'rgba(var(--color-accent-primary-rgb), 0.05)',
              boxShadow: '0 0 10px rgba(var(--color-accent-primary-rgb), 0.05)'
            }}
          >
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-accent-primary opacity-70">
              Pendientes
            </p>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{pendingCount}</h3>
          </div>

          <div
            className="rounded-xl border px-3 py-2 transition-all"
            style={{ 
              borderColor: 'rgba(var(--color-accent-primary-rgb), 0.15)', 
              background: 'rgba(0, 0, 0, 0.2)',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
            }}
          >
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-70">
              Vistos
            </p>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{watchedCount}</h3>
          </div>

          <button
            type="button"
            onClick={onFocusDecisionBlock}
            className="rounded-xl border px-3 py-2 text-left transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ 
              borderColor: 'rgba(var(--color-accent-secondary-rgb), 0.3)', 
              background: 'rgba(var(--color-accent-secondary-rgb), 0.08)',
              boxShadow: '0 0 15px rgba(var(--color-accent-secondary-rgb), 0.1)'
            }}
          >
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-accent-secondary opacity-70">
              Ir a
            </p>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Pendientes</h3>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ListActiveHeader

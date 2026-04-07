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
    <section className="list-active-header font-heading mb-6 p-4 md:p-5">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
            <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--color-text-primary)] md:text-2xl">
              {currentList?.name || 'Sin lista seleccionada'}
            </h2>
            <p className="list-active-header__eyebrow text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-60">
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
              <button type="button" className="ui-action-primary" onClick={onCreateList}>
                <span className="ui-action-plus leading-none">+</span>
                {createListLabel}
              </button>

              {currentList && (
                <div className="flex gap-2">
                  <button type="button" className="ui-action-secondary" onClick={onInvite}>
                    {inviteLabel}
                  </button>

                  <button
                    type="button"
                    className="ui-action-icon group"
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
          <div className="ui-stat-pending">
            <p className="ui-stat-label">Pendientes</p>
            <h3 className="ui-stat-number">{pendingCount}</h3>
          </div>

          <div className="ui-stat-watched">
            <p className="ui-stat-label">Vistos</p>
            <h3 className="ui-stat-number">{watchedCount}</h3>
          </div>

          <button type="button" onClick={onFocusDecisionBlock} className="ui-stat-cta">
            <p className="ui-stat-label">Ir a</p>
            <h3 className="ui-stat-cta-title">Pendientes</h3>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ListActiveHeader

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Users, XCircle, Loader2, ArrowRight } from 'lucide-react'
import HudContainer from '@/features/shared/components/HudContainer'
import TechLabel from '@/features/shared/components/TechLabel'
import { useTheme } from '@/features/shared'

type PendingInvite = {
  list_id: string
  list_name: string
  list_description: string | null
  invite_code: string
}

type PendingInviteModalProps = {
  pendingInvite: PendingInvite | null
  inviteJoining: boolean
  inviteError: string | null
  onClose: () => void
  onJoin: () => Promise<void> | void
}

const PendingInviteModal: React.FC<PendingInviteModalProps> = ({
  pendingInvite,
  inviteJoining,
  inviteError,
  onClose,
  onJoin,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isTerminal = theme === 'terminal'

  if (!pendingInvite) return null

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-4">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in ${isTerminal ? 'duration-75' : 'duration-200'}`} />
      <div className={`relative w-full max-w-md animate-in zoom-in-95 ${isTerminal ? 'duration-75' : 'duration-200'}`}>
        <HudContainer
          className={`p-0 ${
            isTerminal
              ? 'terminal-surface border-[rgba(var(--color-accent-primary-rgb),0.8)] bg-[rgba(0,0,0,0.92)] shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.14)]'
              : 'border-[rgba(var(--color-accent-primary-rgb),0.5)] shadow-[0_0_40px_rgba(var(--color-accent-primary-rgb),0.15)] bg-[rgba(0,0,0,0.6)]'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(var(--color-accent-primary-rgb),0.2)]">
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 border flex items-center justify-center shrink-0 ${
                  isTerminal
                    ? 'bg-[rgba(var(--color-accent-primary-rgb),0.08)] border-[rgba(var(--color-accent-primary-rgb),0.55)] rounded-none'
                    : 'bg-[rgba(var(--color-accent-primary-rgb),0.08)] border-[rgba(var(--color-accent-primary-rgb),0.4)]'
                }`}
                style={isTerminal ? undefined : { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <Users className="w-5 h-5 text-accent-primary drop-shadow-[0_0_8px_rgba(var(--color-accent-primary-rgb),0.6)]" />
              </div>
              <div className="flex flex-col gap-1">
                <TechLabel text="SYS.PENDING_REQ" blink />
                <h2 className={`text-lg font-black uppercase tracking-[0.1em] text-[var(--color-text-primary)] leading-none ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                  {t('invite_notification.title')}
                </h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div
              className={`px-5 py-4 border ${
                isTerminal
                  ? 'rounded-none bg-[rgba(var(--color-accent-primary-rgb),0.05)] border-[rgba(var(--color-accent-primary-rgb),0.45)]'
                  : 'bg-[rgba(var(--color-accent-primary-rgb),0.05)] border-[rgba(var(--color-accent-primary-rgb),0.2)]'
              }`}
              style={isTerminal ? undefined : { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
            >
              <p className={`text-[10px] font-bold uppercase tracking-widest text-accent-primary opacity-70 mb-1 ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                {'>'} TARGET: LIST
              </p>
              <h2 className={`text-[var(--color-text-primary)] font-bold text-sm leading-tight text-xl mb-2 ${isTerminal ? 'theme-heading-font' : 'font-mono'}`}>
                {pendingInvite.list_name}
              </h2>
              {pendingInvite.list_description && (
                <p className={`text-[var(--color-text-muted)] text-xs mt-2 opacity-80 ${isTerminal ? 'theme-body-font' : 'font-mono'}`}>
                  {pendingInvite.list_description}
                </p>
              )}
            </div>

            {inviteError && (
              <div
                className={`px-4 py-3 border text-xs flex items-center gap-2 ${
                  isTerminal
                    ? 'rounded-none bg-[rgba(var(--color-accent-secondary-rgb),0.08)] border-[rgba(var(--color-accent-secondary-rgb),0.5)] text-accent-secondary theme-body-font'
                    : 'bg-[rgba(var(--color-accent-secondary-rgb),0.1)] border-[rgba(var(--color-accent-secondary-rgb),0.4)] text-accent-secondary font-mono'
                }`}
                style={isTerminal ? undefined : { clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
              >
                <XCircle className="w-4 h-4 text-accent-secondary shrink-0" />
                <span>{'> ERR:'} {inviteError}</span>
              </div>
            )}

            <div className="flex gap-4 pt-2 w-full">
              <button
                onClick={onClose}
                disabled={inviteJoining}
                className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed ${
                  isTerminal
                    ? 'terminal-button theme-heading-font rounded-none'
                    : 'bg-transparent hover:bg-[rgba(var(--color-accent-primary-rgb),0.1)] text-[var(--color-text-primary)] font-mono transition-all border border-[rgba(var(--color-accent-primary-rgb),0.4)] hover:border-accent-primary hover:text-accent-primary'
                }`}
                style={isTerminal ? undefined : { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                {t('invite_notification.reject_button')}
              </button>

              <button
                disabled={inviteJoining}
                onClick={onJoin}
                className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isTerminal
                    ? 'terminal-button theme-heading-font rounded-none'
                    : 'bg-[rgba(var(--color-accent-primary-rgb),0.15)] hover:bg-[rgba(var(--color-accent-primary-rgb),0.25)] text-accent-primary font-mono transition-all border border-[rgba(var(--color-accent-primary-rgb),0.6)] hover:border-[rgba(var(--color-accent-primary-rgb),1)] hover:shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.35)]'
                }`}
                style={isTerminal ? undefined : { clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                {inviteJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('invite_notification.joining')}
                  </>
                ) : (
                  <>
                    {t('invite_notification.join_button')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </HudContainer>
      </div>
    </div>
  )
}

export default PendingInviteModal
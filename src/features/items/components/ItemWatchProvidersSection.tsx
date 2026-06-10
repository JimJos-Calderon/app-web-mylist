import React from 'react'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '@/features/shared'
import { useItemWatchProviders } from '../hooks/useItemWatchProviders'
import { TMDB_LOGO_W45, type WatchProviderEntry } from '../services/tmdbService'
import { useTheme } from '@/features/shared'
import { formatRetroHeading } from '@/features/shared/utils/textUtils'

interface ItemWatchProvidersSectionProps {
  item: ListItem | null
  isOpen: boolean
  uiLanguage: string
  isRetroCartoon: boolean
}

function sectionLabelClass(isRetroCartoon: boolean): string {
  return isRetroCartoon
    ? 'item-details-modal__section-label mb-1.5'
    : 'theme-heading-font mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]'
}

function RetroWatchPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="item-details-modal__watch-providers">
      <div className="item-details-modal__watch-providers-inner">{children}</div>
    </div>
  )
}

function ProviderGroup({
  sectionKey,
  title,
  providers,
  isRetroCartoon,
}: {
  sectionKey: string
  title: string
  providers: WatchProviderEntry[]
  isRetroCartoon: boolean
}) {
  if (providers.length === 0) return null

  if (isRetroCartoon) {
    return (
      <div className="item-details-modal__watch-group">
        <p className="item-details-modal__watch-group-title">{title}</p>
        <div className="item-details-modal__watch-chips">
          {providers.map((p) => (
            <span key={`${sectionKey}-${p.provider_id}`} className="item-details-modal__watch-chip theme-body-font">
              {p.logo_path ? (
                <img
                  src={`${TMDB_LOGO_W45}${p.logo_path}`}
                  alt=""
                  className="shrink-0"
                  loading="lazy"
                />
              ) : null}
              <span className="min-w-0 truncate">{p.provider_name}</span>
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{title}</p>
      <div className="flex flex-wrap gap-1">
        {providers.map((p) => (
          <span
            key={`${sectionKey}-${p.provider_id}`}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-[rgba(var(--color-accent-primary-rgb),0.2)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[11px] leading-tight text-[var(--color-text-primary)]"
          >
            {p.logo_path ? (
              <img
                src={`${TMDB_LOGO_W45}${p.logo_path}`}
                alt=""
                className="h-4 w-4 shrink-0 object-contain"
                loading="lazy"
              />
            ) : null}
            <span className="min-w-0 truncate">{p.provider_name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const ItemWatchProvidersSection: React.FC<ItemWatchProvidersSectionProps> = ({
  item,
  isOpen,
  uiLanguage,
  isRetroCartoon,
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const retroText = (v: string) => formatRetroHeading(v, theme)
  const hasToken = Boolean(import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim())
  const { data, isLoading, isError } = useItemWatchProviders(item, Boolean(isOpen && item && hasToken), uiLanguage)

  if (!isOpen || !item) {
    return null
  }

  const labelCls = sectionLabelClass(isRetroCartoon)

  if (!hasToken) {
    if (isRetroCartoon) {
      return (
        <div className="mb-4">
          <RetroWatchPanel>
            <p className={labelCls}>{retroText(t('item.watch_providers_title'))}</p>
            <p className="item-details-modal__watch-muted item-details-modal__synopsis">
              {retroText(t('item.watch_providers_no_token'))}
            </p>
          </RetroWatchPanel>
        </div>
      )
    }
    return (
      <div className="mb-4">
        <p className={labelCls}>{retroText(t('item.watch_providers_title'))}</p>
        <p className="text-xs leading-snug text-[var(--color-text-muted)]">{retroText(t('item.watch_providers_no_token'))}</p>
      </div>
    )
  }

  if (isRetroCartoon) {
    return (
      <div className="mb-4">
        <RetroWatchPanel>
          <p className={labelCls}>{retroText(t('item.watch_providers_title'))}</p>
          {isLoading && (
            <div className="item-details-modal__watch-loading flex items-center gap-1.5">
              <span className="item-details-modal__watch-spinner animate-spin rounded-full" aria-hidden="true" />
              <span>{retroText(t('item.watch_providers_loading'))}</span>
            </div>
          )}
          {isError && <p className="item-details-modal__watch-error">{retroText(t('item.watch_providers_error'))}</p>}
          {!isLoading && !isError && data && (
            <>
              <p className="item-details-modal__watch-region">{retroText(t('item.watch_providers_region', { region: data.regionCode }))}</p>
              <ProviderGroup
                sectionKey="flatrate"
                title={retroText(t('item.watch_providers_streaming'))}
                providers={data.flatrate}
                isRetroCartoon
              />
              <ProviderGroup
                sectionKey="rent"
                title={retroText(t('item.watch_providers_rent'))}
                providers={data.rent}
                isRetroCartoon
              />
              <ProviderGroup
                sectionKey="buy"
                title={retroText(t('item.watch_providers_buy'))}
                providers={data.buy}
                isRetroCartoon
              />
              {data.watchLink ? (
                <a href={data.watchLink} target="_blank" rel="noopener noreferrer" className="item-details-modal__watch-link">
                  {retroText(t('item.watch_providers_more_link'))}
                </a>
              ) : null}
            </>
          )}
          {!isLoading && !isError && !data && (
            <p className="item-details-modal__watch-muted item-details-modal__synopsis">{retroText(t('item.watch_providers_none'))}</p>
          )}
        </RetroWatchPanel>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <p className={labelCls}>{retroText(t('item.watch_providers_title'))}</p>
      {isLoading && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          <span>{retroText(t('item.watch_providers_loading'))}</span>
        </div>
      )}
      {isError && <p className="text-xs text-[var(--color-accent-secondary)]">{retroText(t('item.watch_providers_error'))}</p>}
      {!isLoading && !isError && data && (
        <>
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
            {retroText(t('item.watch_providers_region', { region: data.regionCode }))}
          </p>
          <ProviderGroup
            sectionKey="flatrate"
            title={retroText(t('item.watch_providers_streaming'))}
            providers={data.flatrate}
            isRetroCartoon={false}
          />
          <ProviderGroup
            sectionKey="rent"
            title={retroText(t('item.watch_providers_rent'))}
            providers={data.rent}
            isRetroCartoon={false}
          />
          <ProviderGroup
            sectionKey="buy"
            title={retroText(t('item.watch_providers_buy'))}
            providers={data.buy}
            isRetroCartoon={false}
          />
          {data.watchLink ? (
            <a
              href={data.watchLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-xs font-medium text-[var(--color-accent-primary)] hover:underline"
            >
              {retroText(t('item.watch_providers_more_link'))}
            </a>
          ) : null}
        </>
      )}
      {!isLoading && !isError && !data && (
        <p className="text-xs leading-snug text-[var(--color-text-muted)]">{retroText(t('item.watch_providers_none'))}</p>
      )}
    </div>
  )
}

export default ItemWatchProvidersSection

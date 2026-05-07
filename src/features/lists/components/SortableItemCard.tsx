import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { ItemCard } from '@/features/items'
import type { ListItem } from '@/features/shared'

interface SortableItemCardProps {
  item: ListItem
  isOwn: boolean
  onDelete: (id: string) => Promise<void>
  onToggleVisto: (id: string, currentState: boolean) => Promise<void>
  onOpenDetails: (item: ListItem) => void
  dragLabel: string
}

const SortableItemCard: React.FC<SortableItemCardProps> = ({
  item,
  isOwn,
  onDelete,
  onToggleVisto,
  onOpenDetails,
  dragLabel,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.92 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative h-full">
      <button
        type="button"
        className="absolute left-2 top-2 z-20 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-md border border-[rgba(var(--color-accent-primary-rgb),0.35)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] shadow-sm active:cursor-grabbing hover:border-[rgba(var(--color-accent-primary-rgb),0.55)] hover:text-[var(--color-text-primary)]"
        aria-label={dragLabel}
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <ItemCard item={item} isOwn={isOwn} onDelete={onDelete} onToggleVisto={onToggleVisto} onOpenDetails={onOpenDetails} />
    </div>
  )
}

export default SortableItemCard

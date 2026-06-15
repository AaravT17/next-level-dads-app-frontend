import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeartButtonProps {
  count: number
  isHearted: boolean
  onHeart: () => void
  onUnheart: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function HeartButton({
  count,
  isHearted,
  onHeart,
  onUnheart,
  disabled,
  size = 'sm',
}: HeartButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    isHearted ? onUnheart() : onHeart()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1 transition-colors',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isHearted
          ? 'text-rose-500'
          : 'text-muted-foreground hover:text-rose-400',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      aria-label={isHearted ? 'Unheart' : 'Heart'}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
          isHearted && 'fill-current',
        )}
      />
      <span>{count}</span>
    </button>
  )
}

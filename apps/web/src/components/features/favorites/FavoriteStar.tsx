import type { ShareAssetType } from '@buster/server-shared/share';
import { cva } from 'class-variance-authority';
import React, {} from 'react';
import { Button } from '@/components/ui/buttons';
import { Star } from '@/components/ui/icons';
import StarFilled from '@/components/ui/icons/NucleoIconFilled/star';
import { AppTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/classMerge';
import { useFavoriteStar } from './useFavoriteStar';

const favoriteStarVariants = cva('transition-colors', {
  variants: {
    variant: {
      default: 'text-icon-color hover:text-foreground',
      tertiary: 'text-text-tertiary hover:text-icon-color',
    },
    isFavorited: {
      true: 'text-yellow-500! hover:text-yellow-500!',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    isFavorited: false,
  },
});

export const FavoriteStar: React.FC<{
  id: string;
  type: ShareAssetType;
  title: string;
  className?: string;
  iconStyle?: 'default' | 'tertiary';
}> = React.memo(({ title: name, id, type, className = '', iconStyle = 'default' }) => {
  const { isFavorited, onFavoriteClick } = useFavoriteStar({ id, type, name });

  const tooltipText = isFavorited ? 'Remove from favorites' : 'Add to favorites';

  return (
    <AppTooltip title={tooltipText} key={tooltipText}>
      <Button
        className={cn('flex transition-none', isFavorited && 'opacity-100!', className)}
        onClick={onFavoriteClick}
        variant="ghost"
        prefix={
          <div
            className={cn(
              favoriteStarVariants({
                variant: iconStyle === 'tertiary' ? 'tertiary' : 'default',
                isFavorited,
              })
            )}
          >
            {isFavorited ? <StarFilled /> : <Star />}
          </div>
        }
      />
    </AppTooltip>
  );
});
FavoriteStar.displayName = 'FavoriteStar';

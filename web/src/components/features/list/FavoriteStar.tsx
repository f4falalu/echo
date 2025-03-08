import { ShareAssetType } from '@/api/asset_interfaces';
import { AppTooltip } from '@/components/ui/tooltip';
import { useUserConfigContextSelector } from '@/context/Users';
import React, { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons';
import { cn } from '@/lib/classMerge';
import { Star } from '@/components/ui/icons';
import { cva } from 'class-variance-authority';

const favoriteStarVariants = cva('transition-colors', {
  variants: {
    variant: {
      default: 'text-icon-color hover:text-foreground',
      tertiary: 'text-text-tertiary hover:text-icon-color'
    },
    isFavorited: {
      true: 'text-yellow-500! hover:text-yellow-500!',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'default',
    isFavorited: false
  }
});

export const FavoriteStar: React.FC<{
  id: string;
  type: ShareAssetType;
  title: string;
  className?: string;
  iconStyle?: 'default' | 'tertiary';
}> = React.memo(({ title: name, id, type, className = '', iconStyle = 'default' }) => {
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);
  const removeItemFromFavorite = useUserConfigContextSelector(
    (state) => state.removeItemFromFavorite
  );
  const addItemToFavorite = useUserConfigContextSelector((state) => state.addItemToFavorite);

  const isFavorited = useMemo(() => {
    return userFavorites?.some((favorite) => favorite.id === id || favorite.collection_id === id);
  }, [userFavorites, id]);

  const onFavoriteClick = useMemoizedFn(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isFavorited)
      return await addItemToFavorite({
        asset_type: type,
        id,
        name
      });

    await removeItemFromFavorite({
      asset_type: type,
      id
    });
  });

  const tooltipText = isFavorited ? 'Remove from favorites' : 'Add to favorites';

  return (
    <AppTooltip title={tooltipText} key={tooltipText}>
      <Button
        className={cn(className, 'flex')}
        onClick={onFavoriteClick}
        variant="ghost"
        prefix={
          <div
            className={cn(
              favoriteStarVariants({
                variant: iconStyle === 'tertiary' ? 'tertiary' : 'default',
                isFavorited
              })
            )}>
            <Star />
          </div>
        }
      />
    </AppTooltip>
  );
});
FavoriteStar.displayName = 'FavoriteStar';

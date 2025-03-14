import React from 'react';
import { Avatar as AvatarBase, AvatarFallback, AvatarImage } from './AvatarBase';
import { getFirstTwoCapitalizedLetters } from '@/lib/text';
import { Tooltip } from '../tooltip/Tooltip';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  image?: string;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  useToolTip?: boolean;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = React.memo(
  ({ image, name, className, useToolTip, size, fallbackClassName }) => {
    const hasName = !!name;
    const nameLetters = createNameLetters(name);

    return (
      <Tooltip delayDuration={550} title={useToolTip ? name || '' : ''}>
        <AvatarBase
          className={className}
          style={{
            width: size,
            height: size
          }}>
          {image && <AvatarImage src={image} />}
          {hasName ? (
            <NameLettersFallback fallbackClassName={fallbackClassName} nameLetters={nameLetters} />
          ) : (
            <BusterAvatarFallback fallbackClassName={fallbackClassName} />
          )}
        </AvatarBase>
      </Tooltip>
    );
  }
);
Avatar.displayName = 'Avatar';

const NameLettersFallback: React.FC<{ fallbackClassName?: string; nameLetters: string }> = ({
  fallbackClassName,
  nameLetters
}) => {
  return <AvatarFallback className={cn(fallbackClassName)}>{nameLetters}</AvatarFallback>;
};

const BusterAvatarFallback: React.FC<{ fallbackClassName?: string }> = ({ fallbackClassName }) => {
  return (
    <AvatarFallback className={cn('border bg-white', fallbackClassName)}>
      <div className="text-foreground flex h-full w-full items-center justify-center">
        <BusterLogo className="h-full w-full translate-x-[1px] p-1" />
      </div>
    </AvatarFallback>
  );
};

const createNameLetters = (name?: string | null) => {
  if (name) {
    const firstTwoLetters = getFirstTwoCapitalizedLetters(name);
    if (firstTwoLetters.length == 2) return firstTwoLetters;

    const _name = name.split(' ') as [string, string];
    const returnName = `${_name[0][0]}`.toUpperCase().replace('@', '');

    return returnName;
  }
  return '';
};

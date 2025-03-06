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
  useToolTip?: boolean;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = React.memo(
  ({ image, name, className, useToolTip, size }) => {
    const hasName = !!name;
    const nameLetters = hasName ? createNameLetters(name, image) : '';

    return (
      <Tooltip delayDuration={550} title={useToolTip ? name || '' : ''}>
        <AvatarBase
          className={className}
          style={{
            width: size,
            height: size
          }}>
          {image && <AvatarImage src={image} />}
          <AvatarFallback className={cn(!hasName && !image && 'border bg-white')}>
            {nameLetters || <BusterAvatarFallback />}
          </AvatarFallback>
        </AvatarBase>
      </Tooltip>
    );
  }
);
Avatar.displayName = 'Avatar';

const BusterAvatarFallback: React.FC = () => {
  return (
    <div className="text-foreground flex h-full w-full items-center justify-center">
      <BusterLogo className="h-full w-full translate-x-[1px] p-1" />
    </div>
  );
};

const createNameLetters = (name?: string | null, image?: string | null | React.ReactNode) => {
  if (name && !image) {
    const firstTwoLetters = getFirstTwoCapitalizedLetters(name);
    if (firstTwoLetters.length == 2) return firstTwoLetters;

    //Get First Name Initial
    const _name = name.split(' ') as [string, string];
    const returnName = `${_name[0][0]}`.toUpperCase().replace('@', '');

    return returnName;
  }
  return '';
};

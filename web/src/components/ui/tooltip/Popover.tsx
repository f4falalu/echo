import { Popover as PopoverBase, PopoverContent, PopoverTrigger } from './PopoverBase';
import React from 'react';
import { Separator } from '../seperator/Separator';

interface PopoverProps
  extends React.ComponentProps<typeof PopoverBase>,
    Pick<React.ComponentProps<typeof PopoverContent>, 'align' | 'side'> {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  headerContent?: string | React.ReactNode;
}

export const Popover = React.memo<PopoverProps>(
  ({ children, content, align, side, className = '', headerContent, ...props }) => {
    return (
      <PopoverBase {...props}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          align={align}
          side={side}
          className={className}
          headerContent={headerContent && <PopoverHeaderContent title={headerContent} />}>
          {content}
        </PopoverContent>
      </PopoverBase>
    );
  }
);

const PopoverHeaderContent: React.FC<{
  title: string | React.ReactNode;
}> = ({ title }) => {
  return (
    <div className="flex flex-col">
      <div className="p-2">{title}</div>
      <Separator />
    </div>
  );
};

Popover.displayName = 'Popover';

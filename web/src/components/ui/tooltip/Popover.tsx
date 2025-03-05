import {
  PopoverRoot as PopoverBase,
  PopoverContent,
  PopoverContentVariant,
  PopoverTrigger,
  PopoverTriggerType
} from './PopoverBase';
import React from 'react';
import { Separator } from '../seperator/Separator';

export interface PopoverProps
  extends React.ComponentProps<typeof PopoverBase>,
    Pick<React.ComponentProps<typeof PopoverContent>, 'align' | 'side'> {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  headerContent?: string | React.ReactNode;
  footerContent?: string | React.ReactNode;
  trigger?: PopoverTriggerType;
  size?: PopoverContentVariant['size'];
}

export const Popover = React.memo<PopoverProps>(
  ({
    children,
    content,
    align,
    side,
    className = '',
    headerContent,
    trigger = 'click',
    size = 'default',
    footerContent,
    ...props
  }) => {
    return (
      <PopoverBase trigger={trigger} {...props}>
        <PopoverTrigger asChild>
          <span className="">{children}</span>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          side={side}
          className={className}
          size={size}
          headerContent={headerContent && <PopoverHeaderContent title={headerContent} />}
          footerContent={footerContent && <PopoverFooterContent title={footerContent} />}>
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

const PopoverFooterContent: React.FC<{
  title: string | React.ReactNode;
}> = ({ title }) => {
  return <div className="p-2">{title}</div>;
};

Popover.displayName = 'Popover';

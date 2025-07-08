import { cn } from '@/lib/classMerge';
import { Button } from '../buttons';
import { DoubleChevronRight } from '../icons';
import {
  Sheet as SheetBase,
  SheetContent,
  SheetDescription,
  SheetHeader as SheetHeaderBase,
  SheetTitle,
  SheetTrigger,
  SheetFooter as SheetFooterBase,
  SheetClose as SheetCloseBase
} from './SheetBase';
import React from 'react';
import { ScrollArea } from '../scroll-area';

interface SheetProps extends React.ComponentProps<typeof SheetBase> {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  closeStyle?: 'collapse' | 'close' | 'none';
  closeClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sheet = ({
  trigger,
  children,
  header,
  footer,
  closeStyle = 'collapse',
  side = 'right',
  closeClassName = '',
  headerClassName,
  contentClassName,
  footerClassName,
  ...rest
}: SheetProps) => {
  return (
    <SheetBase {...rest}>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent side={side} className={contentClassName}>
        <SheetClose closeStyle={closeStyle} className={closeClassName}>
          {header}
        </SheetClose>
        <ScrollArea className="flex-1">{children}</ScrollArea>
        <SheetFooter footer={footer} className={footerClassName} />
      </SheetContent>
    </SheetBase>
  );
};

const SheetFooter = ({
  footer,
  className
}: {
  footer: SheetProps['footer'];
  className?: string;
}) => {
  if (!footer) return null;

  return <SheetFooterBase className={className}>{footer}</SheetFooterBase>;
};

const SheetClose: React.FC<
  React.ComponentProps<typeof SheetCloseBase> & {
    closeStyle: SheetProps['closeStyle'];
    children?: React.ReactNode;
    className?: string;
  }
> = ({ className, closeStyle, children, ...props }) => {
  if (closeStyle === 'none') return null;
  if (closeStyle === 'collapse') {
    return (
      <div className={cn('flex min-h-[38px] items-center gap-x-2 border-b px-3', className)}>
        <SheetCloseBase className={className} {...props}>
          <Button variant="ghost" size={'tall'} iconButton prefix={<DoubleChevronRight />} />
        </SheetCloseBase>
        {children}
      </div>
    );
  }

  return <SheetCloseBase className={className} {...props} />;
};

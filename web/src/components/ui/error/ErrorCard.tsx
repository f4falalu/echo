import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib/classMerge';
import { Text } from '../typography';
import { Xmark } from '../icons';

const errorVariants = cva('shadow p-3 rounded', {
  variants: {
    variant: {
      danger: 'bg-danger-foreground text-white',
      default: 'bg-background text-foreground'
    }
  }
});

export const ErrorCard: React.FC<
  {
    error: string;
    title?: string;
    className?: string;
    onClose?: () => void;
  } & VariantProps<typeof errorVariants>
> = ({ error, title, variant, className, onClose }) => {
  return (
    <div className={cn('flex flex-col gap-1', errorVariants({ variant }), className)}>
      {title && <Text variant={'inherit'}>{title}</Text>}
      <Text
        className={cn(
          variant === 'danger' && 'text-white',
          variant === 'default' && 'text-text-secondary',
          'leading-[1.3]'
        )}>
        {error}
      </Text>
      {onClose && (
        <div onClick={onClose} className="absolute top-2 right-2">
          <Xmark />
        </div>
      )}
    </div>
  );
};

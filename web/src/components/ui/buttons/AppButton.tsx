import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 shadow-btn rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed data-[loading=true]:cursor-progress px-2.5 py-1.5',
  {
    variants: {
      buttonType: {
        default:
          'bg-white border hover:bg-item-hover disabled:bg-disabled disabled:text-light-gray active:bg-item-active data-[selected=true]:bg-nav-background',
        black: 'bg-black text-white hover:bg-black-hover disabled:bg-black-hover',
        primary: 'bg-primary text-white hover:bg-primary-light '
      },
      size: {
        default: 'h-6',
        tall: 'h-8'
      }
    },
    defaultVariants: {
      buttonType: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'prefix'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  loading?: boolean;
  selected?: boolean;
}

const AppButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      buttonType = 'default',
      size = 'default',
      asChild = false,
      prefix,
      suffix,
      children,
      loading = false,
      selected = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ buttonType, size, className }))}
        ref={ref}
        disabled={disabled}
        data-loading={loading}
        data-selected={selected}
        {...props}>
        {loading ? <LoadingIcon buttonType={buttonType} /> : prefix && <span>{prefix}</span>}
        {children}
        {suffix && <span>{suffix}</span>}
      </Comp>
    );
  }
);

AppButton.displayName = 'AppButton';

const LoadingIcon: React.FC<{
  buttonType: 'default' | 'black' | 'primary' | null;
}> = ({ buttonType = 'default' }) => {
  return (
    <div
      className={cn(
        'animate-in fade-in text-black duration-400 dark:text-white',
        buttonType === 'black' && 'dark'
      )}>
      <CircleSpinnerLoader
        size={9}
        fill={buttonType === 'black' ? 'var(--color-primary-light)' : 'var(--color-primary)'}
      />
    </div>
  );
};

export { AppButton, buttonVariants };

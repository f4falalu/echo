import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoader } from '../loaders/CircleSpinnerLoader';

const buttonVariants = cva(
  'inline-flex items-center overflow-hidden justify-center gap-1.5 shadow-btn rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed data-[loading=true]:cursor-progress',
  {
    variants: {
      buttonType: {
        default:
          'bg-white border hover:bg-item-hover disabled:bg-disabled disabled:text-light-gray active:bg-item-active data-[selected=true]:bg-nav-background',
        black: 'bg-black text-white hover:bg-black-hover disabled:bg-black-hover',
        primary:
          'bg-primary text-white hover:bg-primary-light active:bg-primary-dark data-[selected=true]:bg-primary-dark',
        ghost:
          'bg-transparent text-dark-gray shadow-none hover:bg-item-hover disabled:bg-transparent disabled:text-light-gray active:bg-item-active data-[selected=true]:bg-nav-background'
      },
      size: {
        default: 'h-6',
        tall: 'h-7',
        small: 'h-[18px]'
      },
      iconButton: {
        true: '',
        false: 'px-2.5'
      }
    },
    compoundVariants: [
      {
        iconButton: true,
        size: 'default',
        className: 'w-6'
      },
      {
        iconButton: true,
        size: 'tall',
        className: 'w-7'
      },
      {
        iconButton: true,
        size: 'small',
        className: 'w-[18px]'
      }
    ],
    defaultVariants: {
      buttonType: 'default',
      size: 'default',
      iconButton: false
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
    const hasChildren = !!children;
    const iconButton = !hasChildren && (!prefix || !suffix);
    const isSmallButton = size === 'small';
    return (
      <Comp
        className={cn(buttonVariants({ buttonType, size, iconButton, className }))}
        ref={ref}
        disabled={disabled}
        data-loading={loading}
        data-selected={selected}
        {...props}>
        {loading ? (
          <LoadingIcon buttonType={buttonType} />
        ) : (
          prefix && (
            <span className={cn('text-icon', isSmallButton && 'text-icon-small')}>{prefix}</span>
          )
        )}
        {hasChildren && <span className="text-base">{children}</span>}
        {suffix && (
          <span className={cn('text-icon', isSmallButton && 'text-icon-small')}>{suffix}</span>
        )}
      </Comp>
    );
  }
);

AppButton.displayName = 'AppButton';

const LoadingIcon: React.FC<{
  buttonType: 'default' | 'black' | 'primary' | 'ghost' | null;
}> = ({ buttonType = 'default' }) => {
  return (
    <div
      className={cn(
        'flex h-[15px] w-[1em] items-center justify-center text-black dark:text-white',
        buttonType === 'black' && 'dark'
      )}>
      <CircleSpinnerLoader
        size={9.5}
        fill={
          buttonType === 'black'
            ? 'var(--color-white)'
            : buttonType === 'primary'
              ? 'var(--color-primary)'
              : 'var(--color-primary)'
        }
      />
    </div>
  );
};

export { AppButton, buttonVariants };

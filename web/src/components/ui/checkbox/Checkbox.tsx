import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/classMerge';
import { Minus, Check } from '../icons';
import { cva, type VariantProps } from 'class-variance-authority';

const checkboxVariants = cva(
  'peer  relative h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          ' ring-offset-background focus-visible:ring-ring data-[state=unchecked]:border-gray-light data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:disabled:bg-primary data-[state=checked]:text-background'
      },
      size: {
        default: 'h-4 w-4 text-[10px]',
        sm: 'h-3 w-3 text-[8px]',
        lg: 'h-5 w-5 text-base'
      },
      disabled: {
        true: 'opacity-60 cursor-not-allowed ',
        false: 'cursor-pointer'
      },
      checked: {
        true: '',
        false: '',
        indeterminate: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      disabled: false
    },
    compoundVariants: [
      {
        variant: 'default',
        checked: 'indeterminate',
        className:
          'bg-primary-light text-background border-primary-light hover:bg-primary! hover:border-primary! hover:disabled:bg-inherit'
      }
    ]
  }
);

type CheckboxVariants = VariantProps<typeof checkboxVariants>;

interface CheckboxProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      keyof CheckboxVariants
    >,
    CheckboxVariants {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      checked,
      disabled = false,
      indeterminate,
      ...props
    },
    ref
  ) => {
    return (
      <CheckboxPrimitive.Root
        ref={ref}
        disabled={disabled || false}
        className={cn(checkboxVariants({ variant, size, disabled, checked }), className)}
        checked={checked || undefined}
        {...props}>
        <CheckboxPrimitive.Indicator
          className={cn('absolute inset-0 flex items-center justify-center')}>
          <div className="text-background flex">
            {checked === 'indeterminate' ? <Minus /> : <Check />}
          </div>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, type CheckboxProps };

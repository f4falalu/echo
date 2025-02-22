import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/classMerge';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed px-2.5 py-1.5',
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900 border  hover:bg-item-hover',
        black: 'bg-black text-white hover:bg-gray-900',
        primary: 'bg-blue-600 text-white hover:bg-blue-700'
      },
      size: {
        default: 'h-6',
        tall: 'h-8'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const AppButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);

AppButton.displayName = 'AppButton';

export { AppButton, buttonVariants };

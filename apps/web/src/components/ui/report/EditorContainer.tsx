import { cn } from '@/lib/utils';
import { PlateContainer } from 'platejs/react';
import { cva, type VariantProps } from 'class-variance-authority';

interface EditorContainerProps {
  className?: string;
  variant?: 'default';
  readonly?: boolean;
  disabled?: boolean;
}

const editorContainerVariants = cva('relative cursor-text h-full p-4', {
  variants: {
    variant: {
      default: 'bg-background'
    },
    readonly: {
      true: 'cursor-not-allowed'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export function EditorContainer({
  className,
  variant,
  readonly,
  disabled,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof editorContainerVariants> &
  EditorContainerProps) {
  return (
    <PlateContainer className={cn(editorContainerVariants({ variant }), className)} {...props} />
  );
}

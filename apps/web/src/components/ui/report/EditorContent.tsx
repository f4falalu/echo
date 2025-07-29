import { PlateContent } from 'platejs/react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const editorContentVariants = cva('pb-42', {
  variants: {
    variant: {
      default: 'bg-background',
      comment: 'bg-background/50'
    }
  }
});

export function EditorContent({
  style,
  placeholder,
  disabled,
  variant,
  ...props
}: React.ComponentProps<typeof PlateContent> & { variant?: 'default' | 'comment' }) {
  return (
    <PlateContent
      {...props}
      style={style}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(editorContentVariants({ variant }))}
      //disableDefaultStyles
    />
  );
}

import React from 'react';
import { PopoverRoot, PopoverContent, PopoverTrigger } from '@/components/ui/tooltip/PopoverBase';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons';
import { ChromePicker } from 'react-color';

const colorPickerVariants = cva(
  'rounded border bg-background transition-colors hover:bg-item-hover hover:text-text-default',
  {
    variants: {
      variant: {
        default: 'border-input',
        outline: 'border-input',
        secondary: 'border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-6 min-h-6 max-h-6 px-4',
        tall: 'h-7 min-h-7 max-h-7 px-4',
        small: 'h-5 min-h-5 max-h-5 px-3 text-xs'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ColorPickerProps {
  value?: string | null;
  onChange?: (color: string) => void;
  onChangeComplete?: (color: string) => void;
  size?: 'small' | 'default' | 'tall';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

const ColorPicker = React.forwardRef<HTMLButtonElement, ColorPickerProps>(
  (
    {
      className,
      value = '#000000',
      onChange,
      onChangeComplete,
      size = 'default',
      variant = 'default'
    },
    ref
  ) => {
    const handleChange = (color: any) => {
      onChange?.(color.hex);
    };

    const handleChangeComplete = (color: any) => {
      onChangeComplete?.(color.hex);
    };

    return (
      <PopoverRoot>
        <PopoverTrigger asChild>
          <Button ref={ref} className={cn(colorPickerVariants({ size, variant }), className)}>
            <div
              className="border-border h-4 w-4 rounded-sm border"
              style={{ backgroundColor: value || '#000000' }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ChromePicker
            color={value || '#000000'}
            onChange={handleChange}
            onChangeComplete={handleChangeComplete}
            disableAlpha
            styles={{
              default: {
                picker: {
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow)'
                }
              }
            }}
          />
        </PopoverContent>
      </PopoverRoot>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };

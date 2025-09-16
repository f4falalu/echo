import React from 'react';
import { cn } from '@/lib/classMerge';
import { Input, type InputProps } from './Input';

export interface InputNumberProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ value, onChange, min, max, step = 1, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      value !== undefined ? String(value) : ''
    );

    // Update display value when external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(String(value));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      setDisplayValue(rawValue);

      // Allow empty values during typing
      if (rawValue === '') {
        return;
      }

      const newValue = Number.parseFloat(rawValue);

      // Only call onChange for valid numbers
      if (!Number.isNaN(newValue)) {
        onChange?.(newValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.trim();

      // If empty on blur and min is defined, enforce min value
      if (rawValue === '' || rawValue === '-') {
        if (min !== undefined) {
          const finalValue = min;
          setDisplayValue(String(finalValue));
          onChange?.(finalValue);
        }
        props.onBlur?.(e);
        return;
      }

      const numValue = Number.parseFloat(rawValue);

      if (Number.isNaN(numValue)) {
        // If invalid number, enforce min if available, otherwise revert to current value
        if (min !== undefined) {
          const finalValue = min;
          setDisplayValue(String(finalValue));
          onChange?.(finalValue);
        } else {
          const fallbackValue = value !== undefined ? value : 0;
          setDisplayValue(String(fallbackValue));
          onChange?.(fallbackValue);
        }
        props.onBlur?.(e);
        return;
      }

      let finalValue = numValue;

      // Apply min/max constraints on blur
      if (min !== undefined && numValue < min) {
        finalValue = min;
      }

      if (max !== undefined && numValue > max) {
        finalValue = max;
      }

      setDisplayValue(String(finalValue));

      if (finalValue !== numValue) {
        onChange?.(finalValue);
      }

      props.onBlur?.(e);
    };

    return (
      <Input
        type="number"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        ref={ref}
        className={cn('pr-0.5', className)}
        {...props}
      />
    );
  }
);

InputNumber.displayName = 'InputNumber';

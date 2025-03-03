import React, { useMemo, useRef } from 'react';
import { InputTextArea, InputTextAreaProps } from './InputTextArea';
import { cn } from '@/lib/classMerge';
import { cva } from 'class-variance-authority';
import { Button } from '../buttons/Button';
import { ArrowUp } from '../icons/NucleoIconOutlined';
import { ShapeSquare } from '../icons/NucleoIconFilled';
import { useMemoizedFn } from 'ahooks';

const inputTextAreaButtonVariants = cva(
  'relative flex w-full items-center overflow-hidden rounded-xl border border-border transition-all duration-200',
  {
    variants: {
      variant: {
        default:
          'has-[textarea:hover]:border-foreground shadow has-[textarea:focus]:border-foreground has-[textarea:disabled]:border-border'
      }
    }
  }
);

export interface InputTextAreaButtonProps extends Omit<InputTextAreaProps, 'variant' | 'onSubmit'> {
  sendIcon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  loading?: boolean;
  onSubmit: (text: string) => void;
  variant?: 'default';
  disabledSubmit?: boolean;
}

export const InputTextAreaButton: React.FC<InputTextAreaButtonProps> = ({
  className,
  disabled,
  autoResize,
  sendIcon = <ArrowUp />,
  loadingIcon = <ShapeSquare />,
  loading = false,
  onSubmit,
  variant = 'default',
  disabledSubmit,
  ...props
}) => {
  const textRef = useRef<HTMLTextAreaElement>(null);

  const onSubmitPreflight = useMemoizedFn(() => {
    if (disabled) return;
    const text = textRef.current?.value || '';
    if (text.trim() === '') return;
    onSubmit(text);
  });

  const onPressMetaEnter = useMemoizedFn(() => {
    onSubmitPreflight();
  });

  return (
    <div
      className={cn(
        inputTextAreaButtonVariants({ variant }),
        loading && 'border-border!',
        className
      )}>
      <InputTextArea
        ref={textRef}
        disabled={disabled || loading}
        variant="ghost"
        className={cn(
          'leading-1.3 w-full px-5! py-4! pr-10 align-middle',
          loading && '!cursor-default'
        )}
        autoResize={autoResize}
        rounding="xl"
        onPressMetaEnter={onPressMetaEnter}
        {...props}
      />

      <div className="absolute right-2 bottom-2">
        <SubmitButton
          disabled={disabled || disabledSubmit}
          loading={loading}
          sendIcon={sendIcon}
          loadingIcon={loadingIcon}
          onSubmitPreflight={onSubmitPreflight}
        />
      </div>
    </div>
  );
};

const SubmitButton: React.FC<{
  loading: boolean;
  disabled?: boolean;
  sendIcon: React.ReactNode;
  loadingIcon: React.ReactNode;
  onSubmitPreflight: () => void;
}> = ({ disabled, sendIcon, loading, loadingIcon, onSubmitPreflight }) => {
  const memoizedPrefix = useMemo(() => {
    return (
      <div
        className={cn(
          'relative h-4 w-4 transition-all duration-300 active:scale-80',
          loading && '!cursor-default'
        )}>
        <div
          className={`absolute inset-0 transition-all duration-300 ${loading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
          {sendIcon}
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center text-sm transition-all duration-300 ${loading ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {loadingIcon}
        </div>
      </div>
    );
  }, [loading, sendIcon, loadingIcon]);

  return (
    <Button
      rounding={'large'}
      variant="black"
      prefix={memoizedPrefix}
      className="active:scale-95"
      onClick={onSubmitPreflight}
      disabled={disabled}
    />
  );
};

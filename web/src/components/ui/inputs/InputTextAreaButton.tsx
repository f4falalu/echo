import React from 'react';
import { InputTextArea, InputTextAreaProps } from './InputTextArea';
import { cn } from '@/lib/classMerge';
import { cva } from 'class-variance-authority';

export interface InputTextAreaButtonProps extends Omit<InputTextAreaProps, 'variant'> {}

const inputTextAreaButtonVariants = cva('relative flex w-full items-center overflow-hidden', {
  variants: {}
});

export const InputTextAreaButton: React.FC<InputTextAreaButtonProps> = ({
  className,
  disabled,
  ...props
}) => {
  return (
    <div
      className={cn(
        // styles.inputContainer,
        // isFocused && 'focused',
        // loading && 'loading',
        inputTextAreaButtonVariants()
      )}>
      <InputTextArea
        disabled={disabled}
        variant="ghost"
        className="inline-block w-full pt-2! pr-9! pb-2! pl-3.5! align-middle"
        {...props}

        // ref={inputRef}
        // variant="borderless"
        // onBlur={onBlurInput}
        // onFocus={onFocusInput}
        // className="inline-block w-full pt-2! pr-9! pb-2! pl-3.5! align-middle"
        // placeholder="Ask a follow up..."
        // value={inputValue}
        // autoFocus={true}
        // onChange={onChangeInput}
        // onPressEnter={onPressEnter}
        // disabled={loading}
        // autoSize={autoSize}
      />

      <div className="absolute right-2 bottom-2">
        HERE
        {/* <SubmitButton
          disableSendButton={disableSendButton}
          loading={loading}
          onSubmitPreflight={onSubmitPreflight}
        /> */}
      </div>
    </div>
  );
};

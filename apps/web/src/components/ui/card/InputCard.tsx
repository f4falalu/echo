import React, { useState } from 'react';
import { Button } from '../buttons/Button';
import { InputTextArea } from '../inputs/InputTextArea';
import { cn } from '@/lib/utils';
import { inputHasText } from '@/lib/text';

interface InputCardProps {
  placeholder: string;
  buttonText: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const InputCard: React.FC<InputCardProps> = ({
  placeholder,
  buttonText,
  value,
  onChange,
  onSubmit,
  loading,
  className
}) => {
  const [inputValue, setInputValue] = useState(value ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
  };

  const disableSubmit = !inputHasText(inputValue) || loading;

  const spacingClass = 'py-2.5 px-3';

  return (
    <div className={cn('flex min-w-[300px] flex-col gap-y-0 rounded border', className)}>
      <div className={spacingClass}>
        <InputTextArea
          placeholder={placeholder}
          value={inputValue}
          readOnly={loading}
          onChange={handleChange}
          autoResize={{
            minRows: 5,
            maxRows: 10
          }}
        />
      </div>
      <div className="w-full border-t" />
      <div className={spacingClass}>
        <Button
          onClick={() => !disableSubmit && onSubmit?.(inputValue)}
          loading={loading}
          block
          variant={'black'}
          disabled={disableSubmit}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

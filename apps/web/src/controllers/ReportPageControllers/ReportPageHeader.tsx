import React, { useMemo } from 'react';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { Paragraph } from '@/components/ui/typography/Paragraph';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';

const DEFAULT_CREATED_BY = 'Created by Buster';

export const ReportPageHeader = React.forwardRef<
  HTMLTextAreaElement,
  {
    className?: string;
    name?: string;
    updatedAt?: string;
    onChangeName: (name: string) => void;
    isStreaming: boolean;
    readOnly: boolean;
  }
>(({ name = '', updatedAt = '', className = '', onChangeName, isStreaming, readOnly }, ref) => {
  const updatedAtFormatted = useMemo(() => {
    if (!updatedAt) return '';
    return formatDate({ date: updatedAt, format: 'll' });
  }, [updatedAt]);

  return (
    <div className={cn('flex flex-col space-y-1.5', className)}>
      <InputTextArea
        readOnly={isStreaming || readOnly}
        className="text-foreground! h-9 font-semibold text-3xl p-0"
        ref={ref}
        variant={'ghost'}
        onChange={(e) => onChangeName(e.target.value)}
      >
        {name}
      </InputTextArea>
      <Paragraph size={'base'} variant={'tertiary'} className="select-none">
        {updatedAtFormatted && (
          <>
            <span className="select-text">{updatedAtFormatted}</span>
            <span className="select-none"> • </span>
          </>
        )}
        <span className="select-text">{DEFAULT_CREATED_BY}</span>
      </Paragraph>
    </div>
  );
});

ReportPageHeader.displayName = 'ReportPageHeader';

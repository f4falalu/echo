'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from '@/components/ui/icons';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons';
import { Calendar, CalendarProps } from '@/components/ui/calendar';
import {
  PopoverRoot as Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/tooltip/PopoverBase';
import { formatDate } from '@/lib';

export type DatePickerProps = Omit<CalendarProps, 'selected'> & {
  dateFormat?: string;
  placeholder?: string;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
};

export function DatePicker({
  dateFormat = 'lll',
  placeholder = 'Pick a date',
  selected,
  onSelect,
  ...props
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'ghost'}
          prefix={<CalendarIcon />}
          className={cn(
            'justify-start text-left font-normal',
            !selected && 'text-muted-foreground'
          )}>
          {selected ? (
            formatDate({
              date: selected as Date,
              format: dateFormat
            })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={selected} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

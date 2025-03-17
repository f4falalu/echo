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
import { DayPickerProps } from 'react-day-picker';

export type DatePickerProps = CalendarProps & {
  dateFormat?: string;
  placeholder?: string;
};

export function DatePicker({
  dateFormat = 'lll',
  placeholder = 'Pick a date',
  selected,

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
        <Calendar {...props} />
      </PopoverContent>
    </Popover>
  );
}

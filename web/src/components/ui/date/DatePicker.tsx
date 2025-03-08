'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from '@/components/ui/icons';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/buttons';
import { Calendar } from '@/components/ui/calendar';
import {
  PopoverRoot as Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/tooltip/PopoverBase';
import { formatDate } from '@/lib';
import { type DayPickerProps } from 'react-day-picker';

export interface DatePickerProps extends Omit<DayPickerProps, 'mode' | 'selected' | 'onSelect'> {
  date: Date;
  onSelect: (date: Date) => void;
  dateFormat?: string;
  placeholder?: string;
}

export function DatePicker({
  date,
  onSelect,
  dateFormat = 'lll',
  placeholder = 'Pick a date'
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'default'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}>
          <div className="mr-2 h-4 w-4">
            <CalendarIcon />
          </div>
          {date ? (
            formatDate({
              date,
              format: dateFormat
            })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={onSelect} autoFocus required />
      </PopoverContent>
    </Popover>
  );
}

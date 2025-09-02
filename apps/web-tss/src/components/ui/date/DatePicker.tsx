
import * as React from 'react';
import { Button } from '@/components/ui/buttons';
import { Calendar, type CalendarProps } from '@/components/ui/calendar';
import CalendarIcon from '@/components/ui/icons/NucleoIconOutlined/calendar';
import {
  PopoverRoot as Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover/PopoverBase';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { Xmark } from '../icons';

export type DatePickerProps = Omit<CalendarProps, 'selected'> & {
  dateFormat?: string;
  placeholder?: string;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  clearable?: boolean;
};

function DatePickerComponent({
  dateFormat = 'lll',
  placeholder = 'Pick a date',
  selected,
  onSelect,
  clearable = true,
  ...props
}: DatePickerProps) {
  const onClickCancel = () => {
    onSelect(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'ghost'}
          prefix={<CalendarIcon />}
          suffix={
            clearable &&
            selected && (
              <button
                type="button"
                onClick={onClickCancel}
                className="hover:bg-gray-light/20 hover:text-default! -mr-1 flex cursor-pointer items-center justify-center rounded-sm p-1 text-xs opacity-30 transition-opacity duration-200 group-hover:opacity-100"
              >
                <Xmark />
              </button>
            )
          }
          className={cn(
            'group justify-start text-left font-normal',
            !selected && 'text-gray-light'
          )}
        >
          {selected ? (
            formatDate({
              date: selected as Date,
              format: dateFormat,
            })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar {...props} mode="single" selected={selected} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

export const DatePicker = React.memo(DatePickerComponent);

DatePicker.displayName = 'DatePicker';

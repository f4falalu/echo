import React from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput
} from '@/components/ui/command';
import { PopoverRoot, PopoverContent, PopoverTrigger } from '@/components/ui/popover/PopoverBase';
import { cn } from '@/lib/classMerge';
import { CircleSpinnerLoader } from '../loaders';
import { Check, ChevronDown, Xmark } from '@/components/ui/icons';

interface SelectItemGroup<T = string> {
  label: string;
  items: SelectItem<T>[];
}

export interface SelectItem<T = string> {
  value: T;
  label: string | React.ReactNode; //this will be used in the select item text
  secondaryLabel?: string;
  icon?: React.ReactNode;
  searchLabel?: string; // Used for filtering
  disabled?: boolean;
}

type SearchFunction<T> = (item: SelectItem<T>, searchTerm: string) => boolean;

// Base interface with common properties
interface BaseSelectProps<T> {
  items: SelectItem<T>[] | SelectItemGroup<T>[];
  disabled?: boolean;
  placeholder?: string;
  value?: string | undefined;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  showIndex?: boolean;
  className?: string;
  dataTestId?: string;
  loading?: boolean;
  showLoadingIcon?: boolean;
  search?: boolean | SearchFunction<T>;
  emptyMessage?: string | false;
  matchPopUpWidth?: boolean;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  hideChevron?: boolean;
}

// Clearable version - onChange can return null
interface ClearableSelectProps<T = string> extends BaseSelectProps<T> {
  clearable: true;
  onChange: (value: T | null) => void;
}

// Non-clearable version - onChange cannot return null
interface NonClearableSelectProps<T = string> extends BaseSelectProps<T> {
  clearable?: false;
  onChange: (value: T) => void;
}

// Union type for type-safe props
export type SelectProps<T = string> = ClearableSelectProps<T> | NonClearableSelectProps<T>;

function isGroupedItems<T>(
  items: SelectItem<T>[] | SelectItemGroup<T>[]
): items is SelectItemGroup<T>[] {
  return items.length > 0 && 'items' in items[0];
}

function defaultSearchFunction<T>(item: SelectItem<T>, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  const labelText = typeof item.label === 'string' ? item.label : '';
  const searchText = item.searchLabel || labelText;
  const valueText = String(item.value);
  const secondaryLabelText = item.secondaryLabel || '';

  return (
    searchText.toLowerCase().includes(term) ||
    valueText.toLowerCase().includes(term) ||
    secondaryLabelText.toLowerCase().includes(term)
  );
}

// Memoized SelectItem component to avoid re-renders
const SelectItemComponent = React.memo(
  <T,>({
    item,
    index,
    value,
    showIndex,
    onSelect
  }: {
    item: SelectItem<T>;
    index: number;
    value: string | undefined;
    showIndex: boolean;
    onSelect: (value: string) => void;
  }) => {
    const isSelected = String(item.value) === String(value);

    return (
      <CommandItem
        value={String(item.value)}
        onSelect={onSelect}
        disabled={item.disabled}
        className={cn(
          'flex min-h-7 items-center gap-2 px-2',
          item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          isSelected && 'bg-item-select'
        )}>
        {item.icon}
        <span className="flex-1">
          {showIndex && `${index + 1}. `}
          <div className="flex flex-col space-y-0">
            <span className="text-foreground">{item.label}</span>
            {item.secondaryLabel && (
              <span className="text-text-secondary text-sm">{item.secondaryLabel}</span>
            )}
          </div>
        </span>
        {isSelected && (
          <div className="text-icon-color flex h-4 w-4 items-center">
            <Check />
          </div>
        )}
      </CommandItem>
    );
  }
);

SelectItemComponent.displayName = 'SelectItemComponent';

function SelectComponent<T = string>({
  items,
  disabled = false,
  onChange,
  placeholder = 'Select an option',
  emptyMessage = 'No options found.',
  value,
  onOpenChange,
  open: controlledOpen,
  showIndex = false,
  className,
  dataTestId,
  loading = false,
  showLoadingIcon = true,
  search = false,
  clearable = false,
  matchPopUpWidth = false,
  inputValue,
  onInputValueChange,
  hideChevron = false
}: SelectProps<T>) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [internalInputValue, setInternalInputValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const commandRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  // Use provided inputValue or internal state
  const currentInputValue = inputValue ?? internalInputValue;
  const setInputValue = onInputValueChange ?? setInternalInputValue;

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!disabled) {
        setInternalOpen(newOpen);
        onOpenChange?.(newOpen);
        if (!newOpen) {
          // Clear search value when closing
          setInputValue('');
          setIsFocused(false);
        }
      }
    },
    [disabled, onOpenChange, setInputValue]
  );

  // Get all items in a flat array for easier processing
  const flatItems = React.useMemo(() => {
    if (isGroupedItems(items)) {
      return items.flatMap((group) => group.items);
    }
    return items;
  }, [items]);

  // Find the selected item
  const selectedItem = React.useMemo(
    () => flatItems.find((item) => String(item.value) === String(value)),
    [flatItems, value]
  );

  // Filter items based on search
  const filterItem = React.useCallback(
    (item: SelectItem<T>): boolean => {
      if (!search || !currentInputValue) return true;

      if (typeof search === 'function') {
        return search(item, currentInputValue);
      }

      return defaultSearchFunction(item, currentInputValue);
    },
    [search, currentInputValue]
  );

  const handleSelect = React.useCallback(
    (itemValue: string) => {
      const item = flatItems.find((i) => String(i.value) === itemValue);
      if (item) {
        onChange(item.value);
        handleOpenChange(false);
        setInputValue('');
        inputRef.current?.blur();
      }
    },
    [flatItems, onChange, handleOpenChange, setInputValue]
  );

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      // Type assertion is safe here because handleClear is only called when clearable is true
      if (clearable) {
        (onChange as (value: T | null) => void)(null);
        setInputValue('');
        handleOpenChange(false);
      }
    },
    [onChange, handleOpenChange, clearable, setInputValue]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // If we have async loading, use debounced version
      if (onInputValueChange) {
        // Update internal state immediately for UI responsiveness
        if (!inputValue) {
          setInternalInputValue(newValue);
        }
        // Debounce the external callback
        setInputValue(newValue);
      } else {
        // No debouncing, update immediately
        setInputValue(newValue);
      }

      if (search !== false && newValue && !open) {
        handleOpenChange(true);
      }
    },
    [search, open, handleOpenChange, setInputValue, onInputValueChange, inputValue]
  );

  const handleInputFocus = React.useCallback(() => {
    setIsFocused(true);
    if (!open) {
      handleOpenChange(true);
    }
  }, [open, handleOpenChange]);

  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Home', 'End'].includes(e.key)) {
        if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault();
          handleOpenChange(true);
          return;
        }

        // Forward the event to the command component
        if (open && commandRef.current) {
          const commandInput = commandRef.current.querySelector('[cmdk-input]');
          if (commandInput) {
            const newEvent = new KeyboardEvent('keydown', {
              key: e.key,
              code: e.code,
              keyCode: e.keyCode,
              which: e.which,
              shiftKey: e.shiftKey,
              ctrlKey: e.ctrlKey,
              altKey: e.altKey,
              metaKey: e.metaKey,
              bubbles: true,
              cancelable: true
            });
            commandInput.dispatchEvent(newEvent);
            e.preventDefault();
          }
        }
      } else if (e.key === 'Escape') {
        handleOpenChange(false);
        inputRef.current?.blur();
      }
    },
    [open, handleOpenChange]
  );

  // Render items with memoization to prevent unnecessary re-renders
  const renderedItems = React.useMemo(() => {
    if (isGroupedItems(items)) {
      return items.map((group, groupIndex) => {
        const filteredItems = group.items.filter(filterItem);
        if (filteredItems.length === 0 && currentInputValue) return null;

        return (
          <CommandGroup key={`${group.label}-${groupIndex}`} heading={group.label}>
            {filteredItems.map((item, index) => (
              <SelectItemComponent
                key={String(item.value)}
                item={item}
                index={index}
                value={value}
                showIndex={showIndex}
                onSelect={handleSelect}
              />
            ))}
          </CommandGroup>
        );
      });
    }

    const filteredItems = flatItems.filter(filterItem);
    return filteredItems.map((item, index) => (
      <SelectItemComponent
        key={String(item.value)}
        item={item}
        index={index}
        value={value}
        showIndex={showIndex}
        onSelect={handleSelect}
      />
    ));
  }, [items, flatItems, filterItem, currentInputValue, value, showIndex, handleSelect]);

  // Display value in input when not focused/searching
  const inputDisplayValue = React.useMemo(() => {
    if (isFocused || currentInputValue) {
      return currentInputValue;
    }
    if (selectedItem) {
      return typeof selectedItem.label === 'string' ? selectedItem.label : '';
    }
    return '';
  }, [isFocused, currentInputValue, selectedItem]);

  // Compute placeholder once
  const computedPlaceholder = React.useMemo(() => {
    return typeof selectedItem?.label === 'string' ? selectedItem.label : placeholder;
  }, [selectedItem, placeholder]);

  return (
    <PopoverRoot open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className={cn('relative w-full', className)}>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-label={placeholder}
            disabled={disabled}
            value={inputDisplayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={computedPlaceholder}
            data-testid={dataTestId}
            readOnly={search === false}
            className={cn(
              'flex h-7 w-full items-center justify-between rounded border px-2.5 text-base',
              'bg-background cursor-pointer transition-all duration-300',
              'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              disabled ? 'bg-disabled text-gray-light' : '',
              !selectedItem && !currentInputValue && 'text-text-secondary'
            )}
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            {loading && showLoadingIcon && (
              <div className="mr-1 flex items-center justify-center">
                <CircleSpinnerLoader size={13} />
              </div>
            )}
            {clearable && selectedItem && !isFocused && (
              <button
                type="button"
                onClick={handleClear}
                className="hover:text-foreground text-icon-color pointer-events-auto mr-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded"
                aria-label="Clear selection">
                <Xmark />
              </button>
            )}
            {!open && !hideChevron && (
              <div className="flex h-4 w-4 shrink-0 items-center opacity-50">
                <ChevronDown />
              </div>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          matchPopUpWidth
            ? 'w-[var(--radix-popover-trigger-width)]'
            : 'min-w-[var(--radix-popover-trigger-width)]',
          'p-0'
        )}
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}>
        <Command ref={commandRef} shouldFilter={false}>
          {/* Hidden input that Command uses for keyboard navigation */}
          <CommandInput
            value={currentInputValue}
            onValueChange={setInputValue}
            parentClassName="sr-only hidden h-0 border-0 p-0"
            aria-hidden="true"
          />
          <div className="scrollbar-hide max-h-[300px] overflow-y-auto">
            <CommandList id={listboxId} className="p-1">
              {emptyMessage && <CommandEmpty>{emptyMessage}</CommandEmpty>}
              {renderedItems}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </PopoverRoot>
  );
}

export const Select = React.memo(SelectComponent) as typeof SelectComponent;

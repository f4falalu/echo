import type { TComboboxInputElement } from 'platejs';

import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/lib/utils';
import { getSlashGroups } from '../config/addMenuItems';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './InlineCombobox';

const groups = getSlashGroups();

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span" data-slate-value={element.value}>
      <InlineCombobox
        element={element}
        trigger="/"
        className="bg-item-select relative rounded-l px-1 min-h-7 overflow-hidden flex items-center w-fit"
      >
        <InlineComboboxInput
          placeholder="Filter..."
          className="pl-1 py-0.5 bg-item-select text-gray-light rounded-r"
        />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(({ focusEditor, icon, keywords, label, value, onSelect }) => (
                <InlineComboboxItem
                  key={value}
                  value={value}
                  onClick={() => onSelect(editor, value)}
                  label={label}
                  focusEditor={focusEditor}
                  group={group}
                  keywords={keywords ? [...keywords] : undefined}
                >
                  <div className="text-muted-foreground mr-2">{icon}</div>
                  {label ?? value}
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>
      {props.children}
    </PlateElement>
  );
}

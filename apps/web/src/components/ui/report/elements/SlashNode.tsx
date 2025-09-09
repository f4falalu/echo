import type { TElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, usePluginOption } from 'platejs/react';
import { getSlashGroups } from '../config/addMenuItems';
import { SlashInputPlugin } from '../plugins/slash-kit';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './InlineCombobox';

interface TSlashInputElement extends TElement {
  value: string;
  placeholder: string;
}

const groups = getSlashGroups();

export function SlashInputElement(props: PlateElementProps<TSlashInputElement>) {
  const { editor, element } = props;

  const placeholderGlobal = usePluginOption(SlashInputPlugin, 'placeholder') || 'Filter...';
  const placeholder = element.placeholder || placeholderGlobal;

  return (
    <PlateElement {...props} as="span" data-slate-value={element.value}>
      <InlineCombobox
        element={element}
        trigger="/"
        className="bg-item-select relative rounded pl-1 pr-2 gap-x-1 min-h-7 overflow-hidden flex items-center w-fit"
      >
        <InlineComboboxInput placeholder={placeholder} className="bg-item-select text-gray-light" />

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
                  <div className="text-icon-color mr-2">{icon}</div>
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

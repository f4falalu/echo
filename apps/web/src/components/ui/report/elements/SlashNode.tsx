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
    <PlateElement
      {...props}
      as="div"
      className="!absolute top-0 left-0 py-1 bg-item-select flex pr-1 pl-0 rounded -translate-y-0.5 -translate-x-0.5"
      data-slate-value={element.value}
    >
      <InlineCombobox
        element={element}
        trigger="/"
        className="bg-item-select relative rounded pl-2 pr-1.5 mr-1 overflow-hidden w-fit flex items-center"
      >
        <InlineComboboxInput
          placeholder={placeholder}
          className="bg-item-select text-gray-light ml-1 rounded-r"
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

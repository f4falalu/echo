import type {
  BusterInputProps,
  BusterOnSelectParams,
  GroupOverrideProps,
} from './BusterInput.types';
import { BusterInputGroup } from './BusterInputGroup';
import { BusterInputItem } from './BusterInputItem';
import { BusterInputSeparator } from './BusterInputSeparator';

export const BusterItemSelector = ({
  item,
  onSelect,
  addValueToInput,
  closeOnSelect,
}: {
  item: BusterInputProps['suggestionItems'][number];
  onSelect: (params: BusterOnSelectParams) => void;
} & GroupOverrideProps) => {
  if (item.type === 'separator') {
    return <BusterInputSeparator />;
  }

  if (item.type === 'group') {
    return <BusterInputGroup {...item} onSelect={onSelect} />;
  }

  return (
    <BusterInputItem
      {...item}
      onSelect={onSelect}
      addValueToInput={item?.addValueToInput ?? addValueToInput}
      closeOnSelect={item?.closeOnSelect ?? closeOnSelect}
    />
  );
};

export const BusterItemsSelector = ({
  suggestionItems,
  onSelect,
  addValueToInput,
  closeOnSelect,
}: {
  suggestionItems: BusterInputProps['suggestionItems'];
  onSelect: (params: BusterOnSelectParams) => void;
} & GroupOverrideProps) => {
  if (!suggestionItems) return null;
  return suggestionItems.map((item, index) => (
    <BusterItemSelector
      key={keySelector(item, index)}
      item={item}
      onSelect={onSelect}
      addValueToInput={addValueToInput}
      closeOnSelect={closeOnSelect}
    />
  ));
};

const keySelector = (item: BusterInputProps['suggestionItems'][number], index: number) => {
  if (item.type === 'separator') return `separator${index}`;
  if (item.type === 'group') return `${item.label} + index`;
  return item.value;
};

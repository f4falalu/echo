import { type MentionListGroupExtended, MentionListSelector } from './MentionListSelector';

export function MentionListGroup<T = string>({
  items,
  label,
  icon,
  setSelectedItem,
  selectedItem,
}: MentionListGroupExtended<T>) {
  return (
    <div className="mention-list-group">
      <div className="flex items-center pb-1 px-2 pt-2 h-7 text-sm text-gray-dark">
        {icon && <span className="mr-2 text-icon-color">{icon}</span>}
        {label}
      </div>

      {items.map((item, index) => (
        <MentionListSelector
          key={index}
          {...item}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
        />
      ))}
    </div>
  );
}

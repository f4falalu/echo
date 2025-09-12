import { useCalloutEmojiPicker } from '@platejs/callout/react';
import { useEmojiDropdownMenuState } from '@platejs/emoji/react';
import type { TCalloutElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { cn } from '@/lib/utils';

export function CalloutElement({
  attributes,
  children,
  ...props
}: PlateElementProps<TCalloutElement>) {
  const { element } = props;
  const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState({
    closeOnSelect: true,
  });

  const { emojiToolbarDropdownProps, props: calloutProps } = useCalloutEmojiPicker({
    isOpen,
    setIsOpen,
  });

  return (
    <PlateElement
      className={cn(
        'bg-item-select flex rounded-sm p-6 my-2.5 relative group text-[15px] leading-[150%] font-normal',
        attributes.className
      )}
      style={{
        ...attributes.style,
        backgroundColor: element.backgroundColor,
      }}
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true,
      }}
      {...props}
    >
      {children}
      {/* <div className="flex w-full gap-2 p-6 rounded"> */}
      {/* <EmojiPopover
          {...emojiToolbarDropdownProps}
          control={
            <Button
              variant="ghost"
              size="tall"
              className="hover:bg-muted-foreground/15 size-6 max-h-none p-1 text-[18px] select-none"
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
              }}
              prefix={<div className="text-lg">{(element.icon || '💡').trim()}</div>}
              contentEditable={false}
            />
          }
        >
          <EmojiPicker {...emojiPickerState} {...calloutProps} />
        </EmojiPopover> */}
      {/* <div className="mt-0.5 w-full">{children}</div> */}
      {/* </div> */}
    </PlateElement>
  );
}

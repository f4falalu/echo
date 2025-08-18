import { DEFAULT_CHART_THEME } from '@buster/server-shared/metrics';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/buttons';
import { Plus, Trash } from '@/components/ui/icons';
import FloppyDisk from '@/components/ui/icons/NucleoIconOutlined/floppy-disk';
import { Input } from '@/components/ui/inputs';
import { Popover } from '@/components/ui/popover';
import { Text } from '@/components/ui/typography';
import { inputHasText } from '@/lib/text';
import type { IColorPalette } from '../ThemeList';
import { ColorPickButton } from './DraggableColorPicker';

interface NewThemePopupProps {
  selectedTheme?: IColorPalette;
  onSave: (theme: IColorPalette) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (theme: IColorPalette) => Promise<void>;
}

const NewThemePopupContent = React.memo(
  ({
    selectedTheme,
    onDelete,
    onUpdate,
    onSave,
    triggerRef,
  }: NewThemePopupProps & {
    triggerRef: React.RefObject<HTMLSpanElement | null>;
  }) => {
    const [title, setTitle] = useState('');
    const [colors, setColors] = useState<string[]>(DEFAULT_CHART_THEME);
    const [id, setId] = useState(uuidv4());

    const isNewTheme = !selectedTheme;
    const disableCreateTheme = isNewTheme ? !inputHasText(title) || colors.length <= 0 : false;

    const reset = () => {
      setTitle('');
      setColors(DEFAULT_CHART_THEME);
      setId(uuidv4());
    };

    const closePopover = () => {
      triggerRef.current?.click();
    };

    const onDeleteClick = async () => {
      if (selectedTheme) await onDelete?.(id);
      closePopover();
      setTimeout(() => {
        reset();
      }, 350);
    };

    const onSaveClick = async () => {
      await onSave({ id, name: title, colors });
      closePopover();
      setTimeout(() => {
        reset();
      }, 350);
    };

    const onUpdateClick = async () => {
      await onUpdate?.({ id, name: title, colors });
      closePopover();
      setTimeout(() => {
        reset();
      }, 350);
    };

    useEffect(() => {
      if (selectedTheme) {
        setTitle(selectedTheme.name);
        setColors(selectedTheme.colors);
        setId(selectedTheme.id);
      }
    }, [selectedTheme]);

    return (
      <div className="w-[280px] max-w-[340px]">
        <div className="grid grid-cols-[80px_1fr] items-center gap-2 p-2.5">
          <Text>Title</Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Theme name"
          />
          <Text>Theme</Text>
          <ColorPickButton colors={colors} onColorsChange={setColors} />
        </div>
        <div className="w-full border-t"></div>

        <div className="flex space-x-1.5 p-2.5">
          {onDelete && !isNewTheme && (
            <Button
              block
              disabled={disableCreateTheme}
              onClick={isNewTheme ? onSaveClick : onDeleteClick}
              prefix={<Trash />}
            >
              {'Delete theme'}
            </Button>
          )}
          <Button
            block
            disabled={disableCreateTheme}
            onClick={isNewTheme ? onSaveClick : onUpdateClick}
            prefix={isNewTheme ? <Plus /> : <FloppyDisk />}
          >
            {isNewTheme || !onUpdate ? 'Create theme' : 'Update theme'}
          </Button>
        </div>
      </div>
    );
  }
);

NewThemePopupContent.displayName = 'NewThemePopupContent';

export const NewThemePopup = ({
  children,
  ...props
}: NewThemePopupProps & { children: React.ReactNode }) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  return (
    <Popover
      content={<NewThemePopupContent {...props} triggerRef={triggerRef} />}
      trigger="click"
      className="max-w-[320px] p-0"
      sideOffset={12}
    >
      <span data-testid="new-theme-popup-trigger" ref={triggerRef}>
        {children}
      </span>
    </Popover>
  );
};

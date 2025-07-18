import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';
import React, { useEffect, useState } from 'react';
import type { IColorTheme } from '../ThemeList';
import { useMemoizedFn } from '@/hooks';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash } from '../../../ui/icons';
import { ColorPickButton } from './DraggableColorPicker';
import { inputHasText } from '@/lib/text';
import { DEFAULT_CHART_THEME } from '@buster/server-shared/metrics';

interface NewThemePopupProps {
  selectedTheme?: IColorTheme;
  onSave: (theme: IColorTheme) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (theme: IColorTheme) => Promise<void>;
}

export const NewThemePopup = React.memo(
  ({ selectedTheme, onDelete, onUpdate, onSave }: NewThemePopupProps) => {
    const [title, setTitle] = useState('');
    const [colors, setColors] = useState<string[]>(DEFAULT_CHART_THEME);
    const [id, setId] = useState(uuidv4());

    const isNewTheme = !selectedTheme;
    const disableCreateTheme = isNewTheme ? !inputHasText(title) || colors.length <= 0 : false;

    const reset = useMemoizedFn(() => {
      setTitle('');
      setColors(DEFAULT_CHART_THEME);
      setId(uuidv4());
    });

    const onDeleteClick = useMemoizedFn(async () => {
      if (selectedTheme) await onDelete?.(id);
      setTimeout(() => {
        reset();
      }, 350);
    });

    const onSaveClick = useMemoizedFn(async () => {
      await onSave({ id, name: title, colors });
      setTimeout(() => {
        reset();
      }, 350);
    });

    const onUpdateClick = useMemoizedFn(async () => {
      await onUpdate?.({ id, name: title, colors });
      setTimeout(() => {
        reset();
      }, 350);
    });

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
              prefix={<Trash />}>
              {'Delete theme'}
            </Button>
          )}
          <Button
            block
            disabled={disableCreateTheme}
            onClick={isNewTheme ? onSaveClick : onUpdateClick}
            prefix={<Plus />}>
            {isNewTheme || !onUpdate ? 'Create theme' : 'Update theme'}
          </Button>
        </div>
      </div>
    );
  }
);

NewThemePopup.displayName = 'NewThemePopup';

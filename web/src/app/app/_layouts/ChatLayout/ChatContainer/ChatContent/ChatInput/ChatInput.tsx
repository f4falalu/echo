import React, { useMemo, useState } from 'react';
import { Input, Button } from 'antd';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components';
import { inputHasText } from '@/utils';

const autoSize = { minRows: 3, maxRows: 4 };

export const ChatInput: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();
  const [inputValue, setInputValue] = useState('');

  const loading = false;

  const disableSendButton = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const onSubmit = useMemoizedFn(async () => {
    if (disableSendButton) return;
  });

  const disableSubmit = !inputHasText(inputValue);
  const [isFocused, setIsFocused] = React.useState(false);

  const onPressEnter = useMemoizedFn((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey && e.key === 'Enter') {
      onSubmit();
      return;
    }
  });

  const onChangeInput = useMemoizedFn((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  const onBlurInput = useMemoizedFn(() => {
    setIsFocused(false);
  });

  const onFocusInput = useMemoizedFn(() => {
    setIsFocused(true);
  });

  return (
    <div
      className={cx(
        styles.inputCard,
        'z-10 mx-3 mt-0.5 flex flex-col items-center space-y-1.5 overflow-hidden pb-2'
      )}>
      <div
        className={cx(
          styles.inputContainer,
          isFocused && 'focused',
          'relative flex w-full items-center'
        )}>
        <Input.TextArea
          variant="borderless"
          onBlur={onBlurInput}
          onFocus={onFocusInput}
          className="inline-block !pl-3.5 !pr-9 !pt-2 align-middle"
          placeholder="Ask a follow up..."
          value={inputValue}
          autoFocus={true}
          onChange={onChangeInput}
          onPressEnter={onPressEnter}
          disabled={loading}
          autoSize={autoSize}
        />
        <div className="absolute bottom-2 right-2">
          <Button
            shape="circle"
            disabled={disableSendButton}
            icon={<AppMaterialIcons icon="arrow_upward" />}
          />
        </div>
      </div>

      <AIWarning />
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

const useStyles = createStyles(({ token, css }) => ({
  inputCard: css`
    box-shadow: 0px -10px 18px 10px ${token.colorBgContainerDisabled};
  `,
  inputContainer: css`
    background: ${token.colorBgBase};
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};
    transition: border-color 0.2s;
    min-height: 40px;
    &:hover {
      border-color: ${token.colorPrimaryHover};
    }
    &.focused {
      border-color: ${token.colorPrimary};
    }
  `
}));

const AIWarning = React.memo(() => {
  return (
    <div className="w-full overflow-hidden truncate text-center">
      <Text size="xs" type="tertiary" className="truncate">
        Our AI may make mistakes. Check important info.
      </Text>
    </div>
  );
});

AIWarning.displayName = 'AIWarning';

import React, { useMemo, useState } from 'react';
import { Input } from 'antd';
import { createStyles } from 'antd-style';
import { useMemoizedFn } from 'ahooks';
import { inputHasText } from '@/utils';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { AIWarning } from './AIWarning';
import { SubmitButton } from './SubmitButton';
import { useChatInputFlow } from './useChatInputFlow';
import { useChatContextSelector } from '../../../ChatContext';

const autoSize = { minRows: 3, maxRows: 4 };

export const ChatInput: React.FC<{}> = React.memo(({}) => {
  const { styles, cx } = useStyles();
  const loading = useBusterNewChatContextSelector((state) => state.loadingNewChat);
  const selectedFileId = useChatContextSelector((x) => x.selectedFileId);

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = React.useState(false);

  const disableSendButton = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const { onSubmitPreflight } = useChatInputFlow({
    disableSendButton,
    inputValue
  });

  const onPressEnter = useMemoizedFn((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey && e.key === 'Enter') {
      onSubmitPreflight();
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
          <SubmitButton
            disableSendButton={disableSendButton}
            loading={loading}
            onSubmitPreflight={onSubmitPreflight}
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

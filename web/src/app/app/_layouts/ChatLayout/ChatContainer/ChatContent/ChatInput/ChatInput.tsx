import React, { useMemo, useState } from 'react';
import { Input, Button } from 'antd';
import { Text } from '@/components/text';
import { createStyles } from 'antd-style';
import { useMemoizedFn } from 'ahooks';
import { AppMaterialIcons } from '@/components';
import { inputHasText } from '@/utils';

const autoSize = { minRows: 4, maxRows: 4 };

export const ChatInput: React.FC = React.memo(() => {
  const { styles, cx } = useStyles();

  const [inputValue, setInputValue] = useState('');

  const disableSendButton = useMemo(() => {
    return !inputHasText(inputValue);
  }, [inputValue]);

  const handleInputChange = useMemoizedFn((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  });

  const onSubmit = useMemoizedFn(async () => {
    if (disableSendButton) return;
    console.log('submit');
  });

  return (
    <div
      className={cx(
        styles.inputContainer,
        'relative z-10 flex flex-col items-center space-y-1.5 px-3 pb-2 pt-0.5'
      )}>
      <div className="relative w-full">
        <Input.TextArea
          className="w-full"
          defaultValue={inputValue}
          placeholder="Edit or follow up"
          rows={4}
          autoSize={autoSize}
          onChange={handleInputChange}
        />

        <div className="absolute bottom-2 right-2">
          <Button
            shape="circle"
            disabled={disableSendButton}
            icon={<AppMaterialIcons icon="arrow_upward" />}
            className=""
          />
        </div>
      </div>
      <Text size="xs" type="tertiary">
        Our AI may make mistakes. Check important info.
      </Text>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

const useStyles = createStyles(({ token, css }) => ({
  inputContainer: css`
    box-shadow: 0px -10px 18px 10px ${token.colorBgContainerDisabled};
  `
}));

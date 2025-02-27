import { Command, Xmark, CircleWarning, ReturnKey } from '@/components/ui/icons';
import { AppCodeEditor } from '@/components/ui/inputs/AppCodeEditor';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from 'ahooks';
import { createStyles } from 'antd-style';
import { Button } from '@/components/ui/buttons/Button';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppVerticalCodeSplitterProps } from './AppVerticalCodeSplitter';

export const SQLContainer: React.FC<{
  className?: string;
  sql: string | undefined;
  setDatasetSQL: (sql: string) => void;
  onRunQuery: () => Promise<void>;
  onSaveSQL?: AppVerticalCodeSplitterProps['onSaveSQL'];
  disabledSave?: AppVerticalCodeSplitterProps['disabledSave'];
  error?: string | null;
}> = React.memo(
  ({ disabledSave, className = '', sql, setDatasetSQL, onRunQuery, onSaveSQL, error }) => {
    const { styles, cx } = useStyles();
    const [isRunning, setIsRunning] = useState(false);
    const [isError, setIsError] = useState(false);
    const { openInfoMessage } = useBusterNotifications();

    const onCopySQL = useMemoizedFn(() => {
      navigator.clipboard.writeText(sql || '');
      openInfoMessage('SQL copied to clipboard');
    });

    const onRunQueryPreflight = useMemoizedFn(async () => {
      setIsRunning(true);
      await onRunQuery();
      setIsRunning(false);
    });

    useEffect(() => {
      setIsError(!!error);
    }, [error]);

    return (
      <div
        className={cx(styles.container, 'flex h-full w-full flex-col overflow-hidden', className)}>
        <AppCodeEditor
          className="overflow-hidden"
          value={sql}
          onChange={setDatasetSQL}
          onMetaEnter={onRunQueryPreflight}
          variant={null}
        />
        <div className="bg-border-color my-0! h-[0.5px] w-full" />
        <div className="relative flex items-center justify-between px-4 py-2.5">
          <Button onClick={onCopySQL}>Copy SQL</Button>

          <div className="flex items-center gap-2">
            {onSaveSQL && (
              <Button
                disabled={disabledSave || !sql || isRunning}
                variant="black"
                onClick={onSaveSQL}>
                Save
              </Button>
            )}

            <Button
              variant="default"
              loading={isRunning}
              disabled={!sql}
              className="flex items-center space-x-0"
              onClick={onRunQueryPreflight}
              suffix={
                <div className="flex items-center gap-x-1 text-sm">
                  <Command />
                  <ReturnKey />
                </div>
              }>
              Run
            </Button>
          </div>

          {error && (
            <ErrorContainer error={error} onClose={() => setIsError(false)} isError={isError} />
          )}
        </div>
      </div>
    );
  }
);

SQLContainer.displayName = 'SQLContainer';

const ErrorContainer: React.FC<{
  error: string;
  onClose: () => void;
  isError: boolean;
}> = React.memo(({ error, onClose, isError }) => {
  const { styles, cx } = useStyles();

  return (
    <AnimatePresence mode="wait">
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          className={cx(styles.errorContainer, 'absolute right-0 bottom-full left-0 mx-4 mb-2')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleWarning />
              <span>{error}</span>
            </div>
            <button
              onClick={() => onClose()}
              className={cx(
                styles.closeButton,
                'rounded-sm p-0.5 transition-colors hover:bg-black/5'
              )}>
              <Xmark />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

ErrorContainer.displayName = 'ErrorContainer';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    background: ${token.colorBgBase};
    border-radius: ${token.borderRadius}px;
    border: 0.5px solid ${token.colorBorder};
  `,
  errorContainer: css`
    background: ${token.colorErrorBg};
    color: ${token.colorError};
    border: 0.5px solid ${token.colorError};
    padding: 8px 12px;
    border-radius: ${token.borderRadius}px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  `,
  closeButton: css`
    color: ${token.colorError};
    cursor: pointer;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      opacity: 0.8;
    }
  `
}));

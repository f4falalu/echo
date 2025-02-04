import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Input, InputRef, ConfigProvider, Divider, ThemeConfig } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { useMemoizedFn, useMount, useThrottleFn } from 'ahooks';
import { useAntToken } from '@/styles/useAntToken';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { inputHasText } from '@/utils';
import { useBusterSearchContextSelector } from '@/context/Search';
import type { BusterSearchResult } from '@/api/asset_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { NewChatModalDataSourceSelect } from './NewChatModalDatasourceSelect';
import { NoDatasets } from './NoDatasets';
import { useParams } from 'next/navigation';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { NewDatasetModal } from '../NewDatasetModal';

const { TextArea } = Input;

const themeConfig: ThemeConfig = {
  components: {
    Modal: {
      paddingMD: 4,
      paddingContentHorizontalLG: 4
    }
  }
};

const modalClassNames = {
  body: '!p-0'
};

export const NewChatModal = React.memo<{
  open: boolean;
  onClose: () => void;
}>(({ open, onClose }) => {
  const searchParams = useParams();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { openErrorNotification } = useBusterNotifications();
  const { isFetched: isFetchedDatasets, data: datasetsList } = useGetDatasets();
  const onStartNewChat = useBusterNewChatContextSelector((x) => x.onStartNewChat);
  const onSetSelectedChatDataSource = useBusterNewChatContextSelector(
    (x) => x.onSetSelectedChatDataSource
  );
  const selectedChatDataSource = useBusterNewChatContextSelector((x) => x.selectedChatDataSource);
  const onSetPrompt = useBusterNewChatContextSelector((x) => x.onSetPrompt);
  const prompt = useBusterNewChatContextSelector((x) => x.prompt);
  const onBusterSearch = useBusterSearchContextSelector((x) => x.onBusterSearch);
  const token = useAntToken();
  const [openNewDatasetModal, setOpenNewDatasetModal] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<BusterSearchResult[]>([]);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [defaultSuggestedPrompts, setDefaultSuggestedPrompts] = useState<BusterSearchResult[]>([]);
  const shownPrompts = prompt.length > 1 ? suggestedPrompts : defaultSuggestedPrompts;
  const lastKeyPressed = useRef<string | null>(null);
  const hasDatasets = datasetsList.length > 0 && isFetchedDatasets;
  const showSuggested = shownPrompts.length > 0 && hasDatasets;

  const memoizedHasDatasetStyle = useMemo(() => {
    return {
      padding: `${token.paddingSM}px ${token.paddingSM}px`,
      paddingTop: token.paddingSM,
      paddingBottom: 0
    };
  }, []);

  const getSuggestedChatPrompts = useMemoizedFn(async (prompt: string) => {
    const res = await onBusterSearch({
      query: prompt,
      include: ['exclude_metrics']
    });
    return res;
  });

  const { run: debouncedGetSuggestedChatPrompts } = useThrottleFn(
    async (v: string) => {
      try {
        const prompts = await getSuggestedChatPrompts(v);
        setSuggestedPrompts(prompts);
        return prompts;
      } catch (e) {
        openErrorNotification(e);
      }
    },
    { wait: 350 }
  );

  const getDefaultSuggestedPrompts = useMemoizedFn(() => {
    getSuggestedChatPrompts('').then((prompts) => {
      setDefaultSuggestedPrompts(prompts);
    });
  });

  const onCloseOrCancel = useMemoizedFn(() => {
    onClose();
  });

  useEffect(() => {
    if (open) {
      onSetPrompt('');

      if (defaultSuggestedPrompts.length === 0) {
        getDefaultSuggestedPrompts();
      }

      const handleKeyPress = (event: KeyboardEvent) => {
        lastKeyPressed.current = event.code;
      };
      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [open]);

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal
        open={open}
        onCancel={onCloseOrCancel}
        closable={false}
        onClose={onCloseOrCancel}
        width={hasDatasets ? 725 : 350}
        destroyOnClose={true}
        footer={null}
        classNames={modalClassNames}>
        {hasDatasets && (
          <div className="flex w-full flex-col" style={memoizedHasDatasetStyle}>
            <NewChatModalDataSourceSelect
              onSetSelectedChatDataSource={onSetSelectedChatDataSource}
              selectedChatDataSource={selectedChatDataSource}
              dataSources={datasetsList}
              loading={!isFetchedDatasets}
            />

            <NewChatInput
              key={open ? 'open' : 'closed'}
              setSuggestedPrompts={setSuggestedPrompts}
              debouncedGetSuggestedChatPrompts={debouncedGetSuggestedChatPrompts}
              shownPrompts={shownPrompts}
              lastKeyPressed={lastKeyPressed}
              activeItem={activeItem}
            />
          </div>
        )}

        {!hasDatasets && (
          <NoDatasets onClose={onClose} setOpenNewDatasetModal={setOpenNewDatasetModal} />
        )}

        {hasDatasets && showSuggested && <Divider className="!m-0" />}

        {/* {hasDatasets && (
          <SuggestedPromptsContainer
            open={open}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            prompts={shownPrompts}
            onSelectPrompt={onSelectPrompt}
            navigatingToMetricId={navigatingToMetricId}
          />
        )} */}
      </Modal>

      {!hasDatasets && (
        <NewDatasetModal
          open={openNewDatasetModal}
          onClose={() => setOpenNewDatasetModal(false)}
          afterCreate={onClose}
        />
      )}
    </ConfigProvider>
  );
});
NewChatModal.displayName = 'NewChatModal';

const NewChatInput: React.FC<{
  setSuggestedPrompts: (prompts: BusterSearchResult[]) => void;
  debouncedGetSuggestedChatPrompts: (prompt: string) => Promise<BusterSearchResult[] | undefined>;
  shownPrompts: BusterSearchResult[];
  lastKeyPressed: React.MutableRefObject<string | null>;
  activeItem: number | null;
}> = React.memo(
  ({
    setSuggestedPrompts,
    debouncedGetSuggestedChatPrompts,
    activeItem,
    shownPrompts,
    lastKeyPressed
  }) => {
    const token = useAntToken();
    const inputRef = useRef<InputRef>(null);
    const loadingNewMetric = useBusterNewChatContextSelector((x) => x.loadingNewChat);
    const prompt = useBusterNewChatContextSelector((x) => x.prompt);
    const onStartNewChat = useBusterNewChatContextSelector((x) => x.onStartNewChat);
    const onSetPrompt = useBusterNewChatContextSelector((x) => x.onSetPrompt);

    const onChangeText = useMemoizedFn((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.currentTarget.value;
      onSetPrompt(value);
      if (value.length < 1) {
        setSuggestedPrompts([]);
      } else {
        debouncedGetSuggestedChatPrompts(e.currentTarget.value);
      }
    });

    const onPressEnter = useMemoizedFn((v: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const value = v.currentTarget.value;
      const lastKeyPressedWasUpOrDown =
        lastKeyPressed.current === 'ArrowUp' || lastKeyPressed.current === 'ArrowDown';

      if (
        typeof activeItem === 'number' &&
        shownPrompts[activeItem]?.name &&
        lastKeyPressedWasUpOrDown
      ) {
        onStartNewChat(shownPrompts[activeItem]?.name);
        v.stopPropagation();
        v.preventDefault();
        return;
      }
      if (v.shiftKey) {
        return;
      }
      onStartNewChat(value);
    });

    const onClickSubmitButton = useMemoizedFn(() => {
      onStartNewChat(prompt);
    });

    useMount(() => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    });

    const autoSizeMemoized = useMemo(() => {
      return { minRows: 1, maxRows: 16 };
    }, []);

    return (
      <div className="flex min-h-[54px] items-center justify-between space-x-1 overflow-y-auto px-2">
        <TextArea
          ref={inputRef}
          size="large"
          className="w-full !pl-0"
          autoSize={autoSizeMemoized}
          disabled={loadingNewMetric}
          variant="borderless"
          placeholder="Search for a metric..."
          defaultValue={prompt}
          onChange={onChangeText}
          onPressEnter={onPressEnter}
        />

        <Button
          type="primary"
          size="middle"
          icon={<AppMaterialIcons icon="arrow_forward" size={token.fontSizeLG} />}
          loading={loadingNewMetric}
          disabled={!inputHasText(prompt)}
          onClick={onClickSubmitButton}
        />
      </div>
    );
  }
);
NewChatInput.displayName = 'NewChatInput';

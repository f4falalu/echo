import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal, Input, InputRef, ConfigProvider, ThemeConfig } from 'antd';
import { AppMaterialIcons } from '@/components/icons';
import { useMemoizedFn, useMount, useThrottleFn } from 'ahooks';
import { useAntToken } from '@/styles/useAntToken';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { inputHasText, timeout } from '@/utils';
import { useBusterSearchContextSelector } from '@/context/Search';
import type { BusterSearchResult } from '@/api/asset_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { NewChatModalDataSourceSelect } from './NewChatModalDatasourceSelect';
import { NoDatasets } from './NoDatasets';
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
  const token = useAntToken();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const { openErrorNotification } = useBusterNotifications();
  const { isFetched: isFetchedDatasets, data: datasetsList } = useGetDatasets();
  const onBusterSearch = useBusterSearchContextSelector((x) => x.onBusterSearch);

  const [selectedChatDataSource, setSelectedChatDataSource] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [openNewDatasetModal, setOpenNewDatasetModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<BusterSearchResult[]>([]);
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [defaultSuggestedPrompts, setDefaultSuggestedPrompts] = useState<BusterSearchResult[]>([]);
  const lastKeyPressed = useRef<string | null>(null);
  const hasDatasets = datasetsList.length > 0 && isFetchedDatasets;
  const shownPrompts = prompt.length > 1 ? suggestedPrompts : defaultSuggestedPrompts;

  const memoizedHasDatasetStyle = useMemo(() => {
    return {
      padding: `${token.paddingSM}px ${token.paddingSM}px`,
      paddingTop: token.paddingSM,
      paddingBottom: 0
    };
  }, []);

  const getSuggestedChatPrompts = useMemoizedFn(async (prompt: string) => {
    const res = await onBusterSearch({
      query: prompt
    });
    return res;
  });

  const { run: debouncedGetSuggestedChatPrompts } = useThrottleFn(
    async (v: string) => {
      try {
        // const prompts = await getSuggestedChatPrompts(v);
        // setSuggestedPrompts(prompts);
        // return prompts;
        return [];
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

  useEffect(() => {
    if (open) {
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
        onCancel={onClose}
        closable={false}
        onClose={onClose}
        width={hasDatasets ? 725 : 350}
        destroyOnClose={true}
        footer={null}
        classNames={modalClassNames}>
        {hasDatasets && (
          <div className="flex w-full flex-col" style={memoizedHasDatasetStyle}>
            <NewChatModalDataSourceSelect
              onSetSelectedChatDataSource={setSelectedChatDataSource}
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
              prompt={prompt}
              selectedChatDataSource={selectedChatDataSource}
              setPrompt={setPrompt}
            />
          </div>
        )}

        {!hasDatasets && (
          <NoDatasets onClose={onClose} setOpenNewDatasetModal={setOpenNewDatasetModal} />
        )}

        {/* {hasDatasets && showSuggested && <Divider className="!m-0" />} */}

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
  prompt: string;
  setPrompt: (prompt: string) => void;
  selectedChatDataSource: {
    id: string;
    name: string;
  } | null;
}> = React.memo(
  ({
    setSuggestedPrompts,
    debouncedGetSuggestedChatPrompts,
    activeItem,
    shownPrompts,
    lastKeyPressed,
    prompt,
    setPrompt,
    selectedChatDataSource
  }) => {
    const token = useAntToken();
    const inputRef = useRef<InputRef>(null);
    const onStartNewChat = useBusterNewChatContextSelector((x) => x.onStartNewChat);
    const onSelectSearchAsset = useBusterNewChatContextSelector((x) => x.onSelectSearchAsset);
    const [loadingNewChat, setLoadingNewChat] = useState(false);

    const onStartNewChatPreflight = useMemoizedFn(async () => {
      setLoadingNewChat(true);
      await onStartNewChat({ prompt, datasetId: selectedChatDataSource?.id });
      await timeout(380);
      setPrompt('');
      setLoadingNewChat(false);
    });

    const onChangeText = useMemoizedFn((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.currentTarget.value;
      setPrompt(value);
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
        const foundAsset = shownPrompts[activeItem];
        if (foundAsset) {
          onSelectSearchAsset(foundAsset);
        }
        v.stopPropagation();
        v.preventDefault();
        return;
      }
      if (v.shiftKey) {
        return;
      }
      onStartNewChatPreflight();
    });

    const onClickSubmitButton = useMemoizedFn(() => {
      onStartNewChatPreflight();
    });

    useMount(() => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 175);
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
          disabled={loadingNewChat}
          variant="borderless"
          placeholder="Search for a metric..."
          defaultValue={prompt}
          onChange={onChangeText}
          onPressEnter={onPressEnter}
        />

        <Button
          type="primary"
          size="middle"
          // color="default"
          // variant="solid"
          icon={<AppMaterialIcons icon="arrow_forward" size={token.fontSizeLG} />}
          loading={loadingNewChat}
          disabled={!inputHasText(prompt)}
          onClick={onClickSubmitButton}
        />
      </div>
    );
  }
);
NewChatInput.displayName = 'NewChatInput';

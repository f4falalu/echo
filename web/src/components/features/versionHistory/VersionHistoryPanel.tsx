import React, { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/buttons';
import { Xmark, History } from '@/components/ui/icons';
import { Check3 } from '@/components/ui/icons/NucleoIconFilled';
import { Text } from '@/components/ui/typography';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/FileContainerHeaderVersionHistory';
import { cn } from '@/lib/classMerge';
import { timeFromNow, timeout } from '@/lib';
import { AppPageLayout } from '@/components/ui/layouts';
import { useListVersionHistories } from './useListVersionHistories';
import { useMount } from '@/hooks';
import { AppTooltip } from '@/components/ui/tooltip';

export const VersionHistoryPanel = React.memo(
  ({ assetId, type }: { assetId: string; type: 'metric' | 'dashboard' }) => {
    const removeVersionHistoryQueryParams = useCloseVersionHistory();
    const {
      listItems,
      selectedVersion,
      selectedQueryVersion,
      onClickRestoreVersion,
      onClickVersionHistory
    } = useListVersionHistories({
      assetId,
      type
    });
    const bodyRef = useRef<HTMLDivElement>(null);

    useMount(async () => {
      if (bodyRef.current) {
        await timeout(250);
        const selectedNode = bodyRef.current.querySelector('.selected-version');
        if (selectedNode) {
          selectedNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    return (
      <AppPageLayout
        header={useMemo(
          () => (
            <PanelHeader removeVersionHistoryQueryParams={removeVersionHistoryQueryParams} />
          ),
          []
        )}
        scrollable
        headerBorderVariant="ghost">
        <div ref={bodyRef} className="mx-2 mb-1.5 flex flex-col">
          {listItems?.map((item) => (
            <ListItem
              key={item.version_number}
              {...item}
              selected={item.version_number === selectedQueryVersion}
              showRestoreButton={item.version_number !== selectedVersion}
              onClickVersionHistory={onClickVersionHistory}
              onClickRestoreVersion={onClickRestoreVersion}
            />
          ))}
        </div>
      </AppPageLayout>
    );
  }
);

const ListItem = React.memo(
  ({
    version_number,
    updated_at,
    selected,
    showRestoreButton,
    onClickVersionHistory,
    onClickRestoreVersion
  }: {
    version_number: number;
    updated_at: string;
    selected: boolean;
    showRestoreButton: boolean;
    onClickVersionHistory: (versionNumber: number) => void;
    onClickRestoreVersion: (versionNumber: number) => void;
  }) => {
    return (
      <div
        onClick={() => onClickVersionHistory(version_number)}
        className={cn(
          'group hover:bg-item-hover flex cursor-pointer items-center justify-between space-x-2 rounded px-2.5 py-1.5',
          selected && 'bg-item-select hover:bg-item-select selected-version'
        )}>
        <div className="flex flex-col justify-center space-y-0.5">
          <Text>{`Version ${version_number}`}</Text>
          <Text size={'xs'} variant={'secondary'}>
            {timeFromNow(updated_at, false)}
          </Text>
        </div>

        <div className="text-icon-color animate-in fade-in-0 flex items-center space-x-2 duration-200">
          {showRestoreButton && (
            <AppTooltip title="Restore version">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClickRestoreVersion(version_number);
                }}
                className="hover:bg-item-select -mr-1 rounded p-1 opacity-0 group-hover:block group-hover:opacity-100">
                <History />
              </div>
            </AppTooltip>
          )}

          {selected && (
            <div className="group-hover:opacity-100">
              <Check3 />
            </div>
          )}
        </div>
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

const PanelHeader = React.memo(
  ({ removeVersionHistoryQueryParams }: { removeVersionHistoryQueryParams: () => void }) => {
    return (
      <div className="flex w-full items-center justify-between">
        <Text>Version History</Text>
        <Button variant="ghost" prefix={<Xmark />} onClick={removeVersionHistoryQueryParams} />
      </div>
    );
  }
);
PanelHeader.displayName = 'PanelHeader';

VersionHistoryPanel.displayName = 'VersionHistoryPanel';

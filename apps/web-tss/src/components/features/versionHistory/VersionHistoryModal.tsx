import type React from 'react';
import { useMemo, useRef } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/modal/ModalBase';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useMount } from '@/hooks/useMount';
import { timeout } from '@/lib/timeout';
import { Button } from '../../ui/buttons';
import { Check3, Xmark } from '../../ui/icons';
import { AppPageLayout } from '../../ui/layouts/AppPageLayout';
import { AppTooltip } from '../../ui/tooltip';
import { Text } from '../../ui/typography';

export type VersionHistoryItem = {
  version_number: number;
  updated_at: string;
};

export interface VersionHistoryModalProps {
  onClose: () => void;
  versionNumber: number | false;
  children: React.ReactNode;
  title: string;
  versionHistoryItems: VersionHistoryItem[];
  onClickVersion: (versionNumber: number) => void;
  onClickRestoreVersion: (versionNumber: number) => void;
  learnMoreButton?: React.ReactNode;
  isRestoringVersion: boolean;
}

export const VersionHistoryModal = ({
  onClose,
  versionNumber,
  title,
  versionHistoryItems,
  onClickVersion,
  onClickRestoreVersion,
  isRestoringVersion,
  learnMoreButton,
  children,
}: VersionHistoryModalProps) => {
  const open = versionNumber !== false;

  const onClickRestoreVersionPreflight = useMemoizedFn(() => {
    if (versionNumber) onClickRestoreVersion(versionNumber);
  });

  const latestVersionNumber = useMemo(() => {
    return versionHistoryItems.reduce((acc, item) => {
      return Math.max(acc, item.version_number);
    }, 0);
  }, [versionHistoryItems]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showClose={false}
        className="w-[85vw] overflow-hidden h-[85vh] grid grid-cols-[1fr_320px] max-w-full max-h-full"
      >
        <DialogTitle hidden>{title}</DialogTitle>
        <DialogDescription hidden>{'This is the version history of the asset'}</DialogDescription>
        <AppPageLayout
          headerBorderVariant="default"
          header={<div>Version History</div>}
          headerClassName="bg-panel-background"
        >
          {open && children}
        </AppPageLayout>
        <AppPageLayout
          headerBorderVariant="ghost"
          className="border-l"
          headerClassName="bg-panel-background"
          scrollable
          mainClassName="bg-panel-background relative"
          header={
            <div className="flex w-full items-center justify-between gap-x-2.5">
              <Text>Version History</Text>
              <DialogClose asChild>
                <Button prefix={<Xmark />} variant="ghost" />
              </DialogClose>
            </div>
          }
        >
          {versionNumber !== false && (
            <>
              <VersionHistoryPanel
                versionHistoryItems={versionHistoryItems}
                onClickVersion={onClickVersion}
                selectedVersion={versionNumber}
              />
              <RestoreVersionContainer
                onClickRestoreVersion={onClickRestoreVersionPreflight}
                disableRestoreVersion={versionNumber === latestVersionNumber}
                isRestoringVersion={isRestoringVersion}
                learnMoreButton={learnMoreButton}
              />
            </>
          )}
        </AppPageLayout>
      </DialogContent>
    </Dialog>
  );
};

VersionHistoryModal.displayName = 'VersionHistoryModal';

const VersionHistoryPanel: React.FC<{
  versionHistoryItems: VersionHistoryItem[];
  onClickVersion: (versionNumber: number) => void;
  selectedVersion: number | null;
}> = ({ versionHistoryItems, onClickVersion, selectedVersion }) => {
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
    <div ref={bodyRef} className="mx-1.5 my-1.5 pb-16 flex flex-col">
      {versionHistoryItems.map((item) => (
        <ListItem
          key={item.version_number}
          {...item}
          onClickVersion={onClickVersion}
          selected={item.version_number === selectedVersion}
        />
      ))}
    </div>
  );
};

const ListItem: React.FC<{
  version_number: number;
  updated_at: string;
  selected: boolean;
  onClickVersion: (versionNumber: number) => void;
}> = ({ version_number, updated_at, selected, onClickVersion }) => {
  return (
    <div
      onClick={() => onClickVersion(version_number)}
      data-active={selected}
      className="hover:bg-item-hover flex cursor-pointer items-center justify-between space-x-2 rounded px-2.5 py-1.5 data-[active=true]:bg-item-select data-[active=true]:hover:bg-item-hover-active"
    >
      <div className="flex flex-col justify-center space-y-0.5">
        <Text>{`Version ${version_number}`}</Text>
        <Text size={'xs'} variant={'secondary'}>
          {updated_at}
        </Text>
      </div>

      {selected && (
        <div className="text-icon-color">
          <Check3 />
        </div>
      )}
    </div>
  );
};

const RestoreVersionContainer: React.FC<
  Pick<VersionHistoryModalProps, 'learnMoreButton'> & {
    onClickRestoreVersion: () => void;
    disableRestoreVersion: boolean;
    isRestoringVersion: boolean;
  }
> = ({ learnMoreButton, onClickRestoreVersion, disableRestoreVersion, isRestoringVersion }) => {
  return (
    <div className="absolute bottom-0 bg-panel-background border-t flex justify-between items-center gap-x-2 left-0 right-0 w-full h-[38px] px-4">
      <div>{learnMoreButton}</div>
      <AppTooltip
        delayDuration={650}
        title={
          disableRestoreVersion
            ? 'This is the latest version'
            : isRestoringVersion
              ? 'Restoring...'
              : ''
        }
      >
        <Button
          loading={isRestoringVersion}
          onClick={() => onClickRestoreVersion()}
          disabled={disableRestoreVersion}
          variant={'black'}
        >
          Restore this version
        </Button>
      </AppTooltip>
    </div>
  );
};

'use client';

import React, { useMemo } from 'react';
import { Button } from 'antd';
import { BusterRoutes } from '@/routes';
import { AppMaterialIcons, AppTooltip } from '@/components/ui';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUserConfigContextSelector } from '@/context/Users';
import { useBusterTermsIndividual } from '@/context/Terms';
import { useMemoizedFn } from 'ahooks';
import { NewTermModal } from '@/components/features/modal/NewTermModal';
import { type BreadcrumbItem, Breadcrumb } from '@/components/ui/breadcrumb';

export const TermsHeader: React.FC<{
  termId?: string;
  openNewTermsModal?: boolean;
  setOpenNewTermsModal?: (open: boolean) => void;
}> = React.memo(({ termId, openNewTermsModal, setOpenNewTermsModal }) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const { term: selectedTerm } = useBusterTermsIndividual({ termId: termId || '' });

  const onOpenNewTermsModal = useMemoizedFn(() => {
    setOpenNewTermsModal?.(true);
  });
  const onCloseNewTermsModal = useMemoizedFn(() => {
    setOpenNewTermsModal?.(false);
  });

  useHotkeys('t', onOpenNewTermsModal);

  return (
    <>
      <div className="flex w-full items-center justify-between space-x-1">
        <TermsBreadcrumb termName={selectedTerm?.name} />

        <div className="flex items-center space-x-0">
          {isAdmin && (
            <AppTooltip title={'Create a new term'} shortcuts={['t']}>
              <Button onClick={onOpenNewTermsModal} icon={<AppMaterialIcons icon="add" />}>
                New term
              </Button>
            </AppTooltip>
          )}
        </div>
      </div>

      <NewTermModal open={!!openNewTermsModal} onClose={onCloseNewTermsModal} />
    </>
  );
});

TermsHeader.displayName = 'TermsHeader';

const TermsBreadcrumb: React.FC<{
  termName: string | undefined;
}> = React.memo(({ termName }) => {
  const items: BreadcrumbItem[] = useMemo(
    () =>
      [
        {
          label: 'Terms',
          route: { route: BusterRoutes.APP_TERMS }
        },
        { label: termName }
      ].filter((item) => item.label) as BreadcrumbItem[],
    [termName]
  );

  return <Breadcrumb items={items} />;
});
TermsBreadcrumb.displayName = 'TermsBreadcrumb';

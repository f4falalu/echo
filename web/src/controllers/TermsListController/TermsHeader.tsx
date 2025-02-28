'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '@/components/ui/layout/AppContentHeader';
import { Breadcrumb, Button } from 'antd';
import { BreadcrumbProps } from 'antd/lib';
import { BreadcrumbSeperator } from '@/components/ui';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { AppMaterialIcons, AppTooltip } from '@/components/ui';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUserConfigContextSelector } from '@/context/Users';
import { useBusterTermsIndividual } from '@/context/Terms';
import { useMemoizedFn } from 'ahooks';
import { NewTermModal } from '@/components/features/Modals/NewTermModal';

export const TermsHeader: React.FC<{
  termId?: string;
  openNewTermsModal?: boolean;
  setOpenNewTermsModal?: (open: boolean) => void;
}> = React.memo(({ termId, openNewTermsModal, setOpenNewTermsModal }) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);

  const { term: selectedTerm } = useBusterTermsIndividual({ termId: termId || '' });

  const items = useMemo<BreadcrumbProps['items']>(
    () =>
      [
        {
          title: (
            <Link
              suppressHydrationWarning
              className={`truncate`}
              href={createBusterRoute({ route: BusterRoutes.APP_TERMS })}>
              {'Terms'}
            </Link>
          )
        },
        {
          title: termId ? <>{selectedTerm?.name}</> : null
        }
      ].filter((v) => v.title),
    [termId, selectedTerm]
  );

  const onOpenNewTermsModal = useMemoizedFn(() => {
    setOpenNewTermsModal?.(true);
  });
  const onCloseNewTermsModal = useMemoizedFn(() => {
    setOpenNewTermsModal?.(false);
  });

  useHotkeys('t', onOpenNewTermsModal);

  return (
    <>
      <AppContentHeader>
        <div className="flex w-full items-center justify-between space-x-1">
          <Breadcrumb items={items} separator={<BreadcrumbSeperator />} />

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
      </AppContentHeader>

      <NewTermModal open={!!openNewTermsModal} onClose={onCloseNewTermsModal} />
    </>
  );
});

TermsHeader.displayName = 'TermsHeader';

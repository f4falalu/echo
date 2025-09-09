import type React from 'react';
import { PermissionsAppContainer } from './PermissionsAppContainer';
import { PermissionTitleCard } from './PermissionTitleCard';

export function DatasetPermissionLayout({
  children,
  datasetId,
}: {
  children: React.ReactNode;
  datasetId: string;
}) {
  return (
    <div className="m-auto flex h-full max-w-[1400px] flex-col space-y-5 overflow-y-auto px-14 pt-12">
      <PermissionTitleCard />
      <PermissionsAppContainer datasetId={datasetId}>{children}</PermissionsAppContainer>
    </div>
  );
}

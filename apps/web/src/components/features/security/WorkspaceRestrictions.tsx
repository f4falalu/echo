'use client';

import React, { useMemo, type ReactNode } from 'react';
import { SecurityCards } from './SecurityCards';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { Switch } from '@/components/ui/switch';
import {
  useGetWorkspaceSettings,
  useUpdateWorkspaceSettings
} from '@/api/buster_rest/security/queryRequests';
import type {
  GetWorkspaceSettingsResponse,
  UpdateWorkspaceSettingsRequest
} from '@buster/server-shared/security';
import { Select, type SelectItem } from '@/components/ui/select';
import { type OrganizationRole, OrganizationRoleEnum } from '@buster/server-shared/organization';
import { OrganizationUserRoleText } from '@/lib/organization/translations';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { SelectMultiple } from '@/components/ui/select/SelectMultiple';

export const WorkspaceRestrictions = React.memo(() => {
  const { data: workspaceSettings } = useGetWorkspaceSettings();
  const { mutateAsync: updateWorkspaceSettings } = useUpdateWorkspaceSettings();

  const sections: ReactNode[] = useMemo(
    () => [
      <EnableRestrictions
        key="enable-restrictions"
        restrict_new_user_invitations={workspaceSettings?.restrict_new_user_invitations}
        updateWorkspaceSettings={updateWorkspaceSettings}
      />,
      <DefaultRole
        key="default-role"
        default_role={workspaceSettings?.default_role}
        updateWorkspaceSettings={updateWorkspaceSettings}
      />,
      <DefaultDatasets
        key="default-datasets"
        default_datasets={workspaceSettings?.default_datasets}
        updateWorkspaceSettings={updateWorkspaceSettings}
      />
    ],
    [workspaceSettings]
  );

  return (
    <SecurityCards
      title="Workspace restrictions"
      description="Restrict the workspace to only allow users with an email address at these domains"
      cards={[{ sections }]}
    />
  );
});

WorkspaceRestrictions.displayName = 'WorkspaceRestrictions';

const EnableRestrictions = ({
  restrict_new_user_invitations = false,
  updateWorkspaceSettings
}: Pick<GetWorkspaceSettingsResponse, 'restrict_new_user_invitations'> & {
  updateWorkspaceSettings: (request: UpdateWorkspaceSettingsRequest) => Promise<unknown>;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-0.5">
        <Text>Restrict new user invitations</Text>
        <Text variant="secondary" size={'sm'}>
          {`Only allow admins to invite new members to workspace`}
        </Text>
      </div>
      <Switch
        checked={restrict_new_user_invitations}
        onCheckedChange={(v) => {
          updateWorkspaceSettings({ restrict_new_user_invitations: v });
        }}
      />
    </div>
  );
};

const DefaultRole = ({
  default_role = 'viewer',
  updateWorkspaceSettings
}: Pick<GetWorkspaceSettingsResponse, 'default_role'> & {
  updateWorkspaceSettings: (request: UpdateWorkspaceSettingsRequest) => Promise<unknown>;
}) => {
  const items: SelectItem<OrganizationRole>[] = useMemo(() => {
    return Object.values(OrganizationRoleEnum).map((role) => ({
      label: OrganizationUserRoleText[role as OrganizationRole],
      value: role as OrganizationRole
    }));
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex min-w-0 flex-1 flex-col space-y-0.5">
        <Text>Default Role</Text>
        <Text variant="secondary" size={'sm'}>
          {`Select which default role is assigned to new users`}
        </Text>
      </div>
      <Select
        items={items}
        className="w-36 max-w-72"
        value={default_role}
        onChange={(v) => {
          updateWorkspaceSettings({ default_role: v });
        }}
      />
    </div>
  );
};

const DefaultDatasets = ({
  default_datasets = [],
  updateWorkspaceSettings
}: Pick<GetWorkspaceSettingsResponse, 'default_datasets'> & {
  updateWorkspaceSettings: (request: UpdateWorkspaceSettingsRequest) => Promise<unknown>;
}) => {
  const { data: datasets, isFetched: isDatasetsFetched } = useGetDatasets();

  const items: SelectItem<string>[] = useMemo(() => {
    const baseItems =
      datasets?.map((dataset) => ({
        label: dataset.name,
        value: dataset.id
      })) || [];

    return [{ label: 'All datasets', value: 'all' }, ...baseItems];
  }, [datasets]);

  const selectedItems = useMemo(() => {
    return default_datasets.map((dataset) => dataset.id);
  }, [default_datasets]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col space-y-0.5">
        <Text>Default Datasets</Text>
        <Text variant="secondary" size={'sm'}>
          {`Select which datasets people can access by default`}
        </Text>
      </div>
      <SelectMultiple
        items={items}
        value={selectedItems}
        loading={!isDatasetsFetched}
        placeholder="Select datasets"
        className="w-40 max-w-72"
        align="end"
        side="left"
        onChange={(v) => {
          updateWorkspaceSettings({ default_datasets_ids: v });
        }}
      />
    </div>
  );
};

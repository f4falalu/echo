import React, { useMemo } from 'react';
import { useIsUserAdmin, useIsUserRegistered } from '@/api/buster_rest/users/useGetUserInfo';
import { BackButton } from '@/components/ui/buttons/BackButton';
import CircleUser from '@/components/ui/icons/NucleoIconOutlined/circle-user';
import ApartmentBuilding from '../../ui/icons/NucleoIconOutlined/apartment-building';
import LockCircle from '../../ui/icons/NucleoIconOutlined/lock-circle';
import { type ISidebarGroup, type ISidebarItem, Sidebar } from '../../ui/sidebar';
import { SidebarUserFooter } from './SidebarUserFooter';

const accountItems: ISidebarGroup = {
  label: 'Account',
  variant: 'icon',
  id: 'account',
  icon: <CircleUser />,
  items: [
    {
      label: 'Profile',
      route: {
        to: '/app/settings/profile',
      },
      id: '/settings/profile',
    },
  ],
};

const workspaceItems: ISidebarGroup = {
  label: 'Administration',
  variant: 'icon',
  id: 'administration',
  icon: <ApartmentBuilding />,
  items: [
    {
      label: 'Workspace',
      route: {
        to: '/app/settings/workspace',
      },
      id: '/app/settings/workspace',
    },
    {
      label: 'API Keys',
      route: {
        to: '/app/settings/api-keys',
      },
      id: '/app/settings/api-keys',
    },
    {
      label: 'Data Sources',
      route: {
        to: '/app/settings/datasources',
      },
      id: '/app/settings/datasources',
    },
    {
      label: 'Integrations',
      route: {
        to: '/app/settings/integrations',
      },
      id: '/app/settings/integrations',
    },
  ] satisfies ISidebarItem[],
};

const permissionAndSecurityItems: ISidebarGroup = {
  label: 'Permission & Security',
  variant: 'icon',
  id: 'permission-and-security',
  icon: <LockCircle />,
  items: [
    {
      label: 'Security',
      route: { to: '/app/settings/security' },
      id: '/app/settings/security',
    },
    {
      label: 'Users',
      route: { to: '/app/settings/users' },
      id: '/app/settings/users',
    },
    {
      label: 'Dataset groups',
      route: { to: '/app/settings/dataset-groups' },
      id: '/app/settings/dataset-groups',
    },
    {
      label: 'Permission groups',
      route: { to: '/app/settings/permission-groups' },
      id: '/app/settings/permission-groups',
    },
  ] satisfies ISidebarItem[],
};

export const SidebarSettings = () => {
  const isAdmin = useIsUserAdmin();
  const isUserRegistered = useIsUserRegistered();

  const sidebarItems = useMemo(() => {
    const items = [accountItems];
    if (isAdmin) {
      items.push(workspaceItems);
      items.push(permissionAndSecurityItems);
    }
    return items;
  }, [isAdmin]);

  return (
    <Sidebar
      content={sidebarItems}
      header={useMemo(() => <SidebarSettingsHeader />, [])}
      footer={useMemo(() => <SidebarUserFooter />, [])}
      useCollapsible={isUserRegistered}
    />
  );
};

SidebarSettings.displayName = 'SidebarSettings';

const SidebarSettingsHeader = () => {
  return (
    <BackButton
      linkUrl={{
        to: '/app/home',
      }}
      text="Settings"
    />
  );
};

'use client';

import { BackButton } from '@/components/ui/buttons';
import { type ISidebarGroup, Sidebar } from '@/components/ui/sidebar';
import { CircleUser, LockCircle, ApartmentBuilding } from '@/components/ui/icons';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo } from 'react';
import { useUserConfigContextSelector } from '@/context/Users';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

const accountItems: ISidebarGroup = {
  label: 'Account',
  variant: 'icon',
  icon: <CircleUser />,
  items: [
    {
      label: 'Profile',
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_PROFILE }),
      id: 'profile'
    }
  ]
};

const workspaceItems: ISidebarGroup = {
  label: 'Workspace',
  variant: 'icon',
  icon: <ApartmentBuilding />,
  items: [
    {
      label: 'API Keys',
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_API_KEYS }),
      id: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_API_KEYS })
    }
  ]
};

const permissionAndSecurityItems: ISidebarGroup = {
  label: 'Permission & Security',
  variant: 'icon',
  icon: <LockCircle />,
  items: [
    {
      label: 'Users',
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_USERS }),
      id: 'users'
    },
    {
      label: 'Dataset groups',
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS }),
      id: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_DATASET_GROUPS })
    },
    {
      label: 'Permission groups',
      route: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_PERMISSION_GROUPS }),
      id: createBusterRoute({ route: BusterRoutes.APP_SETTINGS_PERMISSION_GROUPS })
    }
  ]
};

export const SidebarSettings: React.FC<{}> = React.memo(({}) => {
  const isAdmin = useUserConfigContextSelector((x) => x.isAdmin);
  const currentRoute = useAppLayoutContextSelector((x) => x.currentRoute);

  const content = useMemo(() => {
    const items = [accountItems];
    if (isAdmin) {
      items.push(workspaceItems);
      items.push(permissionAndSecurityItems);
    }
    return items;
  }, [isAdmin]);

  return <Sidebar content={content} header={<SidebarSettingsHeader />} activeItem={currentRoute} />;
});

SidebarSettings.displayName = 'SidebarSettings';

const SidebarSettingsHeader = React.memo(() => {
  return (
    <div>
      <BackButton linkUrl={createBusterRoute({ route: BusterRoutes.APP_HOME })} text="Settings" />
    </div>
  );
});

SidebarSettingsHeader.displayName = 'SidebarSettingsHeader';

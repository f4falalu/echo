import { BackButton } from '@/components/ui/buttons';
import { type ISidebarGroup, Sidebar } from '@/components/ui/sidebar';
import { CircleUser, LockCircle } from '@/components/ui/icons';
import { BusterRoutes, createBusterRoute } from '@/routes';
import React, { useMemo } from 'react';

const accountItems: ISidebarGroup = {
  label: 'Account',
  variant: 'icon',
  icon: <CircleUser />,
  items: [
    {
      label: 'Profile',
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_PROFILE }),
      id: 'profile'
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
      route: createBusterRoute({ route: BusterRoutes.SETTINGS_PERMISSION_GROUPS }),
      id: createBusterRoute({ route: BusterRoutes.SETTINGS_PERMISSION_GROUPS })
    }
  ]
};

export const SidebarSettings: React.FC<{
  activePage: string;
  isAdmin: boolean;
}> = React.memo(({ activePage, isAdmin }) => {
  const content = useMemo(() => {
    const items = [accountItems];
    if (isAdmin) {
      items.push(permissionAndSecurityItems);
    }
    return items;
  }, [isAdmin]);

  return <Sidebar content={content} header={<SidebarSettingsHeader />} activeItem={activePage} />;
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

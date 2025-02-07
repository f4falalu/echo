import type { BusterDashboard } from '@/api/asset_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { useMemoizedFn } from 'ahooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const useDashboardCreate = ({
  onUpdateDashboard
}: {
  onUpdateDashboard: (dashboard: BusterDashboard) => void;
}) => {
  const busterSocket = useBusterWebSocket();
  const router = useRouter();
  const [creatingDashboard, setCreatingDashboard] = useState<boolean>(false);
  const { openErrorNotification } = useBusterNotifications();

  const onCreateNewDashboard = useMemoizedFn(
    async (newDashboard: {
      name?: string;
      description?: string | null;
      rerouteToDashboard?: boolean;
    }) => {
      if (creatingDashboard) {
        return;
      }
      const { rerouteToDashboard, ...rest } = newDashboard;
      setCreatingDashboard(true);

      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/dashboards/post',
          payload: { ...rest, name: rest.name || '' }
        },
        responseEvent: {
          route: '/dashboards/post:postDashboard',
          callback: (v) => {
            setTimeout(() => {
              onUpdateDashboard(v);
            }, 700);

            if (rerouteToDashboard) {
              router.push(
                createBusterRoute({
                  route: BusterRoutes.APP_DASHBOARD_ID,
                  dashboardId: v.id
                })
              );
            }

            return v;
          },
          onError: (e) => openErrorNotification(e)
        }
      });

      setTimeout(() => {
        setCreatingDashboard(false);
      }, 500);

      return res as BusterDashboard;
    }
  );

  return {
    onCreateNewDashboard,
    creatingDashboard
  };
};

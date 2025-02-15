import { useMemoizedFn } from 'ahooks';
import { useBusterWebSocket } from '../BusterWebSocket';
import { timeout } from '@/utils';
import { useBusterNotifications } from '../BusterNotifications';

export const useInviteUser = () => {
  const busterSocket = useBusterWebSocket();
  const { openSuccessMessage } = useBusterNotifications();

  const inviteUsers = useMemoizedFn(async (emails: string[], team_ids?: string[]) => {
    busterSocket.emit({
      route: '/users/invite',
      payload: { emails, team_ids }
    });
    await timeout(350);
    openSuccessMessage('Invites sent');
  });

  return {
    inviteUsers
  };
};

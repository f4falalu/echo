import { useMemoizedFn } from 'ahooks';
import { timeout } from '@/lib';
import { useBusterNotifications } from '../BusterNotifications';
import { inviteUser as inviteUserRest } from '@/api/buster_rest';

export const useInviteUser = () => {
  const { openSuccessMessage } = useBusterNotifications();

  const inviteUsers = useMemoizedFn(async (emails: string[], team_ids?: string[]) => {
    await inviteUserRest({ emails, team_ids });
    await timeout(100);
    openSuccessMessage('Invites sent');
  });

  return {
    inviteUsers
  };
};

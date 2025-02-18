import { useMemoizedFn } from 'ahooks';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import type { BusterUserResponse } from '@/api/asset_interfaces';
import { useUpdateUser } from '@/api/buster_rest';

export const useUserOrganization = ({
  userResponse,
  refetchUserResponse
}: {
  userResponse: BusterUserResponse | null | undefined;
  refetchUserResponse: () => Promise<unknown>;
}) => {
  const { mutateAsync: createOrganization } = useSocketQueryMutation({
    emitEvent: '/organizations/post',
    responseEvent: '/organizations/post:post'
  });

  const { mutateAsync: updateUserInfo } = useUpdateUser();

  const onCreateUserOrganization = useMemoizedFn(
    async ({ name, company }: { name: string; company: string }) => {
      const alreadyHasOrganization = !!userResponse?.organizations?.[0];
      if (!alreadyHasOrganization && userResponse) {
        await Promise.all([
          createOrganization({ name: company }),
          updateUserInfo({
            userId: userResponse.user.id,
            name
          })
        ]);

        await refetchUserResponse();
      }
    }
  );

  return {
    onCreateUserOrganization
  };
};

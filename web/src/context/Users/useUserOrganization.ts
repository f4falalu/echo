import { useMemoizedFn } from 'ahooks';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { BusterUserResponse } from '@/api/asset_interfaces';

export const useUserOrganization = ({
  userResponse,
  refetchUserResponse
}: {
  userResponse: BusterUserResponse | null | undefined;
  refetchUserResponse: () => Promise<unknown>;
}) => {
  const { mutateAsync: createOrganization } = useSocketQueryMutation(
    '/organizations/post',
    '/organizations/post:post'
  );
  const { mutateAsync: updateUserInfo } = useSocketQueryMutation(
    '/permissions/users/update',
    '/permissions/users/update:updateUserPermission'
  );

  const onCreateUserOrganization = useMemoizedFn(
    async ({ name, company }: { name: string; company: string }) => {
      const alreadyHasOrganization = !!userResponse?.organizations?.[0];
      if (!alreadyHasOrganization && userResponse) {
        await Promise.all([
          createOrganization({ name: company }),
          updateUserInfo({ name, id: userResponse?.user?.id })
        ]);

        await refetchUserResponse();
      }
    }
  );

  return {
    onCreateUserOrganization
  };
};

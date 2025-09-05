import { BackButton } from '@/components/ui/buttons/BackButton';

export const PermissionGroupBackButton = () => {
  const text = 'Permission groups';
  return (
    <BackButton
      text={text}
      linkUrl={{
        to: '/app/settings/permission-groups',
      }}
    />
  );
};

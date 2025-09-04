import { BackButton } from '@/components/ui/buttons';

export const UsersBackButton = () => {
  const text = 'Users';
  return (
    <BackButton
      text={text}
      linkUrl={{
        to: '/app/settings/users',
      }}
    />
  );
};

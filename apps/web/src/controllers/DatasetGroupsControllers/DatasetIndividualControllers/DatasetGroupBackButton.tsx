import { BackButton } from '@/components/ui/buttons/BackButton';

export const DatasetGroupBackButton = () => {
  const text = 'Dataset groups';

  return (
    <BackButton
      text={text}
      linkUrl={{
        to: '/app/settings/dataset-groups',
      }}
    />
  );
};

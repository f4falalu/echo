import React from 'react';
import { AppMaterialIcons } from '@/components/ui';
import { Title, Text } from '@/components/ui/typography';
import { Button } from '../buttons/Button';

export const ListEmptyStateWithButton: React.FC<{
  isAdmin?: boolean;
  title: string;
  description: string;
  onClick?: () => void;
  buttonText: string;
  loading?: boolean;
  linkButton?: string;
}> = React.memo(({ isAdmin = true, title, buttonText, description, onClick, loading = false }) => {
  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="flex h-full w-full flex-col items-center justify-start space-y-5 text-center"
        style={{
          marginTop: '25vh'
        }}>
        <div className="flex w-[350px] flex-col justify-center space-y-3">
          <Title as="h4" className="text-center [text-wrap:balance]">
            {title}
          </Title>

          <Text variant="secondary">{description}</Text>
        </div>

        {isAdmin && (
          <Button
            variant="default"
            prefix={<AppMaterialIcons icon="add" />}
            loading={loading}
            onClick={onClick}>
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
});

ListEmptyStateWithButton.displayName = 'ListEmptyStateWithButton';

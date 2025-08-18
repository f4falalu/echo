import type { ShareAssetType } from '@buster/server-shared/share';
import type React from 'react';
import { useRef } from 'react';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Text, Title } from '@/components/ui/typography';
import {
  setProtectedAssetPassword,
  useProtectedAsset,
} from '@/context/BusterAssets/useProtectedAssetStore';

export const AppPasswordAccess: React.FC<{
  assetId: string;
  type: ShareAssetType;
  children: React.ReactNode;
}> = ({ children, assetId, type }) => {
  const { password, error } = useProtectedAsset(assetId);

  if (password && !error) {
    return <>{children}</>;
  }

  return (
    <AppPasswordInputComponent password={password} assetId={assetId} type={type} error={error} />
  );
};

AppPasswordAccess.displayName = 'AppPasswordAccess';

const AppPasswordInputComponent: React.FC<{
  password: string | undefined;
  assetId: string;
  type: ShareAssetType;
  error: string | null;
}> = ({ password, error, assetId, type }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const onEnterPassword = (v: string) => {
    setProtectedAssetPassword({
      assetId,
      password: v,
      type,
    });
  };

  const onPressEnter = (v: React.KeyboardEvent<HTMLInputElement>) => {
    onEnterPassword(v.currentTarget.value);
  };

  const onEnterButtonPress = () => {
    const value = inputRef.current?.value;
    if (!value) return;
    onEnterPassword(value || '');
  };

  return (
    <div
      className="flex h-full min-h-[100vh] w-full justify-center"
      style={{
        paddingTop: '25vh',
      }}
    >
      <div className="flex max-w-[440px] flex-col items-center space-y-6">
        <BusterLogo className="h-16 w-16" />

        <div className="text-center">
          <Title as="h2" className="text-center">
            {'To access this page, enter the password below'}
          </Title>
        </div>

        <div className="flex w-full flex-col space-y-2 space-x-0">
          <div className="flex flex-col space-y-1">
            <Input
              ref={inputRef}
              defaultValue={password}
              onPressEnter={onPressEnter}
              className="w-full"
              placeholder="Enter password"
              type="password"
              autoFocus
            />
            {error ? (
              <Text className="mb-1!" variant="danger">
                {error}
              </Text>
            ) : null}
          </div>

          <Button block variant="black" onClick={onEnterButtonPress}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

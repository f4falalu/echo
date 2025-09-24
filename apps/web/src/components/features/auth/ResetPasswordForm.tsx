import type { User } from '@supabase/supabase-js';
import { useRouter } from '@tanstack/react-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import { useGetMyUserInfo } from '@/api/buster_rest/users';
import { Button } from '@/components/ui/buttons';
import { SuccessCard } from '@/components/ui/card/SuccessCard';
import { Input } from '@/components/ui/inputs';
import { Title } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { resetPassword } from '@/integrations/supabase/resetPassword';
import { PolicyCheck } from './PolicyCheck';

export const ResetPasswordForm: React.FC<{
  supabaseUser: Pick<User, 'email'>;
}> = ({ supabaseUser }) => {
  const { data: busterUser } = useGetMyUserInfo();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const email = busterUser?.user?.email || supabaseUser?.email;
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [goodPassword, setGoodPassword] = useState(false);
  const { openErrorMessage, openSuccessMessage } = useBusterNotifications();
  const [countdown, setCountdown] = useState(5);

  const disabled = !goodPassword || loading || !password || !password2 || password !== password2;

  const startCountdown = useCallback(() => {
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 0) {
          clearInterval(interval);
          router.navigate({ to: '/' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetPassword = useCallback(async () => {
    setLoading(true);
    setResetSuccess(false);
    try {
      const res = await resetPassword({ data: { password } });
      setLoading(false);
      if (res?.error) {
        throw res;
      }
      setResetSuccess(true);
      openSuccessMessage('Password reset successfully');
      startCountdown();
    } catch (error) {
      openErrorMessage(error as string);
    }
  }, [resetPassword, password, openErrorMessage, openSuccessMessage]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      {!resetSuccess && (
        <>
          <Title className="mb-0" as="h1">
            Reset Password
          </Title>
          <div className="flex w-[330px] flex-col gap-2">
            <Input placeholder="Email" disabled value={email} autoComplete="email" />

            <Input
              placeholder="Password"
              type="password"
              name="password"
              id="password"
              value={password}
              onChange={(v) => {
                setPassword(v.target.value);
              }}
              autoComplete="new-password"
            />

            <Input
              value={password2}
              onChange={(v) => {
                setPassword2(v.target.value);
              }}
              disabled={!!loading}
              id="password2"
              type="password"
              name="password2"
              placeholder="Confirm password"
              onPressEnter={() => {
                if (disabled) {
                  return;
                }
                handleResetPassword();
              }}
              autoComplete="new-password"
            />

            <PolicyCheck
              password={password}
              password2={password2}
              email={email || ''}
              onChangePolicyCheck={(v) => {
                setGoodPassword(v);
              }}
            />

            <Button
              block
              variant="black"
              disabled={disabled}
              loading={loading}
              onClick={handleResetPassword}
            >
              Reset Password
            </Button>
          </div>
        </>
      )}

      {resetSuccess && (
        <div className="flex w-[330px] flex-col gap-2">
          <SuccessCard
            title="Password reset successfully"
            message={`Navigating to app in ${countdown} seconds`}
          />
        </div>
      )}
    </div>
  );
};

import { Link, useNavigate } from '@tanstack/react-router';
import Cookies from 'js-cookie';
import React, { useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/buttons';
import { SuccessCard } from '@/components/ui/card/SuccessCard';
import Github from '@/components/ui/icons/customIcons/Github';
import Google from '@/components/ui/icons/customIcons/Google';
import Microsoft from '@/components/ui/icons/customIcons/Microsoft';
import { Input } from '@/components/ui/inputs';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text, Title } from '@/components/ui/typography';
import { env } from '@/env';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  signInWithAzure,
  signInWithEmailAndPassword,
  signInWithGithub,
  signInWithGoogle,
  signUpWithEmailAndPassword,
} from '@/integrations/supabase/signIn';
import { cn } from '@/lib/classMerge';
import { isValidEmail } from '@/lib/email';
import { inputHasText, truncateText } from '@/lib/text';
import { PolicyCheck } from './PolicyCheck';
import { type LastUsedReturnType, useLastUsed } from './useLastUsed';

export const LoginForm: React.FC<{
  redirectTo: string | null | undefined;
  isAnonymousUser?: boolean;
}> = ({ redirectTo }) => {
  const navigate = useNavigate();
  const lastUsedProps = useLastUsed();

  const [loading, setLoading] = useState<'google' | 'github' | 'azure' | 'email' | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [signUpFlow, setSignUpFlow] = useState(
    lastUsedProps.isAnonymousUser && !env.VITE_PUBLIC_USER
  );
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Reusable OAuth handler to reduce code duplication
  const handleOAuthSignIn = async (
    provider: 'google' | 'github' | 'azure',
    signInFn: (data: {
      data: { redirectTo?: string | null };
    }) => Promise<{ success: boolean; url?: string; error?: string }>
  ) => {
    setLoading(provider);
    try {
      const result = await signInFn({ data: { redirectTo } });
      console.log(`${provider} result:`, result);

      if (result && 'success' in result && !result.success) {
        setErrorMessages([result.error || `An error occurred during ${provider} sign-in`]);
        setLoading(null);
        return;
      }

      if (result && 'success' in result && result.success && result.url) {
        // Redirect to OAuth provider's URL
        window.location.href = result.url;
      }
    } catch (error: unknown) {
      console.error(error);
      setErrorMessages(['An unexpected error occurred. Please try again.']);
      setLoading(null);
    }
  };

  const onSignInWithUsernameAndPassword = useMemoizedFn(
    async ({ email, password }: { email: string; password: string }) => {
      setLoading('email');
      try {
        const result = await signInWithEmailAndPassword({
          data: { email, password, redirectUrl: redirectTo },
        });
        if (result?.error) {
          setErrorMessages([result.message]);
          setLoading(null);
        } else {
          navigate({ to: redirectTo || '/' });
        }
      } catch (error: unknown) {
        console.error(error);
        setErrorMessages(['An unexpected error occurred. Please try again.']);
        setLoading(null);
      }
    }
  );

  const onSignInWithGoogle = useMemoizedFn(async () => {
    return handleOAuthSignIn('google', signInWithGoogle);
  });

  const onSignInWithGithub = useMemoizedFn(async () => {
    return handleOAuthSignIn('github', signInWithGithub);
  });

  const onSignInWithAzure = useMemoizedFn(async () => {
    return handleOAuthSignIn('azure', signInWithAzure);
  });

  const onSignUp = useMemoizedFn(async (d: { email: string; password: string }) => {
    setLoading('email');
    try {
      const result = await signUpWithEmailAndPassword({
        data: { ...d, redirectTo },
      });

      if (result && 'success' in result && !result.success) {
        setErrorMessages([result.error || 'An error occurred during sign-up']);
        setLoading(null);
        return;
      }

      if (result && 'success' in result && result.success) {
        setSignUpSuccess(true);
        setLoading(null);
        // For sign-up, we don't need to navigate immediately as the user
        // needs to check their email for verification
      }
    } catch (error: unknown) {
      console.error(error);
      setErrorMessages(['An unexpected error occurred. Please try again.']);
      setLoading(null);
    }
  });

  const onSubmitClick = useMemoizedFn(async (d: { email: string; password: string }) => {
    try {
      setErrorMessages([]);
      setLoading('email');

      if (signUpFlow) await onSignUp(d);
      else await onSignInWithUsernameAndPassword(d);
    } catch (error: unknown) {
      console.error(error);
      setErrorMessages(['An unexpected error occurred. Please try again.']);
      setLoading(null);
    }
  });

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-[330px]">
        {signUpSuccess ? (
          <SignUpSuccess setSignUpSuccess={setSignUpSuccess} setSignUpFlow={setSignUpFlow} />
        ) : (
          <LoginOptions
            onSubmitClick={onSubmitClick}
            setSignUpFlow={setSignUpFlow}
            errorMessages={errorMessages}
            loading={loading}
            setErrorMessages={setErrorMessages}
            signUpFlow={signUpFlow}
            onSignInWithGoogle={onSignInWithGoogle}
            onSignInWithGithub={onSignInWithGithub}
            onSignInWithAzure={onSignInWithAzure}
            lastUsedProps={lastUsedProps}
          />
        )}
      </div>
    </div>
  );
};

const LoginOptions: React.FC<{
  onSubmitClick: (d: { email: string; password: string }) => void;
  onSignInWithGoogle: () => void;
  onSignInWithGithub: () => void;
  onSignInWithAzure: () => void;
  setSignUpFlow: (value: boolean) => void;
  errorMessages: string[];
  loading: 'google' | 'github' | 'azure' | 'email' | null;
  setErrorMessages: (value: string[]) => void;
  signUpFlow: boolean;
  lastUsedProps: LastUsedReturnType;
}> = ({
  onSubmitClick,
  onSignInWithGoogle,
  onSignInWithGithub,
  onSignInWithAzure,
  setSignUpFlow,
  errorMessages,
  loading,
  setErrorMessages,
  signUpFlow,
  lastUsedProps,
}) => {
  const [email, setEmail] = useState(
    lastUsedProps.supabaseUser?.email || env.VITE_PUBLIC_USER || ''
  );
  const [password, setPassword] = useState(env.VITE_PUBLIC_USER_PASSWORD || '');
  const [password2, setPassword2] = useState('');
  const [passwordCheck, setPasswordCheck] = useState(false);
  const navigate = useNavigate();
  const disableSubmitButton =
    !inputHasText(password) || !inputHasText(password2) || password !== password2 || !passwordCheck;

  const clearAllCookies = useMemoizedFn(() => {
    for (const cookieName of Object.keys(Cookies.get())) {
      Cookies.remove(cookieName);
    }

    //also clear local storage
    localStorage.clear();
    sessionStorage.clear();
  });

  useHotkeys(
    'meta+shift+b',
    (e) => {
      e.preventDefault();
      setSignUpFlow(false);
      const DEFAULT_CREDENTIALS = {
        email: env.VITE_PUBLIC_USER || '',
        password: env.VITE_PUBLIC_USER_PASSWORD || '',
      };

      onSubmitClick({
        email: DEFAULT_CREDENTIALS.email,
        password: DEFAULT_CREDENTIALS.password,
      });
    },
    { preventDefault: true, enabled: !!env.VITE_PUBLIC_USER }
  );

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <WelcomeText signUpFlow={signUpFlow} lastUsedProps={lastUsedProps} />
      </div>

      <div className="mt-6 mb-4 flex flex-col space-y-3">
        <Button
          prefix={<Google />}
          size={'tall'}
          type="button"
          onClick={() => {
            clearAllCookies();
            onSignInWithGoogle();
          }}
          block={true}
          loading={loading === 'google'}
          tabIndex={0}
        >
          {!signUpFlow ? 'Continue with Google' : 'Sign up with Google'}
        </Button>
        <Button
          prefix={<Github />}
          size={'tall'}
          type="button"
          onClick={() => {
            clearAllCookies();
            onSignInWithGithub();
          }}
          block={true}
          loading={loading === 'github'}
          tabIndex={-1}
        >
          {!signUpFlow ? 'Continue with Github' : 'Sign up with Github'}
        </Button>
        <Button
          prefix={<Microsoft />}
          size={'tall'}
          type="button"
          onClick={() => {
            clearAllCookies();
            onSignInWithAzure();
          }}
          block={true}
          loading={loading === 'azure'}
          tabIndex={-2}
        >
          {!signUpFlow ? 'Continue with Azure' : 'Sign up with Azure'}
        </Button>
      </div>

      <form
        className="space-y-3"
        onSubmit={(v) => {
          v.preventDefault();
          clearAllCookies();
          onSubmitClick({
            email,
            password,
          });
        }}
      >
        <div className="bg-border mb-4 h-[0.5px] w-full" />

        <Input
          type="email"
          placeholder="What is your email address?"
          name="email"
          id="email"
          value={email}
          onChange={(v) => {
            setEmail(v.target.value);
          }}
          disabled={!!loading}
          autoComplete="email"
        />

        <div className="relative">
          <Input
            value={password}
            onChange={(v) => {
              setPassword(v.target.value);
            }}
            disabled={!!loading}
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="new-password"
          />
        </div>
        {signUpFlow && (
          <>
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
              autoComplete="new-password"
            />

            {password && (
              <PolicyCheck
                email={email}
                password={password}
                password2={password2}
                onChangePolicyCheck={setPasswordCheck}
              />
            )}
          </>
        )}

        <div className="flex flex-col space-y-0.5">
          {errorMessages.map((message, index) => (
            <LoginAlertMessage key={index + message} message={message} />
          ))}
        </div>

        <Button
          size={'tall'}
          block={true}
          type="submit"
          loading={loading === 'email'}
          variant="black"
          disabled={!signUpFlow ? false : disableSubmitButton}
        >
          {!signUpFlow ? 'Sign in' : 'Sign up'}
        </Button>

        {lastUsedProps.isCurrentlySignedIn && !signUpFlow && (
          <Link to="/app/home">
            <Button size={'tall'} block={true} type="button" className="truncate" variant="black">
              Continue with {truncateText(lastUsedProps.supabaseUser?.email || '', 35)}
            </Button>
          </Link>
        )}
      </form>

      <div className="mt-2 flex flex-col gap-y-2">
        <AlreadyHaveAccount
          setErrorMessages={setErrorMessages}
          setPassword2={setPassword2}
          setSignUpFlow={setSignUpFlow}
          signUpFlow={signUpFlow}
          lastUsedProps={lastUsedProps}
        />

        {!signUpFlow && <ResetPasswordLink email={email} tabIndex={-7} />}
      </div>
    </>
  );
};

const SignUpSuccess: React.FC<{
  setSignUpSuccess: (value: boolean) => void;
  setSignUpFlow: (value: boolean) => void;
}> = ({ setSignUpSuccess, setSignUpFlow }) => {
  return (
    <SuccessCard
      title="Thanks for signing up"
      message="Please check your email to verify your account."
      extra={[
        <Button
          key="login"
          variant="black"
          size={'tall'}
          onClick={() => {
            setSignUpSuccess(false);
            setSignUpFlow(true);
          }}
        >
          Go to Login
        </Button>,
      ]}
    />
  );
};

const WelcomeText: React.FC<{
  signUpFlow: boolean;
  lastUsedProps: LastUsedReturnType;
}> = ({ signUpFlow, lastUsedProps }) => {
  const text = !signUpFlow ? 'Sign in' : 'Sign up for free';
  const { isCurrentlySignedIn, supabaseUser } = lastUsedProps;

  return (
    <div className="flex items-center justify-center gap-2">
      <AppTooltip
        title={isCurrentlySignedIn ? `Currently signed in as ${supabaseUser?.email}` : undefined}
      >
        <Title className="mb-0" as="h1">
          {text}
        </Title>
      </AppTooltip>
    </div>
  );
};

const LoginAlertMessage: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <Text size="xs" variant="danger">
      {message}
    </Text>
  );
};

const AlreadyHaveAccount: React.FC<{
  setErrorMessages: (value: string[]) => void;
  setPassword2: (value: string) => void;
  setSignUpFlow: (value: boolean) => void;
  signUpFlow: boolean;
  lastUsedProps: LastUsedReturnType;
}> = React.memo(({ setErrorMessages, setPassword2, setSignUpFlow, signUpFlow, lastUsedProps }) => {
  const { isCurrentlySignedIn, supabaseUser } = lastUsedProps;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="flex items-center justify-center gap-0.5">
        <Text className="" variant="secondary" size="xs">
          {signUpFlow ? 'Already have an account? ' : "Don't already have an account?"}
        </Text>

        <Text
          variant="primary"
          size="xs"
          className={cn('ml-1 cursor-pointer font-normal')}
          onClick={() => {
            setErrorMessages([]);
            setPassword2('');
            setSignUpFlow(!signUpFlow);
          }}
        >
          {!signUpFlow ? 'Sign up' : 'Sign in'}
        </Text>
      </div>
    </div>
  );
});
AlreadyHaveAccount.displayName = 'AlreadyHaveAccount';

const ResetPasswordLink: React.FC<{ email: string; tabIndex?: number }> = ({ email, tabIndex }) => {
  const scrubbedEmail = useMemo(() => {
    if (!email || !isValidEmail(email)) return '';
    try {
      return encodeURIComponent(email.trim());
    } catch (error) {
      console.error('Error encoding email:', error);
      return '';
    }
  }, [email]);

  return (
    <Link
      className={cn('flex w-full cursor-pointer justify-center text-center font-normal')}
      to={`/auth/reset-password`}
      search={{ email: scrubbedEmail }}
      tabIndex={tabIndex}
    >
      <Text variant="primary" size="xs">
        Reset password
      </Text>
    </Link>
  );
};

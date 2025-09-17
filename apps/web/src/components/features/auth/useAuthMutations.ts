import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  signInWithAzure,
  signInWithEmailAndPassword,
  signInWithGithub,
  signInWithGoogle,
  signUpWithEmailAndPassword,
} from '@/integrations/supabase/signIn';
import { useLastUsed } from './useLastUsed';

export type SignInTypes = 'google' | 'github' | 'azure' | 'email' | null;

// Reusable OAuth mutation hook
export const useOAuthMutation = (
  mutationFn: () => Promise<{ success: boolean; url?: string; error?: string }>,
  type: SignInTypes,
  setLastUsedMethod: (method: SignInTypes) => void
) => {
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (data.success && data.url) {
        setLastUsedMethod(type);
        window.location.href = data.url;
      }
    },
    throwOnError: true,
  });
};

// Combined mutation state hook
export const useCombinedMutationState = (
  mutations: Array<{
    isPending: boolean;
    error: unknown;
    reset: () => void;
    name: SignInTypes;
  }>
) => {
  const isLoading = mutations.some((m) => m.isPending);

  const loadingType: SignInTypes =
    (mutations.find((m) => m.isPending)?.name as SignInTypes) || null;

  const errorMessages = mutations
    .filter((m) => m.error)
    .map((m) => (m.error as Error)?.message || `${m.name} error`);

  const clearErrors = useMemoizedFn(() => {
    mutations.forEach((m) => {
      m.reset();
    });
  });

  return { isLoading, loadingType, errorMessages, clearErrors };
};

// Reusable handler generator
export const createMutationHandler = (mutation: { mutate: () => void }) =>
  useMemoizedFn(() => mutation.mutate());

// Complete auth mutations hook
export const useAuthMutations = (redirectTo?: string | null, onSignUpSuccess?: () => void) => {
  const navigate = useNavigate();
  const { setLastUsedMethod } = useLastUsed();

  // OAuth Mutations
  const googleSignInMutation = useOAuthMutation(
    () => signInWithGoogle({ data: { redirectTo } }),
    'google',
    setLastUsedMethod
  );
  const githubSignInMutation = useOAuthMutation(
    () => signInWithGithub({ data: { redirectTo } }),
    'github',
    setLastUsedMethod
  );
  const azureSignInMutation = useOAuthMutation(
    () => signInWithAzure({ data: { redirectTo } }),
    'azure',
    setLastUsedMethod
  );

  // Email/Password Mutations
  const emailSignInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInWithEmailAndPassword({ data: { email, password, redirectUrl: redirectTo } }),
    onSuccess: async (data) => {
      if (!data.error) {
        setLastUsedMethod('email');
        await navigate({ to: redirectTo || '/app/home' });
      }
      if (data.error) {
        throw new Error(data.message);
      }
    },
    throwOnError: true,
  });

  const emailSignUpMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signUpWithEmailAndPassword({ data: { email, password, redirectTo } }),
    onSuccess: (data) => {
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.success) {
        setLastUsedMethod('email');
        if (onSignUpSuccess) {
          onSignUpSuccess();
        }
      }
    },
  });

  // Combined state
  const combinedState = useCombinedMutationState([
    { ...googleSignInMutation, name: 'google' },
    { ...githubSignInMutation, name: 'github' },
    { ...azureSignInMutation, name: 'azure' },
    { ...emailSignInMutation, name: 'email' },
    { ...emailSignUpMutation, name: 'email' },
  ]);

  // Handlers
  const handlers = {
    onSignInWithGoogle: createMutationHandler(googleSignInMutation),
    onSignInWithGithub: createMutationHandler(githubSignInMutation),
    onSignInWithAzure: createMutationHandler(azureSignInMutation),
    onSubmitClick: useMemoizedFn(
      async (d: { email: string; password: string }, isSignUp: boolean) => {
        if (isSignUp) {
          emailSignUpMutation.mutate(d);
        } else {
          emailSignInMutation.mutate(d);
        }
      }
    ),
  };

  return {
    mutations: {
      googleSignInMutation,
      githubSignInMutation,
      azureSignInMutation,
      emailSignInMutation,
      emailSignUpMutation,
    },
    ...combinedState,
    ...handlers,
  };
};

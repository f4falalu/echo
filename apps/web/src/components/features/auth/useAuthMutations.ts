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

// Reusable OAuth mutation hook
export const useOAuthMutation = (
  provider: 'google' | 'github' | 'azure',
  mutationFn: () => Promise<{ success: boolean; url?: string; error?: string }>
) => {
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      console.log(`${provider} OAuth result:`, data);
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    },
  });
};

// Combined mutation state hook
export const useCombinedMutationState = (
  mutations: Array<{
    isPending: boolean;
    error: unknown;
    reset: () => void;
    name: string;
  }>
) => {
  const isLoading = mutations.some((m) => m.isPending);

  const loadingType: 'google' | 'github' | 'azure' | 'email' | null =
    (mutations.find((m) => m.isPending)?.name as 'google' | 'github' | 'azure' | 'email') || null;

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

  // OAuth Mutations
  const googleSignInMutation = useOAuthMutation('google', () =>
    signInWithGoogle({ data: { redirectTo } })
  );
  const githubSignInMutation = useOAuthMutation('github', () =>
    signInWithGithub({ data: { redirectTo } })
  );
  const azureSignInMutation = useOAuthMutation('azure', () =>
    signInWithAzure({ data: { redirectTo } })
  );

  // Email/Password Mutations
  const emailSignInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInWithEmailAndPassword({ data: { email, password, redirectUrl: redirectTo } }),
    onSuccess: async (data) => {
      if (!data.error) {
        await navigate({ to: redirectTo || '/app/home' });
      }
    },
  });

  const emailSignUpMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signUpWithEmailAndPassword({ data: { email, password, redirectTo } }),
    onSuccess: (data) => {
      if (data.success && onSignUpSuccess) {
        onSignUpSuccess();
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

import { useRouter } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { signOut } from '@/integrations/supabase/signOut';
import { clearAllBrowserStorage } from '@/lib/storage';

export const useSignOut = () => {
  const { openErrorMessage } = useBusterNotifications();
  const router = useRouter();
  const handleSignOut = useCallback(async () => {
    try {
      // Then perform server-side sign out
      await signOut();

      // First clear all client-side storage
      clearAllBrowserStorage();

      router.navigate({ to: '/auth/login' });
    } catch (error) {
      openErrorMessage('Error signing out');
    }
  }, [router.navigate, openErrorMessage]);

  return handleSignOut;
};

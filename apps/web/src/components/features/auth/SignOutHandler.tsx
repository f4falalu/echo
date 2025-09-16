import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { signOut } from '@/integrations/supabase/signOut';
import { clearAllBrowserStorage } from '@/lib/storage';

export const useSignOut = () => {
  const { openErrorMessage } = useBusterNotifications();
  const navigate = useNavigate();
  const handleSignOut = useCallback(async () => {
    try {
      // Then perform server-side sign out
      await signOut();

      try {
        // First clear all client-side storage
        clearAllBrowserStorage();
      } catch (error) {
        console.error('Error clearing browser storage', error);
      }
    } finally {
      navigate({ to: '/auth/login' });
    }
  }, [navigate, openErrorMessage]);

  return handleSignOut;
};

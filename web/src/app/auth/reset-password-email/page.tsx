import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { resetPasswordEmailSend } from '@/server_context/supabaseAuthMethods';
import React from 'react';

export default function ResetPassword(p: { searchParams: { email: string } }) {
  const queryEmail = p.searchParams.email;

  return <ResetEmailForm queryEmail={queryEmail} resetPasswordEmailSend={resetPasswordEmailSend} />;
}

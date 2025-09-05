import type { User } from '@supabase/supabase-js';
import { createServerFn } from '@tanstack/react-start';
import { getSupabaseServerClient } from './server';
import { signInWithAnonymousUser } from './signIn';

// Serializable subset of Supabase User compatible with server function constraints
export type AuthUserDTO = {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  role?: string;
  is_anonymous: boolean;
};

function transformToAuthUserDTO(user: User): AuthUserDTO {
  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    is_anonymous: user.is_anonymous ?? false,
  };
}

import type { User } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./server";
import { signInWithAnonymousUser } from "./signIn";

// Serializable subset of Supabase User compatible with server function constraints
export type AuthUserDTO = {
  id: string;
  email?: string;
  aud: string;
  confirmation_sent_at?: string;
  recovery_sent_at?: string;
  email_change_sent_at?: string;
  invited_at?: string;
  action_link?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  deleted_at?: string;
};

function transformToAuthUserDTO(user: User): AuthUserDTO {
  return {
    id: user.id,
    email: user.email,
    aud: user.aud,
    confirmation_sent_at: user.confirmation_sent_at,
    recovery_sent_at: user.recovery_sent_at,
    email_change_sent_at: user.email_change_sent_at,
    invited_at: user.invited_at,
    action_link: user.action_link,
    email_confirmed_at: user.email_confirmed_at,
    phone_confirmed_at: user.phone_confirmed_at,
    last_sign_in_at: user.last_sign_in_at,
    phone: user.phone,
    created_at: user.created_at,
    updated_at: user.updated_at || "",
    role: user.role,
    deleted_at: user.deleted_at,
  };
}

export const getSupabaseUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // Get the session first
  const sessionResult = await supabase.auth.getSession();
  const sessionData = sessionResult.data;
  const sessionError = sessionResult.error;

  if (userError) {
    console.error("Error getting user:", userError);
  }

  if (sessionError) {
    console.error("Error getting session:", sessionError);
  }

  if (!userData.user) {
    const anon = await signInWithAnonymousUser();

    if (!anon || !anon.success || !anon.data) {
      const anonError = anon && !anon.success ? anon.error : "Unknown anonymous sign-in error";
      console.error("Error creating anon session:", anonError);
      throw new Error("Error creating anon session");
    }

    return {
      user: anon.data.user,
      accessToken: anon.data.accessToken,
    } as { user: AuthUserDTO | null; accessToken?: string };
  }

  const user = transformToAuthUserDTO(userData.user);
  const accessToken = sessionData.session?.access_token;

  return {
    user,
    accessToken,
  } as { user: AuthUserDTO | null; accessToken?: string };
});

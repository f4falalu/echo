import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ServerRoute as AuthCallbackRoute } from "../../routes/auth.callback";
import { getSupabaseServerClient } from "./server";

const isValidRedirectUrl = (url: string): boolean => {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.startsWith("/") && !decoded.startsWith("//");
  } catch {
    return false;
  }
};

export const signInWithEmailAndPassword = createServerFn({ method: "POST" })
  .validator(
    z.object({ email: z.string(), password: z.string(), redirectUrl: z.string().optional() }),
  )
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      return {
        error: true,
        message: error.message,
      };
    }

    return;
  });

export const signInWithGoogle = createServerFn({ method: "POST" })
  .validator(z.object({ redirectUrl: z.string().optional() }))
  .handler(async ({ data: { redirectUrl } }) => {
    const supabase = getSupabaseServerClient();

    const redirectTo = redirectUrl || "/";

    const callbackUrl = new URL(AuthCallbackRoute.to);

    if (redirectTo && isValidRedirectUrl(redirectTo)) {
      callbackUrl.searchParams.set("next", redirectTo);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    throw redirect({ to: data.url });
  });

export const signInWithAnonymousUser = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return { success: false, error: error.message };
  }

  const session = data.session;

  if (!session) {
    return { success: false, error: "No session found" };
  }

  return {
    success: true,
    data: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: session.user
        ? {
            id: session.user.id,
            email: session.user.email,
            app_metadata: session.user.app_metadata,
            user_metadata: session.user.user_metadata,
            aud: session.user.aud,
            confirmation_sent_at: session.user.confirmation_sent_at,
            recovery_sent_at: session.user.recovery_sent_at,
            email_change_sent_at: session.user.email_change_sent_at,
            invited_at: session.user.invited_at,
            action_link: session.user.action_link,
            email_confirmed_at: session.user.email_confirmed_at,
            phone_confirmed_at: session.user.phone_confirmed_at,
            last_sign_in_at: session.user.last_sign_in_at,
            phone: session.user.phone,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            role: session.user.role,
            deleted_at: session.user.deleted_at,
          }
        : null,
    },
  };
});

// export const signInWithGithub = async ({
//   redirectTo,
// }: {
//   redirectTo?: string | null;
// } = {}): Promise<ServerActionResult<string>> => {
//   "use server";

//   const supabase = await createSupabaseServerClient();

//   const callbackUrl = new URL(authURLFull);
//   if (redirectTo && isValidRedirectUrl(redirectTo)) {
//     callbackUrl.searchParams.set("next", redirectTo);
//   }

//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: "github",
//     options: {
//       redirectTo: callbackUrl.toString(),
//     },
//   });

//   if (error) {
//     return { success: false, error: error.message };
//   }

//   revalidatePath("/", "layout");
//   return redirect(data.url);
// };

// export const signInWithAzure = async ({
//   redirectTo,
// }: {
//   redirectTo?: string | null;
// } = {}): Promise<ServerActionResult<string>> => {
//   "use server";

//   const supabase = await createSupabaseServerClient();

//   const callbackUrl = new URL(authURLFull);
//   if (redirectTo && isValidRedirectUrl(redirectTo)) {
//     callbackUrl.searchParams.set("next", redirectTo);
//   }

//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: "azure",
//     options: {
//       redirectTo: callbackUrl.toString(),
//       scopes: "email",
//     },
//   });

//   if (error) {
//     return { success: false, error: error.message };
//   }
//   revalidatePath("/", "layout");
//   return redirect(data.url);
// };

// export const signUp = async ({
//   email,
//   password,
//   redirectTo,
// }: {
//   email: string;
//   password: string;
//   redirectTo?: string | null;
// }): Promise<ServerActionResult> => {
//   "use server";
//   const supabase = await createSupabaseServerClient();
//   const authURL = createBusterRoute({
//     route: BusterRoutes.AUTH_CONFIRM,
//   });
//   const authURLFull = `${process.env.NEXT_PUBLIC_URL}${authURL}`;

//   const { error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       emailRedirectTo: authURLFull,
//     },
//   });
//   if (error) {
//     console.error("supabase error in signUp", error);
//     // Return the actual Supabase error message
//     return { success: false, error: error.message };
//   }

//   revalidatePath("/", "layout");
//   const finalRedirect =
//     redirectTo && isValidRedirectUrl(redirectTo)
//       ? decodeURIComponent(redirectTo)
//       : createBusterRoute({ route: BusterRoutes.APP_HOME });
//   return redirect(finalRedirect);
// };

// export const signInWithAnonymousUser = async () => {
//   "use server";

//   const supabase = await createSupabaseServerClient();

//   const { data, error } = await supabase.auth.signInAnonymously();

//   if (error) {
//     throw error;
//   }

//   revalidatePath("/", "layout");

//   return data;
// };

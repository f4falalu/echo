import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { parseCookies, setCookie } from "@tanstack/react-start/server";

export const COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  secure: process.env.NODE_ENV === "production", // Only use secure in production
  sameSite: "lax", // Type assertion to fix the error
  httpOnly: true, // Make cookies HttpOnly
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables for server client");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return Object.entries(parseCookies()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookies) {
        cookies.forEach((cookie) => {
          setCookie(cookie.name, cookie.value, {
            ...COOKIE_OPTIONS,
            ...cookie.options,
          });
        });
      },
    },
  });
}

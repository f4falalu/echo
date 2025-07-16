import { getUser } from '@buster/database';
import type { Context, Next } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { createSupabaseClient } from './supabase';

const supabase = createSupabaseClient();

export const requireAuth = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const { data, error } = await supabase.auth.getUser(token); //usually takes about 3 - 7ms

      if (error) {
        // Log specific auth errors to help with debugging
        console.warn('Token validation failed:', {
          error: error.message,
          // Don't log the actual token for security
          tokenPrefix: `${token.substring(0, 20)}...`,
        });
        return false;
      }

      if (!data.user) {
        console.warn('No user found for valid token');
        return false;
      }

      // Set user in context for use in route handlers
      c.set('supabaseUser', data.user);

      // Get the corresponding user from your database
      const busterUser = await getUser({ id: data.user.id });

      if (!busterUser) {
        console.warn('Supabase user found but no corresponding database user:', {
          supabaseUserId: data.user.id,
          email: data.user.email,
        });
        return false;
      }

      c.set('busterUser', busterUser);

      // Ensure user is not anonymous
      const isAuthenticated = !data.user.is_anonymous;

      if (!isAuthenticated) {
        console.info('Anonymous user attempted to access protected resource');
      }

      return isAuthenticated;
    } catch (error) {
      console.error('Unexpected error during token validation:', error);
      return false;
    }
  },
});

export async function requireUser(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Missing or invalid Authorization header');
    throw new Error('User not authenticated - missing Authorization header');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.warn('Empty token in Authorization header');
    throw new Error('User not authenticated - empty token');
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.warn('Token validation failed in requireUser:', {
        error: error.message,
      });
      throw new Error('User not authenticated - invalid token');
    }

    const user = data.user;

    if (!user || user.is_anonymous) {
      console.warn('No valid user found or user is anonymous');
      throw new Error('User not authenticated - no valid user');
    }

    // User is valid, continue to next middleware/handler
    return next();
  } catch (error) {
    console.error('Unexpected error in requireUser:', error);
    throw new Error('User not authenticated - server error');
  }
}

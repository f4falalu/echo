import { z } from 'zod';
import { isServer } from '@tanstack/react-query';

if (!isServer) {
  throw new Error('env.mjs is only meant to be used on the server');
}

// Initialize env variable that will be exported
let env;

// Skip validation during CI/CD builds or production builds
if (process.env.CI === 'true' || process.env.DOCKER_BUILD || process.env.NODE_ENV === 'production') {
  console.log('🐳 CI/Docker/Production build detected - skipping environment validation');
  
  // Set env object with default values for CI builds
  env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_API2_URL: process.env.NEXT_PUBLIC_API2_URL || '',
    NEXT_PUBLIC_WEB_SOCKET_URL: process.env.NEXT_PUBLIC_WEB_SOCKET_URL || '',
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || '',
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || '',
    POSTHOG_ENV_ID: process.env.POSTHOG_ENV_ID || '',
    NEXT_PUBLIC_USER: process.env.NEXT_PUBLIC_USER || '',
    NEXT_PUBLIC_USER_PASSWORD: process.env.NEXT_PUBLIC_USER_PASSWORD || '',
    NEXT_PUBLIC_ENABLE_TANSTACK_PANEL: process.env.NEXT_PUBLIC_ENABLE_TANSTACK_PANEL || ''
  };
} else {
  const clientEnvSchema = z.object({
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'], {
        errorMap: () => ({ message: 'NODE_ENV must be development, production, or test' })
      })
      .default('development'),

    // API URLs
    NEXT_PUBLIC_API_URL: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_API_URL is required' })
      .url({ message: 'NEXT_PUBLIC_API_URL must be a valid URL' }),
    NEXT_PUBLIC_API2_URL: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_API2_URL is required' })
      .url({ message: 'NEXT_PUBLIC_API2_URL must be a valid URL' }),
    NEXT_PUBLIC_WEB_SOCKET_URL: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_WEB_SOCKET_URL is required' })
      .url({ message: 'NEXT_PUBLIC_WEB_SOCKET_URL must be a valid URL' })
      .optional(),
    NEXT_PUBLIC_URL: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_URL is required' })
      .url({ message: 'NEXT_PUBLIC_URL must be a valid URL' }),

    // Supabase configuration
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_SUPABASE_URL is required' })
      .url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }),

    // PostHog analytics
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .string()
      .url({ message: 'NEXT_PUBLIC_POSTHOG_HOST must be a valid URL' })
      .optional(),
    POSTHOG_API_KEY: z.string().optional(),
    POSTHOG_ENV_ID: z.string().optional(),

    // Development/Testing credentials
    NEXT_PUBLIC_USER: z.string().optional(),
    NEXT_PUBLIC_USER_PASSWORD: z.string().optional(),
    NEXT_PUBLIC_ENABLE_TANSTACK_PANEL: z.string().optional()
  });

  const serverEnvSchema = z.object({});

  // Parse and validate server-only environment variables
  let serverEnv;
  let clientEnv;

  try {
    serverEnv = serverEnvSchema.parse(process.env);
    console.log('Successfully parsed server environment variables');
    clientEnv = clientEnvSchema.parse(process.env);
    console.log('Successfully parsed client environment variables');
  } catch (error) {
    console.error('❌ Server environment validation failed!');
    console.error('');

    if (error instanceof z.ZodError) {
      console.error('The following private environment variables are invalid or missing:');
      console.error('');

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });

      console.error('');
      console.error(
        'Please check your .env file and ensure all required private variables are set correctly.'
      );
    } else {
      console.error('Unexpected error during server environment validation:', error);
    }

    console.error('');
    console.error('Build cannot continue with invalid server environment configuration.');

    // Throw error to prevent build from continuing
    process.exit(1);
  }

  // Combine client and server environment variables
  env = {
    ...clientEnv,
    ...serverEnv
  };
}

export { env };
export default env;

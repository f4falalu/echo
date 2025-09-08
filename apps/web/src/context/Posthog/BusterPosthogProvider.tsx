import { isServer } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import type { PostHogConfig } from 'posthog-js';
import React, { type PropsWithChildren, useEffect, useState } from 'react';
import { useGetUserTeams } from '@/api/buster_rest/users';
import {
  useGetUserBasicInfo,
  useGetUserOrganization,
} from '@/api/buster_rest/users/useGetUserInfo';
import { isDev } from '@/config/dev';
import { env } from '@/env';
import packageJson from '../../../package.json';

const version = packageJson.version;
const POSTHOG_KEY = env.VITE_PUBLIC_POSTHOG_KEY;
const DEBUG_POSTHOG = false;

export const BusterPosthogProvider: React.FC<PropsWithChildren> = ({ children }) => {
  console.log('POSTHOG_KEY', POSTHOG_KEY);
  console.log('DEBUG_POSTHOG', DEBUG_POSTHOG);
  if ((isDev && !DEBUG_POSTHOG) || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  console.log('POSTHOG_KEY22', POSTHOG_KEY);
  console.log('DEBUG_POSTHOG22', DEBUG_POSTHOG);

  return <PosthogWrapper>{children}</PosthogWrapper>;
};
BusterPosthogProvider.displayName = 'BusterPosthogProvider';

const options: Partial<PostHogConfig> = {
  api_host: env.VITE_PUBLIC_POSTHOG_HOST,
  person_profiles: 'always',
  session_recording: {
    recordBody: true,
  },

  loaded: () => {
    console.log(
      `🚀 Welcome to Buster v${version}`,
      'background: linear-gradient(to right, #a21caf, #8b1cb1, #6b21a8); color: white; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 5px;'
    );
    console.log(
      '%cBuster is your open-source data analytics platform. Found a bug? The code is open-source! Report it at https://github.com/buster-so/buster. Better yet, fix it yourself and send a PR.',
      'background: #6b21a8; color: white; font-size: 10px; font-weight: normal; padding: 8px; border-radius: 4px;'
    );
  },
};

const PosthogWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  console.log('PosthogWrapper');
  const user = useGetUserBasicInfo();
  const { data: userTeams } = useGetUserTeams({ userId: user?.id ?? '' });
  const userOrganizations = useGetUserOrganization();
  const team = userTeams?.[0];

  const [posthogModules, setPosthogModules] = useState<{
    posthog: typeof import('posthog-js').default;
    PostHogProvider: typeof import('posthog-js/react').PostHogProvider;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Async load posthog-js dependencies
  useEffect(() => {
    const loadPosthogModules = async () => {
      try {
        const [{ default: posthog }, { PostHogProvider }] = await Promise.all([
          import('posthog-js'),
          import('posthog-js/react'),
        ]);

        setPosthogModules({ posthog, PostHogProvider });
      } catch (error) {
        console.error('Failed to load PostHog modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosthogModules();
  }, []);

  // Initialize PostHog when modules are loaded and user data is available
  useEffect(() => {
    if (POSTHOG_KEY && !isServer && user && posthogModules?.posthog && team) {
      const { posthog } = posthogModules;

      if (posthog.__loaded) {
        return;
      }

      posthog.init(POSTHOG_KEY, options);

      const email = user.email;
      posthog.identify(email, {
        user,
        organization: userOrganizations,
        team,
      });
      posthog.group(team?.id, team?.name);
    }
  }, [user?.id, team?.id, posthogModules]);

  // Show children while loading or if modules failed to load
  if (isLoading || !posthogModules) {
    return <>{children}</>;
  }

  const { PostHogProvider } = posthogModules;

  if (isServer) {
    return <>{children}</>;
  }

  console.log('PostHogProvider!!!!', PostHogProvider);

  return (
    <ClientOnly>
      <PostHogProvider client={posthogModules.posthog}>{children}</PostHogProvider>
    </ClientOnly>
  );
};

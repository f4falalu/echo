import { createServerFn } from '@tanstack/react-start';

export const getAppBuildId = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    buildId: import.meta.env.VITE_BUILD_ID as string,
    buildAt: import.meta.env.VITE_BUILD_AT as string,
  };
});

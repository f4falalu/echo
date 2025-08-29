import { useMatches } from '@tanstack/react-router';

export const useGetParentRoute = () => {
  const afterAppSplash = useMatches({
    select: (matches) => matches[2],
  });
  return afterAppSplash?.routeId;
};

import { useMatches } from '@tanstack/react-router';

export const useGetParentRoute = () => {
  const matches = useMatches();
  const afterAppSplash = matches[2];
  return afterAppSplash?.routeId;
};

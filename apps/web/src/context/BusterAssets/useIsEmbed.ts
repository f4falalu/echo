import { useMatch, useMatches } from '@tanstack/react-router';

export const useIsEmbed = () => {
  const match = useMatch({
    from: '/embed',
  });
  console.log(match);
  return !!match?.id;
};

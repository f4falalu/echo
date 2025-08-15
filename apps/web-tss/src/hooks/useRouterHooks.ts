import {
  type ParsedLocation,
  type RouterState,
  useLocation,
  useRouterState,
} from '@tanstack/react-router';

const stableLocationSelector = (location: ParsedLocation) => location.pathname;
export const usePathname = () => {
  const location = useLocation({ select: stableLocationSelector });
  return location;
};

const stableRouterStatusSelector = (state: RouterState) => state.status;
export const useRouterStatus = () => {
  const status = useRouterState({ select: stableRouterStatusSelector });
  return status;
};

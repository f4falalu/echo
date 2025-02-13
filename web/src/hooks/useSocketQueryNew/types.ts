import type { BusterSocketResponse, BusterSocketResponseRoute } from '@/api/buster_socket';

export type BusterSocketResponseConfig<TRoute extends BusterSocketResponseRoute> = {
  route: TRoute;
  onError?: (d: unknown) => void;
};

export type BusterSocketResponseConfigRoute =
  BusterSocketResponseConfig<BusterSocketResponseRoute>['route'];

export type InferBusterSocketResponseData<TRoute extends BusterSocketResponseRoute> = Extract<
  BusterSocketResponse,
  { route: TRoute }
>['callback'] extends (d: infer D) => void
  ? D
  : never;

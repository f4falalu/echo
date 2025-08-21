import type { RegisteredRouter, ValidateLinkOptions } from '@tanstack/react-router';

export function defineLink<
  TRouter extends RegisteredRouter,
  TOptions,
  TFrom extends string = string,
>(
  link: ValidateLinkOptions<TRouter, TOptions, TFrom>
): ValidateLinkOptions<TRouter, TOptions, TFrom> {
  return link;
}

export function defineLinkFromFactory<TFrom extends string>(fromOptions: { from: TFrom }) {
  return <TRouter extends RegisteredRouter, TOptions>(
    toOptions: Omit<ValidateLinkOptions<TRouter, TOptions, TFrom>, 'from'>
  ): ValidateLinkOptions<TRouter, TOptions, TFrom> =>
    ({
      ...fromOptions,
      ...toOptions,
    }) as ValidateLinkOptions<TRouter, TOptions, TFrom>;
}

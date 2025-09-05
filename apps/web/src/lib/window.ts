export const isServer = typeof window === 'undefined' || import.meta.env.SSR === true;

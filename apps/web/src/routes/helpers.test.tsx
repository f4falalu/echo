import { describe, expect, it } from 'vitest';
import { BusterRoutes } from './busterRoutes';
import { pathNameToRoute } from './helpers';

describe('pathNameToRoute', () => {
  it('should return ROOT for unmatched route', () => {
    const result = pathNameToRoute('/invalid/path', {});
    expect(result).toBe(BusterRoutes.ROOT);
  });
  it('should return parent route for chat ID route', () => {
    const pathName = '/app/chats/123';
    const params = { chatId: '123' };
    const result = pathNameToRoute(pathName, params);
    expect(result).toBe(BusterRoutes.APP_CHAT_ID);
  });
  it('should return route as is when no mapping exists', () => {
    const pathName = '/app/home';
    const result = pathNameToRoute(pathName, {});
    expect(result).toBe(BusterRoutes.APP_HOME);
  });
});
